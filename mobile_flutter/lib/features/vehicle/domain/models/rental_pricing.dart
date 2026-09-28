enum RentalEstimateStatus {
  estimated,
  incompleteInput,
  pricingNotConfigured,
  routeUnavailable,
  error,
  unsupportedPolicy,
}

/// Rejects late asynchronous estimate responses after any booking input has
/// changed or a newer estimate request has started.
class RentalEstimateRequestGuard {
  int _generation = 0;

  int begin() => ++_generation;
  void invalidate() => _generation += 1;
  bool isCurrent(int generation) => generation == _generation;
}

/// Exact server pricing configuration. Amounts are integer minor units; for
/// Pricing Policy V1's TZS currency one minor unit equals one shilling.
class RentalPricingPolicy {
  const RentalPricingPolicy({
    required this.configured,
    this.policyVersion,
    this.currency,
    this.baseChargeMinor,
    this.minimumChargeMinor,
    this.durationRateMinorPerDay,
    this.distanceRateMinorPerKilometer,
  });

  final bool configured;
  final int? policyVersion;
  final String? currency;
  final int? baseChargeMinor;
  final int? minimumChargeMinor;
  final int? durationRateMinorPerDay;
  final int? distanceRateMinorPerKilometer;

  factory RentalPricingPolicy.fromJson(Object? value) {
    if (value is! Map) return const RentalPricingPolicy(configured: false);
    final json = Map<String, dynamic>.from(value);
    int? exactInt(String key) {
      final raw = json[key];
      if (raw is int) return raw;
      if (raw is num && raw.isFinite && raw == raw.round()) return raw.toInt();
      return null;
    }

    final configured = json['configured'] == true;
    if (!configured) return const RentalPricingPolicy(configured: false);
    return RentalPricingPolicy(
      configured: true,
      policyVersion: exactInt('policyVersion'),
      currency: json['currency']?.toString(),
      baseChargeMinor: exactInt('baseChargeMinor'),
      minimumChargeMinor: exactInt('minimumChargeMinor'),
      durationRateMinorPerDay: exactInt('durationRateMinorPerDay'),
      distanceRateMinorPerKilometer: exactInt('distanceRateMinorPerKilometer'),
    );
  }

  Map<String, dynamic> toUpdateJson() => {
    'policyVersion': 1,
    'currency': 'TZS',
    if (baseChargeMinor != null) 'baseChargeMinor': baseChargeMinor,
    if (minimumChargeMinor != null) 'minimumChargeMinor': minimumChargeMinor,
    if (durationRateMinorPerDay != null)
      'durationRateMinorPerDay': durationRateMinorPerDay,
    if (distanceRateMinorPerKilometer != null)
      'distanceRateMinorPerKilometer': distanceRateMinorPerKilometer,
  };
}

class RentalPriceEstimate {
  const RentalPriceEstimate({
    required this.status,
    required this.estimateVersion,
    required this.pricingPolicyVersion,
    required this.currency,
    this.routeCalculationVersion,
    this.rentalDays,
    this.routeDistanceMeters,
    this.baseChargeMinor,
    this.durationChargeMinor,
    this.distanceChargeMinor,
    this.minimumAdjustmentMinor,
    this.rawAmountMinor,
    this.finalEstimatedAmountMinor,
    this.missingInputs = const [],
  });

  final RentalEstimateStatus status;
  final int estimateVersion;
  final int? pricingPolicyVersion;
  final int? routeCalculationVersion;
  final String currency;
  final int? rentalDays;
  final int? routeDistanceMeters;
  final int? baseChargeMinor;
  final int? durationChargeMinor;
  final int? distanceChargeMinor;
  final int? minimumAdjustmentMinor;
  final int? rawAmountMinor;
  final int? finalEstimatedAmountMinor;
  final List<String> missingInputs;

  factory RentalPriceEstimate.fromJson(Map<String, dynamic> json) {
    final status = switch (json['status']) {
      'ESTIMABLE' || 'ESTIMATED' => RentalEstimateStatus.estimated,
      'INCOMPLETE_INPUT' => RentalEstimateStatus.incompleteInput,
      'PRICING_NOT_CONFIGURED' => RentalEstimateStatus.pricingNotConfigured,
      'ROUTE_UNAVAILABLE' => RentalEstimateStatus.routeUnavailable,
      _ => RentalEstimateStatus.unsupportedPolicy,
    };
    int? exactInt(Object? raw) => raw is int
        ? raw
        : raw is num && raw.isFinite && raw == raw.round()
        ? raw.toInt()
        : null;
    final components = json['components'] is Map
        ? Map<String, dynamic>.from(json['components'] as Map)
        : const <String, dynamic>{};
    return RentalPriceEstimate(
      status: status,
      estimateVersion: exactInt(json['estimateVersion']) ?? 1,
      pricingPolicyVersion: exactInt(
        json['pricingPolicyVersion'] ?? json['policyVersion'],
      ),
      routeCalculationVersion: exactInt(json['routeCalculationVersion']),
      currency: json['currency']?.toString() ?? 'TZS',
      rentalDays: exactInt(json['rentalDays'] ?? json['durationDays']),
      routeDistanceMeters: exactInt(json['routeDistanceMeters']),
      baseChargeMinor: exactInt(components['baseChargeMinor']),
      durationChargeMinor: exactInt(components['durationChargeMinor']),
      distanceChargeMinor: exactInt(components['distanceChargeMinor']),
      minimumAdjustmentMinor: exactInt(components['minimumAdjustmentMinor']),
      rawAmountMinor: exactInt(json['rawAmountMinor']),
      finalEstimatedAmountMinor: exactInt(json['finalEstimatedAmountMinor']),
      missingInputs: (json['missingInputs'] as List<dynamic>? ?? const [])
          .whereType<String>()
          .toList(),
    );
  }
}
