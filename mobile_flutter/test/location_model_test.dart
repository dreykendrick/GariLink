import 'package:flutter_test/flutter_test.dart';
import 'package:garilink_mobile/features/location/domain/models/gari_location.dart';

void main() {
  test('location round trips and supports nullable coordinates', () {
    const value = GariLocation(
      locality: 'Sinza',
      city: 'Dar es Salaam',
      source: LocationSource.manual,
    );
    final decoded = GariLocation.fromJson(value.toJson());
    expect(decoded.locality, 'Sinza');
    expect(decoded.latitude, isNull);
    expect(decoded.source, LocationSource.manual);
  });

  test('location rejects impossible coordinates', () {
    expect(
      () => GariLocation.fromJson({'latitude': 91}),
      throwsFormatException,
    );
  });
}
