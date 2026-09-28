begin;
create table garilink_private.sms_deliveries (
  webhook_id text primary key check (char_length(webhook_id) between 1 and 200),
  accepted boolean not null default false,
  created_at timestamptz not null default now()
);
create index sms_deliveries_created_at on garilink_private.sms_deliveries(created_at);
alter table garilink_private.sms_deliveries enable row level security;
revoke all on garilink_private.sms_deliveries from public, anon, authenticated;

create function public.garilink_claim_sms(message_id text) returns text
language plpgsql security definer set search_path = '' as $$
declare inserted_id text; prior_accepted boolean;
begin
  if message_id is null or char_length(message_id) not between 1 and 200 then
    raise exception 'Invalid message ID' using errcode = '22023';
  end if;
  -- Bounded cleanup retains IDs far longer than the five-minute signature window.
  delete from garilink_private.sms_deliveries where webhook_id in
    (select webhook_id from garilink_private.sms_deliveries where created_at < now() - interval '1 day'
     order by created_at limit 100);
  insert into garilink_private.sms_deliveries(webhook_id) values (message_id)
    on conflict do nothing returning webhook_id into inserted_id;
  if inserted_id is not null then return 'NEW'; end if;
  select accepted into prior_accepted from garilink_private.sms_deliveries where webhook_id = message_id;
  return case when prior_accepted then 'ACCEPTED' else 'UNKNOWN' end;
end;
$$;
create function public.garilink_accept_sms(message_id text) returns void
language sql security definer set search_path = '' as $$
  update garilink_private.sms_deliveries set accepted = true where webhook_id = message_id;
$$;
revoke all on function public.garilink_claim_sms(text), public.garilink_accept_sms(text) from public, anon, authenticated;
grant execute on function public.garilink_claim_sms(text), public.garilink_accept_sms(text) to service_role;
commit;
