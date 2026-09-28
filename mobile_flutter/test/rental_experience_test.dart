import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:garilink_mobile/features/trips/data/repositories/rental_repository.dart';
import 'package:garilink_mobile/features/trips/domain/models/rental_summary.dart';
import 'package:garilink_mobile/features/trips/presentation/pages/rental_details_page.dart';
import 'package:garilink_mobile/features/trips/presentation/models/rental_status_presentation.dart';
import 'package:garilink_mobile/features/trips/presentation/pages/trips_page.dart';
import 'package:garilink_mobile/features/vehicle/domain/models/rental_pricing.dart';

void main() {
  test('unchanged rental retries reuse one valid request key', () {
    final retry = RentalRetryRequest();
    final start = DateTime(2030, 1, 10);
    final end = DateTime(2030, 1, 13);
    final first = retry.prepare(
      listingId: 'listing',
      startDate: start,
      endDate: end,
      pickupNotes: 'Airport',
    );
    final second = retry.prepare(
      listingId: 'listing',
      startDate: start,
      endDate: end,
      pickupNotes: ' Airport ',
    );
    expect(second, first);
    expect(first, matches(RegExp(r'^[0-9a-f-]{36}$')));
  });

  test('edited dates create a distinct booking intent', () {
    final retry = RentalRetryRequest();
    final first = retry.prepare(
      listingId: 'listing',
      startDate: DateTime(2030, 1, 10),
      endDate: DateTime(2030, 1, 13),
    );
    final edited = retry.prepare(
      listingId: 'listing',
      startDate: DateTime(2030, 1, 10),
      endDate: DateTime(2030, 1, 14),
    );
    expect(edited, isNot(first));
  });

  test('rental snapshot calculates the backend date interval', () {
    expect(sample().rentalDays, 3);
    expect(sample().canCustomerCancel, isTrue);
    expect(sample(status: 'ACTIVE').canCustomerCancel, isFalse);
  });

  testWidgets('customer details explain pricing, dates and pending status', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(home: RentalDetailsPage(rental: sample())),
    );
    expect(find.text('Toyota Land Cruiser'), findsOneWidget);
    expect(find.text('Waiting'), findsOneWidget);
    expect(find.text('Waiting for the owner'), findsOneWidget);
    expect(find.textContaining('not confirmed'), findsOneWidget);
    await tester.scrollUntilVisible(find.textContaining('TZS 240,000'), 300);
    expect(find.textContaining('TZS 240,000'), findsWidgets);
    await tester.scrollUntilVisible(find.text('Airport pickup'), 300);
    expect(find.text('Airport pickup'), findsOneWidget);
  });

  testWidgets('owner actions only render when supplied for a valid state', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: RentalDetailsPage(
          rental: sample(status: 'APPROVED'),
          ownerView: true,
        ),
      ),
    );
    expect(find.text('Accept request'), findsNothing);
    expect(find.text('Decline'), findsNothing);
    await tester.pumpWidget(
      MaterialApp(
        home: RentalDetailsPage(
          rental: sample(),
          ownerView: true,
          onApprove: () {},
          onReject: () {},
        ),
      ),
    );
    expect(find.text('Accept request'), findsOneWidget);
    expect(find.text('Decline'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('Very Long Customer Name For Responsive Verification'),
      300,
    );
    expect(
      find.text('Very Long Customer Name For Responsive Verification'),
      findsOneWidget,
    );
  });

  testWidgets('legacy null snapshot is explicit and never rendered as zero', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(home: RentalDetailsPage(rental: sample(estimate: false))),
    );
    await tester.scrollUntilVisible(
      find.textContaining('No authoritative price estimate'),
      300,
    );
    expect(
      find.textContaining('No authoritative price estimate'),
      findsOneWidget,
    );
    expect(find.textContaining('TZS 0'), findsNothing);
  });

  test('every authoritative lifecycle status has customer-safe copy', () {
    const statuses = [
      'REQUESTED',
      'UNDER_REVIEW',
      'APPROVED',
      'READY_FOR_PICKUP',
      'ACTIVE',
      'COMPLETED',
      'REJECTED',
      'CANCELLED',
    ];
    for (final status in statuses) {
      final presentation = rentalStatusPresentation(status);
      expect(presentation.label, isNotEmpty);
      expect(presentation.explanation, isNotEmpty);
      expect(presentation.nextStep, isNotEmpty);
      expect(presentation.label, isNot(status));
    }
    expect(
      rentalStatusPresentation('ACTIVE').group,
      RentalLifecycleGroup.active,
    );
    expect(
      rentalStatusPresentation('COMPLETED').group,
      RentalLifecycleGroup.past,
    );
  });

  testWidgets('trip card remains usable at narrow width and large text', (
    tester,
  ) async {
    await tester.pumpWidget(
      MediaQuery(
        data: const MediaQueryData(
          size: Size(320, 720),
          textScaler: TextScaler.linear(1.4),
        ),
        child: MaterialApp(
          home: Scaffold(
            body: RentalTripCard(
              rental: sample(),
              busy: false,
              onOpen: () {},
              onCancel: () {},
            ),
          ),
        ),
      ),
    );
    expect(tester.takeException(), isNull);
    expect(find.text('Waiting'), findsOneWidget);
    expect(find.text('Cancel request'), findsOneWidget);
    expect(find.textContaining('Estimate recorded'), findsOneWidget);
  });
}

RentalSummary sample({String status = 'REQUESTED', bool estimate = true}) =>
    RentalSummary(
      id: 'rental',
      workspaceId: 'workspace',
      listingId: 'listing',
      vehicleId: 'vehicle',
      status: status,
      startDate: DateTime(2030, 1, 10),
      endDate: DateTime(2030, 1, 13),
      dailyRate: 80000,
      currency: 'TZS',
      totalAmount: 240000,
      pricingEstimate: estimate
          ? const RentalPriceEstimate(
              status: RentalEstimateStatus.estimated,
              estimateVersion: 1,
              pricingPolicyVersion: 1,
              currency: 'TZS',
              rentalDays: 3,
              finalEstimatedAmountMinor: 240000,
            )
          : null,
      title: 'Toyota Land Cruiser',
      vehicle: const RentalVehicleSummary(
        make: 'Toyota',
        model: 'Land Cruiser',
        year: 2022,
      ),
      customer: const RentalCustomerSummary(
        id: 'customer',
        displayName: 'Very Long Customer Name For Responsive Verification',
        phoneNumber: '+255700000000',
      ),
      pickupNotes: 'Airport pickup',
      createdAt: DateTime(2029, 12, 1),
      updatedAt: DateTime(2029, 12, 2),
    );
