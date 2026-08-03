import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/colors.dart';
import '../theme/radius.dart';
import '../theme/spacing.dart';
import '../theme/typography.dart';
import '../theme/icons.dart';
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
import '../../features/booking/presentation/pages/booking_page.dart';
import '../../features/owner/presentation/pages/owner_dashboard_page.dart';
import '../../features/owner/presentation/pages/my_vehicles_page.dart';
import '../../features/owner/presentation/pages/incoming_requests_page.dart';
import '../../features/owner/presentation/pages/analytics_page.dart';
import '../../features/owner/presentation/pages/menu_page.dart';
import 'placeholder_pages.dart';

final goRouterRootKey = GlobalKey<NavigatorState>(debugLabel: 'root');
final goRouterShellKey = GlobalKey<NavigatorState>(debugLabel: 'shell');

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  final isAuthenticated = authState.isAuthenticated;

  return GoRouter(
    navigatorKey: goRouterRootKey,
    initialLocation: '/splash',
    redirect: (context, state) {
      final loggingIn = state.matchedLocation == '/splash' ||
          state.matchedLocation == '/onboarding' ||
          state.matchedLocation == '/welcome' ||
          state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/forgot-password' ||
          state.matchedLocation == '/reset-password';

      final isProtectedRoute = state.matchedLocation == '/trips' ||
          state.matchedLocation == '/verify-phone' ||
          state.matchedLocation == '/booking' ||
          state.matchedLocation.startsWith('/owner');

      if (!isAuthenticated && isProtectedRoute) return '/login';
      if (isAuthenticated && loggingIn) return '/home';
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
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/register',
        parentNavigatorKey: goRouterRootKey,
        builder: (context, state) => const RegisterPage(),
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
        builder: (context, state) => const VerifyPhonePage(),
      ),
      // Full-screen pages (above shell, keep back button)
      GoRoute(
        path: '/vehicle-details',
        parentNavigatorKey: goRouterRootKey,
        builder: (context, state) {
          final vehicleId = state.uri.queryParameters['id'] ?? '';
          return VehicleDetailsPageWrapper(vehicleId: vehicleId);
        },
      ),
      GoRoute(
        path: '/booking',
        parentNavigatorKey: goRouterRootKey,
        builder: (context, state) {
          final vehicleId = state.uri.queryParameters['id'] ?? '';
          return BookingPageWrapper(vehicleId: vehicleId);
        },
      ),
      ShellRoute(
        navigatorKey: goRouterShellKey,
        builder: (context, state, child) {
          return ScaffoldWithNavBar(child: child);
        },
        routes: [
          GoRoute(
            path: '/home',
            pageBuilder: (context, state) => const NoTransitionPage(child: HomePageWrapper()),
          ),
          GoRoute(
            path: '/explore',
            pageBuilder: (context, state) => const NoTransitionPage(child: ExplorePageWrapper()),
          ),
          GoRoute(
            path: '/trips',
            pageBuilder: (context, state) => const NoTransitionPage(child: TripsPageWrapper()),
          ),
          GoRoute(
            path: '/profile',
            pageBuilder: (context, state) => const NoTransitionPage(child: ProfilePageWrapper()),
          ),
          // Owner tabs
          GoRoute(
            path: '/owner-dashboard',
            pageBuilder: (context, state) => const NoTransitionPage(child: OwnerDashboardWrapper()),
          ),
          GoRoute(
            path: '/my-vehicles',
            pageBuilder: (context, state) => const NoTransitionPage(child: MyVehiclesWrapper()),
          ),
          GoRoute(
            path: '/incoming-requests',
            pageBuilder: (context, state) => const NoTransitionPage(child: IncomingRequestsWrapper()),
          ),
          GoRoute(
            path: '/analytics',
            pageBuilder: (context, state) => const NoTransitionPage(child: AnalyticsWrapper()),
          ),
          GoRoute(
            path: '/menu',
            pageBuilder: (context, state) => const NoTransitionPage(child: MenuWrapper()),
          ),
        ],
      ),
    ],
  );
});

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
      _NavItem(icon: GariLinkIcons.home, activeIcon: GariLinkIcons.homeActive, label: 'Home', path: '/home'),
      _NavItem(icon: GariLinkIcons.explore, activeIcon: GariLinkIcons.explore, label: 'Explore', path: '/explore'),
      _NavItem(icon: GariLinkIcons.trips, activeIcon: GariLinkIcons.tripsActive, label: 'Trips', path: '/trips'),
      _NavItem(icon: GariLinkIcons.profile, activeIcon: GariLinkIcons.profileActive, label: 'Profile', path: '/profile'),
    ];

    final ownerItems = [
      _NavItem(icon: GariLinkIcons.home, activeIcon: GariLinkIcons.homeActive, label: 'Home', path: '/owner-dashboard'),
      _NavItem(icon: GariLinkIcons.bookings, activeIcon: GariLinkIcons.bookingsActive, label: 'Bookings', path: '/incoming-requests'),
      _NavItem(icon: GariLinkIcons.vehicles, activeIcon: GariLinkIcons.vehiclesActive, label: 'Vehicles', path: '/my-vehicles'),
      _NavItem(icon: GariLinkIcons.menu, activeIcon: GariLinkIcons.menu, label: 'Menu', path: '/menu'),
    ];

    final items = isOwner ? ownerItems : renterItems;

    int activeIndex = items.indexWhere((item) => item.path == location);
    if (activeIndex < 0) activeIndex = 0;

    final isDark = Theme.of(context).brightness == Brightness.dark;

    void handleNav(int index) {
      final path = items[index].path;
      if ((path == '/trips' || path == '/incoming-requests' || path == '/my-vehicles') && !isAuthenticated) {
        context.push('/login');
        return;
      }
      context.go(path);
    }

    return Scaffold(
      body: child,
      resizeToAvoidBottomInset: false,
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      floatingActionButton: FloatingActionButton(
        heroTag: 'main_fab',
        onPressed: () {
          if (!isAuthenticated) {
            context.push('/login');
            return;
          }
          _showListVehicleSheet(context);
        },
        backgroundColor: GariLinkColors.accent,
        shape: const CircleBorder(),
        elevation: 4,
        child: const Icon(Icons.add_rounded, color: Colors.white, size: 28),
      ),
      bottomNavigationBar: BottomAppBar(
        shape: const CircularNotchedRectangle(),
        notchMargin: 8.0,
        color: isDark ? GariLinkColors.darkSurface : Colors.white,
        elevation: 8,
        padding: EdgeInsets.zero,
        height: 64,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            // First two items
            ...items.take(2).toList().asMap().entries.map((e) => Expanded(
              child: _NavItemWidget(
                item: e.value,
                isActive: activeIndex == e.key,
                onTap: () => handleNav(e.key),
              ),
            )),
            // FAB spacer
            const SizedBox(width: 56),
            // Last two items
            ...items.skip(2).toList().asMap().entries.map((e) => Expanded(
              child: _NavItemWidget(
                item: items[e.key + 2],
                isActive: activeIndex == e.key + 2,
                onTap: () => handleNav(e.key + 2),
              ),
            )),
          ],
        ),
      ),
    );
  }

  void _showListVehicleSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
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
  const _NavItem({required this.icon, required this.activeIcon, required this.label, required this.path});
}

// ─── Nav item widget ───────────────────────────────────────────────────────

class _NavItemWidget extends StatelessWidget {
  final _NavItem item;
  final bool isActive;
  final VoidCallback onTap;
  const _NavItemWidget({required this.item, required this.isActive, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final color = isActive ? GariLinkColors.accent : GariLinkColors.textSecondary;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: SizedBox(
        height: 64,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(isActive ? item.activeIcon : item.icon, color: color, size: 22),
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
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Handle
          Center(
            child: Container(
              width: 40, height: 4,
              decoration: BoxDecoration(
                color: GariLinkColors.neutral200,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text('List Your Vehicle', style: GariLinkTypography.titleLarge, textAlign: TextAlign.center),
          const SizedBox(height: 8),
          Text(
            'Turn your vehicle into income. Share it securely with verified renters in Tanzania.',
            style: GariLinkTypography.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(context);
              context.go('/owner-dashboard');
            },
            icon: const Icon(Icons.dashboard_outlined),
            label: const Text('Go to Owner Dashboard'),
            style: ElevatedButton.styleFrom(
              backgroundColor: GariLinkColors.accent,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
          ),
          const SizedBox(height: 12),
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
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
  const ExplorePageWrapper({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => const ExplorePage();
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
  Widget build(BuildContext context, WidgetRef ref) => const OwnerDashboardPage();
}

class MyVehiclesWrapper extends ConsumerWidget {
  const MyVehiclesWrapper({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => const MyVehiclesPage();
}

class IncomingRequestsWrapper extends ConsumerWidget {
  const IncomingRequestsWrapper({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => const IncomingRequestsPage();
}

class AnalyticsWrapper extends ConsumerWidget {
  const AnalyticsWrapper({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => const AnalyticsPage();
}

class MenuWrapper extends ConsumerWidget {
  const MenuWrapper({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => const MenuPage();
}

class VehicleDetailsPageWrapper extends StatelessWidget {
  final String vehicleId;
  const VehicleDetailsPageWrapper({required this.vehicleId, super.key});
  @override
  Widget build(BuildContext context) => VehicleDetailsPage(vehicleId: vehicleId);
}

class BookingPageWrapper extends StatelessWidget {
  final String vehicleId;
  const BookingPageWrapper({required this.vehicleId, super.key});
  @override
  Widget build(BuildContext context) => BookingPage(vehicleId: vehicleId);
}

// ─── Temporary placeholder page ────────────────────────────────────────────

class _TempPage extends StatelessWidget {
  final String title;
  final IconData icon;
  const _TempPage({required this.title, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: GariLinkColors.background,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: GariLinkColors.accent),
            const SizedBox(height: 16),
            Text(title, style: GariLinkTypography.titleLarge),
            const SizedBox(height: 8),
            Text('Building...', style: GariLinkTypography.bodyMedium),
          ],
        ),
      ),
    );
  }
}
