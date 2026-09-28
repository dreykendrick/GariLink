import '../../location/domain/models/gari_location.dart';
import '../../trips/domain/models/transport_need.dart';

enum SuitabilityStatus { suitable, unsuitable, cannotVerify, unknown }

extension SuitabilityStatusWire on SuitabilityStatus {
  static SuitabilityStatus parse(Object? value) => switch (value) {
    'SUITABLE' => SuitabilityStatus.suitable,
    'UNSUITABLE' => SuitabilityStatus.unsuitable,
    'CANNOT_VERIFY' => SuitabilityStatus.cannotVerify,
    _ => SuitabilityStatus.unknown,
  };
}

class SuitabilityResult {
  const SuitabilityResult({
    required this.matchingVersion,
    required this.status,
    required this.reasons,
  });
  final int matchingVersion;
  final SuitabilityStatus status;
  final List<String> reasons;
  factory SuitabilityResult.fromJson(Map<String, dynamic> json) =>
      SuitabilityResult(
        matchingVersion: (json['matchingVersion'] as num?)?.toInt() ?? 0,
        status: SuitabilityStatusWire.parse(json['status']),
        reasons: ((json['reasons'] as List?) ?? const [])
            .map((item) => item.toString())
            .toList(growable: false),
      );
}

String suitabilityExplanation(String reason) => switch (reason) {
  'PASSENGER_CAPACITY_OK' => 'Seats your group',
  'PAYLOAD_CAPACITY_OK' => 'Payload capacity supports your load',
  'COVERED_CARGO_SUPPORTED' => 'Covered cargo body available',
  'DRIVER_AVAILABLE' => 'Driver available',
  'SELF_DRIVE_AVAILABLE' => 'Self-drive available',
  'LONG_DISTANCE_SUPPORTED' => 'Suitable for long-distance use',
  'INSUFFICIENT_PASSENGER_CAPACITY' => 'Does not seat your whole group',
  'INSUFFICIENT_PAYLOAD_CAPACITY' => 'Payload capacity is below your load',
  'COVERED_CARGO_REQUIRED' => 'Does not have a covered cargo body',
  'DRIVER_REQUIRED_NOT_SUPPORTED' => 'Driver is not available',
  'SELF_DRIVE_NOT_SUPPORTED' => 'Self-drive is not available',
  'LONG_DISTANCE_NOT_SUPPORTED' => 'Not configured for long-distance use',
  _ => 'Some vehicle details are not confirmed',
};

class MatchedDiscoveryQuery {
  const MatchedDiscoveryQuery({
    required this.searchLocation,
    required this.transportNeed,
    this.radiusMeters = 10000,
    this.limit = 20,
    this.offset = 0,
  });
  final SearchLocation searchLocation;
  final TransportNeed transportNeed;
  final int radiusMeters, limit, offset;
  Map<String, dynamic> toJson() {
    final location = searchLocation.location;
    if (location?.latitude == null || location?.longitude == null) {
      throw StateError('A precise search location is required.');
    }
    return {
      'searchLocation': {
        'latitude': location!.latitude,
        'longitude': location.longitude,
      },
      'transportNeed': transportNeed.toJson(),
      'radiusMeters': radiusMeters,
      'limit': limit,
      'offset': offset,
    };
  }
}

class MatchedVehicle {
  const MatchedVehicle({
    required this.listing,
    required this.distanceMeters,
    required this.suitability,
  });
  final Map<String, dynamic> listing;
  final double distanceMeters;
  final SuitabilityResult suitability;
  bool get requestable =>
      (listing['eligibility'] as Map?)?['requestable'] == true;
  String get availabilityLabel => switch (listing['operationalAvailability']) {
    'AVAILABLE' => requestable ? 'Available to request' : 'Not requestable',
    'BUSY' => 'Busy · not requestable',
    'MAINTENANCE' => 'Under maintenance',
    'UNAVAILABLE' => 'Unavailable',
    _ => 'Availability not confirmed',
  };
  factory MatchedVehicle.fromJson(Map<String, dynamic> json) => MatchedVehicle(
    listing: json,
    distanceMeters: (json['distanceMeters'] as num?)?.toDouble() ?? 0,
    suitability: SuitabilityResult.fromJson(
      Map<String, dynamic>.from(json['suitability'] as Map? ?? const {}),
    ),
  );
}

class MatchedDiscoveryResult {
  const MatchedDiscoveryResult({
    required this.vehicles,
    required this.radiusMeters,
    this.hasNearbyCandidates = true,
  });
  final List<MatchedVehicle> vehicles;
  final int radiusMeters;
  final bool hasNearbyCandidates;
  factory MatchedDiscoveryResult.fromJson(Map<String, dynamic> json) =>
      MatchedDiscoveryResult(
        vehicles: ((json['data'] as List?) ?? const [])
            .whereType<Map>()
            .map(
              (row) => MatchedVehicle.fromJson(Map<String, dynamic>.from(row)),
            )
            .toList(),
        radiusMeters: (json['radiusMeters'] as num?)?.toInt() ?? 10000,
      );
}
