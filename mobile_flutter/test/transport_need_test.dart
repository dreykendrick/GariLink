import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:garilink_mobile/features/trips/domain/models/rental_summary.dart';
import 'package:garilink_mobile/features/trips/presentation/pages/rental_details_page.dart';
import 'package:garilink_mobile/features/trips/data/repositories/rental_repository.dart';
import 'package:garilink_mobile/features/trips/domain/models/transport_need.dart';
import 'package:garilink_mobile/features/booking/presentation/pages/transport_need_form.dart';
import 'package:garilink_mobile/features/trips/presentation/pages/transport_need_summary.dart';

void main() {
  test('unknown versions and malformed optional snapshots are omitted', () {
    for (final value in [
      null,
      {'schemaVersion': 2, 'purpose': 'PERSONAL_TRIP'},
      {'schemaVersion': 1, 'purpose': 'PERSONAL_TRIP', 'passengerCount': 'bad'},
    ]) {
      expect(TransportNeed.fromJson(value), isNull);
    }
  });
  test('changed discovery requirement creates a fresh retry key', () {
    final retry = RentalRetryRequest();
    final start = DateTime(2027, 1, 1), end = DateTime(2027, 1, 2);
    final first = retry.prepare(
      listingId: 'test',
      startDate: start,
      endDate: end,
    );
    final second = retry.prepare(
      listingId: 'test',
      startDate: start,
      endDate: end,
      transportNeed: const TransportNeed(purpose: TransportPurpose.cityTravel),
    );
    expect(first, isNot(second));
    expect(
      retry.prepare(
        listingId: 'test',
        startDate: start,
        endDate: end,
        transportNeed: const TransportNeed(
          purpose: TransportPurpose.cityTravel,
        ),
      ),
      second,
    );
  });
  for (final owner in [false, true]) {
    testWidgets('persisted rental requirements in owner=$owner view', (
      tester,
    ) async {
      final rental = RentalSummary.fromJson({
        'id': 'test',
        'startDate': '2027-01-01',
        'endDate': '2027-01-02',
        'createdAt': '2026-09-01',
        'updatedAt': '2026-09-01',
        'transportNeed': const TransportNeed(
          purpose: TransportPurpose.familyOrGroup,
          passengerCount: 6,
        ).toJson(),
      });
      await tester.pumpWidget(
        MaterialApp(
          home: RentalDetailsPage(rental: rental, ownerView: owner),
        ),
      );
      await tester.scrollUntilVisible(
        find.text(owner ? 'Transport requirements' : 'What you requested'),
        200,
      );
      expect(find.text('Passengers: 6'), findsOneWidget);
      expect(find.textContaining('FAMILY_OR_GROUP'), findsNothing);
    });
  }
  test('nested cargo snapshot round trips', () {
    const need = TransportNeed(
      purpose: TransportPurpose.movingGoods,
      cargo: CargoRequirement(
        estimatedWeightKg: 300,
        estimatedVolumeM3: 2.5,
        cargoType: 'Furniture',
        fragile: true,
        requiresCoveredBody: true,
      ),
      driverPreference: DriverPreference.withDriver,
      returnTrip: true,
    );
    expect(TransportNeed.fromJson(need.toJson())!.toJson(), need.toJson());
    expect(TransportNeed.fromJson(null), isNull);
  });
  testWidgets('summary displays friendly requirements', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: TransportNeedSummary(
            need: TransportNeed(
              purpose: TransportPurpose.familyOrGroup,
              passengerCount: 6,
            ),
          ),
        ),
      ),
    );
    expect(find.text('Family or group travel'), findsOneWidget);
    expect(find.text('Passengers: 6'), findsOneWidget);
    expect(find.textContaining('schemaVersion'), findsNothing);
  });
  testWidgets('purpose reveals cargo fields and validates weight', (
    tester,
  ) async {
    final key = GlobalKey<TransportNeedFormState>();
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(child: TransportNeedForm(key: key)),
        ),
      ),
    );
    expect(find.text('Approx. cargo weight (kg)'), findsNothing);
    await tester.ensureVisible(find.text('Moving goods'));
    await tester.tap(find.text('Moving goods'));
    await tester.pumpAndSettle();
    expect(find.text('Passengers (optional)'), findsNothing);
    await tester.enterText(find.byType(TextFormField).first, '-1');
    expect(key.currentState!.validate(), isFalse);
    await tester.enterText(find.byType(TextFormField).first, '300');
    expect(key.currentState!.validate(), isTrue);
    expect(key.currentState!.need!.cargo!.estimatedWeightKg, 300);

    await tester.ensureVisible(find.text('Personal trip'));
    await tester.tap(find.text('Personal trip'));
    await tester.pumpAndSettle();
    expect(key.currentState!.need!.cargo, isNull);
    expect(find.text('Approx. cargo weight (kg)'), findsNothing);
  });

  testWidgets('matched transport need is retained when booking starts', (
    tester,
  ) async {
    final key = GlobalKey<TransportNeedFormState>();
    const initial = TransportNeed(
      purpose: TransportPurpose.movingGoods,
      cargo: CargoRequirement(
        estimatedWeightKg: 450,
        estimatedVolumeM3: 3.5,
        cargoType: 'Furniture',
        fragile: true,
        requiresCoveredBody: true,
      ),
      driverPreference: DriverPreference.withDriver,
      longDistance: true,
      returnTrip: true,
      notes: 'Handle with care',
    );
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: TransportNeedForm(key: key, initialNeed: initial),
          ),
        ),
      ),
    );
    expect(find.text('Moving goods'), findsOneWidget);
    expect(find.text('450'), findsOneWidget);
    expect(find.text('3.5'), findsOneWidget);
    expect(find.text('With driver'), findsOneWidget);
    expect(key.currentState!.need!.toJson(), initial.toJson());
  });

  for (final width in [320.0, 390.0, 600.0]) {
    testWidgets('need entry remains usable at ${width.toInt()}px', (
      tester,
    ) async {
      tester.view.physicalSize = Size(width, 900);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(child: TransportNeedForm()),
          ),
        ),
      );
      await tester.ensureVisible(find.text('Long-distance travel'));
      expect(tester.takeException(), isNull);
      expect(find.text('What do you need transport for?'), findsOneWidget);
    });
  }

  testWidgets('need entry supports 200 percent text', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: MediaQuery(
          data: MediaQueryData(textScaler: TextScaler.linear(2)),
          child: Scaffold(
            body: SingleChildScrollView(child: TransportNeedForm()),
          ),
        ),
      ),
    );
    await tester.ensureVisible(find.text('Heavy cargo'));
    expect(tester.takeException(), isNull);
  });
}
