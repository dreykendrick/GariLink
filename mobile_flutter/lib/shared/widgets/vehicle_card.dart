import 'package:flutter/material.dart';

import '../../core/formatters/marketplace_formatters.dart';
import '../../core/theme/theme.dart';
import 'vehicle_image.dart';

class VehicleCard extends StatelessWidget {
  const VehicleCard({
    required this.listing,
    required this.onTap,
    this.compact = false,
    this.saved,
    this.saving = false,
    this.onSaved,
    super.key,
  });

  final Map<String, dynamic> listing;
  final VoidCallback onTap;
  final bool compact;
  final bool? saved;
  final bool saving;
  final VoidCallback? onSaved;

  @override
  Widget build(BuildContext context) {
    final title = listing['title']?.toString().trim();
    final displayTitle = title?.isNotEmpty == true ? title! : 'Vehicle listing';
    final isRental = listing['type'] == 'FOR_HIRE';
    final currency = listing['currency']?.toString() ?? 'TZS';
    final price = formatMarketplacePrice(listing['price'], currency: currency);
    final year = listing['year']?.toString();
    final location = listing['county']?.toString().trim();
    final mileage = formatMileage(listing['mileage']);
    final metadata = [
      if (year?.isNotEmpty == true) year,
      if (location?.isNotEmpty == true) location,
    ].whereType<String>().join('  •  ');

    return Semantics(
      container: true,
      explicitChildNodes: true,
      button: true,
      label:
          '$displayTitle, $price${isRental ? ' per day' : ''}${metadata.isEmpty ? '' : ', $metadata'}',
      child: Material(
        color: GariLinkColors.surface,
        borderRadius: GariLinkRadius.cardBorderRadius,
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: compact
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _Photo(
                      listing: listing,
                      title: displayTitle,
                      height: 148,
                      saved: saved,
                      saving: saving,
                      onSaved: onSaved,
                    ),
                    Padding(
                      padding: const EdgeInsets.all(GariLinkSpacing.md),
                      child: _Details(
                        title: displayTitle,
                        metadata: metadata,
                        mileage: mileage,
                        price: price,
                        isRental: isRental,
                        compact: true,
                      ),
                    ),
                  ],
                )
              : Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width:
                          MediaQuery.sizeOf(context).width <=
                              GariLinkDimensions.compactPhone
                          ? 112
                          : 132,
                      child: _Photo(
                        listing: listing,
                        title: displayTitle,
                        height: 132,
                        saved: saved,
                        saving: saving,
                        onSaved: onSaved,
                      ),
                    ),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.all(GariLinkSpacing.md),
                        child: _Details(
                          title: displayTitle,
                          metadata: metadata,
                          mileage: mileage,
                          price: price,
                          isRental: isRental,
                        ),
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}

class _Photo extends StatelessWidget {
  const _Photo({
    required this.listing,
    required this.title,
    required this.height,
    required this.saved,
    required this.saving,
    required this.onSaved,
  });
  final Map<String, dynamic> listing;
  final String title;
  final double height;
  final bool? saved;
  final bool saving;
  final VoidCallback? onSaved;

  @override
  Widget build(BuildContext context) => Stack(
    fit: StackFit.passthrough,
    children: [
      SizedBox(
        height: height,
        width: double.infinity,
        child: Hero(
          tag: 'listing-cover-${listing['id']}',
          child: VehicleImage(
            url: listing['primaryImageUrl']?.toString(),
            semanticLabel: 'Photo of $title',
          ),
        ),
      ),
      Positioned(
        left: 10,
        top: 10,
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: .68),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
            child: Text(
              listing['type'] == 'FOR_HIRE' ? 'For hire' : 'For sale',
              style: GariLinkTypography.labelSmall.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
      ),
      if (onSaved != null)
        Positioned(
          right: 6,
          top: 6,
          child: Semantics(
            button: true,
            label: saved == true ? 'Remove saved vehicle' : 'Save vehicle',
            child: IconButton.filledTonal(
              tooltip: saved == true ? 'Remove from saved' : 'Save vehicle',
              onPressed: saving ? null : onSaved,
              icon: AnimatedSwitcher(
                duration: GariLinkAnimations.duration(
                  context,
                  GariLinkAnimations.short,
                ),
                transitionBuilder: (child, animation) => ScaleTransition(
                  scale: animation,
                  child: FadeTransition(opacity: animation, child: child),
                ),
                child: saving
                    ? const SizedBox.square(
                        key: ValueKey('saving'),
                        dimension: 17,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Icon(
                        saved == true
                            ? Icons.favorite_rounded
                            : Icons.favorite_border_rounded,
                        key: ValueKey(saved == true),
                      ),
              ),
            ),
          ),
        ),
    ],
  );
}

class _Details extends StatelessWidget {
  const _Details({
    required this.title,
    required this.metadata,
    required this.mileage,
    required this.price,
    required this.isRental,
    this.compact = false,
  });
  final String title;
  final String metadata;
  final String? mileage;
  final String price;
  final bool isRental;
  final bool compact;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    mainAxisSize: MainAxisSize.min,
    children: [
      Text(
        title,
        maxLines: compact ? 1 : 2,
        overflow: TextOverflow.ellipsis,
        style: GariLinkTypography.bodyLarge.copyWith(
          fontWeight: FontWeight.w800,
          height: 1.15,
        ),
      ),
      if (metadata.isNotEmpty) ...[
        const SizedBox(height: 6),
        Text(
          metadata,
          maxLines: 2,
          style: GariLinkTypography.bodySmall.copyWith(
            color: GariLinkColors.textSecondary,
          ),
        ),
      ],
      if (!compact && mileage != null) ...[
        const SizedBox(height: 7),
        Text(
          mileage!,
          style: GariLinkTypography.bodySmall.copyWith(
            color: GariLinkColors.textMuted,
          ),
        ),
      ],
      const SizedBox(height: 9),
      Semantics(
        label: '$price${isRental ? ' per day' : ''}',
        child: Text(
          '$price${isRental ? ' / day' : ''}',
          maxLines: 2,
          style: GariLinkTypography.labelMedium.copyWith(
            color: GariLinkColors.accent,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    ],
  );
}
