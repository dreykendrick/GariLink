begin;
create function garilink_private.protect_transport_need_snapshot() returns trigger
language plpgsql set search_path='' as $$
begin
 if new.transport_need_snapshot is distinct from old.transport_need_snapshot then
  raise exception 'Transport requirements cannot be changed after submission' using errcode='22023';
 end if;
 return new;
end; $$;
create trigger gl_rentals_transport_need_immutable before update on public.gl_rentals
for each row execute function garilink_private.protect_transport_need_snapshot();
revoke all on function garilink_private.protect_transport_need_snapshot() from public,anon,authenticated;

-- Preserve the established nested listing response contract as well as the snapshot.
create or replace function garilink_private.rental_json(r public.gl_rentals, include_customer boolean default false)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'id',r.id,'workspaceId',r.workspace_id,'listingId',r.listing_id,'vehicleId',r.vehicle_id,
 'status',r.status,'startDate',r.start_date,'endDate',r.end_date,'dailyRate',r.daily_rate,
 'currency',r.currency,'totalAmount',r.total_amount,'depositAmount',r.deposit_amount,
 'pickupNotes',r.pickup_notes,'rejectionReason',r.rejection_reason,'transportNeed',r.transport_need_snapshot,
 'createdAt',r.created_at,'updatedAt',r.updated_at,
 'listing',jsonb_build_object('id',l.id,'title',l.title,'county',l.county,'vehicle',garilink_private.vehicle_json(v)),
 'customer',case when include_customer then jsonb_build_object('id',r.customer_id,
 'displayName',coalesce(nullif(p.display_name,''),nullif(trim(concat_ws(' ',p.first_name,p.last_name)),''),'GariLink customer'),
 'phoneNumber',case when u.phone is null or u.phone='' then '' else '+'||ltrim(u.phone,'+') end,'photoUrl',null) else null end)
 from public.gl_listings l join public.gl_vehicles v on v.id=r.vehicle_id
 join public.gl_profiles p on p.user_id=r.customer_id join auth.users u on u.id=r.customer_id where l.id=r.listing_id;
$$;
commit;
