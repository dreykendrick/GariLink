begin;

-- Collection stays closed. No upload or attestation endpoint is exposed.
-- A future trusted validator must verify actual bytes AND malware/content safety.
create table garilink_private.identity_validation_receipts (
  document_id uuid primary key references garilink_private.verification_documents(id),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  size_bytes integer not null check (size_bytes between 1 and 5242880),
  object_path text not null,
  scanner_reference text not null check (length(scanner_reference) between 1 and 200),
  validated_at timestamptz not null default now()
);
alter table garilink_private.identity_validation_receipts enable row level security;
revoke all on garilink_private.identity_validation_receipts from public,anon,authenticated,service_role;
create trigger identity_validation_receipts_immutable before update or delete
  on garilink_private.identity_validation_receipts for each row
  execute function garilink_private.verification_append_only();

create table garilink_private.identity_operation_replays (
  actor_id uuid not null references public.gl_accounts(id),
  request_id uuid not null,
  payload jsonb not null,
  response jsonb not null,
  primary key(actor_id,request_id)
);
alter table garilink_private.identity_operation_replays enable row level security;
revoke all on garilink_private.identity_operation_replays from public,anon,authenticated,service_role;
create trigger identity_operation_replays_immutable before update or delete
  on garilink_private.identity_operation_replays for each row
  execute function garilink_private.verification_append_only();

-- Reviewer qualification is an append-only trusted authority ledger. Workspace
-- roles, JWT metadata and self-assertion can never grant review authority.
create table garilink_private.identity_reviewer_authority_events (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.gl_accounts(id),
  administrator_id uuid not null references public.gl_accounts(id),
  request_id uuid not null unique,
  event_code text not null check (event_code in ('GRANTED','REVOKED')),
  authority_until timestamptz,
  occurred_at timestamptz not null default now(),
  check (reviewer_id <> administrator_id),
  check ((event_code='GRANTED' and authority_until is not null and authority_until>occurred_at)
    or (event_code='REVOKED' and authority_until is null))
);
alter table garilink_private.identity_reviewer_authority_events enable row level security;
revoke all on garilink_private.identity_reviewer_authority_events from public,anon,authenticated,service_role;
create trigger identity_reviewer_authority_events_immutable before update or delete
  on garilink_private.identity_reviewer_authority_events for each row
  execute function garilink_private.verification_append_only();

create function garilink_private.identity_reviewer_qualified(reviewer_key uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select coalesce((select e.event_code='GRANTED' and e.authority_until>now()
    from garilink_private.identity_reviewer_authority_events e
    where e.reviewer_id=reviewer_key order by e.occurred_at desc,e.id desc limit 1),false);
$$;

-- Database-owner administrative boundary ONLY. An event is immutable and an
-- exact request replay is harmless; conflicting reuse is rejected.
create function garilink_private.identity_reviewer_authority(reviewer_key uuid,
  administrator_key uuid, authority_until timestamptz, revoke_authority boolean,
  request_key uuid) returns void
language plpgsql security definer set search_path='' as $$
declare prior garilink_private.identity_reviewer_authority_events; requested_event text;
begin
  requested_event:=case when revoke_authority then 'REVOKED' else 'GRANTED' end;
  if reviewer_key is null or administrator_key is null or request_key is null
    or reviewer_key=administrator_key
    or (not revoke_authority and (authority_until is null or authority_until<=now()))
    or (revoke_authority and authority_until is not null) then
    raise exception 'Invalid reviewer authority.' using errcode='42501'; end if;
  perform 1 from public.gl_accounts x where x.id=reviewer_key for update;
  if not found then raise exception 'Reviewer unavailable.' using errcode='42501'; end if;
  perform 1 from public.gl_accounts x where x.id=administrator_key;
  if not found then raise exception 'Administrator unavailable.' using errcode='42501'; end if;
  select x.* into prior from garilink_private.identity_reviewer_authority_events x
    where x.request_id=request_key;
  if found then
    if prior.reviewer_id<>reviewer_key or prior.administrator_id<>administrator_key
      or prior.event_code<>requested_event or prior.authority_until is distinct from authority_until then
      raise exception 'Conflicting retry.' using errcode='PT409'; end if;
    return;
  end if;
  insert into garilink_private.identity_reviewer_authority_events(
    reviewer_id,administrator_id,request_id,event_code,authority_until)
  values(reviewer_key,administrator_key,request_key,requested_event,authority_until);
end; $$;

create function garilink_private.identity_evidence_ready(case_key uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from garilink_private.verification_documents d
    join garilink_private.identity_validation_receipts r on r.document_id=d.id
    where d.case_id=case_key and d.state='VALIDATED'
      and d.sha256=r.sha256 and d.size_bytes=r.size_bytes and d.object_path=r.object_path
      and r.validated_at<=now() and d.retention_until>now()
      and d.version=(select max(x.version) from garilink_private.verification_documents x where x.case_id=case_key)
  );
$$;

create function public.garilink_identity_submit(case_key uuid, expected_revision integer,
  expected_policy integer, request_key uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=garilink_private.require_user(false); c garilink_private.verification_cases;
  p jsonb; prior garilink_private.identity_operation_replays; result jsonb;
begin
  if case_key is null or expected_revision is null or expected_policy is null or request_key is null then
    raise exception 'Invalid submission.' using errcode='22023'; end if;
  p:=jsonb_build_object('operation','SUBMIT','case',case_key,'revision',expected_revision,'policy',expected_policy);
  perform 1 from public.gl_accounts a where a.id=actor for update;
  select x.* into prior from garilink_private.identity_operation_replays x where x.actor_id=actor and x.request_id=request_key;
  if found then
    if prior.payload<>p then raise exception 'Conflicting retry.' using errcode='PT409'; end if;
    return prior.response;
  end if;
  select x.* into c from garilink_private.verification_cases x where x.id=case_key for update;
  if c.id is null or c.subject_id<>actor or c.requirement_key<>'identity' then
    raise exception 'Identity case unavailable.' using errcode='42501'; end if;
  if c.state<>'DRAFT' or c.revision<>expected_revision or c.policy_version<>expected_policy then
    raise exception 'Refresh the identity case.' using errcode='PT409'; end if;
  if not exists(select 1 from garilink_private.verification_requirements r
    where r.key='identity' and r.scope='PERSON' and r.policy_version=c.policy_version)
    or not garilink_private.identity_evidence_ready(c.id) then
    raise exception 'Validated identity evidence is required.' using errcode='22023'; end if;
  update garilink_private.verification_cases x set state='PENDING_REVIEW',revision=x.revision+1 where x.id=c.id returning x.* into c;
  insert into garilink_private.verification_audit(case_id,actor_id,event_code) values(c.id,actor,'IDENTITY_SUBMITTED');
  result:=garilink_private.identity_case_summary(c);
  insert into garilink_private.identity_operation_replays values(actor,request_key,p,result);
  return result;
end; $$;

-- Database-owner administrative boundary ONLY. Not granted to service_role,
-- authenticated, workspace administrators or editable JWT metadata.
create function garilink_private.identity_assign(case_key uuid, reviewer_key uuid,
  administrator_key uuid, authority_until timestamptz, revoke_assignment boolean default false) returns void
language plpgsql security definer set search_path='' as $$
declare c garilink_private.verification_cases;
begin
  select x.* into c from garilink_private.verification_cases x where x.id=case_key for update;
  if c.id is null or c.requirement_key<>'identity' or c.state<>'PENDING_REVIEW'
    or reviewer_key is null or administrator_key is null or reviewer_key=c.subject_id
    or administrator_key=c.subject_id or authority_until is null or authority_until<=now() then
    raise exception 'Invalid reviewer assignment.' using errcode='42501'; end if;
  if not garilink_private.identity_reviewer_qualified(reviewer_key) then
    raise exception 'Reviewer is not qualified.' using errcode='42501'; end if;
  insert into garilink_private.verification_review_assignments(case_id,reviewer_id,assigned_by,expires_at,revoked_at)
    values(c.id,reviewer_key,administrator_key,authority_until,case when revoke_assignment then now() end)
    on conflict(case_id,reviewer_id) do update set assigned_by=excluded.assigned_by,
      expires_at=excluded.expires_at,revoked_at=excluded.revoked_at;
  insert into garilink_private.verification_audit(case_id,actor_id,event_code)
    values(c.id,administrator_key,case when revoke_assignment then 'REVIEW_ASSIGNMENT_REVOKED' else 'REVIEWER_ASSIGNED' end);
end; $$;

create function public.garilink_identity_decide(case_key uuid, expected_revision integer,
  expected_policy integer, request_key uuid, decision_result text, decision_reason text,
  approval_until timestamptz default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=garilink_private.require_user(false); c garilink_private.verification_cases;
  a garilink_private.verification_review_assignments; prior garilink_private.identity_operation_replays;
  evidence uuid; p jsonb; result jsonb;
begin
  if case_key is null or expected_revision is null or expected_policy is null or request_key is null
    or decision_result is null or decision_result not in ('APPROVED','REJECTED')
    or decision_reason is null or decision_reason not in ('EVIDENCE_ACCEPTED','EVIDENCE_UNREADABLE','EVIDENCE_MISMATCH')
    or (decision_result='APPROVED' and (decision_reason<>'EVIDENCE_ACCEPTED' or approval_until is null))
    or (decision_result='REJECTED' and (decision_reason='EVIDENCE_ACCEPTED' or approval_until is not null)) then
    raise exception 'Invalid identity decision.' using errcode='22023'; end if;
  p:=jsonb_build_object('operation','DECIDE','case',case_key,'revision',expected_revision,'policy',expected_policy,
    'result',decision_result,'reason',decision_reason,'until',approval_until);
  perform 1 from public.gl_accounts x where x.id=actor for update;
  select x.* into c from garilink_private.verification_cases x where x.id=case_key for update;
  if c.id is null or c.requirement_key<>'identity' or c.subject_id=actor then
    raise exception 'Review access denied.' using errcode='42501'; end if;
  select x.* into a from garilink_private.verification_review_assignments x
    where x.case_id=c.id and x.reviewer_id=actor for update;
  if a.case_id is null or a.revoked_at is not null or a.expires_at<=now() then
    raise exception 'Review assignment unavailable.' using errcode='42501'; end if;
  if not garilink_private.identity_reviewer_qualified(actor) then
    raise exception 'Reviewer authority unavailable.' using errcode='42501'; end if;
  select x.* into prior from garilink_private.identity_operation_replays x where x.actor_id=actor and x.request_id=request_key;
  if found then
    if prior.payload<>p then raise exception 'Conflicting retry.' using errcode='PT409'; end if;
    return prior.response;
  end if;
  if c.state<>'PENDING_REVIEW' or c.revision<>expected_revision or c.policy_version<>expected_policy then
    raise exception 'Refresh the review case.' using errcode='PT409'; end if;
  if decision_result='APPROVED' and approval_until<=now() then
    raise exception 'Approval period has ended.' using errcode='22023'; end if;
  if not garilink_private.identity_evidence_ready(c.id) or not exists(
    select 1 from garilink_private.verification_requirements r where r.key='identity' and r.scope='PERSON' and r.policy_version=c.policy_version
  ) then raise exception 'Validated evidence unavailable.' using errcode='42501'; end if;
  select d.id into evidence from garilink_private.verification_documents d where d.case_id=c.id order by d.version desc limit 1;
  insert into garilink_private.verification_decisions(case_id,document_id,reviewer_id,request_id,result,reason_code,valid_until)
    values(c.id,evidence,actor,request_key,decision_result,decision_reason,approval_until);
  update garilink_private.verification_cases x set state=decision_result,revision=x.revision+1 where x.id=c.id returning x.* into c;
  insert into garilink_private.verification_audit(case_id,actor_id,event_code) values(c.id,actor,'IDENTITY_'||decision_result);
  -- Reviewer receives no applicant identifiers, paths, hashes or raw evidence.
  result:=jsonb_build_object('state',c.state,'revision',c.revision,'policyVersion',c.policy_version);
  insert into garilink_private.identity_operation_replays values(actor,request_key,p,result);
  return result;
end; $$;

create function garilink_private.identity_revoke(case_key uuid, administrator_key uuid, request_key uuid) returns void
language plpgsql security definer set search_path='' as $$
declare c garilink_private.verification_cases; d garilink_private.verification_decisions;
begin
  select x.* into c from garilink_private.verification_cases x where x.id=case_key for update;
  if c.id is null or c.requirement_key<>'identity' or administrator_key is null or administrator_key=c.subject_id or request_key is null then
    raise exception 'Revocation denied.' using errcode='42501'; end if;
  select x.* into d from garilink_private.verification_decisions x where x.request_id=request_key;
  if found then
    if d.case_id<>c.id or d.result<>'REVOKED' then raise exception 'Conflicting retry.' using errcode='PT409'; end if;
    return;
  end if;
  if c.state<>'APPROVED' then raise exception 'Approval unavailable.' using errcode='PT409'; end if;
  select x.* into d from garilink_private.verification_decisions x where x.case_id=c.id and x.result='APPROVED' order by x.decided_at desc,x.id desc limit 1;
  if d.id is null then raise exception 'Approval provenance unavailable.' using errcode='42501'; end if;
  insert into garilink_private.verification_decisions(case_id,document_id,reviewer_id,request_id,result,reason_code)
    values(c.id,d.document_id,d.reviewer_id,request_key,'REVOKED','TRUSTED_REVOCATION');
  update garilink_private.verification_cases x set state='REVOKED',revision=x.revision+1 where x.id=c.id;
  insert into garilink_private.verification_audit(case_id,actor_id,event_code) values(c.id,administrator_key,'IDENTITY_REVOKED');
end; $$;

-- Evaluate only the requested subject/case and action period. Identity validity
-- is distinct from activation and every independent booking/publication gate.
create function garilink_private.identity_eligibility(subject_key uuid, case_key uuid,
  action_start timestamptz, action_end timestamptz) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare c garilink_private.verification_cases; s jsonb; reason text; expiry timestamptz;
begin
  if subject_key is null or case_key is null or action_start is null or action_end is null
    or action_start<now() or action_end<action_start then reason:='INVALID_PERIOD';
  else
    select x.* into c from garilink_private.verification_cases x where x.id=case_key;
    if c.id is null or c.subject_id<>subject_key or c.requirement_key<>'identity' then reason:='WRONG_SUBJECT';
    else
      s:=garilink_private.identity_case_summary(c);
      expiry:=(s->>'expiresAt')::timestamptz;
      if s->>'state'<>'APPROVED' then reason:=s->>'state';
      elsif not garilink_private.identity_evidence_ready(c.id) then reason:='MISSING_EVIDENCE';
      elsif expiry is null or expiry<action_end then reason:='EXPIRED';
      else reason:='POLICY_NOT_ACTIVATED'; end if;
    end if;
  end if;
  return jsonb_build_object('identityValid',reason='POLICY_NOT_ACTIVATED','eligible',false,'reasonCode',reason);
end; $$;

-- Preserve the already-reviewed preparation signature and behavior; expire
-- stale approvals under the same subject lock before enforcing active uniqueness.
do $repair$
declare definition text; needle text;
begin
  definition:=pg_get_functiondef('public.garilink_identity_create_case(jsonb)'::regprocedure);
  needle:='  if exists(select 1 from garilink_private.verification_cases x where x.subject_id=actor';
  if position(needle in definition)=0 then raise exception 'Preparation repair target missing'; end if;
  definition:=replace(definition,needle,$body$
  with expired as (
    update garilink_private.verification_cases x set state='EXPIRED',revision=x.revision+1
    where x.subject_id=actor and x.requirement_key='identity' and x.state='APPROVED'
      and garilink_private.identity_case_summary(x)->>'state'='EXPIRED'
    returning x.id
  ) insert into garilink_private.verification_audit(case_id,actor_id,event_code)
      select e.id,actor,'IDENTITY_EXPIRED' from expired e;
  if exists(select 1 from garilink_private.verification_cases x where x.subject_id=actor$body$);
  execute definition;
end; $repair$;

do $projection$
declare definition text;
begin
  definition:=pg_get_functiondef('garilink_private.identity_case_summary(garilink_private.verification_cases)'::regprocedure);
  if position('''resubmissionAvailable'',false' in definition)=0 then
    raise exception 'Summary repair target missing'; end if;
  execute replace(definition,'''resubmissionAvailable'',false',
    '''resubmissionAvailable'',effective_state in (''REJECTED'',''EXPIRED'',''REVOKED'')');
end; $projection$;

revoke all on function garilink_private.identity_evidence_ready(uuid),
  garilink_private.identity_reviewer_qualified(uuid),
  garilink_private.identity_reviewer_authority(uuid,uuid,timestamptz,boolean,uuid),
  garilink_private.identity_assign(uuid,uuid,uuid,timestamptz,boolean),
  garilink_private.identity_revoke(uuid,uuid,uuid),
  garilink_private.identity_eligibility(uuid,uuid,timestamptz,timestamptz)
  from public,anon,authenticated,service_role;
revoke all on function public.garilink_identity_submit(uuid,integer,integer,uuid),
  public.garilink_identity_decide(uuid,integer,integer,uuid,text,text,timestamptz)
  from public,anon,service_role;
grant execute on function public.garilink_identity_submit(uuid,integer,integer,uuid),
  public.garilink_identity_decide(uuid,integer,integer,uuid,text,text,timestamptz) to authenticated;
commit;
