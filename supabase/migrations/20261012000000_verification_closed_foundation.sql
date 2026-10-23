begin;

-- LOCAL CLOSED FOUNDATION. No uploads, review endpoint, or action enforcement
-- is enabled by this migration. Activation requires separately certified RPCs.
create table garilink_private.verification_requirements (
  key text primary key,
  scope text not null check (scope in ('PERSON','VEHICLE','DRIVER','WORKSPACE')),
  policy_version integer not null check (policy_version > 0),
  approved_policy boolean not null default false check (not approved_policy)
);
insert into garilink_private.verification_requirements(key,scope,policy_version) values
  ('identity','PERSON',1),('contact','PERSON',1),
  ('designatedDriverLicence','DRIVER',1),('ownerIdentity','PERSON',1),
  ('vehicleDocuments','VEHICLE',1),('ownershipOrMandate','VEHICLE',1),
  ('insurance','VEHICLE',1),('driverLicence','DRIVER',1),
  ('operatingQualifications','DRIVER',1),('workspaceAuthority','WORKSPACE',1);

create table garilink_private.verification_cases (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.gl_accounts(id),
  workspace_id uuid references public.gl_workspaces(id),
  vehicle_id uuid,
  driver_id uuid references public.gl_accounts(id),
  requirement_key text not null references garilink_private.verification_requirements(key),
  revision integer not null check (revision > 0),
  request_id uuid not null,
  state text not null default 'NOT_STARTED' check (state in
    ('NOT_STARTED','DRAFT','PENDING_REVIEW','APPROVED','REJECTED','EXPIRED','REVOKED','SUPERSEDED')),
  created_at timestamptz not null default now(),
  foreign key(vehicle_id,workspace_id) references public.gl_vehicles(id,workspace_id),
  check (vehicle_id is null or workspace_id is not null),
  unique(subject_id,request_id)
);
create index verification_cases_subject on garilink_private.verification_cases(subject_id,requirement_key);

create table garilink_private.verification_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references garilink_private.verification_cases(id),
  version integer not null check (version > 0),
  -- Opaque IDs only; never names, emails, document numbers or phone numbers.
  object_path text not null unique check (object_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}$'),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','application/pdf')),
  size_bytes integer not null check (size_bytes between 1 and 5242880),
  sha256 text check (sha256 ~ '^[0-9a-f]{64}$'),
  state text not null default 'RESERVED' check (state in ('RESERVED','VALIDATED','FAILED','EXPIRED','DELETION_PENDING','DELETED')),
  reservation_expires_at timestamptz not null,
  retention_until timestamptz not null,
  deleted_at timestamptz,
  unique(case_id,version),
  unique(id,case_id),
  check (retention_until > reservation_expires_at),
  check ((state='DELETED') = (deleted_at is not null))
);
create table garilink_private.verification_review_assignments (
  case_id uuid not null references garilink_private.verification_cases(id),
  reviewer_id uuid not null references public.gl_accounts(id),
  assigned_by uuid not null references public.gl_accounts(id),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  primary key(case_id,reviewer_id)
);
create table garilink_private.verification_decisions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references garilink_private.verification_cases(id),
  document_id uuid not null,
  reviewer_id uuid not null,
  request_id uuid not null unique,
  result text not null check (result in ('APPROVED','REJECTED','REVOKED')),
  reason_code text not null check (reason_code ~ '^[A-Z_]{1,80}$'),
  decided_at timestamptz not null default now(),
  valid_until timestamptz,
  foreign key(document_id,case_id) references garilink_private.verification_documents(id,case_id),
  foreign key(case_id,reviewer_id) references garilink_private.verification_review_assignments(case_id,reviewer_id),
  check (result <> 'APPROVED' or (valid_until is not null and valid_until > decided_at))
);
create table garilink_private.verification_audit (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references garilink_private.verification_cases(id),
  actor_id uuid not null references public.gl_accounts(id),
  event_code text not null check(event_code ~ '^[A-Z_]{1,80}$'),
  occurred_at timestamptz not null default now()
);
create function garilink_private.verification_append_only() returns trigger
language plpgsql set search_path='' as $$
begin
  raise exception 'Verification history is append-only.' using errcode='42501';
end; $$;
revoke all on function garilink_private.verification_append_only() from public,anon,authenticated,service_role;
create trigger verification_decisions_immutable before update or delete
  on garilink_private.verification_decisions for each row
  execute function garilink_private.verification_append_only();
create trigger verification_audit_immutable before update or delete
  on garilink_private.verification_audit for each row
  execute function garilink_private.verification_append_only();

-- No client or service-role grants: future narrow reviewed administrative RPCs
-- must implement transitions/assignment/expiry/audit atomically, not raw CRUD.
alter table garilink_private.verification_requirements enable row level security;
alter table garilink_private.verification_cases enable row level security;
alter table garilink_private.verification_documents enable row level security;
alter table garilink_private.verification_review_assignments enable row level security;
alter table garilink_private.verification_decisions enable row level security;
alter table garilink_private.verification_audit enable row level security;
revoke all on garilink_private.verification_requirements,garilink_private.verification_cases,
  garilink_private.verification_documents,garilink_private.verification_review_assignments,
  garilink_private.verification_decisions,garilink_private.verification_audit
  from public,anon,authenticated,service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('verification-private','verification-private',false,5242880,
  array['image/jpeg','image/png','application/pdf']);
-- Restrictive policies intersect any permissive Storage policies. Collection
-- remains impossible through end-user Storage APIs until explicit activation.
create policy verification_collection_closed on storage.objects
  as restrictive for all to anon,authenticated
  using (bucket_id <> 'verification-private')
  with check (bucket_id <> 'verification-private');

-- Safe advisory-only contract. allowed=NULL means NOT AN AUTHORIZATION.
-- No case IDs, documents, private paths or reviewer data are serialized.
create function public.garilink_verification_requirements(action text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare actor uuid := garilink_private.require_user(false); keys text[];
begin
  keys := case action
    when 'WITH_DRIVER_REQUEST' then array['identity','contact']
    when 'SELF_DRIVE_REQUEST' then array['identity','contact','designatedDriverLicence']
    when 'VEHICLE_PUBLICATION' then array['ownerIdentity','contact','vehicleDocuments','ownershipOrMandate','insurance']
    when 'DRIVER_ACTIVATION' then array['identity','contact','driverLicence','operatingQualifications']
    when 'WORKSPACE_AUTHORITY' then array['identity','contact','workspaceAuthority']
    else null end;
  if keys is null then raise exception 'Unsupported verification action.' using errcode='22023'; end if;
  return jsonb_build_object('action',action,'policyVersion',1,'gateEnabled',false,
    'collectionEnabled',false,'allowed',null,'reasonCode','POLICY_NOT_ACTIVATED',
    'evaluatedAt',now(),'requirementKeys',to_jsonb(keys));
end; $$;
revoke all on function public.garilink_verification_requirements(text) from public,anon;
grant execute on function public.garilink_verification_requirements(text) to authenticated;
commit;
