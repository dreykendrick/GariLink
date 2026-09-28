import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:garilink_mobile/features/explore/domain/discovery_selection.dart';
import 'package:garilink_mobile/features/explore/domain/vehicle_suitability.dart';
import 'package:garilink_mobile/features/explore/presentation/providers/explore_provider.dart';
import 'package:garilink_mobile/features/location/domain/models/gari_location.dart';
import 'package:garilink_mobile/features/trips/domain/models/transport_need.dart';
import 'package:garilink_mobile/features/vehicle/presentation/pages/vehicle_details_page.dart';

Map<String, dynamic> detail({
  Map<String, dynamic>? capabilities,
  Map<String, dynamic>? pricing,
  String availability = 'AVAILABLE',
  bool requestable = true,
}) => {
  'id': 'listing-1',
  'vehicleId': 'vehicle-1',
  'workspaceId': 'workspace-1',
  'type': 'FOR_HIRE',
  'title': 'Fallback listing title',
  'make': 'Toyota',
  'model': 'Alphard',
  'vehicleCategory': 'MINIVAN',
  'operationalAvailability': availability,
  'publicLocality': 'Mikocheni',
  'capabilities':
      capabilities ??
      {
        'schema_version': 1,
        'passenger_capacity': 7,
        'with_driver': true,
        'self_drive': false,
        'long_distance': true,
      },
  'rentalPricing':
      pricing ??
      {'configured': true, 'currency': 'TZS', 'durationRateMinorPerDay': 80000},
  'eligibility': {'requestable': requestable},
  'images': <String>[],
  'workspace': {'name': 'GariLink Evaluation Garage'},
};

DiscoverySelection passengerSelection() => const DiscoverySelection(
  listingId: 'listing-1',
  need: TransportNeed(
    purpose: TransportPurpose.familyOrGroup,
    passengerCount: 6,
    driverPreference: DriverPreference.withDriver,
    longDistance: true,
  ),
  searchLocation: SearchLocation(location: GariLocation(locality: 'Mikocheni')),
  suitability: SuitabilityResult(
    matchingVersion: 1,
    status: SuitabilityStatus.suitable,
    reasons: [
      'PASSENGER_CAPACITY_OK',
      'DRIVER_AVAILABLE',
      'LONG_DISTANCE_SUPPORTED',
    ],
  ),
);

DiscoverySelection cargoSelection() => const DiscoverySelection(
  listingId: 'listing-1',
  need: TransportNeed(
    purpose: TransportPurpose.movingGoods,
    cargo: CargoRequirement(estimatedWeightKg: 800, requiresCoveredBody: true),
  ),
  searchLocation: SearchLocation(location: GariLocation(locality: 'Mikocheni')),
  suitability: SuitabilityResult(
    matchingVersion: 1,
    status: SuitabilityStatus.suitable,
    reasons: ['PAYLOAD_CAPACITY_OK', 'COVERED_CARGO_SUPPORTED'],
  ),
);

Future<void> render(
  WidgetTester tester, {
  required Map<String, dynamic> data,
  DiscoverySelection? selection,
  double width = 390,
  double textScale = 1,
}) async {
  tester.view.physicalSize = Size(width, 1000);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        listingDetailsProvider('listing-1').overrideWith((ref) async => data),
        savedListingsProvider.overrideWith((ref) async => []),
        marketplaceAuthenticatedProvider.overrideWithValue(false),
      ],
      child: MaterialApp(
        home: MediaQuery(
          data: MediaQueryData(textScaler: TextScaler.linear(textScale)),
          child: VehicleDetailsPage(
            listingId: 'listing-1',
            selection: selection,
          ),
        ),
      ),
    ),
  );
  await tester.pump();
  await tester.pump();
}

void main() {
  testWidgets('passenger arrival explains authoritative fit and pricing', (
    tester,
  ) async {
    await render(tester, data: detail(), selection: passengerSelection());
    expect(find.text('Toyota Alphard'), findsOneWidget);
    expect(find.text('Suitable for your group'), findsOneWidget);
    expect(find.text('Seats 7 passengers'), findsOneWidget);
    expect(find.text('Driver available'), findsOneWidget);
    expect(find.text('TZS 80,000/day'), findsWidgets);
    expect(find.text('Request this vehicle'), findsOneWidget);
    expect(find.textContaining('latitude'), findsNothing);
    expect(find.textContaining('longitude'), findsNothing);
  });

  testWidgets('cargo arrival prioritizes payload and covered body', (
    tester,
  ) async {
    await render(
      tester,
      data: detail(
        capabilities: {
          'schema_version': 1,
          'payload_kg': 1000,
          'cargo_body': 'CLOSED_BOX',
        },
      ),
      selection: cargoSelection(),
    );
    expect(find.text('Suitable for moving goods'), findsOneWidget);
    expect(find.text('1000 kg payload'), findsOneWidget);
    expect(find.text('Covered cargo body available'), findsOneWidget);
    expect(find.text('Closed Box cargo body'), findsOneWidget);
  });

  testWidgets('busy vehicle truthfully disables request', (tester) async {
    await render(
      tester,
      data: detail(availability: 'BUSY', requestable: false),
      selection: passengerSelection(),
    );
    expect(find.text('Busy'), findsOneWidget);
    expect(find.text('Not requestable'), findsOneWidget);
    expect(find.textContaining('currently busy'), findsWidgets);
    expect(find.text('Request this vehicle'), findsNothing);
  });

  testWidgets('direct link omits matching claim and handles no pricing', (
    tester,
  ) async {
    await render(tester, data: detail(pricing: {'configured': false}));
    expect(find.text('Suitable for your group'), findsNothing);
    expect(find.text('Your trip'), findsNothing);
    expect(find.text('Confirm price with owner'), findsWidgets);
    expect(find.text('Request this vehicle'), findsOneWidget);
  });

  for (final width in [320.0, 390.0, 600.0]) {
    testWidgets('detail remains usable at ${width.toInt()}px and 200% text', (
      tester,
    ) async {
      await render(
        tester,
        data: detail(),
        selection: passengerSelection(),
        width: width,
        textScale: 2,
      );
      expect(tester.takeException(), isNull);
      expect(find.text('Request this vehicle'), findsOneWidget);
      expect(find.text('Toyota Alphard'), findsOneWidget);
    });
  }
}
