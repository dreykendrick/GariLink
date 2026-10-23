begin;

-- Sprint 3.7B remains disabled by default. Only a database owner may activate
-- a separately approved policy in a disposable/certified environment.
create table garilink_private.identity_collection_control (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false,
  changed_at timestamptz not null default now()
);
insert into garilink_private.identity_collection_control(singleton) values(true);
alter table garilink_private.identity_collection_control enable row level security;
revoke all on garilink_private.identity_collection_control from public,anon,authenticated,service_role;

create table garilink_private.identity_evidence_policies (
  policy_version integer primary key,
  allowed_mime_types text[] not null,
  max_size_bytes integer not null check(max_size_bytes between 1 and 5242880),
  reservation_seconds integer not null check(reservation_seconds between 60 and 900),
  -- No legal retention duration assumed. Trusted policy approval must supply it.
  retention_seconds integer check(retention_seconds > reservation_seconds),
  approved boolean not null default false,
  check(not approved or retention_seconds is not null),
  check(cardinality(allowed_mime_types)>0 and allowed_mime_types <@ array['image/jpeg','image/png','application/pdf'])
);
insert into garilink_private.identity_evidence_policies
  (policy_version,allowed_mime_types,max_size_bytes,reservation_seconds,approved) values
  (1,array['image/jpeg','image/png','application/pdf'],5242880,300,false);
alter table garilink_private.identity_evidence_policies enable row level security;
revoke all on garilink_private.identity_evidence_policies from public,anon,authenticated,service_role;

alter table garilink_private.verification_documents
  add column reservation_request_id uuid,
  add column reserved_case_revision integer,
  add column finalized_at timestamptz,
  add constraint identity_reservation_request_unique unique(case_id,reservation_request_id),
  add constraint identity_finalized_state check((state='VALIDATED')=(finalized_at is not null));

create table garilink_private.identity_content_inspections (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references garilink_private.verification_documents(id),
  object_version text not null check(length(object_version) between 1 and 200),
  actual_mime_type text not null check(actual_mime_type in ('image/jpeg','image/png','application/pdf')),
  actual_size_bytes integer not null check(actual_size_bytes between 1 and 5242880),
  actual_sha256 text not null check(actual_sha256 ~ '^[0-9a-f]{64}$'),
  scanner_provider text not null check(length(scanner_provider) between 1 and 80),
  scanner_attestation text not null check(length(scanner_attestation) between 16 and 500),
  scan_result text not null check(scan_result in ('CLEAN','UNSAFE','ERROR','UNKNOWN')),
  scanned_at timestamptz not null,
  expires_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  check(scanned_at<=recorded_at and expires_at>scanned_at),
  unique(document_id,object_version,actual_sha256)
);
alter table garilink_private.identity_content_inspections enable row level security;
revoke all on garilink_private.identity_content_inspections from public,anon,authenticated,service_role;
create trigger identity_content_inspections_immutable before update or delete
  on garilink_private.identity_content_inspections for each row
  execute function garilink_private.verification_append_only();

create table garilink_private.identity_finalization_events (
  request_id uuid primary key,
  document_id uuid not null unique references garilink_private.verification_documents(id),
  inspection_id uuid not null unique references garilink_private.identity_content_inspections(id),
  case_revision integer not null,
  finalized_at timestamptz not null default now()
);
alter table garilink_private.identity_finalization_events enable row level security;
revoke all on garilink_private.identity_finalization_events from public,anon,authenticated,service_role;
create trigger identity_finalization_events_immutable before update or delete
  on garilink_private.identity_finalization_events for each row
  execute function garilink_private.verification_append_only();

create table garilink_private.identity_reviewer_access_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references garilink_private.verification_cases(id),
  document_id uuid not null,
  reviewer_id uuid not null references public.gl_accounts(id),
  request_id uuid not null unique,
  expires_at timestamptz not null,
  occurred_at timestamptz not null default now(),
  foreign key(document_id,case_id) references garilink_private.verification_documents(id,case_id),
  check(expires_at>occurred_at and expires_at<=occurred_at+interval '5 minutes')
);
alter table garilink_private.identity_reviewer_access_events enable row level security;
revoke all on garilink_private.identity_reviewer_access_events from public,anon,authenticated,service_role;
create trigger identity_reviewer_access_events_immutable before update or delete
  on garilink_private.identity_reviewer_access_events for each row
  execute function garilink_private.verification_append_only();

create function garilink_private.identity_collection_enabled() returns boolean
language sql stable security definer set search_path='' as $$
  select coalesce((select enabled from garilink_private.identity_collection_control where singleton),false);
$$;

create function public.garilink_identity_reserve_evidence(case_key uuid,expected_revision integer,
  expected_policy integer,request_key uuid,declared_mime text,declared_size integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=garilink_private.require_user(false); c garilink_private.verification_cases;
  d garilink_private.verification_documents; pol garilink_private.identity_evidence_policies; next_version integer;
begin
  if case_key is null or expected_revision is null or expected_policy is null
    or request_key is null or declared_mime is null then
    raise exception 'Invalid evidence reservation.' using errcode='22023'; end if;
  if not garilink_private.identity_collection_enabled() then
    raise exception 'Identity evidence collection is disabled.' using errcode='42501'; end if;
  select * into c from garilink_private.verification_cases where id=case_key for update;
  if c.id is null or c.subject_id<>actor or c.requirement_key<>'identity' then
    raise exception 'Identity case unavailable.' using errcode='42501'; end if;
  if c.state<>'DRAFT' or c.revision<>expected_revision or c.policy_version<>expected_policy then
    raise exception 'Refresh the identity case.' using errcode='PT409'; end if;
  select * into pol from garilink_private.identity_evidence_policies where policy_version=c.policy_version;
  if pol.policy_version is null or not pol.approved or not (declared_mime=any(pol.allowed_mime_types))
    or declared_size is null or declared_size<1 or declared_size>pol.max_size_bytes then
    raise exception 'Evidence does not satisfy policy.' using errcode='22023'; end if;
  select * into d from garilink_private.verification_documents
    where case_id=c.id and reservation_request_id=request_key;
  if found then
    if d.state<>'RESERVED' or d.reservation_expires_at<=now() then
      raise exception 'Evidence reservation unavailable.' using errcode='PT409'; end if;
    if d.reserved_case_revision<>expected_revision or d.mime_type<>declared_mime or d.size_bytes<>declared_size then
      raise exception 'Conflicting reservation retry.' using errcode='PT409'; end if;
  else
    select coalesce(max(version),0)+1 into next_version from garilink_private.verification_documents where case_id=c.id;
    insert into garilink_private.verification_documents(case_id,version,object_path,mime_type,size_bytes,state,
      reservation_expires_at,retention_until,reservation_request_id,reserved_case_revision)
    values(c.id,next_version,gen_random_uuid()::text||'/'||gen_random_uuid()::text,declared_mime,declared_size,'RESERVED',
      now()+make_interval(secs=>pol.reservation_seconds),now()+make_interval(secs=>pol.retention_seconds),request_key,expected_revision) returning * into d;
    insert into garilink_private.verification_audit(case_id,actor_id,event_code) values(c.id,actor,'IDENTITY_EVIDENCE_RESERVED');
  end if;
  return jsonb_build_object('documentId',d.id,'version',d.version,'objectPath',d.object_path,
    'expiresAt',d.reservation_expires_at,'maxSizeBytes',pol.max_size_bytes,'allowedMimeTypes',to_jsonb(pol.allowed_mime_types));
end; $$;

-- Database-owner trusted processor boundary. No application/service role grant.
-- The caller must inspect the exact stored bytes and use a real scanner before
-- recording this append-only attestation.
create function garilink_private.identity_record_inspection(document_key uuid,object_version text,
  actual_mime text,actual_size integer,actual_hash text,scanner_provider text,
  scanner_attestation text,scan_result text,scanned_at timestamptz,expires_at timestamptz) returns uuid
language plpgsql security definer set search_path='' as $$
declare d garilink_private.verification_documents; receipt_id uuid;
begin
  select * into d from garilink_private.verification_documents where id=document_key for update;
  if d.id is null or d.state<>'RESERVED' or d.reservation_expires_at<=now()
    or actual_mime<>d.mime_type or actual_size<>d.size_bytes or scan_result<>'CLEAN'
    or scanned_at>now() or expires_at<=now() then
    raise exception 'Evidence inspection rejected.' using errcode='22023'; end if;
  insert into garilink_private.identity_content_inspections(document_id,object_version,actual_mime_type,
    actual_size_bytes,actual_sha256,scanner_provider,scanner_attestation,scan_result,scanned_at,expires_at)
  values(d.id,object_version,actual_mime,actual_size,actual_hash,scanner_provider,scanner_attestation,
    scan_result,scanned_at,expires_at) returning id into receipt_id;
  return receipt_id;
end; $$;

create function garilink_private.identity_finalize_evidence(document_key uuid,inspection_key uuid,
  expected_case_revision integer,request_key uuid) returns void
language plpgsql security definer set search_path='' as $$
declare d garilink_private.verification_documents; c garilink_private.verification_cases;
  i garilink_private.identity_content_inspections; prior garilink_private.identity_finalization_events;
begin
  if document_key is null or inspection_key is null or expected_case_revision is null or request_key is null then
    raise exception 'Invalid finalization request.' using errcode='22023'; end if;
  -- Same lock order as reservation/submission: case, then document.
  select * into d from garilink_private.verification_documents where id=document_key;
  select * into c from garilink_private.verification_cases where id=d.case_id for update;
  select * into d from garilink_private.verification_documents where id=document_key for update;
  select * into prior from garilink_private.identity_finalization_events where request_id=request_key;
  if found then
    if prior.document_id<>document_key or prior.inspection_id<>inspection_key
      or prior.case_revision<>expected_case_revision then
      raise exception 'Conflicting finalization retry.' using errcode='PT409'; end if;
    return;
  end if;
  select * into i from garilink_private.identity_content_inspections where id=inspection_key and document_id=d.id;
  if d.id is null or c.id is null or c.state<>'DRAFT' or c.revision<>expected_case_revision
    or d.reserved_case_revision<>expected_case_revision or d.state<>'RESERVED' or d.reservation_expires_at<=now()
    or i.id is null or i.scan_result<>'CLEAN' or i.expires_at<=now()
    or i.actual_mime_type<>d.mime_type or i.actual_size_bytes<>d.size_bytes then
    raise exception 'Evidence finalization rejected.' using errcode='PT409'; end if;
  update garilink_private.verification_documents set state='VALIDATED',sha256=i.actual_sha256,finalized_at=now()
    where id=d.id;
  insert into garilink_private.identity_validation_receipts(document_id,sha256,size_bytes,object_path,scanner_reference)
    values(d.id,i.actual_sha256,i.actual_size_bytes,d.object_path,i.id::text);
  insert into garilink_private.identity_finalization_events(request_id,document_id,inspection_id,case_revision)
    values(request_key,d.id,i.id,expected_case_revision);
  insert into garilink_private.verification_audit(case_id,actor_id,event_code)
    values(c.id,c.subject_id,'IDENTITY_EVIDENCE_FINALIZED');
end; $$;

create or replace function garilink_private.identity_evidence_ready(case_key uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from garilink_private.verification_documents d
    join garilink_private.identity_validation_receipts r on r.document_id=d.id
    join garilink_private.identity_content_inspections i on i.id::text=r.scanner_reference
    join garilink_private.identity_finalization_events f on f.document_id=d.id and f.inspection_id=i.id
    where d.case_id=case_key and d.state='VALIDATED' and d.finalized_at is not null
      and d.sha256=r.sha256 and d.sha256=i.actual_sha256
      and d.size_bytes=r.size_bytes and d.size_bytes=i.actual_size_bytes
      and d.mime_type=i.actual_mime_type and d.object_path=r.object_path
      and i.scan_result='CLEAN' and i.expires_at>d.finalized_at
      and d.retention_until>now()
      and d.version=(select max(x.version) from garilink_private.verification_documents x where x.case_id=case_key)
  );
$$;

create function public.garilink_identity_reviewer_evidence(case_key uuid,request_key uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=garilink_private.require_user(false); a garilink_private.verification_review_assignments;
  c garilink_private.verification_cases;
  d garilink_private.verification_documents; expiry timestamptz:=now()+interval '5 minutes';
begin
  select * into c from garilink_private.verification_cases where id=case_key;
  if c.id is null or c.subject_id=actor or c.state<>'PENDING_REVIEW' or request_key is null then
    raise exception 'Review access denied.' using errcode='42501'; end if;
  select * into a from garilink_private.verification_review_assignments where case_id=case_key and reviewer_id=actor;
  if a.case_id is null or a.revoked_at is not null or a.expires_at<=now()
    or not garilink_private.identity_reviewer_qualified(actor) then
    raise exception 'Review access denied.' using errcode='42501'; end if;
  select x.* into d from garilink_private.verification_documents x
    where x.case_id=case_key and x.state='VALIDATED' and garilink_private.identity_evidence_ready(case_key)
    order by x.version desc limit 1;
  if d.id is null then raise exception 'Finalized evidence unavailable.' using errcode='42501'; end if;
  insert into garilink_private.identity_reviewer_access_events(case_id,document_id,reviewer_id,request_id,expires_at)
    values(case_key,d.id,actor,request_key,expiry);
  return jsonb_build_object('documentId',d.id,'objectPath',d.object_path,'expiresAt',expiry);
end; $$;

revoke all on function garilink_private.identity_collection_enabled(),
  garilink_private.identity_record_inspection(uuid,text,text,integer,text,text,text,text,timestamptz,timestamptz),
  garilink_private.identity_finalize_evidence(uuid,uuid,integer,uuid)
  from public,anon,authenticated,service_role;
revoke all on function public.garilink_identity_reserve_evidence(uuid,integer,integer,uuid,text,integer),
  public.garilink_identity_reviewer_evidence(uuid,uuid) from public,anon,service_role;
grant execute on function public.garilink_identity_reserve_evidence(uuid,integer,integer,uuid,text,integer),
  public.garilink_identity_reviewer_evidence(uuid,uuid) to authenticated;

commit;
