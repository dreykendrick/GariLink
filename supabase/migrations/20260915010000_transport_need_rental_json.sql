begin;
create or replace function garilink_private.rental_json(r public.gl_rentals, include_customer boolean default false) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',r.id,'listingId',r.listing_id,'vehicleId',r.vehicle_id,'workspaceId',r.workspace_id,'status',r.status,'startDate',r.start_date,'endDate',r.end_date,'dailyRate',r.daily_rate,'currency',r.currency,'totalAmount',r.total_amount,'pickupNotes',r.pickup_notes,'transportNeed',r.transport_need_snapshot,'rejectionReason',r.rejection_reason,'createdAt',r.created_at,'updatedAt',r.updated_at,'vehicle',garilink_private.vehicle_json(v),'customer',case when include_customer then jsonb_build_object('id',r.customer_id,'displayName',coalesce(nullif(p.display_name,''),nullif(trim(concat_ws(' ',p.first_name,p.last_name)),''),'GariLink customer'),'phoneNumber',case when u.phone is null or u.phone='' then '' else '+'||ltrim(u.phone,'+') end,'photoUrl',null) else null end)
 from public.gl_listings l join public.gl_vehicles v on v.id=r.vehicle_id join public.gl_profiles p on p.user_id=r.customer_id join auth.users u on u.id=r.customer_id where l.id=r.listing_id;
$$;
commit;
