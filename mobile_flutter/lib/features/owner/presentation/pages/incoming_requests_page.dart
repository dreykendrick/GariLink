import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/theme.dart';
import '../../../explore/presentation/providers/explore_provider.dart';
import '../../../trips/data/repositories/rental_repository.dart';
import '../../../trips/domain/models/rental_summary.dart';
import '../../../trips/domain/models/transport_need.dart';
import '../../../trips/presentation/providers/trips_provider.dart';
import '../../../trips/presentation/pages/rental_details_page.dart';
import '../models/owner_rental_status_presentation.dart';
import '../providers/operator_workspace_provider.dart';
import '../widgets/operator_workspace_selector.dart';

class IncomingRequestsPage extends ConsumerStatefulWidget {
  const IncomingRequestsPage({super.key});

  @override
  ConsumerState<IncomingRequestsPage> createState() =>
      _IncomingRequestsPageState();
}

class _IncomingRequestsPageState extends ConsumerState<IncomingRequestsPage>
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
    if (state != AppLifecycleState.resumed) return;
    ref.invalidate(operatorWorkspaceContextProvider);
    final workspaceId = ref
        .read(operatorWorkspaceContextProvider)
        .valueOrNull
        ?.selectedId;
    if (workspaceId != null) {
      ref.invalidate(workspaceRentalsProvider(workspaceId));
    }
  }

  @override
  Widget build(BuildContext context) {
    final workspaces = ref.watch(operatorWorkspaceContextProvider);
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        backgroundColor: GariLinkColors.background,
        appBar: AppBar(
          backgroundColor: GariLinkColors.surface,
          elevation: 0,
          title: Text('Rental requests', style: GariLinkTypography.titleLarge),
          bottom: TabBar(
            isScrollable: true,
            labelColor: GariLinkColors.accent,
            unselectedLabelColor: GariLinkColors.textMuted,
            indicatorColor: GariLinkColors.accent,
            tabs: const [
              Tab(text: 'Needs attention'),
              Tab(text: 'Upcoming'),
              Tab(text: 'Active'),
              Tab(text: 'History'),
            ],
          ),
        ),
        body: workspaces.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, _) => _OwnerMessage(
            icon: Icons.cloud_off_outlined,
            title: 'Workspaces could not be loaded',
            message: 'Check your connection and try again.',
            onRetry: () => refreshOperatorWorkspace(ref),
          ),
          data: (items) {
            if (items.isEmpty) {
              return const _OwnerMessage(
                icon: Icons.business_outlined,
                title: 'No owner workspace yet',
                message:
                    'Create an owner workspace before accepting rental requests.',
              );
            }
            final selected = items.selectedId;
            if (selected == null) return const SizedBox.shrink();
            return Column(
              children: [
                if (items.available.length > 1)
                  const Padding(
                    padding: EdgeInsets.fromLTRB(16, 12, 16, 0),
                    child: OperatorWorkspaceSelector(),
                  ),
                Expanded(child: _requests(selected)),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _requests(String workspaceId) {
    final rentals = ref.watch(workspaceRentalsProvider(workspaceId));
    return rentals.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, _) => _OwnerMessage(
        icon: Icons.cloud_off_outlined,
        title: 'Requests could not be loaded',
        message: 'Check your connection and try again.',
        onRetry: () => ref.invalidate(workspaceRentalsProvider(workspaceId)),
      ),
      data: (items) => TabBarView(
        children: List.generate(4, (tab) {
          final group = OwnerRentalQueueGroup.values[tab];
          final filtered = orderOwnerRentals(
            items.where(
              (rental) =>
                  ownerRentalStatusPresentation(rental.status).group == group,
            ),
            group,
          );
          return RefreshIndicator(
            onRefresh: () =>
                ref.refresh(workspaceRentalsProvider(workspaceId).future),
            child: filtered.isEmpty
                ? _OwnerMessage(
                    icon: Icons.event_note_outlined,
                    title: const [
                      'No requests need attention',
                      'No upcoming rentals',
                      'No active rentals',
                      'No rental history yet',
                    ][tab],
                    message: const [
                      'New requests will appear here for review.',
                      'Accepted and pickup-ready rentals will appear here.',
                      'Rentals in progress will appear here.',
                      'Completed, declined and cancelled rentals will appear here.',
                    ][tab],
                  )
                : ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(GariLinkSpacing.lg),
                    itemCount: filtered.length,
                    separatorBuilder: (_, _) =>
                        const SizedBox(height: GariLinkSpacing.md),
                    itemBuilder: (_, index) {
                      final rental = filtered[index];
                      return _OwnerRentalCard(
                        rental: rental,
                        busy: _busyRentalId == rental.id,
                        onOpen: () => _openDetails(workspaceId, rental),
                        onApprove:
                            rental.status == 'REQUESTED' ||
                                rental.status == 'UNDER_REVIEW'
                            ? () => _approve(workspaceId, rental)
                            : null,
                        onReject:
                            rental.status == 'REQUESTED' ||
                                rental.status == 'UNDER_REVIEW'
                            ? () => _reject(workspaceId, rental)
                            : null,
                        primaryAction: _lifecycleAction(workspaceId, rental),
                      );
                    },
                  ),
          );
        }),
      ),
    );
  }

  Future<void> _openDetails(String workspaceId, RentalSummary rental) async {
    final actionable =
        rental.status == 'REQUESTED' || rental.status == 'UNDER_REVIEW';
    final lifecycle = _lifecycleAction(workspaceId, rental);
    await Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (detailContext) => Consumer(
          builder: (context, detailRef, _) {
            final selectedId = detailRef
                .watch(operatorWorkspaceContextProvider)
                .valueOrNull
                ?.selectedId;
            final isCurrentWorkspace = selectedId == workspaceId;
            return RentalDetailsPage(
              rental: rental,
              ownerView: true,
              ownerWorkspaceActive: isCurrentWorkspace,
              onApprove: actionable && isCurrentWorkspace
                  ? () {
                      Navigator.pop(detailContext);
                      _approve(workspaceId, rental);
                    }
                  : null,
              onReject: actionable && isCurrentWorkspace
                  ? () {
                      Navigator.pop(detailContext);
                      _reject(workspaceId, rental);
                    }
                  : null,
              primaryAction: lifecycle == null || !isCurrentWorkspace
                  ? null
                  : (
                      label: lifecycle.label,
                      run: () {
                        Navigator.pop(detailContext);
                        lifecycle.run();
                      },
                    ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _approve(String workspaceId, RentalSummary rental) async {
    final dates =
        '${DateFormat('d MMM').format(rental.startDate)} – ${DateFormat('d MMM y').format(rental.endDate)}';
    final estimatedAmount = rental.estimatedAmountMinor;
    final estimate = NumberFormat.currency(
      name: rental.currency,
      symbol: '${rental.currency} ',
      decimalDigits: 0,
    ).format(estimatedAmount ?? 0);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Accept rental request?'),
        content: Text(
          'Accept ${rental.customer?.displayName ?? 'this customer'} for ${rental.title}\n$dates\n${estimatedAmount == null ? 'Price estimate unavailable' : 'Estimated rental price: $estimate'}\n\nAcceptance reserves these dates and may block overlapping requests. Payment is arranged outside GariLink.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Not yet'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Accept request'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    await _runAction(
      rental,
      () => ref
          .read(rentalRepositoryProvider)
          .approveRentalRequest(workspaceId, rental.id),
      'Rental request accepted.',
    );
  }

  ({String label, Future<void> Function() run})? _lifecycleAction(
    String workspaceId,
    RentalSummary rental,
  ) => switch (rental.status) {
    'APPROVED' => (
      label: 'Mark ready for pickup',
      run: () => _runAction(
        rental,
        () => ref
            .read(rentalRepositoryProvider)
            .markRentalReady(workspaceId, rental.id),
        'Rental marked ready for pickup.',
      ),
    ),
    'READY_FOR_PICKUP' => (
      label: 'Start rental',
      run: () => _runAction(
        rental,
        () => ref
            .read(rentalRepositoryProvider)
            .startRental(workspaceId, rental.id),
        'Rental started.',
      ),
    ),
    'ACTIVE' => (
      label: 'Complete rental',
      run: () => _runAction(
        rental,
        () => ref
            .read(rentalRepositoryProvider)
            .completeRental(workspaceId, rental.id),
        'Rental completed.',
      ),
    ),
    _ => null,
  };

  Future<void> _reject(String workspaceId, RentalSummary rental) async {
    final controller = TextEditingController();
    final reason = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Decline rental request'),
        content: TextField(
          controller: controller,
          autofocus: true,
          maxLength: 300,
          maxLines: 3,
          decoration: const InputDecoration(
            labelText: 'Reason',
            hintText: 'Tell the customer why this request cannot be accepted.',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              final value = controller.text.trim();
              if (value.isNotEmpty) Navigator.pop(dialogContext, value);
            },
            child: const Text('Decline request'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (reason == null || !mounted) return;
    await _runAction(
      rental,
      () => ref
          .read(rentalRepositoryProvider)
          .rejectRentalRequest(workspaceId, rental.id, reason),
      'Rental request declined.',
    );
  }

  Future<void> _runAction(
    RentalSummary rental,
    Future<void> Function() action,
    String successMessage,
  ) async {
    setState(() => _busyRentalId = rental.id);
    try {
      await action();
      ref.invalidate(workspaceRentalsProvider(rental.workspaceId));
      ref.invalidate(myListingsProvider);
      ref.invalidate(workspaceListingsProvider(rental.workspaceId));
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(successMessage)));
      }
    } catch (error) {
      ref.invalidate(workspaceRentalsProvider(rental.workspaceId));
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(ownerRentalActionError(error))));
      }
    } finally {
      if (mounted) setState(() => _busyRentalId = null);
    }
  }
}

class _OwnerRentalCard extends StatelessWidget {
  const _OwnerRentalCard({
    required this.rental,
    required this.busy,
    required this.onOpen,
    this.onApprove,
    this.onReject,
    this.primaryAction,
  });

  final RentalSummary rental;
  final bool busy;
  final VoidCallback onOpen;
  final VoidCallback? onApprove;
  final VoidCallback? onReject;
  final ({String label, Future<void> Function() run})? primaryAction;

  @override
  Widget build(BuildContext context) {
    final customer = rental.customer;
    final presentation = ownerRentalStatusPresentation(rental.status);
    final dates =
        '${DateFormat('d MMM').format(rental.startDate)} – ${DateFormat('d MMM y').format(rental.endDate)}';
    final estimatedAmount = rental.estimatedAmountMinor;
    final estimate = NumberFormat.currency(
      name: rental.currency,
      symbol: '${rental.currency} ',
      decimalDigits: 0,
    ).format(estimatedAmount ?? 0);
    return Material(
      color: GariLinkColors.surface,
      borderRadius: GariLinkRadius.cardBorderRadius,
      child: InkWell(
        onTap: busy ? null : onOpen,
        borderRadius: GariLinkRadius.cardBorderRadius,
        child: Padding(
          padding: const EdgeInsets.all(GariLinkSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  ClipRRect(
                    borderRadius: GariLinkRadius.inputBorderRadius,
                    child: SizedBox(
                      width: 88,
                      height: 80,
                      child: rental.vehicle.imageUrl == null
                          ? const ColoredBox(
                              color: GariLinkColors.neutral100,
                              child: Icon(Icons.directions_car_rounded),
                            )
                          : Image.network(
                              rental.vehicle.imageUrl!,
                              fit: BoxFit.cover,
                              errorBuilder: (_, _, _) => const ColoredBox(
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
                        const SizedBox(height: 4),
                        Semantics(
                          label: 'Rental status ${presentation.label}',
                          child: Text(
                            presentation.label,
                            style: GariLinkTypography.labelMedium.copyWith(
                              color: presentation.color,
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(dates, style: GariLinkTypography.bodySmall),
                        const SizedBox(height: 4),
                        Text(
                          estimatedAmount == null
                              ? 'Estimate unavailable'
                              : 'Estimated $estimate',
                          style: GariLinkTypography.bodyLarge.copyWith(
                            color: estimatedAmount == null
                                ? GariLinkColors.textSecondary
                                : GariLinkColors.accent,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              if (rental.pickupNotes?.isNotEmpty ?? false) ...[
                const SizedBox(height: GariLinkSpacing.md),
                Text(
                  'Pickup note: ${rental.pickupNotes}',
                  style: GariLinkTypography.bodySmall,
                ),
              ],
              if (rental.transportNeed != null) ...[
                const SizedBox(height: GariLinkSpacing.md),
                _metadata(
                  Icons.route_outlined,
                  _needSummary(rental.transportNeed!),
                ),
              ],
              if (rental.pickupLocation != null) ...[
                const SizedBox(height: GariLinkSpacing.sm),
                _metadata(Icons.location_on_outlined, _pickupSummary(rental)),
              ],
              if (customer != null) ...[
                const SizedBox(height: GariLinkSpacing.sm),
                _metadata(Icons.person_outline, customer.displayName),
              ],
              if (onApprove != null || primaryAction != null) ...[
                const Divider(height: GariLinkSpacing.xxl),
                if (busy)
                  const Center(child: CircularProgressIndicator())
                else if (onApprove != null)
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: onReject,
                          child: const Text('Decline'),
                        ),
                      ),
                      const SizedBox(width: GariLinkSpacing.md),
                      Expanded(
                        child: FilledButton(
                          onPressed: onApprove,
                          child: const Text('Accept'),
                        ),
                      ),
                    ],
                  )
                else
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () async {
                        final action = primaryAction;
                        if (action != null) await action.run();
                      },
                      child: Text(primaryAction!.label),
                    ),
                  ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _metadata(IconData icon, String value) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Icon(icon, size: 18, color: GariLinkColors.textMuted),
      const SizedBox(width: GariLinkSpacing.sm),
      Expanded(child: Text(value, style: GariLinkTypography.bodySmall)),
    ],
  );

  String _needSummary(TransportNeed need) {
    final details = <String>[need.purpose.label];
    if (need.passengerCount != null) {
      details.add('${need.passengerCount} passengers');
    }
    if (need.cargo?.cargoType?.isNotEmpty ?? false) {
      details.add(need.cargo!.cargoType!);
    }
    return details.join(' · ');
  }

  String _pickupSummary(RentalSummary rental) {
    final pickup = rental.pickupLocation!;
    final parts = [
      pickup.locality,
      pickup.city,
      pickup.region,
    ].whereType<String>().where((part) => part.isNotEmpty).toList();
    return parts.isEmpty ? 'Pickup location recorded' : parts.join(', ');
  }
}

class _OwnerMessage extends StatelessWidget {
  const _OwnerMessage({
    required this.icon,
    required this.title,
    required this.message,
    this.onRetry,
  });
  final IconData icon;
  final String title;
  final String message;
  final VoidCallback? onRetry;

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
      if (onRetry != null) ...[
        const SizedBox(height: GariLinkSpacing.lg),
        Center(
          child: FilledButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh),
            label: const Text('Try again'),
          ),
        ),
      ],
    ],
  );
}
