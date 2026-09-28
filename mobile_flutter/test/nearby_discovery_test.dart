import 'package:flutter_test/flutter_test.dart';
import 'package:garilink_mobile/features/explore/domain/nearby_discovery.dart';
import 'package:garilink_mobile/features/location/domain/models/gari_location.dart';

void main() {
  test(
    'nearby query keeps SearchLocation separate and serializes coordinates',
    () {
      const location = GariLocation(
        latitude: -6.8,
        longitude: 39.2,
        locality: 'Sinza',
        source: LocationSource.manual,
      );
      final query = NearbySearchQuery(
        searchLocation: const SearchLocation(location: location),
      );
      expect(query.toQueryParameters()['radiusMeters'], 10000);
      expect(query.toQueryParameters()['lat'], -6.8);
    },
  );
  test('locality-only search cannot invent coordinates', () {
    const location = GariLocation(
      locality: 'Sinza',
      source: LocationSource.manual,
    );
    final query = NearbySearchQuery(
      searchLocation: const SearchLocation(location: location),
    );
    expect(query.canSearch, isFalse);
    expect(query.toQueryParameters, throwsStateError);
  });
  test('nearby model formats rounded public distance', () {
    final vehicle = NearbyVehicle.fromJson({
      'distanceMeters': 4382.61,
      'publicLocality': 'Sinza',
      'eligibility': {'requestable': true},
    });
    expect(vehicle.distanceLabel, '4.4 km away');
    expect(vehicle.requestable, isTrue);
  });
}
