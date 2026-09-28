import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../core/errors/app_exception.dart';
import '../../../../core/theme/theme.dart';
import '../../data/repositories/rental_repository.dart';
import '../../domain/models/rental_summary.dart';
import '../models/rental_status_presentation.dart';
import '../providers/trips_provider.dart';
import 'rental_details_page.dart';

class TripsPage extends ConsumerStatefulWidget {
  const TripsPage({super.key});
  @override
  ConsumerState<TripsPage> createState() => _TripsPageState();
}

class _TripsPageState extends ConsumerState<TripsPage>
    with WidgetsBindingObserver {
  String? _busyRentalId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) ref.invalidate(myTripsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final rentals = ref.watch(myTripsProvider);
    return Scaffold(
      backgroundColor: GariLinkColors.background,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: GariLinkColors.background,
        elevation: 0,
        title: Text('Trips', style: GariLinkTypography.titleLarge),
        actions: [
          IconButton(
            tooltip: 'Refresh trips',
            onPressed: () => ref.invalidate(myTripsProvider),
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: rentals.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => _MessageState(
          icon: Icons.cloud_off_outlined,
          title: 'Trips could not be loaded',
          message: 'Check your connection and try again.',
          actionLabel: 'Try again',
          onAction: () => ref.invalidate(myTripsProvider),
        ),
        data: (items) => RefreshIndicator(
          onRefresh: () => ref.refresh(myTripsProvider.future),
          child: items.isEmpty
              ? _MessageState(
                  icon: Icons.route_outlined,
                  title: 'No trips yet',
                  message: 'Rental requests and active trips will appear here.',
                  actionLabel: 'Find a vehicle',
                  actionIcon: Icons.search_rounded,
                  onAction: () => context.go('/explore'),
                )
              : _TripsList(
                  rentals: items,
                  busyRentalId: _busyRentalId,
                  onOpen: _openRental,
                  onCancel: _cancel,
                ),
        ),
      ),
    );
  }

  void _openRental(RentalSummary rental) {
    Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => RentalDetailsPage(
          rental: rental,
          onCancel: rental.canCustomerCancel
              ? () async {
                  Navigator.of(context).pop();
                  await _cancel(rental);
                }
              : null,
          primaryAction:
              const {'REJECTED', 'CANCELLED', 'EXPIRED'}.contains(rental.status)
              ? (label: 'Explore vehicles', run: () => context.go('/explore'))
              : null,
        ),
      ),
    );
  }

  Future<void> _cancel(RentalSummary rental) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Cancel rental request?'),
        content: Text(
          'Your request for ${rental.title} will be cancelled. This cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Keep request'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            style: FilledButton.styleFrom(
              backgroundColor: GariLinkColors.error,
            ),
            child: const Text('Cancel request'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _busyRentalId = rental.id);
    try {
      await ref.read(rentalRepositoryProvider).cancelRentalRequest(rental.id);
      ref.invalidate(myTripsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Rental request cancelled.')),
        );
      }
    } catch (error) {
      ref.invalidate(myTripsProvider);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(userFacingError(error))));
      }
    } finally {
      if (mounted) setState(() => _busyRentalId = null);
    }
  }
}

class _TripsList extends StatelessWidget {
  const _TripsList({
    required this.rentals,
    required this.busyRentalId,
    required this.onOpen,
    required this.onCancel,
  });
  final List<RentalSummary> rentals;
  final String? busyRentalId;
  final ValueChanged<RentalSummary> onOpen;
  final ValueChanged<RentalSummary> onCancel;

  @override
  Widget build(BuildContext context) {
    final sections = RentalLifecycleGroup.values
        .map(
          (group) => (
            group,
            rentals
                .where(
                  (rental) =>
                      rentalStatusPresentation(rental.status).group == group,
                )
                .toList(),
          ),
        )
        .where((section) => section.$2.isNotEmpty)
        .toList();
    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(
        GariLinkSpacing.lg,
        GariLinkSpacing.sm,
        GariLinkSpacing.lg,
        GariLinkSpacing.xxxl,
      ),
      itemCount: sections.length,
      itemBuilder: (_, sectionIndex) {
        final section = sections[sectionIndex];
        return Padding(
          padding: const EdgeInsets.only(bottom: GariLinkSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _sectionTitle(section.$1),
                style: GariLinkTypography.titleMedium,
              ),
              const SizedBox(height: GariLinkSpacing.md),
              ...section.$2.map(
                (rental) => Padding(
                  padding: const EdgeInsets.only(bottom: GariLinkSpacing.md),
                  child: RentalTripCard(
                    rental: rental,
                    busy: busyRentalId == rental.id,
                    onOpen: () => onOpen(rental),
                    onCancel: rental.canCustomerCancel
                        ? () => onCancel(rental)
                        : null,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  String _sectionTitle(RentalLifecycleGroup group) => switch (group) {
    RentalLifecycleGroup.upcoming => 'Upcoming',
    RentalLifecycleGroup.active => 'Active',
    RentalLifecycleGroup.past => 'Past trips',
  };
}

class RentalTripCard extends StatelessWidget {
  const RentalTripCard({
    super.key,
    required this.rental,
    required this.busy,
    required this.onOpen,
    this.onCancel,
  });
  final RentalSummary rental;
  final bool busy;
  final VoidCallback onOpen;
  final VoidCallback? onCancel;

  @override
  Widget build(BuildContext context) {
    final dates =
        '${DateFormat('d MMM').format(rental.startDate)} – ${DateFormat('d MMM y').format(rental.endDate)}';
    final estimatedAmount = rental.estimatedAmountMinor;
    final estimate = NumberFormat.currency(
      name: rental.currency,
      symbol: '${rental.currency} ',
      decimalDigits: 0,
    ).format(estimatedAmount ?? 0);
    final status = rentalStatusPresentation(rental.status);
    final pickup =
        rental.pickupLocation?.locality ??
        rental.pickupLocation?.city ??
        rental.pickupLocation?.region;
    return Semantics(
      button: true,
      label: 'Open ${rental.title}. ${status.title}.',
      child: Material(
        color: GariLinkColors.surface,
        borderRadius: GariLinkRadius.cardBorderRadius,
        child: InkWell(
          onTap: onOpen,
          borderRadius: GariLinkRadius.cardBorderRadius,
          child: Padding(
            padding: const EdgeInsets.all(GariLinkSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: GariLinkRadius.inputBorderRadius,
                      child: SizedBox(
                        width: 88,
                        height: 88,
                        child: rental.vehicle.imageUrl == null
                            ? const ColoredBox(
                                color: GariLinkColors.neutral100,
                                child: Icon(Icons.directions_car_rounded),
                              )
                            : CachedNetworkImage(
                                imageUrl: rental.vehicle.imageUrl!,
                                fit: BoxFit.cover,
                                memCacheWidth: 320,
                                placeholder: (_, _) => const ColoredBox(
                                  color: GariLinkColors.neutral100,
                                ),
                                errorWidget: (_, _, _) => const ColoredBox(
                                  color: GariLinkColors.neutral100,
                                  child: Icon(Icons.broken_image_outlined),
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(width: GariLinkSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            rental.title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: GariLinkTypography.bodyLarge.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: GariLinkSpacing.sm),
                          _StatusChip(
                            label: status.label,
                            color: status.color,
                            icon: status.icon,
                          ),
                          const SizedBox(height: GariLinkSpacing.sm),
                          Text(dates, style: GariLinkTypography.bodySmall),
                          if (pickup?.isNotEmpty ?? false)
                            Text(
                              'Pickup: $pickup',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GariLinkTypography.bodySmall,
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: GariLinkSpacing.md),
                Text(status.explanation, style: GariLinkTypography.bodySmall),
                const SizedBox(height: GariLinkSpacing.sm),
                Text(
                  estimatedAmount == null
                      ? 'No authoritative estimate recorded'
                      : 'Estimate recorded: $estimate',
                  style: GariLinkTypography.labelMedium.copyWith(
                    color: estimatedAmount == null
                        ? GariLinkColors.textSecondary
                        : GariLinkColors.accent,
                  ),
                ),
                if (onCancel != null) ...[
                  const Divider(height: GariLinkSpacing.xxl),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton.icon(
                      onPressed: busy ? null : onCancel,
                      icon: busy
                          ? const SizedBox.square(
                              dimension: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.close_rounded),
                      label: const Text('Cancel request'),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({
    required this.label,
    required this.color,
    required this.icon,
  });
  final String label;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.1),
      borderRadius: GariLinkRadius.badgeBorderRadius,
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 15, color: color),
        const SizedBox(width: 4),
        Text(
          label,
          style: GariLinkTypography.labelSmall.copyWith(color: color),
        ),
      ],
    ),
  );
}

class _MessageState extends StatelessWidget {
  const _MessageState({
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.actionIcon = Icons.refresh_rounded,
    this.onAction,
  });
  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final IconData actionIcon;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) => ListView(
    physics: const AlwaysScrollableScrollPhysics(),
    padding: const EdgeInsets.all(GariLinkSpacing.xxxl),
    children: [
      const SizedBox(height: 100),
      Icon(icon, size: 56, color: GariLinkColors.textMuted),
      const SizedBox(height: GariLinkSpacing.lg),
      Text(
        title,
        textAlign: TextAlign.center,
        style: GariLinkTypography.titleMedium,
      ),
      const SizedBox(height: GariLinkSpacing.sm),
      Text(
        message,
        textAlign: TextAlign.center,
        style: GariLinkTypography.bodyMedium,
      ),
      if (onAction != null) ...[
        const SizedBox(height: GariLinkSpacing.lg),
        Center(
          child: FilledButton.icon(
            onPressed: onAction,
            icon: Icon(actionIcon),
            label: Text(actionLabel ?? 'Try again'),
          ),
        ),
      ],
    ],
  );
}
