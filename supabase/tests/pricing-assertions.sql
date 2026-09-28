select set_config('test.pricing.vehicle',(select vehicle_id::text from public.gl_listings where id=current_setting('test.rental.id')::uuid),true);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}',true);
select pg_temp.assert_true(
  public.garilink_vehicle_rental_pricing(current_setting('test.pricing.vehicle')::uuid)->>'configured'='false',
  'unconfigured pricing is explicit');
select pg_temp.assert_true(
  public.garilink_update_vehicle_rental_pricing(current_setting('test.pricing.vehicle')::uuid,
    '{"policyVersion":1,"currency":"TZS","baseChargeMinor":25000,"minimumChargeMinor":50000,"durationRateMinorPerDay":80000,"distanceRateMinorPerKilometer":1500}')
    ->>'durationRateMinorPerDay'='80000','owner configures exact pricing');
select pg_temp.assert_true(
  public.garilink_vehicle(current_setting('test.pricing.vehicle')::uuid)
    ->'rentalPricing'->>'configured'='true','public vehicle serializer includes safe pricing summary');
do $$ begin
  begin perform public.garilink_update_vehicle_rental_pricing(current_setting('test.pricing.vehicle')::uuid,
    '{"policyVersion":1,"currency":"TZS","baseChargeMinor":-1}');
    raise exception 'Expected negative pricing rejected'; exception when invalid_parameter_value then null; end;
  begin perform public.garilink_update_vehicle_rental_pricing(current_setting('test.pricing.vehicle')::uuid,
    '{"policyVersion":2,"currency":"TZS","baseChargeMinor":1}');
    raise exception 'Expected version rejected'; exception when invalid_parameter_value then null; end;
  begin perform public.garilink_update_vehicle_rental_pricing(current_setting('test.pricing.vehicle')::uuid,
    '{"policyVersion":1,"currency":"USD","baseChargeMinor":1}');
    raise exception 'Expected currency rejected'; exception when invalid_parameter_value then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","session_id":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}',true);
do $$ begin
  begin perform public.garilink_update_vehicle_rental_pricing(current_setting('test.pricing.vehicle')::uuid,
    '{"policyVersion":1,"currency":"TZS","baseChargeMinor":1}');
    raise exception 'Expected unrelated renter rejected'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select pg_temp.assert_true(
  garilink_private.evaluate_rental_pricing_v1(
    '{"policyVersion":1,"currency":"TZS","baseChargeMinor":25000,"minimumChargeMinor":50000,"durationRateMinorPerDay":80000,"distanceRateMinorPerKilometer":1500}',
    '{"startDate":"2027-01-01","endDate":"2027-01-04","routeDistanceMeters":12500}')
    ->>'finalEstimatedAmountMinor'='283750','exact deterministic estimate arithmetic');
select pg_temp.assert_true(
  garilink_private.evaluate_rental_pricing_v1(
    '{"policyVersion":1,"currency":"TZS","minimumChargeMinor":50000,"distanceRateMinorPerKilometer":1500}',
    '{"startDate":"2027-01-01","endDate":"2027-01-02","routeDistanceMeters":1000}')
    ->>'finalEstimatedAmountMinor'='50000','minimum adjustment applies');
select pg_temp.assert_true(
  garilink_private.evaluate_rental_pricing_v1(
    '{"policyVersion":1,"currency":"TZS","distanceRateMinorPerKilometer":1500}',
    '{"startDate":"2027-01-01","endDate":"2027-01-02"}')
    ->>'status'='INCOMPLETE_INPUT','missing route distance never fabricates estimate');
select pg_temp.assert_true(
  garilink_private.rental_price_estimate_v1(
    '{"policyVersion":1,"currency":"TZS","baseChargeMinor":25000,"minimumChargeMinor":50000,"durationRateMinorPerDay":80000}',
    '2027-01-01','2027-01-04',null)->>'finalEstimatedAmountMinor'='265000',
  'route-independent RentalPriceEstimate V1 is exact');
select pg_temp.assert_true(
  garilink_private.rental_price_estimate_v1(null,'2027-01-01','2027-01-02',null)->>'status'='PRICING_NOT_CONFIGURED',
  'unconfigured estimate is explicit');
select pg_temp.assert_true(
  garilink_private.rental_price_estimate_v1(
    '{"policyVersion":1,"currency":"TZS","distanceRateMinorPerKilometer":1500}',
    '2027-01-01','2027-01-02','{"status":"PROVIDER_UNAVAILABLE","routeCalculationVersion":1}')
    ->>'status'='ROUTE_UNAVAILABLE','provider failure never fabricates distance price');
select pg_temp.assert_true(
  garilink_private.rental_price_estimate_v1(
    '{"policyVersion":1,"currency":"TZS","distanceRateMinorPerKilometer":1500}',
    '2027-01-01','2027-01-02','{"status":"ROUTE_AVAILABLE","routeCalculationVersion":1,"routeDistanceMeters":12500}')
    ->>'finalEstimatedAmountMinor'='18750','authoritative route metres compose with Pricing V1');
do $$ begin
  begin update public.gl_rentals set pricing_estimate_snapshot='{"status":"ESTIMABLE"}' where id=current_setting('test.rental.request.one')::uuid;
    raise exception 'Expected pricing snapshot immutable'; exception when invalid_parameter_value then null; end;
end $$;
select 'PASS: pricing configuration, authorization, validation, exact engine and snapshot boundary' as result;
