import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:photo_view/photo_view.dart';

import '../../../../core/formatters/marketplace_formatters.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/spacing.dart';
import '../../../../shared/widgets/app_skeleton.dart';
import '../../../explore/data/repositories/marketplace_repository.dart';
import '../../../explore/domain/discovery_selection.dart';
import '../../../explore/domain/vehicle_suitability.dart';
import '../../../explore/presentation/providers/explore_provider.dart';
import '../../../trips/domain/models/transport_need.dart';

final listingDetailsProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>, String>((ref, listingId) {
      return ref
          .watch(marketplaceRepositoryProvider)
          .getListingDetails(listingId);
    });

class VehicleDetailsPage extends ConsumerWidget {
  const VehicleDetailsPage({
    super.key,
    required this.listingId,
    this.selection,
  });
  final String listingId;
  final DiscoverySelection? selection;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (listingId.isEmpty) {
      return const _MessagePage(
        icon: Icons.link_off_rounded,
        title: 'Vehicle link unavailable',
        message: 'This vehicle link is incomplete.',
      );
    }
    return ref
        .watch(listingDetailsProvider(listingId))
        .when(
          loading: () => const _DetailsSkeleton(),
          error: (_, _) => _MessagePage(
            icon: Icons.cloud_off_outlined,
            title: 'Vehicle unavailable',
            message:
                'Check your connection and try loading this vehicle again.',
            action: FilledButton(
              onPressed: () =>
                  ref.invalidate(listingDetailsProvider(listingId)),
              child: const Text('Try again'),
            ),
          ),
          data: (data) => _ListingDetails(
            listing: data,
            selection: selection?.listingId == listingId ? selection : null,
          ),
        );
  }
}

class _ListingDetails extends StatelessWidget {
  const _ListingDetails({required this.listing, this.selection});
  final Map<String, dynamic> listing;
  final DiscoverySelection? selection;

  @override
  Widget build(BuildContext context) {
    final vehicle = _map(listing['vehicle']);
    final capabilities = _map(
      listing['capabilities'] ?? vehicle['capabilities'],
    );
    final pricing = _map(listing['rentalPricing'] ?? vehicle['rentalPricing']);
    final eligibility = _map(listing['eligibility']);
    final images = (listing['images'] as List? ?? const [])
        .whereType<String>()
        .where((url) => url.trim().isNotEmpty)
        .toList(growable: false);
    final title = _vehicleTitle(listing);
    final category = _humanize(
      listing['vehicleCategory'] ?? vehicle['vehicleCategory'],
    );
    final availability =
        listing['operationalAvailability']?.toString() ??
        eligibility['operationalAvailability']?.toString() ??
        'UNAVAILABLE';
    final requestable =
        listing['type'] == 'FOR_HIRE' &&
        eligibility['requestable'] == true &&
        (selection == null ||
            selection!.suitability.status == SuitabilityStatus.suitable);
    final price = _pricingLabel(pricing);
    final explanation = _requestabilityExplanation(availability, requestable);
    final locality = listing['publicLocality']?.toString().trim();
    final operatorName = _map(listing['workspace'])['name']?.toString().trim();
    final facts = _specifications(category, capabilities);
    final fit = selection == null
        ? const <String>[]
        : _whyItFits(selection!, capabilities);

    return Scaffold(
      backgroundColor: GariLinkColors.background,
      bottomNavigationBar: _RequestBar(
        pricingLabel: price,
        enabled: requestable,
        explanation: explanation,
        onRequest: () => context.push(
          Uri(
            path: '/booking',
            queryParameters: {
              'listingId': listing['id']?.toString() ?? '',
              'vehicleId': listing['vehicleId']?.toString() ?? '',
              'workspaceId': listing['workspaceId']?.toString() ?? '',
              'currency': pricing['currency']?.toString() ?? 'TZS',
              'vehicleTitle': title,
              if (category.isNotEmpty) 'vehicleCategory': category,
              if (locality?.isNotEmpty == true) 'publicLocality': locality!,
              'availability': availability,
              if (images.isNotEmpty) 'coverUrl': images.first,
            },
          ).toString(),
          extra: selection,
        ),
      ),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            foregroundColor: Colors.white,
            backgroundColor: GariLinkColors.primary,
            flexibleSpace: FlexibleSpaceBar(
              background: _VehicleGallery(
                listingId: listing['id']?.toString() ?? '',
                images: images,
                vehicleName: title,
              ),
            ),
            actions: [
              _SaveListingButton(listingId: listing['id']?.toString() ?? ''),
            ],
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(
              GariLinkSpacing.lg,
              GariLinkSpacing.lg,
              GariLinkSpacing.lg,
              GariLinkSpacing.xl,
            ),
            sliver: SliverList.list(
              children: [
                Semantics(
                  header: true,
                  child: Text(
                    title,
                    style: const TextStyle(
                      fontSize: 26,
                      height: 1.15,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                if (category.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    category,
                    style: const TextStyle(color: GariLinkColors.textSecondary),
                  ),
                ],
                if (selection != null) ...[
                  const SizedBox(height: 18),
                  _SuitabilityBanner(need: selection!.need),
                  const SizedBox(height: 12),
                  _TripContext(need: selection!.need),
                ],
                const SizedBox(height: 22),
                _AvailabilityPanel(
                  availability: availability,
                  requestable: requestable,
                  explanation: explanation,
                ),
                if (fit.isNotEmpty) ...[
                  const SizedBox(height: 28),
                  const _Heading('Why this fits'),
                  const SizedBox(height: 12),
                  ...fit.map(
                    (item) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _InfoRow(icon: Icons.check_rounded, text: item),
                    ),
                  ),
                ],
                const SizedBox(height: 28),
                const _Heading('Pricing'),
                const SizedBox(height: 10),
                _PricingPanel(label: price),
                if (locality?.isNotEmpty == true) ...[
                  const SizedBox(height: 28),
                  const _Heading('Operating area'),
                  const SizedBox(height: 10),
                  _InfoRow(
                    icon: Icons.location_on_outlined,
                    text: 'Operates around $locality',
                  ),
                ],
                if (facts.isNotEmpty) ...[
                  const SizedBox(height: 28),
                  const _Heading('Vehicle specifications'),
                  const SizedBox(height: 12),
                  _SpecificationGrid(facts: facts),
                ],
                if (operatorName?.isNotEmpty == true) ...[
                  const SizedBox(height: 28),
                  const _Heading('Vehicle operator'),
                  const SizedBox(height: 10),
                  _InfoRow(icon: Icons.business_outlined, text: operatorName!),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SuitabilityBanner extends StatelessWidget {
  const _SuitabilityBanner({required this.need});
  final TransportNeed need;
  @override
  Widget build(BuildContext context) {
    final text = need.purpose.needsCargo
        ? 'Suitable for moving goods'
        : 'Suitable for your group';
    return Semantics(
      label: text,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: GariLinkColors.success.withValues(alpha: .1),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            const Icon(
              Icons.check_circle_rounded,
              color: GariLinkColors.success,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                text,
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TripContext extends StatelessWidget {
  const _TripContext({required this.need});
  final TransportNeed need;
  @override
  Widget build(BuildContext context) {
    final details = need.purpose.needsCargo
        ? [
            if (need.cargo?.estimatedWeightKg != null)
              '${_number(need.cargo!.estimatedWeightKg!)} kg',
            if (need.cargo?.requiresCoveredBody == true) 'covered cargo',
          ]
        : [
            if (need.passengerCount != null)
              '${need.passengerCount} passengers',
          ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Your trip',
          style: TextStyle(
            color: GariLinkColors.textMuted,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 3),
        Text([need.purpose.label, ...details].join(' • ')),
      ],
    );
  }
}

class _AvailabilityPanel extends StatelessWidget {
  const _AvailabilityPanel({
    required this.availability,
    required this.requestable,
    required this.explanation,
  });
  final String availability;
  final bool requestable;
  final String explanation;
  @override
  Widget build(BuildContext context) => _Panel(
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          requestable ? Icons.event_available : Icons.schedule_outlined,
          color: requestable
              ? GariLinkColors.success
              : GariLinkColors.textSecondary,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _humanize(availability),
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text(
                explanation,
                style: const TextStyle(color: GariLinkColors.textSecondary),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _PricingPanel extends StatelessWidget {
  const _PricingPanel({required this.label});
  final String label;
  @override
  Widget build(BuildContext context) => Semantics(
    label:
        'Pricing. $label. Final price depends on your dates and trip details.',
    child: _Panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: GariLinkColors.accent,
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Final price depends on your dates and trip details.',
            style: TextStyle(color: GariLinkColors.textSecondary),
          ),
        ],
      ),
    ),
  );
}

class _Panel extends StatelessWidget {
  const _Panel({required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: GariLinkColors.neutral200),
    ),
    child: child,
  );
}

class _SpecificationGrid extends StatelessWidget {
  const _SpecificationGrid({required this.facts});
  final List<(String, String)> facts;
  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) => GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: facts.length,
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: constraints.maxWidth >= 520 ? 3 : 2,
        mainAxisExtent: 82,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemBuilder: (_, index) => _Panel(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              facts[index].$1,
              style: const TextStyle(
                color: GariLinkColors.textMuted,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              facts[index].$2,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ],
        ),
      ),
    ),
  );
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.text});
  final IconData icon;
  final String text;
  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Icon(icon, size: 20, color: GariLinkColors.accent),
      const SizedBox(width: 10),
      Expanded(child: Text(text)),
    ],
  );
}

class _VehicleGallery extends StatefulWidget {
  const _VehicleGallery({
    required this.listingId,
    required this.images,
    required this.vehicleName,
  });
  final String listingId;
  final List<String> images;
  final String vehicleName;
  @override
  State<_VehicleGallery> createState() => _VehicleGalleryState();
}

class _VehicleGalleryState extends State<_VehicleGallery> {
  int index = 0;
  @override
  Widget build(BuildContext context) {
    if (widget.images.isEmpty) return const _GalleryFallback();
    return Stack(
      fit: StackFit.expand,
      children: [
        PageView.builder(
          itemCount: widget.images.length,
          onPageChanged: (value) => setState(() => index = value),
          itemBuilder: (_, i) => Semantics(
            image: true,
            button: true,
            label:
                '${widget.vehicleName}, photo ${i + 1} of ${widget.images.length}. Open gallery.',
            child: GestureDetector(
              excludeFromSemantics: true,
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => _FullscreenGallery(
                    images: widget.images,
                    initialIndex: i,
                    heroPrefix: widget.listingId,
                    vehicleName: widget.vehicleName,
                  ),
                ),
              ),
              child: Hero(
                tag: i == 0
                    ? 'listing-cover-${widget.listingId}'
                    : '${widget.listingId}-photo-$i',
                child: CachedNetworkImage(
                  imageUrl: widget.images[i],
                  fit: BoxFit.cover,
                  memCacheWidth: 1440,
                  placeholder: (_, _) => const ColoredBox(
                    color: GariLinkColors.neutral200,
                    child: Center(
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                  errorWidget: (_, _, _) => const _GalleryFallback(),
                ),
              ),
            ),
          ),
        ),
        Positioned(
          right: 16,
          bottom: 16,
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: .68),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              child: Text(
                '${index + 1} / ${widget.images.length}',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _FullscreenGallery extends StatefulWidget {
  const _FullscreenGallery({
    required this.images,
    required this.initialIndex,
    required this.heroPrefix,
    required this.vehicleName,
  });
  final List<String> images;
  final int initialIndex;
  final String heroPrefix;
  final String vehicleName;

  @override
  State<_FullscreenGallery> createState() => _FullscreenGalleryState();
}

class _FullscreenGalleryState extends State<_FullscreenGallery> {
  late int index = widget.initialIndex;
  late final PageController controller = PageController(initialPage: index);

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: Colors.black,
    appBar: AppBar(
      backgroundColor: Colors.black,
      foregroundColor: Colors.white,
      title: Text('${index + 1} of ${widget.images.length}'),
    ),
    body: SafeArea(
      child: PageView.builder(
        controller: controller,
        itemCount: widget.images.length,
        onPageChanged: (value) => setState(() => index = value),
        itemBuilder: (_, i) => Semantics(
          image: true,
          label:
              '${widget.vehicleName}, photo ${i + 1} of ${widget.images.length}',
          child: Hero(
            tag: i == 0
                ? 'listing-cover-${widget.heroPrefix}'
                : '${widget.heroPrefix}-photo-$i',
            child: PhotoView(
              imageProvider: CachedNetworkImageProvider(widget.images[i]),
              backgroundDecoration: const BoxDecoration(color: Colors.black),
              minScale: PhotoViewComputedScale.contained,
              maxScale: PhotoViewComputedScale.covered * 3,
              errorBuilder: (_, _, _) => const _GalleryFallback(),
            ),
          ),
        ),
      ),
    ),
  );
}

class _GalleryFallback extends StatelessWidget {
  const _GalleryFallback();
  @override
  Widget build(BuildContext context) => const ColoredBox(
    color: GariLinkColors.neutral200,
    child: Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.directions_car_filled_outlined,
            size: 68,
            color: GariLinkColors.textMuted,
          ),
          SizedBox(height: 8),
          Text('Vehicle photos are not available'),
        ],
      ),
    ),
  );
}

class _Heading extends StatelessWidget {
  const _Heading(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Semantics(
    header: true,
    child: Text(
      text,
      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
    ),
  );
}

class _RequestBar extends StatelessWidget {
  const _RequestBar({
    required this.pricingLabel,
    required this.enabled,
    required this.explanation,
    required this.onRequest,
  });
  final String pricingLabel;
  final bool enabled;
  final String explanation;
  final VoidCallback onRequest;
  @override
  Widget build(BuildContext context) => Material(
    color: Colors.white,
    elevation: 8,
    child: SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 12),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final text = enabled ? pricingLabel : explanation;
            final button = FilledButton(
              onPressed: enabled ? onRequest : null,
              child: Text(enabled ? 'Request this vehicle' : 'Not requestable'),
            );
            if (constraints.maxWidth < 700) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(text, maxLines: 2, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 8),
                  button,
                ],
              );
            }
            return Row(
              children: [
                Expanded(
                  child: Text(
                    text,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 12),
                button,
              ],
            );
          },
        ),
      ),
    ),
  );
}

class _DetailsSkeleton extends StatelessWidget {
  const _DetailsSkeleton();
  @override
  Widget build(BuildContext context) => const Scaffold(
    body: SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppSkeleton(width: double.infinity, height: 300, borderRadius: 0),
          Padding(
            padding: EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AppSkeleton(width: 250, height: 28),
                SizedBox(height: 16),
                AppSkeleton(width: double.infinity, height: 74),
                SizedBox(height: 16),
                AppSkeleton(width: double.infinity, height: 94),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

class _SaveListingButton extends ConsumerStatefulWidget {
  const _SaveListingButton({required this.listingId});
  final String listingId;
  @override
  ConsumerState<_SaveListingButton> createState() => _SaveListingButtonState();
}

class _SaveListingButtonState extends ConsumerState<_SaveListingButton> {
  bool busy = false;
  bool? savedOverride;
  Future<void> toggle(bool saved) async {
    if (!ref.read(marketplaceAuthenticatedProvider)) {
      context.push('/login');
      return;
    }
    setState(() {
      busy = true;
      savedOverride = !saved;
    });
    HapticFeedback.selectionClick();
    try {
      final result = await ref
          .read(marketplaceRepositoryProvider)
          .setSaved(widget.listingId, !saved);
      if (mounted) setState(() => savedOverride = result);
      ref.invalidate(savedListingsProvider);
    } catch (_) {
      if (mounted) setState(() => savedOverride = null);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authenticated = ref.watch(marketplaceAuthenticatedProvider);
    final saved =
        savedOverride ??
        (authenticated &&
            (ref.watch(savedListingsProvider).valueOrNull ?? const []).any(
              (item) => item['id']?.toString() == widget.listingId,
            ));
    return IconButton(
      tooltip: saved ? 'Remove from saved' : 'Save vehicle',
      onPressed: busy ? null : () => toggle(saved),
      icon: busy
          ? const SizedBox.square(
              dimension: 18,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Icon(
              saved ? Icons.favorite_rounded : Icons.favorite_border_rounded,
            ),
    );
  }
}

class _MessagePage extends StatelessWidget {
  const _MessagePage({
    required this.icon,
    required this.title,
    required this.message,
    this.action,
  });
  final IconData icon;
  final String title;
  final String message;
  final Widget? action;
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(),
    body: Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 52),
            const SizedBox(height: 16),
            Text(title, style: const TextStyle(fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            Text(message, textAlign: TextAlign.center),
            if (action != null) ...[const SizedBox(height: 16), action!],
          ],
        ),
      ),
    ),
  );
}

Map<String, dynamic> _map(Object? value) =>
    value is Map ? Map<String, dynamic>.from(value) : const {};

String _vehicleTitle(Map<String, dynamic> listing) {
  final identity = [listing['make'], listing['model']]
      .map((value) => value?.toString().trim() ?? '')
      .where((value) => value.isNotEmpty)
      .join(' ');
  if (identity.isNotEmpty) return identity;
  final title = listing['title']?.toString().trim();
  return title?.isNotEmpty == true ? title! : 'Vehicle';
}

String _pricingLabel(Map<String, dynamic> pricing) {
  if (pricing['configured'] != true) return 'Confirm price with owner';
  final daily = pricing['durationRateMinorPerDay'];
  if (daily is num && daily > 0) {
    return '${formatMarketplacePrice(daily, currency: pricing['currency']?.toString() ?? 'TZS')}/day';
  }
  return 'Price calculated during booking';
}

String _requestabilityExplanation(String availability, bool requestable) {
  if (requestable) return 'Ready to receive a rental request.';
  return switch (availability) {
    'BUSY' =>
      'This vehicle is currently busy and cannot receive a new request.',
    'MAINTENANCE' =>
      'This vehicle is under maintenance and cannot be requested.',
    'UNAVAILABLE' => 'The owner has marked this vehicle unavailable.',
    _ => 'This vehicle cannot receive a rental request right now.',
  };
}

List<String> _whyItFits(
  DiscoverySelection selection,
  Map<String, dynamic> capabilities,
) {
  final items = selection.suitability.reasons
      .where((reason) => !suitabilityExplanation(reason).startsWith('Some '))
      .map(suitabilityExplanation)
      .toList(growable: true);
  if (selection.need.purpose.needsCargo) {
    if (capabilities['payload_kg'] is num) {
      items.insert(
        0,
        '${_number(capabilities['payload_kg'] as num)} kg payload',
      );
    }
    final body = _humanize(capabilities['cargo_body']);
    if (body.isNotEmpty) items.add('$body cargo body');
  } else if (capabilities['passenger_capacity'] is num) {
    items.insert(
      0,
      'Seats ${_number(capabilities['passenger_capacity'] as num)} passengers',
    );
  }
  return items.toSet().toList(growable: false);
}

List<(String, String)> _specifications(
  String category,
  Map<String, dynamic> capabilities,
) {
  final result = <(String, String)>[];
  void add(String label, String value) {
    if (value.isNotEmpty) {
      result.add((label, value));
    }
  }

  add('Category', category);
  if (capabilities['passenger_capacity'] is num) {
    add('Seats', _number(capabilities['passenger_capacity'] as num));
  }
  if (capabilities['payload_kg'] is num) {
    add('Payload', '${_number(capabilities['payload_kg'] as num)} kg');
  }
  add('Body type', _humanize(capabilities['cargo_body']));
  add('Transmission', _humanize(capabilities['transmission']));
  add('Fuel', _humanize(capabilities['fuel_type']));
  if (capabilities['with_driver'] is bool) {
    add(
      'Driver',
      capabilities['with_driver'] == true ? 'Available' : 'Not offered',
    );
  }
  if (capabilities['self_drive'] is bool) {
    add(
      'Self-drive',
      capabilities['self_drive'] == true ? 'Available' : 'Not offered',
    );
  }
  if (capabilities['long_distance'] is bool) {
    add(
      'Long-distance',
      capabilities['long_distance'] == true ? 'Supported' : 'Not offered',
    );
  }
  return result;
}

String _humanize(Object? value) {
  final text = value?.toString().trim() ?? '';
  if (text.isEmpty) return '';
  return text
      .toLowerCase()
      .split('_')
      .map((part) => '${part[0].toUpperCase()}${part.substring(1)}')
      .join(' ');
}

String _number(num value) => value == value.roundToDouble()
    ? value.toInt().toString()
    : value.toStringAsFixed(1);
