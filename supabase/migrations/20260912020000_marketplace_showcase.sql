begin;

create or replace function public.garilink_search_listings(filters jsonb default '{}') returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  page_no int := coalesce((filters ->> 'page')::int,1);
  page_size int := coalesce((filters ->> 'limit')::int,20);
  low_price numeric := (filters ->> 'priceMin')::numeric;
  high_price numeric := (filters ->> 'priceMax')::numeric;
  sort_mode text := coalesce(nullif(filters ->> 'sort',''),'NEWEST');
  result jsonb;
  total bigint;
begin
  if filters is null or jsonb_typeof(filters) <> 'object' or
    page_no not between 1 and 10000 or page_size not between 1 and 100 or
    char_length(filters ->> 'q') > 100 or char_length(filters ->> 'county') > 100 or
    char_length(filters ->> 'transmission') > 30 or char_length(filters ->> 'fuelType') > 30 or
    low_price < 0 or high_price < 0 or low_price > high_price or
    (filters ? 'type' and filters ->> 'type' not in ('FOR_SALE','FOR_HIRE')) or
    sort_mode not in ('NEWEST','PRICE_ASC','PRICE_DESC','YEAR_DESC','MILEAGE_ASC') then
    raise exception 'Invalid search filters' using errcode = '22023';
  end if;

  with matches as (
    select l.id,l.created_at,l.price,
      case when (v.specs ->> 'year') ~ '^[0-9]{4}$' then (v.specs ->> 'year')::int end as model_year,
      case when (v.specs ->> 'mileage') ~ '^[0-9]+([.][0-9]+)?$' then (v.specs ->> 'mileage')::numeric end as mileage
    from public.gl_listings l
    join public.gl_vehicles v on v.id=l.vehicle_id
    where garilink_private.listing_visible(l)
      and (nullif(filters ->> 'type','') is null or l.type=filters ->> 'type')
      and (nullif(trim(filters ->> 'county'),'') is null or position(lower(trim(filters ->> 'county')) in lower(l.county)) > 0)
      and (nullif(trim(filters ->> 'transmission'),'') is null or upper(v.specs ->> 'transmission')=upper(filters ->> 'transmission'))
      and (nullif(trim(filters ->> 'fuelType'),'') is null or upper(v.specs ->> 'fuelType')=upper(filters ->> 'fuelType'))
      and (nullif(trim(filters ->> 'q'),'') is null or
        position(lower(trim(filters ->> 'q')) in lower(concat_ws(' ',l.title,l.description,l.county,v.specs ->> 'make',v.specs ->> 'model'))) > 0)
      and (low_price is null or l.price >= low_price)
      and (high_price is null or l.price <= high_price)
  ), ranked as (
    select m.id,row_number() over(order by
      case when sort_mode='PRICE_ASC' then m.price end asc nulls last,
      case when sort_mode='PRICE_DESC' then m.price end desc nulls last,
      case when sort_mode='YEAR_DESC' then m.model_year end desc nulls last,
      case when sort_mode='MILEAGE_ASC' then m.mileage end asc nulls last,
      m.created_at desc,m.id) as ordinal
    from matches m
  ), paged as (
    select * from ranked order by ordinal limit page_size offset (page_no-1)*page_size
  )
  select
    (select count(*) from matches),
    coalesce(jsonb_agg(garilink_private.listing_json(l) order by p.ordinal),'[]'::jsonb)
  into total,result
  from paged p join public.gl_listings l on l.id=p.id;

  return jsonb_build_object('data',result,'total',total,'page',page_no,'limit',page_size,'sort',sort_mode);
end;
$$;

revoke all on function public.garilink_search_listings(jsonb) from public;
grant execute on function public.garilink_search_listings(jsonb) to anon,authenticated;

commit;
