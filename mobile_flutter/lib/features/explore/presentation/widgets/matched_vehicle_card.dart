import 'package:flutter/material.dart';

import '../../../../core/formatters/marketplace_formatters.dart';
import '../../../../core/theme/theme.dart';
import '../../../../shared/widgets/vehicle_image.dart';
import '../../../trips/domain/models/transport_need.dart';
import '../../domain/vehicle_suitability.dart';

class MatchedVehicleCard extends StatelessWidget {
  const MatchedVehicleCard({
    required this.vehicle,
    required this.need,
    required this.onTap,
    super.key,
  });

  final MatchedVehicle vehicle;
  final TransportNeed need;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final listing = vehicle.listing;
    final rawVehicle = listing['vehicle'];
    final details = rawVehicle is Map
        ? Map<String, dynamic>.from(rawVehicle)
        : <String, dynamic>{};
    final title = _vehicleTitle(listing, details);
    final capability = _capabilityLabel(
      need,
      details['capabilities'] ?? listing['capabilities'],
    );
    final locality = listing['publicLocality']?.toString().trim();
    final category = _humanize(
      listing['vehicleCategory'] ?? details['vehicleCategory'],
    );
    final price = _pricingLabel(
      details['rentalPricing'] ?? listing['rentalPricing'],
    );
    final distance = _distanceLabel(vehicle.distanceMeters);
    final image = _coverUrl(listing, details);

    return Semantics(
      container: true,
      button: true,
      label:
          '$title, $distance, ${vehicle.availabilityLabel}, suitable for your needs',
      child: Material(
        color: GariLinkColors.surface,
        borderRadius: GariLinkRadius.cardBorderRadius,
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AspectRatio(
                aspectRatio: 16 / 9,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Hero(
                      tag: 'listing-cover-${listing['id']}',
                      child: VehicleImage(
                        url: image,
                        semanticLabel: 'Photo of $title',
                      ),
                    ),
                    Positioned(
                      left: 12,
                      bottom: 12,
                      child: _OverlayLabel(
                        icon: Icons.near_me_outlined,
                        text: distance,
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(GariLinkSpacing.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: GariLinkTypography.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        _AvailabilityBadge(vehicle: vehicle),
                      ],
                    ),
                    if (category.isNotEmpty ||
                        locality?.isNotEmpty == true) ...[
                      const SizedBox(height: 6),
                      Text(
                        [
                          category,
                          if (locality?.isNotEmpty == true) 'Near $locality',
                        ].where((value) => value.isNotEmpty).join(' • '),
                        style: GariLinkTypography.bodySmall.copyWith(
                          color: GariLinkColors.textSecondary,
                        ),
                      ),
                    ],
                    const SizedBox(height: 12),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(
                          Icons.check_circle_outline_rounded,
                          size: 20,
                          color: GariLinkColors.success,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            capability ?? _reasonLabel(vehicle.suitability),
                            style: GariLinkTypography.bodyMedium.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          price,
                          style: GariLinkTypography.labelMedium.copyWith(
                            color: GariLinkColors.accent,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'View vehicle →',
                          style: GariLinkTypography.labelMedium.copyWith(
                            color: GariLinkColors.primary,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AvailabilityBadge extends StatelessWidget {
  const _AvailabilityBadge({required this.vehicle});
  final MatchedVehicle vehicle;

  @override
  Widget build(BuildContext context) {
    final available = vehicle.requestable;
    return Semantics(
      label: vehicle.availabilityLabel,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: available
              ? GariLinkColors.successBg
              : GariLinkColors.warningBg,
          borderRadius: GariLinkRadius.badgeBorderRadius,
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                available
                    ? Icons.check_circle_outline
                    : Icons.schedule_outlined,
                size: 15,
                color: available
                    ? GariLinkColors.success
                    : GariLinkColors.warning,
              ),
              const SizedBox(width: 4),
              Text(
                available
                    ? 'Requestable'
                    : _humanize(vehicle.listing['operationalAvailability']),
                style: GariLinkTypography.labelSmall.copyWith(
                  color: available
                      ? GariLinkColors.success
                      : GariLinkColors.warning,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OverlayLabel extends StatelessWidget {
  const _OverlayLabel({required this.icon, required this.text});
  final IconData icon;
  final String text;
  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      color: Colors.black.withValues(alpha: .72),
      borderRadius: BorderRadius.circular(9),
    ),
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: Colors.white),
          const SizedBox(width: 5),
          Text(
            text,
            style: GariLinkTypography.labelSmall.copyWith(color: Colors.white),
          ),
        ],
      ),
    ),
  );
}

String _vehicleTitle(
  Map<String, dynamic> listing,
  Map<String, dynamic> vehicle,
) {
  final make = vehicle['make']?.toString().trim() ?? '';
  final model = vehicle['model']?.toString().trim() ?? '';
  final identity = '$make $model'.trim();
  if (identity.isNotEmpty) return identity;
  final title = listing['title']?.toString().trim() ?? '';
  return title.isEmpty ? 'Vehicle' : title;
}

String? _capabilityLabel(TransportNeed need, Object? raw) {
  if (raw is! Map) return null;
  final capability = Map<String, dynamic>.from(raw);
  if (need.purpose.needsCargo) {
    final parts = <String>[];
    final payload = capability['payload_kg'];
    if (payload is num) parts.add('${_number(payload)} kg payload');
    final volume = capability['cargo_volume_m3'];
    if (volume is num) parts.add('${_number(volume)} m³ cargo volume');
    final body = capability['cargo_body']?.toString();
    if (body?.isNotEmpty == true) parts.add('${_humanize(body)} cargo');
    return parts.isEmpty ? null : parts.take(2).join(' • ');
  }
  final capacity = capability['passenger_capacity'];
  if (capacity is num) return 'Seats ${capacity.toInt()} passengers';
  return null;
}

String _reasonLabel(SuitabilityResult suitability) {
  final known = suitability.reasons
      .map(suitabilityExplanation)
      .where((value) => value != 'Some vehicle details are not confirmed')
      .toList();
  return known.isEmpty ? 'Suitable for your needs' : known.first;
}

String _distanceLabel(double meters) => meters < 1000
    ? '${meters.round()} m away'
    : '${(meters / 1000).toStringAsFixed(meters < 10000 ? 1 : 0)} km away';

String _pricingLabel(Object? raw) {
  if (raw is! Map) return 'Confirm price with owner';
  final pricing = Map<String, dynamic>.from(raw);
  if (pricing['configured'] != true) return 'Confirm price with owner';
  final daily = pricing['durationRateMinorPerDay'];
  final currency = pricing['currency']?.toString() ?? 'TZS';
  if (daily is num && daily > 0) {
    return '${formatMarketplacePrice(daily, currency: currency)} daily component';
  }
  return 'Price calculated during booking';
}

String? _coverUrl(Map<String, dynamic> listing, Map<String, dynamic> vehicle) {
  final direct = listing['primaryImageUrl']?.toString().trim();
  if (direct?.isNotEmpty == true) return direct;
  final images = vehicle['images'];
  if (images is! List) return null;
  for (final item in images.whereType<Map>()) {
    final media = item['media'];
    if (media is Map) {
      final url = (media['publicUrl'] ?? media['signedUrl'])?.toString().trim();
      if (url?.isNotEmpty == true) return url;
    }
  }
  return null;
}

String _number(num value) {
  if (value != value.roundToDouble()) return value.toStringAsFixed(1);
  return value.toInt().toString().replaceAllMapped(
    RegExp(r'\B(?=(\d{3})+(?!\d))'),
    (_) => ',',
  );
}

String _humanize(Object? value) =>
    value
        ?.toString()
        .toLowerCase()
        .split('_')
        .where((part) => part.isNotEmpty)
        .map((part) => '${part[0].toUpperCase()}${part.substring(1)}')
        .join(' ') ??
    '';
