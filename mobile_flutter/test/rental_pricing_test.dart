import 'package:flutter_test/flutter_test.dart';
import 'package:garilink_mobile/features/trips/domain/models/rental_summary.dart';
import 'package:garilink_mobile/features/vehicle/domain/models/rental_pricing.dart';

void main() {
  test('configured pricing preserves exact integer minor units', () {
    final policy = RentalPricingPolicy.fromJson({
      'configured': true,
      'policyVersion': 1,
      'currency': 'TZS',
      'baseChargeMinor': 25000,
      'minimumChargeMinor': 50000,
      'durationRateMinorPerDay': 80000,
      'distanceRateMinorPerKilometer': 1500,
    });
    expect(policy.configured, isTrue);
    expect(policy.durationRateMinorPerDay, 80000);
    expect(policy.distanceRateMinorPerKilometer, 1500);
    expect(policy.toUpdateJson()['baseChargeMinor'], 25000);
  });

  test('missing pricing is explicit and never parsed as zero', () {
    final policy = RentalPricingPolicy.fromJson({'configured': false});
    expect(policy.configured, isFalse);
    expect(policy.currency, isNull);
    expect(policy.baseChargeMinor, isNull);
  });

  test(
    'incomplete estimate exposes missing route distance without a price',
    () {
      final estimate = RentalPriceEstimate.fromJson({
        'status': 'INCOMPLETE_INPUT',
        'policyVersion': 1,
        'currency': 'TZS',
        'missingInputs': ['ROUTE_DISTANCE_METERS'],
      });
      expect(estimate.status, RentalEstimateStatus.incompleteInput);
      expect(estimate.finalEstimatedAmountMinor, isNull);
      expect(estimate.missingInputs, ['ROUTE_DISTANCE_METERS']);
    },
  );

  test('authoritative estimate preserves exact component breakdown', () {
    final estimate = RentalPriceEstimate.fromJson({
      'status': 'ESTIMATED',
      'estimateVersion': 1,
      'pricingPolicyVersion': 1,
      'currency': 'TZS',
      'rentalDays': 3,
      'components': {
        'baseChargeMinor': 25000,
        'durationChargeMinor': 240000,
        'distanceChargeMinor': 0,
        'minimumAdjustmentMinor': 0,
      },
      'rawAmountMinor': 265000,
      'finalEstimatedAmountMinor': 265000,
    });
    expect(estimate.status, RentalEstimateStatus.estimated);
    expect(estimate.rentalDays, 3);
    expect(estimate.baseChargeMinor, 25000);
    expect(estimate.durationChargeMinor, 240000);
    expect(estimate.distanceChargeMinor, 0);
    expect(estimate.finalEstimatedAmountMinor, 265000);
  });

  test('unconfigured and unavailable estimates never invent a price', () {
    final unconfigured = RentalPriceEstimate.fromJson({
      'status': 'PRICING_NOT_CONFIGURED',
      'estimateVersion': 1,
    });
    final unavailable = RentalPriceEstimate.fromJson({
      'status': 'ROUTE_UNAVAILABLE',
      'estimateVersion': 1,
      'pricingPolicyVersion': 1,
      'currency': 'TZS',
    });
    expect(unconfigured.status, RentalEstimateStatus.pricingNotConfigured);
    expect(unconfigured.finalEstimatedAmountMinor, isNull);
    expect(unavailable.status, RentalEstimateStatus.routeUnavailable);
    expect(unavailable.finalEstimatedAmountMinor, isNull);
  });

  test('late estimate responses cannot overwrite newer booking inputs', () {
    final guard = RentalEstimateRequestGuard();
    final destinationA = guard.begin();
    guard.invalidate();
    final destinationB = guard.begin();
    expect(guard.isCurrent(destinationA), isFalse);
    expect(guard.isCurrent(destinationB), isTrue);
  });

  test('a newer date estimate supersedes an earlier in-flight request', () {
    final guard = RentalEstimateRequestGuard();
    final datesA = guard.begin();
    final datesB = guard.begin();
    expect(guard.isCurrent(datesA), isFalse);
    expect(guard.isCurrent(datesB), isTrue);
  });

  test('legacy rental without pricing snapshot remains compatible', () {
    final rental = RentalSummary.fromJson({
      'id': 'legacy',
      'workspaceId': 'workspace',
      'listingId': 'listing',
      'vehicleId': 'vehicle',
      'status': 'REQUESTED',
      'startDate': '2027-01-01',
      'endDate': '2027-01-03',
      'dailyRate': 80000,
      'currency': 'TZS',
      'totalAmount': 160000,
      'createdAt': '2026-09-22T00:00:00Z',
      'updatedAt': '2026-09-22T00:00:00Z',
      'listing': {'title': 'Legacy rental', 'vehicle': {}},
    });
    expect(rental.pricingEstimate, isNull);
    expect(rental.totalAmount, 160000);
  });
}
