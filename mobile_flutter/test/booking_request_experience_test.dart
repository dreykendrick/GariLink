import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:garilink_mobile/features/booking/presentation/pages/booking_page.dart';
import 'package:garilink_mobile/features/explore/domain/discovery_selection.dart';
import 'package:garilink_mobile/features/explore/domain/vehicle_suitability.dart';
import 'package:garilink_mobile/features/location/domain/models/gari_location.dart';
import 'package:garilink_mobile/features/trips/domain/models/transport_need.dart';

const selection = DiscoverySelection(
  listingId: 'listing-1',
  need: TransportNeed(
    purpose: TransportPurpose.familyOrGroup,
    passengerCount: 6,
    driverPreference: DriverPreference.withDriver,
  ),
  searchLocation: SearchLocation(location: GariLocation(locality: 'Mikocheni')),
  suitability: SuitabilityResult(
    matchingVersion: 1,
    status: SuitabilityStatus.suitable,
    reasons: ['PASSENGER_CAPACITY_OK'],
  ),
);

Future<void> render(
  WidgetTester tester, {
  double width = 390,
  double textScale = 1,
  DiscoverySelection? discoverySelection = selection,
}) async {
  tester.view.physicalSize = Size(width, 1000);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  await tester.pumpWidget(
    ProviderScope(
      child: MaterialApp(
        home: MediaQuery(
          data: MediaQueryData(textScaler: TextScaler.linear(textScale)),
          child: BookingPage(
            listingId: 'listing-1',
            dailyRate: 0,
            currency: 'TZS',
            selection: discoverySelection,
            vehicleTitle: 'Toyota Alphard',
            vehicleCategory: 'Minivan',
            publicLocality: 'Mikocheni',
            availability: 'AVAILABLE',
          ),
        ),
      ),
    ),
  );
}

void main() {
  testWidgets('matched request reassures renter and preserves need summary', (
    tester,
  ) async {
    await render(tester);
    expect(find.text('Toyota Alphard'), findsOneWidget);
    expect(find.text('Family or group travel'), findsOneWidget);
    expect(find.text('Passengers: 6'), findsOneWidget);
    expect(find.text('What do you need transport for?'), findsNothing);
    expect(find.text('Send rental request'), findsOneWidget);
    expect(find.textContaining("doesn't confirm the rental"), findsOneWidget);
    expect(find.textContaining('No payment is taken'), findsOneWidget);
  });

  testWidgets(
    'direct entry collects transport need without suitability claim',
    (tester) async {
      await render(tester, discoverySelection: null);
      expect(find.text('What do you need transport for?'), findsOneWidget);
      expect(find.textContaining('Suitable'), findsNothing);
    },
  );

  for (final width in [320.0, 390.0, 600.0]) {
    testWidgets('request flow fits ${width.toInt()}px at 200% text', (
      tester,
    ) async {
      await render(tester, width: width, textScale: 2);
      await tester.pump();
      expect(tester.takeException(), isNull);
      expect(find.text('Send rental request'), findsOneWidget);
      expect(find.text('When do you need it?'), findsOneWidget);
    });
  }
}
