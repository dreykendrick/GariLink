import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/theme.dart';
import '../../../../core/errors/app_exception.dart';
import '../../../explore/data/repositories/marketplace_repository.dart';
import '../../../explore/presentation/providers/explore_provider.dart';
import '../../data/owner_draft_repository.dart';
import '../providers/operator_workspace_provider.dart';
import '../widgets/operator_workspace_selector.dart';
import 'create_listing_page.dart';
import 'vehicle_media_page.dart';
import '../../../../shared/widgets/vehicle_image.dart';
import '../../../vehicle/domain/models/vehicle_v2.dart';
import '../../../vehicle/domain/models/rental_pricing.dart';

class MyVehiclesPage extends ConsumerStatefulWidget {
  const MyVehiclesPage({super.key});

  @override
  ConsumerState<MyVehiclesPage> createState() => _MyVehiclesPageState();
}

class _MyVehiclesPageState extends ConsumerState<MyVehiclesPage> {
  final _busyListingIds = <String>{};

  @override
  Widget build(BuildContext context) {
    final workspaceContext = ref.watch(operatorWorkspaceContextProvider);
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        backgroundColor: GariLinkColors.background,
        floatingActionButton: supabaseOwnerToolsEnabled
            ? FloatingActionButton.extended(
                onPressed: _addVehicle,
                icon: const Icon(Icons.add),
                label: const Text('Add vehicle'),
              )
            : null,
        appBar: AppBar(
          backgroundColor: GariLinkColors.surface,
          elevation: 0,
          title: Text(
            workspaceContext.valueOrNull?.selected?.businessMode.name == 'fleet'
                ? 'My fleet'
                : 'My vehicles',
            style: GariLinkTypography.titleLarge,
          ),
          actions: [
            IconButton(
              tooltip: 'Refresh listings',
              onPressed: () => refreshOperatorWorkspace(
                ref,
                workspaceId: workspaceContext.valueOrNull?.selectedId,
              ),
              icon: const Icon(Icons.refresh_rounded),
            ),
          ],
          bottom: const TabBar(
            isScrollable: true,
            tabs: [
              Tab(text: 'All'),
              Tab(text: 'Published'),
              Tab(text: 'Paused'),
              Tab(text: 'Drafts'),
            ],
          ),
        ),
        body: workspaceContext.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => _ListingMessage(
            icon: Icons.cloud_off_outlined,
            title: 'Vehicles could not be loaded',
            message: userFacingError(error),
            onRetry: () => refreshOperatorWorkspace(ref),
          ),
          data: (workspaceState) {
            final workspace = workspaceState.selected;
            if (workspace == null) {
              return const _ListingMessage(
                icon: Icons.business_outlined,
                title: 'Set up an owner workspace',
                message:
                    'Create an owner workspace before adding your first vehicle.',
              );
            }
            final listings = ref.watch(workspaceListingsProvider(workspace.id));
            return Column(
              children: [
                const Padding(
                  padding: EdgeInsets.fromLTRB(16, 12, 16, 4),
                  child: OperatorWorkspaceSelector(),
                ),
                Expanded(
                  child: listings.when(
                    loading: () =>
                        const Center(child: CircularProgressIndicator()),
                    error: (error, _) => _ListingMessage(
                      icon: Icons.cloud_off_outlined,
                      title: 'Vehicles could not be loaded',
                      message: userFacingError(error),
                      onRetry: () => ref.invalidate(
                        workspaceListingsProvider(workspace.id),
                      ),
                    ),
                    data: (visible) => TabBarView(
                      children: [
                        _listingList(visible),
                        _listingList(_withStatus(visible, 'PUBLISHED')),
                        _listingList(_withStatus(visible, 'PAUSED')),
                        _listingList(_withStatus(visible, 'DRAFT')),
                      ],
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  List<Map<String, dynamic>> _withStatus(
    List<Map<String, dynamic>> items,
    String status,
  ) => items.where((item) => item['status'] == status).toList();

  Widget _listingList(List<Map<String, dynamic>> items) {
    if (items.isEmpty) {
      return const _ListingMessage(
        icon: Icons.directions_car_outlined,
        title: 'No vehicles here',
        message:
            'Add a vehicle now, then configure photos, pricing, availability, and publication when ready.',
      );
    }
    return RefreshIndicator(
      onRefresh: () => ref.refresh(myListingsProvider.future),
      child: ListView.separated(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(
          GariLinkSpacing.lg,
          GariLinkSpacing.lg,
          GariLinkSpacing.lg,
          100,
        ),
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(height: GariLinkSpacing.md),
        itemBuilder: (_, index) {
          final listing = items[index];
          return _OwnerListingCard(
            listing: listing,
            busy: _busyListingIds.contains(listing['id']),
            onAction: (action) => _changeStatus(listing, action),
            onAvailability: (availability) =>
                _changeAvailability(listing, availability),
            onPhotos: () => _managePhotos(listing),
            onEdit: () => _editListing(listing),
          );
        },
      ),
    );
  }

  Future<void> _changeStatus(
    Map<String, dynamic> listing,
    String action,
  ) async {
    final id = listing['id'].toString();
    if (_busyListingIds.contains(id)) return;
    setState(() => _busyListingIds.add(id));
    final repository = ref.read(marketplaceRepositoryProvider);
    try {
      if (action == 'publish') {
        final photos = listing['mediaItems'] as List<dynamic>? ?? const [];
        final proceed =
            await showDialog<bool>(
              context: context,
              builder: (context) => AlertDialog(
                title: const Text('Publish this listing?'),
                content: Text(
                  photos.isEmpty
                      ? 'Add at least one ready photo before publishing. Your draft will remain private.'
                      : 'Customers will immediately see ${listing['title']} in the marketplace. You can pause it later.',
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context, false),
                    child: const Text('Cancel'),
                  ),
                  if (photos.isNotEmpty)
                    FilledButton(
                      onPressed: () => Navigator.pop(context, true),
                      child: const Text('Publish'),
                    ),
                ],
              ),
            ) ??
            false;
        if (!proceed) return;
      }
      if (action == 'archive') {
        if (!mounted) return;
        final proceed =
            await showDialog<bool>(
              context: context,
              builder: (context) => AlertDialog(
                title: const Text('Archive this listing?'),
                content: const Text(
                  'It will be removed from the marketplace and kept for your records. Archived listings cannot be restored.',
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context, false),
                    child: const Text('Cancel'),
                  ),
                  FilledButton(
                    onPressed: () => Navigator.pop(context, true),
                    child: const Text('Archive'),
                  ),
                ],
              ),
            ) ??
            false;
        if (!proceed) return;
      }
      switch (action) {
        case 'publish':
          final vehicleId = listing['vehicleId']?.toString() ?? '';
          if (vehicleId.isNotEmpty &&
              (listing['vehicleCategory'] ??
                      (listing['vehicle'] as Map?)?['vehicleCategory']) !=
                  null) {
            await ref
                .read(ownerDraftRepositoryProvider)
                .setV2Publication(id == '' ? '' : vehicleId, 'publish');
          } else {
            await repository.publishListing(id);
          }
          break;
        case 'pause':
          await repository.pauseListing(id);
          break;
        case 'archive':
          await repository.archiveListing(id);
          break;
      }
      ref.invalidate(myListingsProvider);
      ref.invalidate(searchListingsProvider);
      if (mounted) {
        final message = switch (action) {
          'publish' => 'Vehicle published for rental.',
          'pause' => 'Vehicle publication paused.',
          _ => 'Vehicle archived.',
        };
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(message)));
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(userFacingError(error))));
      }
    } finally {
      if (mounted) setState(() => _busyListingIds.remove(id));
    }
  }

  Future<void> _changeAvailability(
    Map<String, dynamic> listing,
    VehicleAvailability availability,
  ) async {
    final vehicleId = listing['vehicleId']?.toString() ?? '';
    if (vehicleId.isEmpty || _busyListingIds.contains(vehicleId)) return;
    setState(() => _busyListingIds.add(vehicleId));
    try {
      await ref.read(ownerDraftRepositoryProvider).updateV2Vehicle(vehicleId, {
        'operationalAvailability': availability.wireValue,
      });
      ref.invalidate(myListingsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${availability.wireValue.toLowerCase().replaceAll('_', ' ')} set for this vehicle.',
            ),
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'We could not update availability. Please try again.',
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _busyListingIds.remove(vehicleId));
    }
  }

  Future<void> _editListing(Map<String, dynamic> listing) async {
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => CreateListingPage(initialListing: listing),
      ),
    );
    if (saved == true) {
      ref.invalidate(myListingsProvider);
      ref.invalidate(searchListingsProvider);
    }
  }

  Future<void> _managePhotos(Map<String, dynamic> listing) async {
    final vehicleId = listing['vehicleId']?.toString() ?? '';
    if (vehicleId.isEmpty) return;
    await Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => VehicleMediaPage(
          vehicleId: vehicleId,
          initialMedia: (listing['mediaItems'] as List<dynamic>? ?? const [])
              .map((item) => Map<String, dynamic>.from(item as Map))
              .toList(),
        ),
      ),
    );
    ref.invalidate(myListingsProvider);
    ref.invalidate(searchListingsProvider);
  }

  Future<void> _addVehicle() async {
    final saved = await Navigator.of(
      context,
    ).push<bool>(MaterialPageRoute(builder: (_) => const CreateListingPage()));
    if (mounted && saved == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Private draft saved. Find it under Drafts.'),
        ),
      );
    }
  }
}

class _OwnerListingCard extends StatelessWidget {
  const _OwnerListingCard({
    required this.listing,
    required this.busy,
    required this.onAction,
    required this.onAvailability,
    required this.onPhotos,
    required this.onEdit,
  });
  final Map<String, dynamic> listing;
  final bool busy;
  final ValueChanged<String> onAction;
  final ValueChanged<VehicleAvailability> onAvailability;
  final VoidCallback onPhotos;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    final status = listing['status']?.toString() ?? 'DRAFT';
    final currency = listing['currency']?.toString() ?? 'TZS';
    final rawPrice =
        listing['rentalConfig']?['dailyRate'] ?? listing['price'] ?? 0;
    final price = rawPrice is num
        ? rawPrice
        : num.tryParse(rawPrice.toString()) ?? 0;
    final money = NumberFormat.currency(
      name: currency,
      symbol: '$currency ',
      decimalDigits: 0,
    ).format(price);
    final image = listing['primaryImageUrl']?.toString();
    final vehicle = listing['vehicle'] as Map?;
    final category = VehicleCategory.parse(
      listing['vehicleCategory'] ?? vehicle?['vehicleCategory'],
    );
    final availability = VehicleAvailability.parse(
      listing['operationalAvailability'] ?? vehicle?['operationalAvailability'],
    );
    final requestable =
        listing['eligibility'] is Map &&
        listing['eligibility']['requestable'] == true;
    final pricing = RentalPricingPolicy.fromJson(
      listing['rentalPricing'] ?? vehicle?['rentalPricing'],
    );
    final media = listing['mediaItems'] as List<dynamic>? ?? const [];
    final ready = category != null && media.isNotEmpty;
    final statusColor = status == 'PUBLISHED'
        ? GariLinkColors.success
        : status == 'PAUSED'
        ? GariLinkColors.warning
        : GariLinkColors.textMuted;
    return Container(
      padding: const EdgeInsets.all(GariLinkSpacing.md),
      decoration: BoxDecoration(
        color: GariLinkColors.surface,
        borderRadius: GariLinkRadius.cardBorderRadius,
        border: Border.all(color: GariLinkColors.borderLight),
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: GariLinkRadius.inputBorderRadius,
                child: SizedBox(
                  width: 100,
                  height: 90,
                  child: VehicleImage(url: image),
                ),
              ),
              const SizedBox(width: GariLinkSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            listing['title']?.toString() ?? 'Vehicle listing',
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: GariLinkTypography.bodyLarge.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: statusColor.withValues(alpha: 0.1),
                            borderRadius: GariLinkRadius.badgeBorderRadius,
                          ),
                          child: Text(
                            _statusLabel(status),
                            style: GariLinkTypography.labelSmall.copyWith(
                              color: statusColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: GariLinkSpacing.sm),
                    Text(
                      listing['type'] == 'FOR_HIRE' ? '$money / day' : money,
                      style: GariLinkTypography.labelMedium.copyWith(
                        color: GariLinkColors.accent,
                      ),
                    ),
                    if (category != null || availability != null) ...[
                      const SizedBox(height: GariLinkSpacing.xs),
                      Text(
                        [
                          if (category != null) category.label,
                          if (availability != null)
                            _availabilityLabel(availability),
                        ].join(' • '),
                        style: GariLinkTypography.bodySmall,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${ready ? 'Setup ready' : 'Setup incomplete'} • ${pricing.configured ? 'Pricing configured' : 'Pricing not configured'}',
                        style: GariLinkTypography.labelSmall.copyWith(
                          color: ready
                              ? GariLinkColors.textSecondary
                              : GariLinkColors.warning,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        requestable
                            ? 'Available for requests'
                            : status == 'PUBLISHED'
                            ? 'Not requestable'
                            : 'Not discoverable — publication is paused',
                        style: GariLinkTypography.labelSmall.copyWith(
                          color: requestable
                              ? GariLinkColors.success
                              : GariLinkColors.textMuted,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const Divider(height: GariLinkSpacing.xxl),
          Wrap(
            alignment: WrapAlignment.end,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: GariLinkSpacing.xs,
            children: [
              TextButton.icon(
                onPressed: busy ? null : onPhotos,
                icon: const Icon(Icons.photo_library_outlined),
                label: const Text('Photos'),
              ),
              if (availability != null && category != null)
                PopupMenuButton<VehicleAvailability>(
                  tooltip: 'Change availability',
                  onSelected: busy ? null : onAvailability,
                  itemBuilder: (_) => VehicleAvailability.values
                      .map(
                        (value) => PopupMenuItem(
                          value: value,
                          child: Text(_availabilityLabel(value)),
                        ),
                      )
                      .toList(),
                  child: const Padding(
                    padding: EdgeInsets.all(8),
                    child: Icon(Icons.event_available_outlined),
                  ),
                ),
              IconButton(
                onPressed: busy ? null : onEdit,
                tooltip: 'Edit listing',
                icon: const Icon(Icons.edit_outlined),
              ),
              if (busy)
                const SizedBox.square(
                  dimension: 22,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              else
                PopupMenuButton<String>(
                  tooltip: 'Listing actions',
                  onSelected: onAction,
                  itemBuilder: (_) => [
                    if (status == 'DRAFT' ||
                        status == 'PAUSED' ||
                        status == 'EXPIRED')
                      const PopupMenuItem(
                        value: 'publish',
                        child: Text('Publish'),
                      ),
                    if (status == 'PUBLISHED')
                      const PopupMenuItem(value: 'pause', child: Text('Pause')),
                    if (status != 'ARCHIVED')
                      const PopupMenuItem(
                        value: 'archive',
                        child: Text('Archive'),
                      ),
                  ],
                ),
            ],
          ),
        ],
      ),
    );
  }

  String _statusLabel(String status) => switch (status) {
    'PUBLISHED' => 'Live',
    'PAUSED' => 'Paused',
    'EXPIRED' => 'Expired',
    'SOLD' => 'Sold',
    'ARCHIVED' => 'Archived',
    _ => 'Draft',
  };

  String _availabilityLabel(VehicleAvailability availability) =>
      switch (availability) {
        VehicleAvailability.available => 'Available',
        VehicleAvailability.busy => 'Busy',
        VehicleAvailability.unavailable => 'Unavailable',
        VehicleAvailability.maintenance => 'Maintenance',
      };
}

class _ListingMessage extends StatelessWidget {
  const _ListingMessage({
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
        const SizedBox(height: GariLinkSpacing.md),
        Center(
          child: OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh),
            label: const Text('Try again'),
          ),
        ),
      ],
    ],
  );
}
