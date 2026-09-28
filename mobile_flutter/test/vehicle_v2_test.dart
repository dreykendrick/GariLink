import 'package:flutter_test/flutter_test.dart';
import 'package:garilink_mobile/features/vehicle/domain/models/vehicle_v2.dart';

void main() {
  test('V2 categories and availability use stable server values', () {
    expect(VehicleCategory.parse('PICKUP'), VehicleCategory.pickup);
    expect(
      VehicleAvailability.parse('MAINTENANCE'),
      VehicleAvailability.maintenance,
    );
    expect(VehicleCategory.parse('SPORTS_CAR'), isNull);
  });

  test('V2 capabilities round trip known passenger and cargo fields', () {
    const capabilities = VehicleCapabilities(
      schemaVersion: 1,
      passengerCapacity: 5,
      selfDrive: true,
      cargoBody: 'open',
      cargoLengthM: 4.2,
    );
    final restored = VehicleCapabilities.fromJson(capabilities.toJson());
    expect(restored.schemaVersion, 1);
    expect(restored.passengerCapacity, 5);
    expect(restored.cargoLengthM, 4.2);
  });

  test(
    'legacy vehicle data remains representable without V2 configuration',
    () {
      final state = VehicleV2State.fromJson(const {});
      expect(state.category, isNull);
      expect(state.capabilities, isNull);
      expect(state.discoverable, isFalse);
      expect(state.requestable, isFalse);
    },
  );
}
