enum VehicleCategory {
  sedan('SEDAN', 'Sedan'),
  hatchback('HATCHBACK', 'Hatchback'),
  suv('SUV', 'SUV'),
  minivan('MINIVAN', 'Minivan'),
  van('VAN', 'Van'),
  pickup('PICKUP', 'Pickup'),
  smallTruck('SMALL_TRUCK', 'Small truck'),
  mediumTruck('MEDIUM_TRUCK', 'Medium truck'),
  heavyTruck('HEAVY_TRUCK', 'Heavy truck');

  const VehicleCategory(this.wireValue, this.label);
  final String wireValue;
  final String label;
  static VehicleCategory? parse(Object? value) {
    for (final category in VehicleCategory.values) {
      if (category.wireValue == value) return category;
    }
    return null;
  }
}

enum VehicleAvailability {
  available('AVAILABLE'),
  busy('BUSY'),
  unavailable('UNAVAILABLE'),
  maintenance('MAINTENANCE');

  const VehicleAvailability(this.wireValue);
  final String wireValue;
  static VehicleAvailability? parse(Object? value) {
    for (final availability in VehicleAvailability.values) {
      if (availability.wireValue == value) return availability;
    }
    return null;
  }
}

/// Server-validated V2 capability payload. Unknown keys never originate here.
class VehicleCapabilities {
  const VehicleCapabilities({
    required this.schemaVersion,
    this.passengerCapacity,
    this.payloadKg,
    this.transmission,
    this.fuelType,
    this.selfDrive,
    this.withDriver,
    this.longDistance,
    this.cargoBody,
    this.cargoLengthM,
    this.cargoWidthM,
    this.cargoHeightM,
  });
  final int schemaVersion;
  final int? passengerCapacity;
  final double? payloadKg;
  final String? transmission;
  final String? fuelType;
  final bool? selfDrive;
  final bool? withDriver;
  final bool? longDistance;
  final String? cargoBody;
  final double? cargoLengthM;
  final double? cargoWidthM;
  final double? cargoHeightM;

  factory VehicleCapabilities.fromJson(Map<String, dynamic> json) =>
      VehicleCapabilities(
        schemaVersion: json['schema_version'] as int? ?? 1,
        passengerCapacity: json['passenger_capacity'] as int?,
        payloadKg: (json['payload_kg'] as num?)?.toDouble(),
        transmission: json['transmission'] as String?,
        fuelType: json['fuel_type'] as String?,
        selfDrive: json['self_drive'] as bool?,
        withDriver: json['with_driver'] as bool?,
        longDistance: json['long_distance'] as bool?,
        cargoBody: json['cargo_body'] as String?,
        cargoLengthM: (json['cargo_length_m'] as num?)?.toDouble(),
        cargoWidthM: (json['cargo_width_m'] as num?)?.toDouble(),
        cargoHeightM: (json['cargo_height_m'] as num?)?.toDouble(),
      );
  Map<String, dynamic> toJson() => {
    'schema_version': schemaVersion,
    if (passengerCapacity != null) 'passenger_capacity': passengerCapacity,
    if (payloadKg != null) 'payload_kg': payloadKg,
    if (transmission != null) 'transmission': transmission,
    if (fuelType != null) 'fuel_type': fuelType,
    if (selfDrive != null) 'self_drive': selfDrive,
    if (withDriver != null) 'with_driver': withDriver,
    if (longDistance != null) 'long_distance': longDistance,
    if (cargoBody != null) 'cargo_body': cargoBody,
    if (cargoLengthM != null) 'cargo_length_m': cargoLengthM,
    if (cargoWidthM != null) 'cargo_width_m': cargoWidthM,
    if (cargoHeightM != null) 'cargo_height_m': cargoHeightM,
  };
}

class VehicleV2State {
  const VehicleV2State({
    this.category,
    this.availability,
    this.capabilities,
    this.discoverable = false,
    this.requestable = false,
  });
  final VehicleCategory? category;
  final VehicleAvailability? availability;
  final VehicleCapabilities? capabilities;
  final bool discoverable;
  final bool requestable;
  factory VehicleV2State.fromJson(Map<String, dynamic> json) {
    final eligibility =
        json['eligibility'] as Map<String, dynamic>? ?? const {};
    final rawCapabilities = json['capabilities'];
    return VehicleV2State(
      category: VehicleCategory.parse(json['vehicleCategory']),
      availability: VehicleAvailability.parse(json['operationalAvailability']),
      capabilities: rawCapabilities is Map
          ? VehicleCapabilities.fromJson(
              Map<String, dynamic>.from(rawCapabilities),
            )
          : null,
      discoverable: eligibility['discoverable'] == true,
      requestable: eligibility['requestable'] == true,
    );
  }
}
