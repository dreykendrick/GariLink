import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/formatters/marketplace_formatters.dart';
import '../../../../core/theme/theme.dart';
import '../../../../shared/widgets/app_skeleton.dart';
import '../../../../shared/widgets/vehicle_card.dart';
import '../../data/repositories/marketplace_repository.dart';
import '../../data/repositories/nearby_discovery_repository.dart';
import '../../data/repositories/matched_discovery_repository.dart';
import '../../domain/marketplace_query.dart';
import '../../domain/nearby_discovery.dart';
import '../../domain/vehicle_suitability.dart';
import '../../domain/discovery_selection.dart';
import '../../../location/data/device_location_service.dart';
import '../../../location/domain/models/gari_location.dart';
import '../../../booking/presentation/pages/transport_need_form.dart';
import '../../../trips/domain/models/transport_need.dart';
import '../providers/explore_provider.dart';
import '../widgets/matched_vehicle_card.dart';

const marketplaceSearchDebounce = Duration(milliseconds: 350);

class ExplorePage extends ConsumerStatefulWidget {
  const ExplorePage({super.key, this.initialIntent});

  final DiscoverySearchIntent? initialIntent;

  @override
  ConsumerState<ExplorePage> createState() => _ExplorePageState();
}

class NearbyDiscoveryPanel extends ConsumerStatefulWidget {
  const NearbyDiscoveryPanel({
    super.key,
    this.initialSearchLocation = const SearchLocation(),
    this.initialTransportNeed,
  });
  final SearchLocation initialSearchLocation;
  final TransportNeed? initialTransportNeed;
  @override
  ConsumerState<NearbyDiscoveryPanel> createState() =>
      _NearbyDiscoveryPanelState();
}

class _NearbyDiscoveryPanelState extends ConsumerState<NearbyDiscoveryPanel> {
  SearchLocation _origin = const SearchLocation();
  Future<NearbyDiscoveryResult>? _future;
  Future<MatchedDiscoveryResult>? _matchedFuture;
  TransportNeed? _transportNeed;
  int _radius = 10000;

  @override
  void initState() {
    super.initState();
    _origin = widget.initialSearchLocation;
    _transportNeed = widget.initialTransportNeed;
    _search();
  }

  @override
  void didUpdateWidget(covariant NearbyDiscoveryPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    final locationChanged =
        oldWidget.initialSearchLocation.location !=
        widget.initialSearchLocation.location;
    final needChanged =
        oldWidget.initialTransportNeed?.toJson().toString() !=
        widget.initialTransportNeed?.toJson().toString();
    if (locationChanged || needChanged) {
      _origin = widget.initialSearchLocation;
      _transportNeed = widget.initialTransportNeed;
      _radius = 10000;
      _search();
    }
  }

  void _search() {
    final query = NearbySearchQuery(
      searchLocation: _origin,
      radiusMeters: _radius,
    );
    if (!query.canSearch) {
      return;
    }
    setState(() {
      if (_transportNeed == null) {
        _future = ref.read(nearbyDiscoveryRepositoryProvider).discover(query);
        _matchedFuture = null;
      } else {
        _matchedFuture = ref
            .read(matchedDiscoveryRepositoryProvider)
            .discover(
              MatchedDiscoveryQuery(
                searchLocation: _origin,
                transportNeed: _transportNeed!,
                radiusMeters: _radius,
              ),
            );
        _future = null;
      }
      // A fast failure can arrive before FutureBuilder subscribes next frame.
      // Observe it immediately; the original future still drives the error UI.
      unawaited(
        (_matchedFuture ?? _future)?.then<void>(
          (_) {},
          onError: (Object error, StackTrace stack) {},
        ),
      );
    });
  }

  Future<void> _chooseTransportNeed() async {
    final formKey = GlobalKey<TransportNeedFormState>();
    final selected = await showModalBottomSheet<TransportNeed>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          20,
          20,
          MediaQuery.viewInsetsOf(sheetContext).bottom + 20,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TransportNeedForm(key: formKey, initialNeed: _transportNeed),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () {
                  if (formKey.currentState!.validate() &&
                      formKey.currentState!.need != null) {
                    Navigator.pop(sheetContext, formKey.currentState!.need);
                  }
                },
                child: const Text('Find vehicles that fit'),
              ),
            ],
          ),
        ),
      ),
    );
    if (selected != null && mounted) {
      setState(() => _transportNeed = selected);
      _search();
    }
  }

  Future<void> _useCurrentLocation() async {
    final result = await const DeviceLocationService().currentLocation();
    if (!mounted) {
      return;
    }
    if (result is DeviceLocationSuccess) {
      setState(() => _origin = SearchLocation(location: result.location));
      _search();
    } else if (result is DeviceLocationUnavailable) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(result.message)));
    }
  }

  Future<void> _chooseManually() async {
    final selected = await showModalBottomSheet<GariLocation>(
      context: context,
      useSafeArea: true,
      showDragHandle: true,
      builder: (sheetContext) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Change search area',
              style: Theme.of(sheetContext).textTheme.titleLarge,
            ),
            const SizedBox(height: 4),
            Text(
              'Search uses the selected city centre. Exact pickup is added later.',
              style: GariLinkTypography.bodyMedium,
            ),
            const SizedBox(height: 12),
            ..._searchAreas.map(
              (area) => ListTile(
                minVerticalPadding: 12,
                leading: const Icon(Icons.location_on_outlined),
                title: Text(area.city!),
                onTap: () => Navigator.pop(sheetContext, area),
              ),
            ),
          ],
        ),
      ),
    );
    if (selected != null && mounted) {
      setState(() => _origin = SearchLocation(location: selected));
      _search();
    }
  }

  @override
  Widget build(BuildContext context) {
    final location = _origin.location;
    final label = [
      location?.locality,
      location?.city,
    ].whereType<String>().where((value) => value.isNotEmpty).join(', ');
    return DecoratedBox(
      decoration: BoxDecoration(
        color: GariLinkColors.surface,
        borderRadius: GariLinkRadius.cardBorderRadius,
        border: Border.all(color: GariLinkColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _transportNeed == null
                  ? 'Nearby rental vehicles'
                  : 'Vehicles for your trip',
              style: GariLinkTypography.titleLarge,
            ),
            const SizedBox(height: 4),
            Text(
              _transportNeed == null
                  ? (label.isEmpty
                        ? 'Where do you need a vehicle?'
                        : 'Searching near $label')
                  : '${_needSummary(_transportNeed!)}\n${label.isEmpty ? 'Choose a search area' : 'Searching near $label'}',
              style: GariLinkTypography.bodyMedium,
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              children: [
                OutlinedButton.icon(
                  onPressed: _useCurrentLocation,
                  icon: const Icon(Icons.my_location_outlined),
                  label: const Text('Use my location'),
                ),
                OutlinedButton.icon(
                  onPressed: _chooseManually,
                  icon: const Icon(Icons.edit_location_alt_outlined),
                  label: Text(label.isEmpty ? 'Choose an area' : 'Change area'),
                ),
              ],
            ),
            TextButton.icon(
              onPressed: _chooseTransportNeed,
              icon: const Icon(Icons.tune_outlined),
              label: Text(
                _transportNeed == null
                    ? 'Add transport requirements'
                    : 'Edit what you need',
              ),
            ),
            if (location != null &&
                (location.latitude == null || location.longitude == null))
              const Padding(
                padding: EdgeInsets.only(top: 8),
                child: Text(
                  'Choose a more precise location to see nearby vehicles.',
                ),
              ),
            if (_future != null)
              FutureBuilder<NearbyDiscoveryResult>(
                future: _future,
                builder: (context, snapshot) {
                  if (snapshot.connectionState != ConnectionState.done) {
                    return const Padding(
                      padding: EdgeInsets.only(top: 12),
                      child: LinearProgressIndicator(),
                    );
                  }
                  if (snapshot.hasError) {
                    return Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: TextButton(
                        onPressed: _search,
                        child: const Text(
                          'Nearby vehicles could not be loaded. Try again.',
                        ),
                      ),
                    );
                  }
                  final results = snapshot.data!;
                  if (results.vehicles.isEmpty) {
                    return Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'No vehicles within ${(_radius / 1000).round()} km.',
                          ),
                          if (_radius < 25000)
                            TextButton(
                              onPressed: () {
                                setState(() => _radius = 25000);
                                _search();
                              },
                              child: const Text('Search within 25 km'),
                            ),
                        ],
                      ),
                    );
                  }
                  return Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Column(
                      children: results.vehicles.take(3).map((nearby) {
                        final vehicle =
                            nearby.listing['vehicle'] as Map? ?? const {};
                        return ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: const Icon(Icons.directions_car_outlined),
                          title: Text(
                            '${vehicle['make'] ?? 'Vehicle'} ${vehicle['model'] ?? ''}'
                                .trim(),
                          ),
                          subtitle: Text(
                            '${nearby.publicLocality ?? 'Area not shared'} • ${nearby.distanceLabel}',
                          ),
                          trailing: Text(
                            nearby.requestable ? 'Available' : 'Busy',
                          ),
                        );
                      }).toList(),
                    ),
                  );
                },
              ),
            if (_matchedFuture != null)
              FutureBuilder<MatchedDiscoveryResult>(
                key: ValueKey(_matchedFuture),
                future: _matchedFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState != ConnectionState.done) {
                    return const Padding(
                      padding: EdgeInsets.only(top: 12),
                      child: LinearProgressIndicator(),
                    );
                  }
                  if (snapshot.hasError) {
                    return TextButton(
                      onPressed: _search,
                      child: const Text(
                        'Matching vehicles could not be loaded. Try again.',
                      ),
                    );
                  }
                  final vehicles = snapshot.data!.vehicles;
                  if (vehicles.isEmpty) {
                    return Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            snapshot.data!.hasNearbyCandidates
                                ? 'No nearby vehicles match all your requirements.'
                                : 'No vehicles within ${(_radius / 1000).round()} km.',
                          ),
                          if (_radius < 25000)
                            TextButton(
                              onPressed: () {
                                setState(() => _radius = 25000);
                                _search();
                              },
                              child: const Text('Search within 25 km'),
                            ),
                        ],
                      ),
                    );
                  }
                  return Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${vehicles.length} suitable ${vehicles.length == 1 ? 'vehicle' : 'vehicles'} nearby',
                          style: GariLinkTypography.titleMedium,
                        ),
                        const SizedBox(height: 12),
                        ...vehicles.expand(
                          (matched) => [
                            MatchedVehicleCard(
                              vehicle: matched,
                              need: _transportNeed!,
                              onTap: () => context.push(
                                Uri(
                                  path: '/vehicle-details',
                                  queryParameters: {
                                    'listingId': matched.listing['id']
                                        .toString(),
                                  },
                                ).toString(),
                                extra: DiscoverySelection(
                                  listingId: matched.listing['id'].toString(),
                                  need: _transportNeed!,
                                  searchLocation: _origin,
                                  suitability: matched.suitability,
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}

const _searchAreas = <GariLocation>[
  GariLocation(
    latitude: -6.7924,
    longitude: 39.2083,
    city: 'Dar es Salaam',
    source: LocationSource.placeSelection,
  ),
  GariLocation(
    latitude: -3.3869,
    longitude: 36.6830,
    city: 'Arusha',
    source: LocationSource.placeSelection,
  ),
  GariLocation(
    latitude: -6.1630,
    longitude: 35.7516,
    city: 'Dodoma',
    source: LocationSource.placeSelection,
  ),
  GariLocation(
    latitude: -2.5164,
    longitude: 32.9175,
    city: 'Mwanza',
    source: LocationSource.placeSelection,
  ),
];

String _needSummary(TransportNeed need) {
  final details = <String>[];
  if (need.passengerCount != null) {
    details.add('${need.passengerCount} passengers');
  }
  if (need.cargo?.estimatedWeightKg case final num weight) {
    details.add(
      '${weight == weight.roundToDouble() ? weight.toInt() : weight} kg',
    );
  }
  if (need.cargo?.requiresCoveredBody == true) {
    details.add('Covered cargo');
  }
  return [need.purpose.label, ...details].join(' • ');
}

class _ExplorePageState extends ConsumerState<ExplorePage>
    with AutomaticKeepAliveClientMixin {
  final _search = TextEditingController();
  Timer? _debounce;
  MarketplaceQuery _query = const MarketplaceQuery(type: 'FOR_HIRE');
  final Set<String> _saving = {};
  final Map<String, bool> _savedOverrides = {};

  @override
  void initState() {
    super.initState();
    if (widget.initialIntent != null) {
      _query = const MarketplaceQuery(type: 'FOR_HIRE');
    }
  }

  @override
  bool get wantKeepAlive => true;

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    super.dispose();
  }

  void _onSearch(String value) {
    _debounce?.cancel();
    _debounce = Timer(marketplaceSearchDebounce, () {
      if (mounted) setState(() => _query = _query.copyWith(text: value.trim()));
    });
  }

  Future<void> _toggleSaved(String id, bool currentlySaved) async {
    if (!ref.read(marketplaceAuthenticatedProvider)) {
      context.push('/login');
      return;
    }
    if (_saving.contains(id)) return;
    setState(() {
      _saving.add(id);
      _savedOverrides[id] = !currentlySaved;
    });
    HapticFeedback.selectionClick();
    try {
      final saved = await ref
          .read(marketplaceRepositoryProvider)
          .setSaved(id, !currentlySaved);
      if (mounted) setState(() => _savedOverrides[id] = saved);
      ref.invalidate(savedListingsProvider);
    } catch (_) {
      if (!mounted) return;
      setState(() => _savedOverrides.remove(id));
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Saved vehicles could not be updated.')),
      );
    } finally {
      if (mounted) setState(() => _saving.remove(id));
    }
  }

  Future<void> _openFilters() async {
    final result = await showModalBottomSheet<MarketplaceQuery>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => _FilterSheet(initial: _query),
    );
    if (result != null && mounted) setState(() => _query = result);
  }

  Future<void> _openSort() async {
    final result = await showModalBottomSheet<MarketplaceSort>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const ListTile(
                title: Text(
                  'Sort vehicles',
                  style: TextStyle(fontWeight: FontWeight.w800),
                ),
              ),
              ...MarketplaceSort.values.map(
                (sort) => ListTile(
                  title: Text(sort.label),
                  trailing: sort == _query.sort
                      ? const Icon(Icons.check_rounded)
                      : null,
                  onTap: () => Navigator.pop(context, sort),
                ),
              ),
            ],
          ),
        ),
      ),
    );
    if (result != null && mounted) {
      setState(() => _query = _query.copyWith(sort: result));
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final listings = ref.watch(searchListingsProvider(_query));
    final saved = ref.watch(savedListingsProvider).valueOrNull ?? const [];
    final savedIds = saved.map((item) => item['id']?.toString()).toSet();
    final authenticated = ref.watch(marketplaceAuthenticatedProvider);

    return Scaffold(
      backgroundColor: GariLinkColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => ref.refresh(searchListingsProvider(_query).future),
          child: CustomScrollView(
            key: const PageStorageKey('marketplace-scroll'),
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverAppBar(
                floating: true,
                backgroundColor: GariLinkColors.background,
                surfaceTintColor: Colors.transparent,
                title: const Text('Explore vehicles'),
                actions: [
                  Semantics(
                    button: true,
                    label: 'Sort vehicles, ${_query.sort.label}',
                    child: IconButton(
                      tooltip: 'Sort: ${_query.sort.label}',
                      onPressed: _openSort,
                      icon: const Icon(Icons.swap_vert_rounded),
                    ),
                  ),
                ],
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
                sliver: SliverToBoxAdapter(
                  child: SearchBar(
                    controller: _search,
                    hintText: 'Search make, model or location',
                    leading: const Icon(Icons.search_rounded),
                    onChanged: _onSearch,
                    trailing: [
                      if (_search.text.isNotEmpty)
                        IconButton(
                          tooltip: 'Clear search',
                          onPressed: () {
                            _debounce?.cancel();
                            _search.clear();
                            setState(() => _query = _query.copyWith(text: ''));
                          },
                          icon: const Icon(Icons.close_rounded),
                        ),
                      Badge(
                        isLabelVisible: _query.filterCount > 0,
                        label: Text('${_query.filterCount}'),
                        child: IconButton(
                          tooltip: 'Filter vehicles',
                          onPressed: _openFilters,
                          icon: const Icon(Icons.tune_rounded),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                sliver: SliverToBoxAdapter(
                  child: NearbyDiscoveryPanel(
                    initialSearchLocation:
                        widget.initialIntent?.searchLocation ??
                        const SearchLocation(),
                    initialTransportNeed: widget.initialIntent?.need,
                  ),
                ),
              ),
              if (_query.hasFilters)
                SliverToBoxAdapter(
                  child: _ActiveFilters(
                    query: _query,
                    onChanged: (value) => setState(() => _query = value),
                  ),
                ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
                sliver: SliverToBoxAdapter(
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          listings.valueOrNull == null
                              ? 'Finding vehicles'
                              : '${listings.valueOrNull!.length} vehicles',
                          style: GariLinkTypography.titleMedium,
                        ),
                      ),
                      Text(
                        _query.sort.label,
                        style: GariLinkTypography.bodySmall.copyWith(
                          color: GariLinkColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (listings.isLoading && listings.valueOrNull == null)
                const SliverPadding(
                  padding: EdgeInsets.symmetric(horizontal: 20),
                  sliver: _ListingSkeletons(),
                )
              else if (listings.hasError && listings.valueOrNull == null)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: _MarketplaceState(
                    icon: Icons.cloud_off_outlined,
                    title: 'Vehicles could not be loaded',
                    message: 'Check your connection and try again.',
                    action: 'Try again',
                    onAction: () =>
                        ref.invalidate(searchListingsProvider(_query)),
                  ),
                )
              else if ((listings.valueOrNull ?? const []).isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: _MarketplaceState(
                    icon: Icons.search_off_rounded,
                    title: _query.text.isNotEmpty || _query.hasFilters
                        ? 'No matching vehicles'
                        : 'No vehicles available yet',
                    message: _query.text.isNotEmpty || _query.hasFilters
                        ? 'Try removing a filter or using a broader search.'
                        : 'Published vehicles will appear here.',
                    action: _query.text.isNotEmpty || _query.hasFilters
                        ? 'Clear search and filters'
                        : null,
                    onAction: () {
                      _search.clear();
                      setState(
                        () => _query = const MarketplaceQuery(type: 'FOR_HIRE'),
                      );
                    },
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
                  sliver: SliverLayoutBuilder(
                    builder: (context, constraints) {
                      final columns =
                          constraints.crossAxisExtent >=
                              GariLinkDimensions.tablet
                          ? 2
                          : 1;
                      final items = listings.valueOrNull!;
                      Widget cardAt(BuildContext context, int index) {
                        final item = items[index];
                        final id = item['id']?.toString() ?? '';
                        final isSaved =
                            _savedOverrides[id] ?? savedIds.contains(id);
                        return VehicleCard(
                          listing: item,
                          compact: columns > 1,
                          saved: authenticated ? isSaved : null,
                          saving: _saving.contains(id),
                          onSaved: () => _toggleSaved(id, isSaved),
                          onTap: () => context.push(
                            '/vehicle-details?listingId=${Uri.encodeComponent(id)}',
                          ),
                        );
                      }

                      if (columns == 1) {
                        return SliverList.separated(
                          itemCount: items.length,
                          itemBuilder: cardAt,
                          separatorBuilder: (_, _) =>
                              const SizedBox(height: GariLinkSpacing.md),
                        );
                      }
                      return SliverGrid(
                        delegate: SliverChildBuilderDelegate(
                          cardAt,
                          childCount: items.length,
                        ),
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: columns,
                          mainAxisExtent: 252,
                          crossAxisSpacing: 14,
                          mainAxisSpacing: 14,
                        ),
                      );
                    },
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActiveFilters extends StatelessWidget {
  const _ActiveFilters({required this.query, required this.onChanged});
  final MarketplaceQuery query;
  final ValueChanged<MarketplaceQuery> onChanged;

  @override
  Widget build(BuildContext context) {
    final entries = <(String, String, MarketplaceQuery)>[
      if (query.type != null && query.type != 'FOR_HIRE')
        (
          'type',
          query.type == 'FOR_HIRE' ? 'For hire' : 'For sale',
          query.copyWith(clearType: true),
        ),
      if (query.location.isNotEmpty)
        ('location', query.location, query.copyWith(location: '')),
      if (query.minPrice != null || query.maxPrice != null)
        (
          'price',
          '${query.minPrice == null ? 'Any' : formatMarketplacePrice(query.minPrice)} – ${query.maxPrice == null ? 'Any' : formatMarketplacePrice(query.maxPrice)}',
          query.copyWith(clearPrice: true),
        ),
      if (query.transmission != null)
        (
          'transmission',
          humanizeVehicleValue(query.transmission),
          query.copyWith(clearTransmission: true),
        ),
      if (query.fuelType != null)
        (
          'fuel',
          humanizeVehicleValue(query.fuelType),
          query.copyWith(clearFuelType: true),
        ),
    ];
    return SizedBox(
      height: 42,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        children: [
          ...entries.map(
            (entry) => Padding(
              padding: const EdgeInsets.only(right: 8),
              child: InputChip(
                label: Text(entry.$2),
                onDeleted: () => onChanged(entry.$3),
              ),
            ),
          ),
          TextButton(
            onPressed: () =>
                onChanged(query.clearFilters().copyWith(type: 'FOR_HIRE')),
            child: const Text('Clear all'),
          ),
        ],
      ),
    );
  }
}

class _FilterSheet extends StatefulWidget {
  const _FilterSheet({required this.initial});
  final MarketplaceQuery initial;
  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  late String location = widget.initial.location;
  late String? transmission = widget.initial.transmission;
  late String? fuel = widget.initial.fuelType;
  late final minPrice = TextEditingController(
    text: widget.initial.minPrice?.round().toString() ?? '',
  );
  late final maxPrice = TextEditingController(
    text: widget.initial.maxPrice?.round().toString() ?? '',
  );

  @override
  void dispose() {
    minPrice.dispose();
    maxPrice.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.fromLTRB(
      20,
      12,
      20,
      MediaQuery.viewInsetsOf(context).bottom + 24,
    ),
    child: SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Filter vehicles',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              TextButton(
                onPressed: () => Navigator.pop(
                  context,
                  widget.initial.clearFilters().copyWith(type: 'FOR_HIRE'),
                ),
                child: const Text('Reset'),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            'Showing rental vehicles',
            style: GariLinkTypography.bodyMedium.copyWith(
              color: GariLinkColors.textSecondary,
            ),
          ),
          const SizedBox(height: 18),
          TextFormField(
            initialValue: location,
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(
              labelText: 'Location',
              hintText: 'For example, Dar es Salaam',
              prefixIcon: Icon(Icons.location_on_outlined),
            ),
            onChanged: (value) => location = value.trim(),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: minPrice,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Minimum TZS'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: maxPrice,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Maximum TZS'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          DropdownButtonFormField<String>(
            initialValue: transmission,
            decoration: const InputDecoration(labelText: 'Transmission'),
            items: const [
              DropdownMenuItem(value: 'AUTOMATIC', child: Text('Automatic')),
              DropdownMenuItem(value: 'MANUAL', child: Text('Manual')),
            ],
            onChanged: (value) => setState(() => transmission = value),
          ),
          const SizedBox(height: 14),
          DropdownButtonFormField<String>(
            initialValue: fuel,
            decoration: const InputDecoration(labelText: 'Fuel'),
            items: const [
              DropdownMenuItem(value: 'PETROL', child: Text('Petrol')),
              DropdownMenuItem(value: 'DIESEL', child: Text('Diesel')),
              DropdownMenuItem(value: 'ELECTRIC', child: Text('Electric')),
              DropdownMenuItem(value: 'HYBRID', child: Text('Hybrid')),
            ],
            onChanged: (value) => setState(() => fuel = value),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: () {
              final minimum = double.tryParse(minPrice.text.trim());
              final maximum = double.tryParse(maxPrice.text.trim());
              if (minimum != null && maximum != null && minimum > maximum) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Minimum price must be below maximum price.'),
                  ),
                );
                return;
              }
              Navigator.pop(
                context,
                MarketplaceQuery(
                  text: widget.initial.text,
                  type: 'FOR_HIRE',
                  location: location,
                  minPrice: minimum,
                  maxPrice: maximum,
                  transmission: transmission,
                  fuelType: fuel,
                  sort: widget.initial.sort,
                ),
              );
            },
            child: const Text('Show vehicles'),
          ),
        ],
      ),
    ),
  );
}

class _ListingSkeletons extends StatelessWidget {
  const _ListingSkeletons();
  @override
  Widget build(BuildContext context) => SliverList.separated(
    itemCount: 5,
    separatorBuilder: (_, _) => const SizedBox(height: 14),
    itemBuilder: (_, _) =>
        const AppSkeleton(width: double.infinity, height: 132),
  );
}

class _MarketplaceState extends StatelessWidget {
  const _MarketplaceState({
    required this.icon,
    required this.title,
    required this.message,
    this.action,
    required this.onAction,
  });
  final IconData icon;
  final String title;
  final String message;
  final String? action;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 54, color: GariLinkColors.textMuted),
          const SizedBox(height: 14),
          Text(
            title,
            textAlign: TextAlign.center,
            style: GariLinkTypography.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: GariLinkTypography.bodyMedium,
          ),
          if (action != null) ...[
            const SizedBox(height: 18),
            OutlinedButton(onPressed: onAction, child: Text(action!)),
          ],
        ],
      ),
    ),
  );
}
