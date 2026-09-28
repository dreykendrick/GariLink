import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/theme.dart';
import '../../../authentication/presentation/providers/auth_provider.dart';
import '../../../booking/presentation/pages/transport_need_form.dart';
import '../../../explore/domain/discovery_selection.dart';
import '../../../location/data/device_location_service.dart';
import '../../../location/domain/models/gari_location.dart';
import '../../../trips/domain/models/transport_need.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key, this.currentLocation});

  final Future<DeviceLocationResult> Function()? currentLocation;
  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  final _needKey = GlobalKey<TransportNeedFormState>();
  SearchLocation _searchLocation = const SearchLocation();
  bool _locating = false;

  Future<void> _useCurrentLocation() async {
    setState(() => _locating = true);
    final result =
        await (widget.currentLocation?.call() ??
            const DeviceLocationService().currentLocation());
    if (!mounted) return;
    setState(() => _locating = false);
    if (result is DeviceLocationSuccess) {
      setState(
        () => _searchLocation = SearchLocation(location: result.location),
      );
    } else if (result is DeviceLocationUnavailable) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(result.message)));
    }
  }

  Future<void> _chooseArea() async {
    final selected = await showModalBottomSheet<GariLocation>(
      context: context,
      useSafeArea: true,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => const _AreaPicker(),
    );
    if (selected != null && mounted) {
      setState(() => _searchLocation = SearchLocation(location: selected));
    }
  }

  void _findVehicles() {
    final state = _needKey.currentState;
    if (state == null || !state.validate() || state.need == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Choose what you need transport for.')),
      );
      return;
    }
    if (_searchLocation.location?.latitude == null ||
        _searchLocation.location?.longitude == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Choose where you need the vehicle.')),
      );
      return;
    }
    _openExplore(state.need!);
  }

  void _openExplore(TransportNeed need) => context.go(
    '/explore',
    extra: DiscoverySearchIntent(need: need, searchLocation: _searchLocation),
  );

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(authStateProvider).user?.profile;
    final name = profile?.firstName?.trim().isNotEmpty == true
        ? profile!.firstName!.trim()
        : profile?.fullName.trim().isNotEmpty == true
        ? profile!.fullName.trim()
        : 'GariLink member';
    final bottomClearance =
        MediaQuery.paddingOf(context).bottom +
        GariLinkDimensions.bottomNavigationHeight +
        28 +
        GariLinkSpacing.md;
    return Scaffold(
      backgroundColor: GariLinkColors.background,
      body: SafeArea(
        child: CustomScrollView(
          key: const Key('renter-home-scroll'),
          slivers: [
            SliverToBoxAdapter(
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 680),
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(
                      GariLinkSpacing.lg,
                      GariLinkSpacing.lg,
                      GariLinkSpacing.lg,
                      bottomClearance,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _Header(name: name),
                        const SizedBox(height: 20),
                        const _VehicleHero(),
                        const SizedBox(height: 24),
                        _Surface(
                          tint: const Color(0xFFF4F7FB),
                          child: TransportNeedForm(
                            key: _needKey,
                            variant: TransportNeedFormVariant.home,
                          ),
                        ),
                        const SizedBox(height: 16),
                        _Surface(
                          tint: const Color(0xFFF2F7FF),
                          child: _locationContent,
                        ),
                        const SizedBox(height: 24),
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                'Popular for you',
                                style: GariLinkTypography.titleLarge,
                              ),
                            ),
                            TextButton(
                              key: const Key('popular-see-all'),
                              onPressed: () => context.go('/explore'),
                              child: const Text('See all'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          height:
                              176 +
                              (MediaQuery.textScalerOf(context).scale(100) -
                                          100)
                                      .clamp(0, 100) *
                                  2.6,
                          child: ListView.separated(
                            key: const Key('popular-category-list'),
                            scrollDirection: Axis.horizontal,
                            itemCount: _popularCategories.length,
                            separatorBuilder: (_, _) =>
                                const SizedBox(width: 12),
                            itemBuilder: (_, index) => _PopularCard(
                              item: _popularCategories[index],
                              onTap: () =>
                                  _openExplore(_popularCategories[index].need),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget get _locationContent => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Wrap(
        alignment: WrapAlignment.spaceBetween,
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing: 8,
        runSpacing: 4,
        children: [
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 340),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Where do you need it?',
                  style: GariLinkTypography.titleLarge,
                ),
                const SizedBox(height: 4),
                Text(
                  'Choose an area or use your current location.',
                  style: GariLinkTypography.bodyMedium,
                ),
              ],
            ),
          ),
          TextButton.icon(
            key: const Key('use-current-location'),
            onPressed: _locating ? null : _useCurrentLocation,
            icon: _locating
                ? const SizedBox.square(
                    dimension: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.my_location_rounded, size: 18),
            label: const Text('Use my location'),
          ),
        ],
      ),
      const SizedBox(height: 16),
      Semantics(
        button: true,
        label: 'Choose area. Current selection: $_locationLabel',
        child: InkWell(
          key: const Key('manual-location-field'),
          borderRadius: BorderRadius.circular(GariLinkRadius.input),
          onTap: _chooseArea,
          child: Container(
            constraints: const BoxConstraints(minHeight: 56),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: GariLinkColors.neutral50,
              borderRadius: BorderRadius.circular(GariLinkRadius.input),
              border: Border.all(color: GariLinkColors.border),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.location_on_outlined,
                  color: GariLinkColors.accent,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _locationLabel,
                    style: GariLinkTypography.bodyMedium.copyWith(
                      color: _searchLocation.location == null
                          ? GariLinkColors.textMuted
                          : GariLinkColors.textPrimary,
                    ),
                  ),
                ),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: GariLinkColors.textMuted,
                ),
              ],
            ),
          ),
        ),
      ),
      const SizedBox(height: 16),
      FilledButton.icon(
        key: const Key('find-vehicles-button'),
        onPressed: _findVehicles,
        icon: const Icon(Icons.search_rounded),
        label: const Text('Find vehicles'),
      ),
    ],
  );

  String get _locationLabel {
    final location = _searchLocation.location;
    if (location == null) return 'Search for a city, town or area';
    return [
      location.locality,
      location.city,
    ].whereType<String>().where((value) => value.isNotEmpty).join(', ');
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.name});
  final String name;
  @override
  Widget build(BuildContext context) => Row(
    children: [
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'GariLink',
              style: GariLinkTypography.titleLarge.copyWith(
                color: GariLinkColors.accent,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Vehicles for the jobs that move you',
              style: GariLinkTypography.bodySmall,
            ),
          ],
        ),
      ),
      Semantics(
        button: true,
        label: 'Open profile for $name',
        child: InkWell(
          key: const Key('home-profile-action'),
          customBorder: const CircleBorder(),
          onTap: () => context.go('/profile'),
          child: CircleAvatar(
            radius: 22,
            backgroundColor: GariLinkColors.primary,
            child: Text(
              name.characters.first.toUpperCase(),
              style: GariLinkTypography.titleMedium.copyWith(
                color: Colors.white,
              ),
            ),
          ),
        ),
      ),
    ],
  );
}

class _VehicleHero extends StatelessWidget {
  const _VehicleHero();
  @override
  Widget build(BuildContext context) {
    final baseHeight = MediaQuery.sizeOf(context).width <= 340 ? 132.0 : 148.0;
    final textScale = MediaQuery.textScalerOf(context).scale(1);
    final accessibleHeight = baseHeight + ((textScale - 1).clamp(0, 1) * 196);
    return Semantics(
      image: true,
      label: 'Cars, an SUV and a truck ready for different journeys',
      child: Container(
        key: const Key('home-vehicle-hero'),
        height: accessibleHeight,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          boxShadow: const [GariLinkShadows.softOverlay],
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.asset(
              'assets/images/home/garilink_home_hero.jpg',
              key: const Key('home-hero-photo'),
              fit: BoxFit.cover,
              alignment: Alignment.center,
              cacheWidth: 1280,
              excludeFromSemantics: true,
              errorBuilder: (_, _, _) => const Center(
                child: Icon(
                  Icons.image_not_supported_outlined,
                  color: GariLinkColors.textMuted,
                ),
              ),
            ),
            const DecoratedBox(
              key: Key('home-hero-gradient'),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.center,
                  colors: [Color(0xD90B1F3A), Color(0x3D0B1F3A)],
                  stops: [0, .68],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Align(
                alignment: Alignment.centerLeft,
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 280),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Transport for\nevery move.',
                        key: const Key('home-hero-headline'),
                        style: GariLinkTypography.largeTitle.copyWith(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          height: 1.03,
                          shadows: const [
                            Shadow(color: Color(0x52000000), blurRadius: 8),
                          ],
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Cars, SUVs, pickups and trucks\nfor people, goods and businesses.',
                        key: const Key('home-hero-supporting-copy'),
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: GariLinkTypography.bodySmall.copyWith(
                          color: const Color(0xFFF8FAFC),
                          fontSize: 10.5,
                          height: 1.25,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Surface extends StatelessWidget {
  const _Surface({required this.child, this.tint = GariLinkColors.surface});
  final Widget child;
  final Color tint;
  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      color: tint,
      borderRadius: BorderRadius.circular(24),
      boxShadow: const [GariLinkShadows.card],
    ),
    child: Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: GariLinkSpacing.md,
        vertical: GariLinkSpacing.lg,
      ),
      child: child,
    ),
  );
}

class _PopularCategory {
  const _PopularCategory(
    this.title,
    this.subtitle,
    this.assetPath,
    this.color,
    this.need,
  );
  final String title;
  final String subtitle;
  final String assetPath;
  final Color color;
  final TransportNeed need;
}

const _popularCategories = <_PopularCategory>[
  _PopularCategory(
    'Comfortable cars',
    'For daily trips and city travel',
    'assets/images/home/category_cars.jpg',
    Color(0xFF2563EB),
    TransportNeed(purpose: TransportPurpose.cityTravel),
  ),
  _PopularCategory(
    'SUVs',
    'Space for family and groups',
    'assets/images/home/category_suvs.jpg',
    Color(0xFF7C3AED),
    TransportNeed(purpose: TransportPurpose.familyOrGroup),
  ),
  _PopularCategory(
    'Pickups',
    'For work and business',
    'assets/images/home/category_pickups.jpg',
    Color(0xFFD97706),
    TransportNeed(purpose: TransportPurpose.businessTransport),
  ),
];

class _PopularCard extends StatelessWidget {
  const _PopularCard({required this.item, required this.onTap});
  final _PopularCategory item;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final extraWidth = (MediaQuery.textScalerOf(context).scale(100) - 100)
        .clamp(0, 100)
        .toDouble();
    return Semantics(
      button: true,
      label: '${item.title}. ${item.subtitle}',
      child: SizedBox(
        width: 210 + extraWidth,
        child: Material(
          color: item.color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(GariLinkRadius.card),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            borderRadius: BorderRadius.circular(GariLinkRadius.card),
            onTap: onTap,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(
                  height: 78,
                  child: Image.asset(
                    item.assetPath,
                    key: Key('popular-image-${item.title}'),
                    fit: BoxFit.cover,
                    alignment: Alignment.center,
                    cacheWidth: 480,
                    excludeFromSemantics: true,
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item.title, style: GariLinkTypography.cardTitle),
                        const SizedBox(height: 4),
                        Text(
                          item.subtitle,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: GariLinkTypography.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _AreaPicker extends StatelessWidget {
  const _AreaPicker();
  static const _areas = <GariLocation>[
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
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
    child: Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Choose a search area', style: GariLinkTypography.titleLarge),
        const SizedBox(height: 4),
        Text(
          'We’ll search near the city centre. You can refine the pickup point later.',
          style: GariLinkTypography.bodyMedium,
        ),
        const SizedBox(height: 12),
        ..._areas.map(
          (area) => ListTile(
            minVerticalPadding: 12,
            leading: const Icon(Icons.location_on_outlined),
            title: Text(area.city!),
            onTap: () => Navigator.pop(context, area),
          ),
        ),
      ],
    ),
  );
}
