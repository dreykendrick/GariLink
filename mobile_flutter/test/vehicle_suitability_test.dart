import 'package:flutter_test/flutter_test.dart';
import 'package:garilink_mobile/features/explore/domain/vehicle_suitability.dart';
import 'package:garilink_mobile/features/location/domain/models/gari_location.dart';
import 'package:garilink_mobile/features/trips/domain/models/transport_need.dart';

void main() {
  const need = TransportNeed(
    purpose: TransportPurpose.familyOrGroup,
    passengerCount: 6,
  );

  test(
    'matched discovery serializes typed discovery intent without coordinates leaking from a result',
    () {
      final query = MatchedDiscoveryQuery(
        searchLocation: const SearchLocation(
          location: GariLocation(latitude: -6.8, longitude: 39.2),
        ),
        transportNeed: need,
      );
      expect(query.toJson(), containsPair('transportNeed', need.toJson()));
      expect(query.toJson()['searchLocation'], {
        'latitude': -6.8,
        'longitude': 39.2,
      });
    },
  );

  test('suitability parses known and future-safe reason codes', () {
    final result = SuitabilityResult.fromJson({
      'matchingVersion': 1,
      'status': 'SUITABLE',
      'reasons': ['PASSENGER_CAPACITY_OK', 'FUTURE_REASON'],
    });
    expect(result.status, SuitabilityStatus.suitable);
    expect(suitabilityExplanation(result.reasons.first), 'Seats your group');
    expect(
      suitabilityExplanation(result.reasons.last),
      'Some vehicle details are not confirmed',
    );
  });

  test(
    'matched vehicle reads server authority and human-friendly distance input',
    () {
      final vehicle = MatchedVehicle.fromJson({
        'id': 'listing',
        'distanceMeters': 3100,
        'suitability': {
          'matchingVersion': 1,
          'status': 'SUITABLE',
          'reasons': [],
        },
      });
      expect(vehicle.distanceMeters, 3100);
      expect(vehicle.suitability.matchingVersion, 1);
    },
  );
}
