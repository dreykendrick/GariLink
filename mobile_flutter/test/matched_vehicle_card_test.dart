import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:garilink_mobile/features/explore/domain/vehicle_suitability.dart';
import 'package:garilink_mobile/features/explore/presentation/widgets/matched_vehicle_card.dart';
import 'package:garilink_mobile/features/trips/domain/models/transport_need.dart';

MatchedVehicle fixture({
  required Map<String, dynamic> capabilities,
  bool requestable = true,
  Object? pricing,
}) => MatchedVehicle.fromJson({
  'id': 'listing-1',
  'title': 'Controlled vehicle',
  'vehicleCategory': 'MEDIUM_TRUCK',
  'operationalAvailability': requestable ? 'AVAILABLE' : 'BUSY',
  'publicLocality': 'Mikocheni',
  'distanceMeters': 1800,
  'eligibility': {'requestable': requestable},
  'vehicle': {
    'make': 'Isuzu',
    'model': 'N-Series',
    'capabilities': capabilities,
    'rentalPricing': pricing ?? {'configured': false},
  },
  'suitability': {
    'matchingVersion': 1,
    'status': 'SUITABLE',
    'reasons': ['PAYLOAD_CAPACITY_OK', 'COVERED_CARGO_SUPPORTED'],
  },
});

Future<void> render(
  WidgetTester tester, {
  required MatchedVehicle vehicle,
  required TransportNeed need,
  VoidCallback? onTap,
  double width = 390,
  double textScale = 1,
}) async {
  tester.view.physicalSize = Size(width, 900);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  await tester.pumpWidget(
    MaterialApp(
      home: MediaQuery(
        data: MediaQueryData(textScaler: TextScaler.linear(textScale)),
        child: Scaffold(
          body: SingleChildScrollView(
            child: MatchedVehicleCard(
              vehicle: vehicle,
              need: need,
              onTap: onTap ?? () {},
            ),
          ),
        ),
      ),
    ),
  );
}

void main() {
  testWidgets('cargo result prioritizes truthful cargo capability', (
    tester,
  ) async {
    await render(
      tester,
      vehicle: fixture(
        capabilities: {
          'payload_kg': 1000,
          'cargo_volume_m3': 12,
          'cargo_body': 'COVERED',
        },
      ),
      need: const TransportNeed(
        purpose: TransportPurpose.movingGoods,
        cargo: CargoRequirement(
          estimatedWeightKg: 300,
          requiresCoveredBody: true,
        ),
      ),
    );
    expect(find.text('1,000 kg payload • 12 m³ cargo volume'), findsOneWidget);
    expect(find.text('1.8 km away'), findsOneWidget);
    expect(find.text('Confirm price with owner'), findsOneWidget);
    expect(find.textContaining('latitude'), findsNothing);
  });

  testWidgets('configured pricing is a component, never a trip estimate', (
    tester,
  ) async {
    await render(
      tester,
      vehicle: fixture(
        capabilities: {'passenger_capacity': 7},
        pricing: {
          'configured': true,
          'currency': 'TZS',
          'durationRateMinorPerDay': 80000,
        },
      ),
      need: const TransportNeed(
        purpose: TransportPurpose.familyOrGroup,
        passengerCount: 6,
      ),
    );
    expect(find.text('TZS 80,000 daily component'), findsOneWidget);
    expect(find.textContaining('trip total'), findsNothing);
    expect(find.textContaining('asking'), findsNothing);
  });

  testWidgets('card has one primary navigation interaction', (tester) async {
    var opened = false;
    await render(
      tester,
      vehicle: fixture(capabilities: {'passenger_capacity': 7}),
      need: const TransportNeed(purpose: TransportPurpose.cityTravel),
      onTap: () => opened = true,
    );
    await tester.tap(find.text('View vehicle →'));
    expect(opened, isTrue);
  });

  for (final width in [320.0, 390.0, 600.0]) {
    testWidgets('matched card fits ${width.toInt()}px at large text', (
      tester,
    ) async {
      await render(
        tester,
        width: width,
        textScale: 2,
        vehicle: fixture(
          requestable: false,
          capabilities: {'passenger_capacity': 7},
        ),
        need: const TransportNeed(
          purpose: TransportPurpose.familyOrGroup,
          passengerCount: 6,
        ),
      );
      expect(tester.takeException(), isNull);
      expect(find.text('Busy'), findsOneWidget);
    });
  }
}
