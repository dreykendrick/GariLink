import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/colors.dart';
import '../theme/radius.dart';
import '../theme/spacing.dart';
import '../theme/typography.dart';
import '../../features/authentication/presentation/providers/auth_provider.dart';
import '../../features/authentication/presentation/pages/splash_page.dart';
import '../../features/authentication/presentation/pages/onboarding_page.dart';
import '../../features/authentication/presentation/pages/login_page.dart';
import '../../features/authentication/presentation/pages/register_page.dart';
import '../../features/authentication/presentation/pages/forgot_password_page.dart';
import '../../features/authentication/presentation/pages/reset_password_page.dart';
import '../../features/authentication/presentation/pages/verify_phone_page.dart';
import '../../features/profile/presentation/pages/profile_page.dart';
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

      // Protected routes list
      final isProtectedRoute = state.matchedLocation == '/manage' ||
          state.matchedLocation == '/saved' ||
          state.matchedLocation == '/trips' ||
          state.matchedLocation == '/verify-phone';

      if (!isAuthenticated && isProtectedRoute) {
        return '/login';
      }

      if (isAuthenticated && loggingIn) {
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
      ShellRoute(
        navigatorKey: goRouterShellKey,
        builder: (context, state, child) {
          return ScaffoldWithNavBar(child: child);
        },
        routes: [
          GoRoute(
            path: '/home',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: HomePage(),
            ),
          ),
          GoRoute(
            path: '/explore',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ExplorePage(),
            ),
          ),
          GoRoute(
            path: '/manage',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ManagePage(),
            ),
          ),
          GoRoute(
            path: '/saved',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: SavedPage(),
            ),
          ),
          GoRoute(
            path: '/trips',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: TripsPage(),
            ),
          ),
          GoRoute(
            path: '/profile',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ProfilePage(),
            ),
          ),
        ],
      ),
    ],
  );
});

class ScaffoldWithNavBar extends ConsumerWidget {
  final Widget child;

  const ScaffoldWithNavBar({
    required this.child,
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).matchedLocation;
    final authState = ref.watch(authStateProvider);
    final isAuthenticated = authState.isAuthenticated;

    int getSelectedIndex() {
      switch (location) {
        case '/home':
          return 0;
        case '/explore':
          return 1;
        case '/trips':
          return 2;
        case '/profile':
          return 3;
        default:
          return 0;
      }
    }

    void handleNavigation(int index) {
      switch (index) {
        case 0:
          context.go('/home');
          break;
        case 1:
          context.go('/explore');
          break;
        case 2:
          if (isAuthenticated) {
            context.go('/trips');
          } else {
            context.push('/login');
          }
          break;
        case 3:
          context.go('/profile');
          break;
      }
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final activeIndex = getSelectedIndex();

    return Scaffold(
      body: child,
      resizeToAvoidBottomInset: false,
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          if (!isAuthenticated) {
            context.push('/login');
          } else {
            showModalBottomSheet(
              context: context,
              backgroundColor: isDark ? const Color(0xFF0F1E33) : Colors.white,
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.vertical(top: Radius.circular(GariLinkRadius.bottomSheet)),
              ),
              builder: (context) => const ListVehicleBottomSheet(),
            );
          }
        },
        backgroundColor: GariLinkColors.accent,
        shape: const CircleBorder(),
        elevation: 4,
        child: const Icon(Icons.add, color: Colors.white, size: 28),
      ),
      bottomNavigationBar: BottomAppBar(
        shape: const CircularNotchedRectangle(),
        notchMargin: 8.0,
        color: isDark ? const Color(0xFF0F1E33) : Colors.white,
        elevation: 8,
        padding: EdgeInsets.zero,
        height: 64,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildNavItem(
              context: context,
              icon: Icons.home_outlined,
              activeIcon: Icons.home,
              label: 'Home',
              isActive: activeIndex == 0,
              onTap: () => handleNavigation(0),
            ),
            _buildNavItem(
              context: context,
              icon: Icons.search,
              activeIcon: Icons.search,
              label: 'Explore',
              isActive: activeIndex == 1,
              onTap: () => handleNavigation(1),
            ),
            const SizedBox(width: 48), // FAB center space
            _buildNavItem(
              context: context,
              icon: Icons.calendar_today_outlined,
              activeIcon: Icons.calendar_today,
              label: 'Trips',
              isActive: activeIndex == 2,
              onTap: () => handleNavigation(2),
            ),
            _buildNavItem(
              context: context,
              icon: Icons.person_outline,
              activeIcon: Icons.person,
              label: 'Profile',
              isActive: activeIndex == 3,
              onTap: () => handleNavigation(3),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required BuildContext context,
    required IconData icon,
    required IconData activeIcon,
    required String label,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = isActive
        ? GariLinkColors.accent
        : (isDark ? GariLinkColors.textMuted : GariLinkColors.textSecondary);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(isActive ? activeIcon : icon, color: color, size: 22),
            const SizedBox(height: 2),
            Text(
              label,
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

class ListVehicleBottomSheet extends StatelessWidget {
  const ListVehicleBottomSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.all(GariLinkSpacing.xxl),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'List Your Vehicle',
            style: GariLinkTypography.titleLarge.copyWith(
              color: isDark ? Colors.white : GariLinkColors.textPrimary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: GariLinkSpacing.sm),
          Text(
            'Turn your vehicle into income. Share it securely with verified renters in Tanzania.',
            style: GariLinkTypography.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: GariLinkSpacing.xxl),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(context);
              context.go('/manage');
            },
            icon: const Icon(Icons.dashboard_outlined),
            label: const Text('Go to Owner Dashboard'),
            style: ElevatedButton.styleFrom(
              backgroundColor: GariLinkColors.accent,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: GariLinkSpacing.md),
              shape: RoundedRectangleBorder(
                borderRadius: GariLinkRadius.buttonBorderRadius,
              ),
            ),
          ),
          const SizedBox(height: GariLinkSpacing.md),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }
}
