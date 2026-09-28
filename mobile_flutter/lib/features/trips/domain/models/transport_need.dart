enum TransportPurpose {
  personalTrip,
  cityTravel,
  familyOrGroup,
  airportTransfer,
  parcelDelivery,
  smallCargo,
  movingGoods,
  businessTransport,
  regionalCargo,
  heavyCargo,
  longDistance,
}

enum DriverPreference { any, withDriver, selfDrive }

extension TransportPurposeWire on TransportPurpose {
  String get wire => const [
    'PERSONAL_TRIP',
    'CITY_TRAVEL',
    'FAMILY_OR_GROUP',
    'AIRPORT_TRANSFER',
    'PARCEL_DELIVERY',
    'SMALL_CARGO',
    'MOVING_GOODS',
    'BUSINESS_TRANSPORT',
    'REGIONAL_CARGO',
    'HEAVY_CARGO',
    'LONG_DISTANCE',
  ][index];
  String get label => const [
    'Personal trip',
    'City travel',
    'Family or group travel',
    'Airport transfer',
    'Parcel delivery',
    'Small cargo',
    'Moving goods',
    'Business transport',
    'Regional cargo',
    'Heavy cargo',
    'Long-distance travel',
  ][index];
  bool get needsCargo => const {
    TransportPurpose.parcelDelivery,
    TransportPurpose.smallCargo,
    TransportPurpose.movingGoods,
    TransportPurpose.regionalCargo,
    TransportPurpose.heavyCargo,
  }.contains(this);
}

extension DriverPreferenceWire on DriverPreference {
  String get wire => const ['ANY', 'WITH_DRIVER', 'SELF_DRIVE'][index];
}

class CargoRequirement {
  const CargoRequirement({
    this.estimatedWeightKg,
    this.estimatedVolumeM3,
    this.cargoType,
    this.fragile = false,
    this.requiresCoveredBody = false,
  });
  final num? estimatedWeightKg;
  final num? estimatedVolumeM3;
  final String? cargoType;
  final bool fragile;
  final bool requiresCoveredBody;
  Map<String, dynamic> toJson() => {
    if (estimatedWeightKg != null) 'estimatedWeightKg': estimatedWeightKg,
    if (estimatedVolumeM3 != null) 'estimatedVolumeM3': estimatedVolumeM3,
    if (cargoType?.isNotEmpty ?? false) 'cargoType': cargoType,
    'fragile': fragile,
    'requiresCoveredBody': requiresCoveredBody,
  };
}

extension CargoRequirementJson on CargoRequirement {
  static CargoRequirement fromJson(Map<String, dynamic> json) =>
      CargoRequirement(
        estimatedWeightKg: json['estimatedWeightKg'] as num?,
        estimatedVolumeM3: json['estimatedVolumeM3'] as num?,
        cargoType: json['cargoType'] as String?,
        fragile: json['fragile'] as bool? ?? false,
        requiresCoveredBody: json['requiresCoveredBody'] as bool? ?? false,
      );
}

class TransportNeed {
  const TransportNeed({
    required this.purpose,
    this.passengerCount,
    this.cargo,
    this.driverPreference = DriverPreference.any,
    this.longDistance = false,
    this.returnTrip = false,
    this.notes,
  });
  final TransportPurpose purpose;
  final int? passengerCount;
  final CargoRequirement? cargo;
  final DriverPreference driverPreference;
  final bool longDistance;
  final bool returnTrip;
  final String? notes;
  static TransportNeed? fromJson(Object? value) {
    if (value is! Map) return null;
    final j = Map<String, dynamic>.from(value);
    if (j['schemaVersion'] != 1) return null;
    if (j['passengerCount'] != null &&
        (j['passengerCount'] is! int ||
            (j['passengerCount'] as int) < 1 ||
            (j['passengerCount'] as int) > 100)) {
      return null;
    }
    if (j.containsKey('cargo') && j['cargo'] is! Map) return null;
    if (j['cargo'] is Map) {
      final c = j['cargo'] as Map;
      for (final field in ['estimatedWeightKg', 'estimatedVolumeM3']) {
        if (c.containsKey(field) &&
            (c[field] is! num ||
                !(c[field] as num).isFinite ||
                (c[field] as num) < 0)) {
          return null;
        }
      }
      for (final field in ['fragile', 'requiresCoveredBody']) {
        if (c.containsKey(field) && c[field] is! bool) return null;
      }
      if (c.containsKey('cargoType') && c['cargoType'] is! String) return null;
    }
    for (final field in ['longDistance', 'returnTrip']) {
      if (j.containsKey(field) && j[field] is! bool) return null;
    }
    if (j.containsKey('notes') && j['notes'] is! String) return null;
    final matches = TransportPurpose.values.where(
      (x) => x.wire == j['purpose'],
    );
    if (matches.isEmpty) return null;
    final preferences = DriverPreference.values.where(
      (x) => x.wire == j['driverPreference'],
    );
    if (j.containsKey('driverPreference') && preferences.isEmpty) return null;
    return TransportNeed(
      purpose: matches.first,
      passengerCount: (j['passengerCount'] as num?)?.toInt(),
      cargo: j['cargo'] is Map
          ? CargoRequirementJson.fromJson(
              Map<String, dynamic>.from(j['cargo'] as Map),
            )
          : null,
      driverPreference: preferences.isEmpty
          ? DriverPreference.any
          : preferences.first,
      longDistance: j['longDistance'] as bool? ?? false,
      returnTrip: j['returnTrip'] as bool? ?? false,
      notes: j['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'schemaVersion': 1,
    'purpose': purpose.wire,
    if (passengerCount != null) 'passengerCount': passengerCount,
    if (cargo != null) 'cargo': cargo!.toJson(),
    'driverPreference': driverPreference.wire,
    'longDistance': longDistance,
    'returnTrip': returnTrip,
    if (notes?.trim().isNotEmpty ?? false) 'notes': notes!.trim(),
  };
}

class TransportDiscoveryIntent {
  const TransportDiscoveryIntent({this.need});
  final TransportNeed? need;
  TransportDiscoveryIntent copyWith({
    TransportNeed? need,
    bool clear = false,
  }) => TransportDiscoveryIntent(need: clear ? null : need ?? this.need);
}
