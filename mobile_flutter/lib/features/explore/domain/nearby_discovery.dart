import '../../location/domain/models/gari_location.dart';

class NearbySearchQuery {
  const NearbySearchQuery({
    required this.searchLocation,
    this.radiusMeters = 10000,
    this.limit = 20,
    this.offset = 0,
  });
  final SearchLocation searchLocation;
  final int radiusMeters, limit, offset;
  GariLocation? get location => searchLocation.location;
  bool get canSearch =>
      location?.latitude != null && location?.longitude != null;
  Map<String, dynamic> toQueryParameters() {
    if (!canSearch) throw StateError('A precise search location is required.');
    return {
      'lat': location!.latitude,
      'lng': location!.longitude,
      'radiusMeters': radiusMeters,
      'limit': limit,
      'offset': offset,
    };
  }

  NearbySearchQuery copyWith({int? radiusMeters, int? limit, int? offset}) =>
      NearbySearchQuery(
        searchLocation: searchLocation,
        radiusMeters: radiusMeters ?? this.radiusMeters,
        limit: limit ?? this.limit,
        offset: offset ?? this.offset,
      );
}

class NearbyVehicle {
  const NearbyVehicle({
    required this.listing,
    required this.distanceMeters,
    required this.publicLocality,
    required this.requestable,
  });
  final Map<String, dynamic> listing;
  final double distanceMeters;
  final String? publicLocality;
  final bool requestable;
  factory NearbyVehicle.fromJson(Map<String, dynamic> json) => NearbyVehicle(
    listing: json,
    distanceMeters: (json['distanceMeters'] as num?)?.toDouble() ?? 0,
    publicLocality: json['publicLocality']?.toString(),
    requestable: (json['eligibility'] as Map?)?['requestable'] == true,
  );
  String get distanceLabel => distanceMeters < 1000
      ? '${distanceMeters.round()} m away'
      : '${(distanceMeters / 1000).toStringAsFixed(distanceMeters < 10000 ? 1 : 0)} km away';
}

class NearbyDiscoveryResult {
  const NearbyDiscoveryResult({
    required this.vehicles,
    required this.radiusMeters,
  });
  final List<NearbyVehicle> vehicles;
  final int radiusMeters;
  factory NearbyDiscoveryResult.fromJson(Map<String, dynamic> json) =>
      NearbyDiscoveryResult(
        vehicles: ((json['data'] as List?) ?? const [])
            .whereType<Map>()
            .map(
              (row) => NearbyVehicle.fromJson(Map<String, dynamic>.from(row)),
            )
            .toList(),
        radiusMeters: (json['radiusMeters'] as num?)?.toInt() ?? 10000,
      );
}
