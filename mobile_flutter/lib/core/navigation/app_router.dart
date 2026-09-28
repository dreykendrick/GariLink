import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/colors.dart';
import '../services/storage_service.dart';
import '../theme/typography.dart';
import '../theme/icons.dart';
import '../theme/animations.dart';
import '../theme/dimensions.dart';
import '../theme/radius.dart';
import '../theme/spacing.dart';
import '../../shared/widgets/app_button.dart';
import '../../features/authentication/domain/entities/user.dart';
import '../../features/authentication/presentation/providers/auth_provider.dart';
import '../../features/authentication/presentation/pages/splash_page.dart';
import '../../features/authentication/presentation/pages/onboarding_page.dart';
import '../../features/authentication/presentation/pages/login_page.dart';
import '../../features/authentication/presentation/pages/register_page.dart';
import '../../features/authentication/presentation/pages/forgot_password_page.dart';
import '../../features/authentication/presentation/pages/reset_password_page.dart';
import '../../features/authentication/presentation/pages/verify_phone_page.dart';
import '../../features/home/presentation/pages/home_page.dart';
import '../../features/explore/presentation/pages/explore_page.dart';
import '../../features/trips/presentation/pages/trips_page.dart';
import '../../features/profile/presentation/pages/profile_page.dart';
import '../../features/vehicle/presentation/pages/vehicle_details_page.dart';
import '../../features/explore/presentation/pages/saved_vehicles_page.dart';
import '../../features/booking/presentation/pages/booking_page.dart';
import '../../features/explore/domain/discovery_selection.dart';
import '../../features/owner/presentation/pages/owner_dashboard_page.dart';
import '../../features/owner/presentation/pages/my_vehicles_page.dart';
import '../../features/owner/presentation/pages/incoming_requests_page.dart';
import '../../features/owner/presentation/pages/menu_page.dart';
import '../../features/owner/presentation/pages/create_listing_page.dart';
import '../../features/owner/data/owner_draft_repository.dart';
import 'placeholder_pages.dart';

final goRouterRootKey = GlobalKey<NavigatorState>(debugLabel: 'root');
final goRouterShellKey = GlobalKey<NavigatorState>(debugLabel: 'shell');

final routerProvider = Provider<GoRouter>((ref) {
  final refreshNotifier = _RouterRefreshNotifier();
  ref.listen<AuthState>(authStateProvider, (_, _) => refreshNotifier.refresh());
  ref.onDispose(refreshNotifier.dispose);

  final router = GoRouter(
    navigatorKey: goRouterRootKey,
    initialLocation: '/splash',
    refreshListenable: refreshNotifier,
    redirect: (context, state) {
      final authState = ref.read(authStateProvider);
      final isAuthenticated = authState.isAuthenticated;
      final location = state.matchedLocation;
      if (!authState.isHydrated) {
        return location == '/splash' ? null : '/splash';
      }
      if (authState.pendingPhone != null) {
        return location == '/verify-phone' ? null : '/verify-phone';
      }
      if (!isAuthenticated && location == '/splash') {
        final completed =
            ref
                .read(storageServiceProvider)
                .getString('onboarding_completed') ==
            'true';
        return completed ? '/welcome' : '/onboarding';
      }
      final loggingIn =
          location == '/splash' ||
          location == '/onboarding' ||
          location == '/welcome' ||
          location == '/login' ||
          location == '/register' ||
          location == '/forgot-password' ||
          location == '/reset-password';

      final isProtectedRoute =
          location == '/trips' ||
          location == '/profile' ||
          location == '/verify-phone' ||
          location == '/booking' ||
          location == '/saved-vehicles' ||
          location == '/owner-dashboard' ||
          location == '/my-vehicles' ||
          location == '/incoming-requests' ||
          location == '/menu';

      final isOwnerRoute =
          location == '/owner-dashboard' ||
          location == '/my-vehicles' ||
          location == '/incoming-requests' ||
          location == '/menu';

      if (!isAuthenticated && isProtectedRoute) return '/login';
      if (isAuthenticated && authState.user?.isPhoneVerified == false) {
        return location == '/verify-phone' ? null : '/verify-phone';
      }
      if (isAuthenticated && isOwnerRoute && !_isOwner(authState.user)) {
        return '/home';
      }
      if (isAuthenticated && (loggingIn || location == '/verify-phone')) {
        return '/home';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        parentNavigatorKey: goRouterRootKey,
        builder: (context, state) => const SplashPage(),
      ),
      GoRoute(
        path: '/onboarding',
        parentNavigatorKey: goRouterRootKey,
        builder: (context, state) => const OnboardingPage(),
      ),
      GoRoute(
        path: '/welcome',
        parentNavigatorKey: goRouterRootKey,
        builder: (context, state) => const WelcomePage(),
      ),
      GoRoute(
        path: '/login',
        parentNavigatorKey: goRouterRootKey,
        pageBuilder: (context, state) =>
            _forwardPage(context, state, const LoginPage()),
      ),
      GoRoute(
        path: '/register',
        parentNavigatorKey: goRouterRootKey,
        pageBuilder: (context, state) =>
            _forwardPage(context, state, const RegisterPage()),
      ),
      GoRoute(
        path: '/forgot-password',
        parentNavigatorKey: goRouterRootKey,
        builder: (context, state) => const ForgotPasswordPage(),
      ),
      GoRoute(
        path: '/reset-password',
        parentNavigatorKey: goRouterRootKey,
        builder: (context, state) => const ResetPasswordPage(),
      ),
      GoRoute(
        path: '/verify-phone',
        parentNavigatorKey: goRouterRootKey,
        pageBuilder: (context, state) =>
            _forwardPage(context, state, const VerifyPhonePage()),
      ),
      // Full-screen pages (above shell, keep back button)
      GoRoute(
        path: '/vehicle-details',
        parentNavigatorKey: goRouterRootKey,
        pageBuilder: (context, state) {
          final listingId = state.uri.queryParameters['listingId'] ?? '';
          return _forwardPage(
            context,
            state,
            VehicleDetailsPageWrapper(
              listingId: listingId,
              selection: state.extra is DiscoverySelection
                  ? state.extra as DiscoverySelection
                  : null,
            ),
          );
        },
      ),
      GoRoute(
        path: '/booking',
        parentNavigatorKey: goRouterRootKey,
        pageBuilder: (context, state) {
          final query = state.uri.queryParameters;
          return _forwardPage(
            context,
            state,
            BookingPageWrapper(
              listingId: query['listingId'] ?? '',
              dailyRate: double.tryParse(query['dailyRate'] ?? '') ?? 0,
              currency: query['currency'] ?? 'TZS',
              vehicleTitle: query['vehicleTitle'],
              vehicleCategory: query['vehicleCategory'],
              publicLocality: query['publicLocality'],
              availability: query['availability'],
              coverUrl: query['coverUrl'],
              selection: state.extra is DiscoverySelection
                  ? state.extra as DiscoverySelection
                  : null,
            ),
          );
        },
      ),
      GoRoute(
        path: '/saved-vehicles',
        parentNavigatorKey: goRouterRootKey,
        pageBuilder: (context, state) =>
            _forwardPage(context, state, const SavedVehiclesPage()),
      ),
      ShellRoute(
        navigatorKey: goRouterShellKey,
        builder: (context, state, child) {
          return ScaffoldWithNavBar(child: child);
        },
        routes: [
          GoRoute(
            path: '/home',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: HomePageWrapper()),
          ),
          GoRoute(
            path: '/explore',
            pageBuilder: (context, state) => NoTransitionPage(
              child: ExplorePageWrapper(
                initialIntent: state.extra is DiscoverySearchIntent
                    ? state.extra as DiscoverySearchIntent
                    : null,
              ),
            ),
          ),
          GoRoute(
            path: '/trips',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: TripsPageWrapper()),
          ),
          GoRoute(
            path: '/profile',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: ProfilePageWrapper()),
          ),
          // Owner tabs
          GoRoute(
            path: '/owner-dashboard',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: OwnerDashboardWrapper()),
          ),
          GoRoute(
            path: '/my-vehicles',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: MyVehiclesWrapper()),
          ),
          GoRoute(
            path: '/incoming-requests',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: IncomingRequestsWrapper()),
          ),
          GoRoute(
            path: '/menu',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: MenuWrapper()),
          ),
        ],
      ),
    ],
  );
  ref.onDispose(router.dispose);
  return router;
});

CustomTransitionPage<void> _forwardPage(
  BuildContext context,
  GoRouterState state,
  Widget child,
) => CustomTransitionPage<void>(
  key: state.pageKey,
  child: child,
  transitionDuration: GariLinkAnimations.duration(
    context,
    GariLinkAnimations.standard,
  ),
  reverseTransitionDuration: GariLinkAnimations.duration(
    context,
    GariLinkAnimations.short,
  ),
  transitionsBuilder: (context, animation, secondaryAnimation, child) {
    if (GariLinkAnimations.reduceMotion(context)) return child;
    final curved = CurvedAnimation(
      parent: animation,
      curve: GariLinkAnimations.premiumCurve,
      reverseCurve: GariLinkAnimations.defaultCurve,
    );
    return FadeTransition(
      opacity: curved,
      child: SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(.035, 0),
          end: Offset.zero,
        ).animate(curved),
        child: child,
      ),
    );
  },
);

class _RouterRefreshNotifier extends ChangeNotifier {
  void refresh() => notifyListeners();
}

// ─── Role detection helper ─────────────────────────────────────────────────

bool _isOwner(User? user) {
  if (user == null) return false;
  return user.roles.contains(UserRole.privateOwner) ||
      user.roles.contains(UserRole.dealer);
}

// ─── Scaffold with role-based bottom nav ──────────────────────────────────

class ScaffoldWithNavBar extends ConsumerWidget {
  final Widget child;
  const ScaffoldWithNavBar({required this.child, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).matchedLocation;
    final authState = ref.watch(authStateProvider);
    final isAuthenticated = authState.isAuthenticated;
    final isOwner = _isOwner(authState.user);

    // ── nav config ──────────────────────────────────────────────────────────
    final renterItems = [
      _NavItem(
        icon: GariLinkIcons.home,
        activeIcon: GariLinkIcons.homeActive,
        label: 'Home',
        path: '/home',
      ),
      _NavItem(
        icon: GariLinkIcons.explore,
        activeIcon: GariLinkIcons.explore,
        label: 'Explore',
        path: '/explore',
      ),
      _NavItem(
        icon: GariLinkIcons.trips,
        activeIcon: GariLinkIcons.tripsActive,
        label: 'Trips',
        path: '/trips',
      ),
      _NavItem(
        icon: GariLinkIcons.profile,
        activeIcon: GariLinkIcons.profileActive,
        label: 'Profile',
        path: '/profile',
      ),
    ];

    final ownerItems = [
      _NavItem(
        icon: GariLinkIcons.home,
        activeIcon: GariLinkIcons.homeActive,
        label: 'Home',
        path: '/owner-dashboard',
      ),
      _NavItem(
        icon: GariLinkIcons.bookings,
        activeIcon: GariLinkIcons.bookingsActive,
        label: 'Bookings',
        path: '/incoming-requests',
      ),
      _NavItem(
        icon: GariLinkIcons.vehicles,
        activeIcon: GariLinkIcons.vehiclesActive,
        label: 'Vehicles',
        path: '/my-vehicles',
      ),
      _NavItem(
        icon: GariLinkIcons.menu,
        activeIcon: GariLinkIcons.menu,
        label: 'Menu',
        path: '/menu',
      ),
    ];

    final items = isOwner ? ownerItems : renterItems;

    int activeIndex = items.indexWhere((item) => item.path == location);
    if (activeIndex < 0) activeIndex = 0;

    final isDark = Theme.of(context).brightness == Brightness.dark;

    void handleNav(int index) {
      final path = items[index].path;
      if ((path == '/trips' ||
              path == '/incoming-requests' ||
              path == '/my-vehicles') &&
          !isAuthenticated) {
        context.push('/login');
        return;
      }
      context.go(path);
    }

    return Scaffold(
      body: child,
      resizeToAvoidBottomInset: false,
      floatingActionButtonLocation: isOwner
          ? FloatingActionButtonLocation.centerDocked
          : null,
      floatingActionButton: isOwner
          ? FloatingActionButton(
              heroTag: 'main_fab',
              tooltip: 'Add a vehicle',
              onPressed: () async {
                if (!isAuthenticated) {
                  context.push('/login');
                  return;
                }
                if (supabaseOwnerToolsEnabled) {
                  final saved = await Navigator.of(context, rootNavigator: true)
                      .push<bool>(
                        MaterialPageRoute(
                          builder: (_) => const CreateListingPage(),
                        ),
                      );
                  if (!context.mounted) return;
                  // Workspace creation grants the server-side private-owner role.
                  // Refresh even after cancellation: a workspace may have been created
                  // before an uncertain/failed draft request. Never invent the role.
                  await ref.read(authStateProvider.notifier).refreshMe();
                  if (!context.mounted) return;
                  if (saved == true) {
                    if (_isOwner(ref.read(authStateProvider).user)) {
                      context.go('/my-vehicles');
                    }
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'Private draft saved. It is not published yet.',
                        ),
                      ),
                    );
                  }
                  return;
                }
                _showListVehicleSheet(context);
              },
              backgroundColor: GariLinkColors.accent,
              shape: const CircleBorder(),
              elevation: 4,
              child: const Icon(
                GariLinkIcons.add,
                color: Colors.white,
                size: 28,
              ),
            )
          : null,
      bottomNavigationBar: BottomAppBar(
        shape: isOwner ? const CircularNotchedRectangle() : null,
        notchMargin: isOwner ? 8.0 : 0,
        color: isDark ? GariLinkColors.darkSurface : Colors.white,
        elevation: 8,
        padding: EdgeInsets.zero,
        height: GariLinkDimensions.bottomNavigationHeight,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            // First two items
            ...items
                .take(2)
                .toList()
                .asMap()
                .entries
                .map(
                  (e) => Expanded(
                    child: _NavItemWidget(
                      item: e.value,
                      isActive: activeIndex == e.key,
                      onTap: () => handleNav(e.key),
                    ),
                  ),
                ),
            // Owner workspaces retain the listing action and its notch.
            if (isOwner) const SizedBox(width: 56),
            // Last two items
            ...items
                .skip(2)
                .toList()
                .asMap()
                .entries
                .map(
                  (e) => Expanded(
                    child: _NavItemWidget(
                      item: items[e.key + 2],
                      isActive: activeIndex == e.key + 2,
                      onTap: () => handleNav(e.key + 2),
                    ),
                  ),
                ),
          ],
        ),
      ),
    );
  }

  void _showListVehicleSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      useSafeArea: true,
      isScrollControlled: true,
      builder: (ctx) => const _ListVehicleSheet(),
    );
  }
}

// ─── Nav item data ─────────────────────────────────────────────────────────

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final String path;
  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.path,
  });
}

// ─── Nav item widget ───────────────────────────────────────────────────────

class _NavItemWidget extends StatelessWidget {
  final _NavItem item;
  final bool isActive;
  final VoidCallback onTap;
  const _NavItemWidget({
    required this.item,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = isActive
        ? GariLinkColors.accent
        : GariLinkColors.textSecondary;
    return InkWell(
      onTap: onTap,
      borderRadius: GariLinkRadius.badgeBorderRadius,
      child: SizedBox(
        height: GariLinkDimensions.bottomNavigationHeight,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isActive ? item.activeIcon : item.icon,
              color: color,
              size: 22,
            ),
            const SizedBox(height: 2),
            Text(
              item.label,
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── List vehicle bottom sheet ─────────────────────────────────────────────

class _ListVehicleSheet extends StatelessWidget {
  const _ListVehicleSheet();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        GariLinkSpacing.xxl,
        GariLinkSpacing.sm,
        GariLinkSpacing.xxl,
        GariLinkSpacing.xxl,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: GariLinkSpacing.sm),
          Text(
            'List Your Vehicle',
            style: GariLinkTypography.titleLarge,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Turn your vehicle into income. Share it securely with verified renters in Tanzania.',
            style: GariLinkTypography.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          AppButton(
            text: 'Go to owner dashboard',
            icon: Icons.dashboard_outlined,
            onPressed: () {
              Navigator.pop(context);
              context.go('/owner-dashboard');
            },
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }
}

// ─── Wrapper widgets (deferred imports via placeholder until real pages exist) ──

class HomePageWrapper extends ConsumerWidget {
  const HomePageWrapper({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => const HomePage();
}

class ExplorePageWrapper extends ConsumerWidget {
  const ExplorePageWrapper({super.key, this.initialIntent});
  final DiscoverySearchIntent? initialIntent;
  @override
  Widget build(BuildContext context, WidgetRef ref) =>
      ExplorePage(initialIntent: initialIntent);
}

class TripsPageWrapper extends ConsumerWidget {
  const TripsPageWrapper({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => const TripsPage();
}

class ProfilePageWrapper extends ConsumerWidget {
  const ProfilePageWrapper({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => const ProfilePage();
}

class OwnerDashboardWrapper extends ConsumerWidget {
  const OwnerDashboardWrapper({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) =>
      const OwnerDashboardPage();
}

class MyVehiclesWrapper extends ConsumerWidget {
  const MyVehiclesWrapper({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => const MyVehiclesPage();
}

class IncomingRequestsWrapper extends ConsumerWidget {
  const IncomingRequestsWrapper({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) =>
      const IncomingRequestsPage();
}

class MenuWrapper extends ConsumerWidget {
  const MenuWrapper({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => const MenuPage();
}

class VehicleDetailsPageWrapper extends StatelessWidget {
  final String listingId;
  final DiscoverySelection? selection;
  const VehicleDetailsPageWrapper({
    required this.listingId,
    this.selection,
    super.key,
  });
  @override
  Widget build(BuildContext context) =>
      VehicleDetailsPage(listingId: listingId, selection: selection);
}

class BookingPageWrapper extends StatelessWidget {
  final DiscoverySelection? selection;
  final String listingId;
  final double dailyRate;
  final String currency;
  final String? vehicleTitle;
  final String? vehicleCategory;
  final String? publicLocality;
  final String? availability;
  final String? coverUrl;
  const BookingPageWrapper({
    required this.listingId,
    required this.dailyRate,
    required this.currency,
    this.vehicleTitle,
    this.vehicleCategory,
    this.publicLocality,
    this.availability,
    this.coverUrl,
    this.selection,
    super.key,
  });
  @override
  Widget build(BuildContext context) => BookingPage(
    listingId: listingId,
    dailyRate: dailyRate,
    currency: currency,
    vehicleTitle: vehicleTitle,
    vehicleCategory: vehicleCategory,
    publicLocality: publicLocality,
    availability: availability,
    coverUrl: coverUrl,
    selection: selection,
  );
}
