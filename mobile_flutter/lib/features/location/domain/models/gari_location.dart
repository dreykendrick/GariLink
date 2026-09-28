enum LocationSource {
  device,
  manual,
  placeSelection,
  ownerConfigured,
  systemDerived,
}

extension LocationSourceWire on LocationSource {
  String get wireValue => switch (this) {
    LocationSource.device => 'DEVICE',
    LocationSource.manual => 'MANUAL',
    LocationSource.placeSelection => 'PLACE_SELECTION',
    LocationSource.ownerConfigured => 'OWNER_CONFIGURED',
    LocationSource.systemDerived => 'SYSTEM_DERIVED',
  };
  static LocationSource? parse(Object? value) {
    for (final s in LocationSource.values) {
      if (s.wireValue == value) return s;
    }
    return null;
  }
}

class GariLocation {
  const GariLocation({
    this.latitude,
    this.longitude,
    this.locality,
    this.city,
    this.region,
    this.countryCode = 'TZ',
    this.source = LocationSource.manual,
    this.accuracyMeters,
    this.capturedAt,
  });
  final double? latitude, longitude, accuracyMeters;
  final String? locality, city, region, countryCode;
  final LocationSource source;
  final DateTime? capturedAt;
  factory GariLocation.fromJson(Object? raw) {
    if (raw is! Map) throw const FormatException('Invalid location');
    final j = Map<String, dynamic>.from(raw);
    final lat = (j['latitude'] as num?)?.toDouble(),
        lng = (j['longitude'] as num?)?.toDouble(),
        accuracy = (j['accuracyMeters'] as num?)?.toDouble();
    if (lat != null && (lat < -90 || lat > 90) ||
        lng != null && (lng < -180 || lng > 180) ||
        accuracy != null && accuracy < 0) {
      throw const FormatException('Invalid location range');
    }
    return GariLocation(
      latitude: lat,
      longitude: lng,
      locality: j['locality'] as String?,
      city: j['city'] as String?,
      region: j['region'] as String?,
      countryCode: j['countryCode'] as String? ?? 'TZ',
      source: LocationSourceWire.parse(j['source']) ?? LocationSource.manual,
      accuracyMeters: accuracy,
      capturedAt: DateTime.tryParse(j['capturedAt']?.toString() ?? ''),
    );
  }
  Map<String, dynamic> toJson() => {
    'schemaVersion': 1,
    if (latitude != null) 'latitude': latitude,
    if (longitude != null) 'longitude': longitude,
    if (locality != null) 'locality': locality,
    if (city != null) 'city': city,
    if (region != null) 'region': region,
    if (countryCode != null) 'countryCode': countryCode,
    'source': source.wireValue,
    if (accuracyMeters != null) 'accuracyMeters': accuracyMeters,
    if (capturedAt != null) 'capturedAt': capturedAt!.toUtc().toIso8601String(),
  };
  GariLocation copyWith({
    double? latitude,
    double? longitude,
    String? locality,
    String? city,
    String? region,
    LocationSource? source,
  }) => GariLocation(
    latitude: latitude ?? this.latitude,
    longitude: longitude ?? this.longitude,
    locality: locality ?? this.locality,
    city: city ?? this.city,
    region: region ?? this.region,
    countryCode: countryCode,
    source: source ?? this.source,
    accuracyMeters: accuracyMeters,
    capturedAt: capturedAt,
  );
  @override
  bool operator ==(Object other) =>
      other is GariLocation && other.toJson().toString() == toJson().toString();
  @override
  int get hashCode => toJson().toString().hashCode;
}

/// Mutable discovery state; never reuse this object as a persisted rental snapshot.
class SearchLocation {
  const SearchLocation({this.location});
  final GariLocation? location;
  SearchLocation copyWith({GariLocation? location}) =>
      SearchLocation(location: location ?? this.location);
}
