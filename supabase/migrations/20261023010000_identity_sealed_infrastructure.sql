begin;

-- NOLOGIN capability roles. Provision a separate restricted login/JWT through
-- an approved operator procedure; never grant these roles to service_role.
create role garilink_evidence_worker nologin noinherit;
create role garilink_evidence_ingest nologin noinherit;
create role garilink_evidence_sealer nologin noinherit;
create role garilink_evidence_reader nologin noinherit;
do $$ begin
  if exists(select 1 from pg_roles where rolname='authenticator') then
    grant garilink_evidence_ingest,garilink_evidence_sealer,garilink_evidence_reader to authenticator;
  end if;
end $$;
grant usage on schema garilink_private to garilink_evidence_worker;
grant usage on schema storage to garilink_evidence_ingest,garilink_evidence_sealer,garilink_evidence_reader;
grant insert on storage.objects to garilink_evidence_ingest,garilink_evidence_sealer;
grant select on storage.objects to garilink_evidence_sealer;
grant select on storage.objects to garilink_evidence_reader;
grant select on storage.buckets to garilink_evidence_ingest,garilink_evidence_sealer;
grant select on storage.buckets to garilink_evidence_reader;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('verification-sealed','verification-sealed',false,5242880,array['image/png']);
create policy identity_quarantine_insert on storage.objects for insert to garilink_evidence_ingest
  with check(bucket_id='verification-private');
create policy identity_sealed_insert on storage.objects for insert to garilink_evidence_sealer
  with check(bucket_id='verification-sealed');
create policy identity_worker_read on storage.objects for select to garilink_evidence_sealer
  using(bucket_id in ('verification-private','verification-sealed'));
create policy identity_proxy_read on storage.objects for select to garilink_evidence_reader
  using(bucket_id='verification-sealed');
-- No UPDATE/DELETE policy or grant: promotion is create-only, never upsert.

create table garilink_private.identity_sealed_objects (
  document_id uuid primary key references garilink_private.verification_documents(id),
  object_path text not null unique,
  sha256 text not null check(sha256 ~ '^[0-9a-f]{64}$'),
  sealed_at timestamptz not null default now()
);
alter table garilink_private.identity_sealed_objects enable row level security;
revoke all on garilink_private.identity_sealed_objects from public,anon,authenticated,service_role;
create trigger identity_sealed_objects_immutable before update or delete
  on garilink_private.identity_sealed_objects for each row
  execute function garilink_private.verification_append_only();

create or replace function garilink_private.identity_evidence_ready(case_key uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from garilink_private.verification_documents d
    join garilink_private.identity_validation_receipts r on r.document_id=d.id
    join garilink_private.identity_content_inspections i on i.id::text=r.scanner_reference
    join garilink_private.identity_finalization_events f on f.document_id=d.id and f.inspection_id=i.id
    join garilink_private.identity_sealed_objects s on s.document_id=d.id and s.sha256=d.sha256
    where d.case_id=case_key and d.state='VALIDATED' and d.finalized_at is not null
      and d.sha256=r.sha256 and d.sha256=i.actual_sha256
      and d.size_bytes=r.size_bytes and d.size_bytes=i.actual_size_bytes
      and d.mime_type=i.actual_mime_type and d.object_path=r.object_path
      and i.scan_result='CLEAN' and i.expires_at>d.finalized_at and d.retention_until>now()
      and d.version=(select max(x.version) from garilink_private.verification_documents x where x.case_id=case_key)
  );
$$;

create function garilink_private.identity_worker_snapshot(document_key uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare d garilink_private.verification_documents; c garilink_private.verification_cases;
  p garilink_private.identity_evidence_policies;
begin
  select * into d from garilink_private.verification_documents where id=document_key;
  select * into c from garilink_private.verification_cases where id=d.case_id;
  select * into p from garilink_private.identity_evidence_policies where policy_version=c.policy_version;
  if not garilink_private.identity_collection_enabled() or d.id is null or c.id is null
    or c.state<>'DRAFT' or d.state<>'RESERVED' or d.reservation_expires_at<=clock_timestamp()
    or d.reserved_case_revision is distinct from c.revision or not coalesce(p.approved,false)
    or d.version<>(select max(x.version) from garilink_private.verification_documents x where x.case_id=c.id)
    or d.mime_type<>'image/png' or not (d.mime_type=any(p.allowed_mime_types)) then
    raise exception 'Evidence unavailable.' using errcode='42501'; end if;
  return jsonb_build_object('documentId',d.id,'caseId',c.id,'subjectId',c.subject_id,
    'objectPath',d.object_path,'version',d.version,'caseRevision',c.revision,'policyVersion',c.policy_version,
    'expiresAt',d.reservation_expires_at,'mimeType',d.mime_type,'sizeBytes',d.size_bytes,'maxSizeBytes',p.max_size_bytes);
end; $$;

create function garilink_private.identity_worker_commit(input_value jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare d garilink_private.verification_documents; c garilink_private.verification_cases;
  prior garilink_private.identity_finalization_events; inspection_id uuid; snapshot jsonb;
  document_key uuid:=(input_value->>'documentId')::uuid;
  request_key uuid:=(input_value->>'requestId')::uuid;
  digest text:=input_value->>'actualSha256'; sealed_path text;
begin
  if document_key is null or request_key is null then
    raise exception 'Invalid processing request.' using errcode='22023'; end if;
  select * into d from garilink_private.verification_documents where id=document_key;
  select * into c from garilink_private.verification_cases where id=d.case_id for update;
  select * into d from garilink_private.verification_documents where id=document_key for update;
  sealed_path:=d.id::text||'/'||d.version::text||'/'||digest||'.png';
  select * into prior from garilink_private.identity_finalization_events where request_id=request_key;
  if found then
    if prior.document_id is distinct from document_key or prior.case_revision is distinct from (input_value->>'caseRevision')::integer
      or not exists(select 1 from garilink_private.identity_sealed_objects s where s.document_id=d.id
        and s.sha256=digest and s.object_path=sealed_path) then
      raise exception 'Conflicting processing retry.' using errcode='PT409'; end if;
    return;
  end if;
  snapshot:=garilink_private.identity_worker_snapshot(document_key);
  if (snapshot->>'caseRevision')::integer is distinct from (input_value->>'caseRevision')::integer
    or (snapshot->>'policyVersion')::integer is distinct from (input_value->>'policyVersion')::integer
    or (snapshot->>'version')::integer is distinct from (input_value->>'version')::integer
    or (snapshot->>'sizeBytes')::integer is distinct from (input_value->>'actualSizeBytes')::integer
    or snapshot->>'mimeType' is distinct from input_value->>'actualMimeType'
    or input_value->>'scanResult' is distinct from 'CLEAN'
    or (input_value->>'expiresAt')::timestamptz<=clock_timestamp() then
    raise exception 'Stale processing request.' using errcode='PT409'; end if;
  -- Trusted worker has already decoded/scanned exact bytes and verified a
  -- create-only sealed upload. Ordinary callers cannot execute this boundary.
  inspection_id:=garilink_private.identity_record_inspection(d.id,sealed_path,
    input_value->>'actualMimeType',(input_value->>'actualSizeBytes')::integer,digest,
    input_value->>'scannerProvider',input_value->>'scannerAttestation',input_value->>'scanResult',
    (input_value->>'scannedAt')::timestamptz,(input_value->>'expiresAt')::timestamptz);
  insert into garilink_private.identity_sealed_objects(document_id,object_path,sha256) values(d.id,sealed_path,digest);
  perform garilink_private.identity_finalize_evidence(d.id,inspection_id,c.revision,request_key);
end; $$;
revoke all on function garilink_private.identity_worker_snapshot(uuid),
  garilink_private.identity_worker_commit(jsonb) from public,anon,authenticated,service_role;
grant execute on function garilink_private.identity_worker_snapshot(uuid),
  garilink_private.identity_worker_commit(jsonb) to garilink_evidence_worker;

create function garilink_private.identity_worker_outcome(request_key uuid,document_key uuid) returns jsonb
language sql stable security definer set search_path='' as $$
  select jsonb_build_object('documentId',f.document_id,'caseRevision',f.case_revision,'sha256',s.sha256)
  from garilink_private.identity_finalization_events f
  join garilink_private.identity_sealed_objects s on s.document_id=f.document_id
  where f.request_id=request_key and f.document_id=document_key;
$$;
revoke all on function garilink_private.identity_worker_outcome(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function garilink_private.identity_worker_outcome(uuid,uuid) to garilink_evidence_worker;

create function public.garilink_identity_upload_authorize(document_key uuid,expected_revision integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=garilink_private.require_user(false); snapshot jsonb;
begin
  snapshot:=garilink_private.identity_worker_snapshot(document_key);
  if (snapshot->>'subjectId')::uuid is distinct from actor
    or (snapshot->>'caseRevision')::integer is distinct from expected_revision then
    raise exception 'Upload denied.' using errcode='42501'; end if;
  return snapshot - 'subjectId';
end; $$;
revoke all on function public.garilink_identity_upload_authorize(uuid,integer) from public,anon,service_role;
grant execute on function public.garilink_identity_upload_authorize(uuid,integer) to authenticated;

-- Reviewer authorization still derives the ordinary session. Only sealed
-- evidence may leave the proxy; no signed/public URL is returned to a client.
create function public.garilink_identity_reviewer_sealed(case_key uuid,request_key uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare access_value jsonb; d garilink_private.verification_documents;
  s garilink_private.identity_sealed_objects;
begin
  access_value:=public.garilink_identity_reviewer_evidence(case_key,request_key);
  select * into d from garilink_private.verification_documents where id=(access_value->>'documentId')::uuid;
  select * into s from garilink_private.identity_sealed_objects where document_id=d.id;
  if s.document_id is null or s.sha256 is distinct from d.sha256 then
    raise exception 'Sealed evidence unavailable.' using errcode='42501'; end if;
  return jsonb_build_object('documentId',d.id,'accessId',request_key,'sha256',s.sha256,
    'mimeType',d.mime_type,'sizeBytes',d.size_bytes,'version',d.version);
end; $$;
revoke all on function public.garilink_identity_reviewer_sealed(uuid,uuid) from public,anon,service_role;
grant execute on function public.garilink_identity_reviewer_sealed(uuid,uuid) to authenticated;
create function public.garilink_identity_proxy_resolve(access_key uuid,reviewer_key uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
  select jsonb_build_object('objectPath',s.object_path) into result
  from garilink_private.identity_reviewer_access_events e
  join garilink_private.verification_cases c on c.id=e.case_id
  join garilink_private.verification_review_assignments a on a.case_id=c.id and a.reviewer_id=e.reviewer_id
  join garilink_private.identity_sealed_objects s on s.document_id=e.document_id
  where e.request_id=access_key and e.reviewer_id=reviewer_key and e.expires_at>clock_timestamp()
    and a.revoked_at is null and a.expires_at>clock_timestamp() and c.state='PENDING_REVIEW'
    and c.subject_id<>reviewer_key and garilink_private.identity_reviewer_qualified(reviewer_key)
    and garilink_private.identity_evidence_ready(c.id);
  if result is null then raise exception 'Proxy access denied.' using errcode='42501'; end if;
  return result;
end; $$;
revoke all on function public.garilink_identity_proxy_resolve(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.garilink_identity_proxy_resolve(uuid,uuid) to garilink_evidence_reader;
commit;
