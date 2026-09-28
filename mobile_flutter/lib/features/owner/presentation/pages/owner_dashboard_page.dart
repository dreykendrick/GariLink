import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/errors/app_exception.dart';
import '../../../../core/theme/theme.dart';
import '../../../trips/domain/models/rental_summary.dart';
import '../../../trips/presentation/providers/trips_provider.dart';
import '../../domain/operator_workspace.dart';
import '../providers/operator_workspace_provider.dart';
import '../widgets/operator_workspace_selector.dart';

class OwnerDashboardPage extends ConsumerWidget {
  const OwnerDashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final operator = ref.watch(operatorWorkspaceContextProvider);
    return Scaffold(
      backgroundColor: GariLinkColors.background,
      body: SafeArea(
        child: operator.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => _Message(
            icon: Icons.cloud_off_outlined,
            title: 'Owner Home could not be loaded',
            message: userFacingError(error),
            onAction: () => refreshOperatorWorkspace(ref),
          ),
          data: (state) {
            final workspace = state.selected;
            if (workspace == null) {
              return const _Message(
                icon: Icons.business_outlined,
                title: 'Set up your owner workspace',
                message:
                    'An authorized workspace is required before you can add vehicles and receive rental requests.',
              );
            }
            final listings = ref.watch(workspaceListingsProvider(workspace.id));
            final rentals = ref.watch(workspaceRentalsProvider(workspace.id));
            return RefreshIndicator(
              onRefresh: () async {
                refreshOperatorWorkspace(ref, workspaceId: workspace.id);
                await Future.wait([
                  ref.read(workspaceListingsProvider(workspace.id).future),
                  ref.read(workspaceRentalsProvider(workspace.id).future),
                ]);
              },
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.only(bottom: GariLinkSpacing.xxl),
                children: [
                  _Header(workspace: workspace),
                  if (state.available.length > 1)
                    const Padding(
                      padding: EdgeInsets.fromLTRB(16, 16, 16, 0),
                      child: OperatorWorkspaceSelector(),
                    ),
                  Padding(
                    padding: const EdgeInsets.all(GariLinkSpacing.lg),
                    child: _OperationalBody(
                      workspace: workspace,
                      listings: listings,
                      rentals: rentals,
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.workspace});
  final OperatorWorkspace workspace;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.fromLTRB(20, 22, 20, 26),
    decoration: const BoxDecoration(
      gradient: LinearGradient(
        colors: [GariLinkColors.primary, Color(0xFF163D6B)],
      ),
      borderRadius: BorderRadius.vertical(
        bottom: Radius.circular(GariLinkRadius.card),
      ),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          workspace.businessMode.label,
          style: GariLinkTypography.bodyMedium.copyWith(
            color: Colors.white.withValues(alpha: .75),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          workspace.name,
          style: GariLinkTypography.titleLarge.copyWith(color: Colors.white),
        ),
      ],
    ),
  );
}

class _OperationalBody extends StatelessWidget {
  const _OperationalBody({
    required this.workspace,
    required this.listings,
    required this.rentals,
  });
  final OperatorWorkspace workspace;
  final AsyncValue<List<Map<String, dynamic>>> listings;
  final AsyncValue<List<RentalSummary>> rentals;

  @override
  Widget build(BuildContext context) {
    if (listings.isLoading || rentals.isLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(48),
          child: CircularProgressIndicator(),
        ),
      );
    }
    if (listings.hasError || rentals.hasError) {
      return _Message(
        icon: Icons.cloud_off_outlined,
        title: 'Operational activity is unavailable',
        message: userFacingError(listings.error ?? rentals.error!),
      );
    }
    final vehicles = listings.valueOrNull ?? const [];
    final rentalItems = rentals.valueOrNull ?? const [];
    if (vehicles.isEmpty) {
      return _Message(
        icon: Icons.directions_car_outlined,
        title: 'Add your first vehicle',
        message:
            'Create a private vehicle draft, then add photos, location, pricing, availability, and publish when it is ready.',
        actionLabel: 'Add vehicle',
        onAction: () => context.go('/my-vehicles'),
      );
    }
    int countAvailability(String value) => vehicles.where((item) {
      final vehicle = item['vehicle'] as Map?;
      return (item['operationalAvailability'] ??
              vehicle?['operationalAvailability']) ==
          value;
    }).length;
    final published = vehicles
        .where((item) => item['status'] == 'PUBLISHED')
        .length;
    final needsSetup = vehicles.where((item) {
      final vehicle = item['vehicle'] as Map?;
      final media = item['mediaItems'] as List? ?? const [];
      return (item['vehicleCategory'] ?? vehicle?['vehicleCategory']) == null ||
          media.isEmpty;
    }).length;
    final pending = rentalItems
        .where(
          (rental) =>
              rental.status == 'REQUESTED' || rental.status == 'UNDER_REVIEW',
        )
        .length;
    final active = rentalItems
        .where(
          (rental) => const {
            'APPROVED',
            'READY_FOR_PICKUP',
            'ACTIVE',
          }.contains(rental.status),
        )
        .length;
    final metrics = <(String, int)>[
      ('Vehicles', vehicles.length),
      ('Published', published),
      ('Available', countAvailability('AVAILABLE')),
      if (workspace.businessMode == WorkspaceBusinessMode.fleet) ...[
        ('Busy', countAvailability('BUSY')),
        ('Unavailable', countAvailability('UNAVAILABLE')),
        ('Maintenance', countAvailability('MAINTENANCE')),
      ],
      ('New requests', pending),
      ('Open rentals', active),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (needsSetup > 0) ...[
          _Attention(
            message:
                '$needsSetup ${needsSetup == 1 ? 'vehicle needs' : 'vehicles need'} setup before publication.',
            onTap: () => context.go('/my-vehicles'),
          ),
          const SizedBox(height: GariLinkSpacing.lg),
        ],
        Text('Operations', style: GariLinkTypography.titleMedium),
        const SizedBox(height: GariLinkSpacing.md),
        LayoutBuilder(
          builder: (context, constraints) {
            final columns = constraints.maxWidth >= 560 ? 3 : 2;
            return GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: columns,
              crossAxisSpacing: GariLinkSpacing.sm,
              mainAxisSpacing: GariLinkSpacing.sm,
              childAspectRatio: 1.55,
              children: metrics
                  .map((metric) => _Metric(label: metric.$1, value: metric.$2))
                  .toList(),
            );
          },
        ),
        const SizedBox(height: GariLinkSpacing.xxl),
        Wrap(
          spacing: GariLinkSpacing.md,
          runSpacing: GariLinkSpacing.md,
          children: [
            FilledButton.icon(
              onPressed: () => context.go('/my-vehicles'),
              icon: const Icon(Icons.directions_car_outlined),
              label: Text(
                workspace.businessMode == WorkspaceBusinessMode.fleet
                    ? 'Manage fleet'
                    : 'Manage vehicles',
              ),
            ),
            OutlinedButton.icon(
              onPressed: () => context.go('/incoming-requests'),
              icon: const Icon(Icons.event_note_outlined),
              label: const Text('Rental requests'),
            ),
          ],
        ),
      ],
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.label, required this.value});
  final String label;
  final int value;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(GariLinkSpacing.md),
    decoration: BoxDecoration(
      color: GariLinkColors.surface,
      borderRadius: GariLinkRadius.cardBorderRadius,
      border: Border.all(color: GariLinkColors.borderLight),
    ),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('$value', style: GariLinkTypography.titleLarge),
        Text(label, style: GariLinkTypography.bodySmall),
      ],
    ),
  );
}

class _Attention extends StatelessWidget {
  const _Attention({required this.message, required this.onTap});
  final String message;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Material(
    color: GariLinkColors.warning.withValues(alpha: .10),
    borderRadius: GariLinkRadius.cardBorderRadius,
    child: ListTile(
      leading: const Icon(Icons.build_circle_outlined),
      title: Text(message),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    ),
  );
}

class _Message extends StatelessWidget {
  const _Message({
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  });
  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;
  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(GariLinkSpacing.xxl),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 48, color: GariLinkColors.textMuted),
          const SizedBox(height: GariLinkSpacing.md),
          Text(
            title,
            textAlign: TextAlign.center,
            style: GariLinkTypography.titleMedium,
          ),
          const SizedBox(height: GariLinkSpacing.sm),
          Text(message, textAlign: TextAlign.center),
          if (onAction != null) ...[
            const SizedBox(height: GariLinkSpacing.md),
            OutlinedButton(
              onPressed: onAction,
              child: Text(actionLabel ?? 'Try again'),
            ),
          ],
        ],
      ),
    ),
  );
}
