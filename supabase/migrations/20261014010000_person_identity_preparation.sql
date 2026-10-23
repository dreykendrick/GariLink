begin;

-- Preparation slice only. Accepted uploads, review and approval remain closed.
alter table garilink_private.verification_cases
  add column policy_version integer not null default 1 check (policy_version>0),
  add column case_sequence bigint generated always as identity,
  add column creation_payload jsonb not null default '{}'::jsonb;
revoke all on sequence garilink_private.verification_cases_case_sequence_seq
  from public,anon,authenticated,service_role;
create unique index verification_one_active_identity_case
  on garilink_private.verification_cases(subject_id)
  where requirement_key='identity' and state in ('NOT_STARTED','DRAFT','PENDING_REVIEW','APPROVED');

create function garilink_private.identity_case_summary(c garilink_private.verification_cases)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare effective_state text:=c.state; decision garilink_private.verification_decisions;
begin
  if c.state='APPROVED' then
    select d.* into decision from garilink_private.verification_decisions d
      where d.case_id=c.id order by d.decided_at desc,d.id desc limit 1;
    if exists(select 1 from garilink_private.verification_decisions d where d.case_id=c.id and d.result='REVOKED')
      then effective_state:='REVOKED';
    elsif decision.result='APPROVED' and decision.valid_until<=now() then effective_state:='EXPIRED';
    elsif decision.id is null or decision.result<>'APPROVED' or decision.valid_until is null or not exists(
      select 1 from garilink_private.verification_requirements r
      where r.key=c.requirement_key and r.scope='PERSON' and r.policy_version=c.policy_version
    ) or not exists(
      select 1 from garilink_private.verification_documents e
      where e.id=decision.document_id and e.case_id=c.id and e.state='VALIDATED' and e.sha256 is not null
    ) then effective_state:='PENDING_REVIEW'; end if;
  end if;
  return jsonb_build_object('caseId',c.id,'state',effective_state,'revision',c.revision,
    'policyVersion',c.policy_version,'collectionEnabled',false,'eligible',false,
    'reasonCode','POLICY_NOT_ACTIVATED','expiresAt',case when effective_state='APPROVED' then decision.valid_until else null end,
    'missingRequirements',case when effective_state='APPROVED' then '[]'::jsonb else jsonb_build_array('identityEvidence') end,
    'resubmissionAvailable',false);
end; $$;
revoke all on function garilink_private.identity_case_summary(garilink_private.verification_cases)
  from public,anon,authenticated,service_role;

create function public.garilink_identity_status() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=garilink_private.require_user(false); c garilink_private.verification_cases;
begin
  select x.* into c from garilink_private.verification_cases x
    where x.subject_id=actor and x.requirement_key='identity'
    order by x.case_sequence desc limit 1;
  if not found then return jsonb_build_object('caseId',null,'state','NOT_STARTED','revision',0,
    'policyVersion',1,'collectionEnabled',false,'eligible',false,'reasonCode','POLICY_NOT_ACTIVATED',
    'expiresAt',null,'missingRequirements',jsonb_build_array('identityEvidence'),'resubmissionAvailable',false); end if;
  return garilink_private.identity_case_summary(c);
end; $$;

create function public.garilink_identity_create_case(input_value jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=garilink_private.require_user(false); c garilink_private.verification_cases;
  request_key uuid; policy integer; payload jsonb;
begin
  if input_value is null or jsonb_typeof(input_value)<>'object' or
    exists(select 1 from jsonb_object_keys(input_value) k where k not in ('requestId','policyVersion')) or
    jsonb_typeof(input_value->'requestId') is distinct from 'string' or
    coalesce(input_value->>'requestId','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or
    jsonb_typeof(input_value->'policyVersion') is distinct from 'number' or
    coalesce(input_value->>'policyVersion','') !~ '^[1-9][0-9]{0,8}$' then
    raise exception 'Invalid identity preparation request.' using errcode='22023';
  end if;
  request_key:=(input_value->>'requestId')::uuid;
  policy:=(input_value->>'policyVersion')::integer;
  payload:=jsonb_build_object('policyVersion',policy);
  -- Serialize creation for this subject; unique partial index is a second guard.
  perform 1 from public.gl_accounts a where a.id=actor for update;
  select x.* into c from garilink_private.verification_cases x
    where x.subject_id=actor and x.request_id=request_key;
  if found then
    if c.requirement_key<>'identity' or c.creation_payload<>payload then
      raise exception 'This request has different details.' using errcode='PT409'; end if;
    return garilink_private.identity_case_summary(c);
  end if;
  if not exists(select 1 from garilink_private.verification_requirements r
    where r.key='identity' and r.scope='PERSON' and r.policy_version=policy) then
    raise exception 'Identity policy is unavailable.' using errcode='22023'; end if;
  if exists(select 1 from garilink_private.verification_cases x where x.subject_id=actor
    and x.requirement_key='identity' and x.state in ('NOT_STARTED','DRAFT','PENDING_REVIEW','APPROVED')) then
    raise exception 'An identity case already exists. Refresh its status.' using errcode='PT409'; end if;
  insert into garilink_private.verification_cases(subject_id,requirement_key,revision,request_id,state,policy_version,creation_payload)
    values(actor,'identity',1,request_key,'DRAFT',policy,payload) returning * into c;
  insert into garilink_private.verification_audit(case_id,actor_id,event_code)
    values(c.id,actor,'IDENTITY_DRAFT_CREATED');
  return garilink_private.identity_case_summary(c);
end; $$;
revoke all on function public.garilink_identity_status(),public.garilink_identity_create_case(jsonb)
  from public,anon,service_role;
grant execute on function public.garilink_identity_status(),public.garilink_identity_create_case(jsonb) to authenticated;
commit;
