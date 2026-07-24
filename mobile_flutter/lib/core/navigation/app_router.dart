import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'placeholder_pages.dart';

// Dummy auth state provider for Phase A compilation.
// This will be replaced with the real auth notifier in Phase B.
final isAuthenticatedProvider = StateProvider<bool>((ref) => false);

final goRouterRootKey = GlobalKey<NavigatorState>(debugLabel: 'root');
final goRouterShellKey = GlobalKey<NavigatorState>(debugLabel: 'shell');

final routerProvider = Provider<GoRouter>((ref) {
  final isAuthenticated = ref.watch(isAuthenticatedProvider);

  return GoRouter(
    navigatorKey: goRouterRootKey,
    initialLocation: '/welcome',
    redirect: (context, state) {
      final loggingIn = state.matchedLocation == '/welcome' ||
          state.matchedLocation == '/login' ||
          state.matchedLocation == '/register';

      // Protected routes list
      final isProtectedRoute = state.matchedLocation == '/manage' ||
          state.matchedLocation == '/saved' ||
          state.matchedLocation == '/trips';

      if (!isAuthenticated && isProtectedRoute) {
        return '/welcome';
      }

      if (isAuthenticated && loggingIn) {
        return '/home';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/welcome',
        parentNavigatorKey: goRouterRootKey,
        builder: (context, state) => const WelcomePage(),
      ),
      GoRoute(
        path: '/login',
        parentNavigatorKey: goRouterRootKey,
        builder: (context, state) => const Scaffold(body: Center(child: Text('Login'))),
      ),
      GoRoute(
        path: '/register',
        parentNavigatorKey: goRouterRootKey,
        builder: (context, state) => const Scaffold(body: Center(child: Text('Register'))),
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
    final isAuthenticated = ref.watch(isAuthenticatedProvider);

    int getSelectedIndex() {
      switch (location) {
        case '/home':
          return 0;
        case '/explore':
          return 1;
        case '/manage':
          return 2;
        case '/saved':
          return 3;
        case '/trips':
          return 4;
        case '/profile':
          return 5;
        default:
          return 0;
      }
    }

    void onItemTapped(int index) {
      switch (index) {
        case 0:
          context.go('/home');
          break;
        case 1:
          context.go('/explore');
          break;
        case 2:
          context.go('/manage');
          break;
        case 3:
          context.go('/saved');
          break;
        case 4:
          context.go('/trips');
          break;
        case 5:
          context.go('/profile');
          break;
      }
    }

    // Items list: hides protected tabs if not authenticated
    final items = [
      const BottomNavigationBarItem(
        icon: Icon(Icons.home_outlined),
        activeIcon: Icon(Icons.home),
        label: 'Home',
      ),
      const BottomNavigationBarItem(
        icon: Icon(Icons.explore_outlined),
        activeIcon: Icon(Icons.explore),
        label: 'Explore',
      ),
      if (isAuthenticated) ...[
        const BottomNavigationBarItem(
          icon: Icon(Icons.dashboard_outlined),
          activeIcon: Icon(Icons.dashboard),
          label: 'Manage',
        ),
        const BottomNavigationBarItem(
          icon: Icon(Icons.favorite_outline),
          activeIcon: Icon(Icons.favorite),
          label: 'Saved',
        ),
        const BottomNavigationBarItem(
          icon: Icon(Icons.calendar_today_outlined),
          activeIcon: Icon(Icons.calendar_today),
          label: 'Trips',
        ),
      ],
      const BottomNavigationBarItem(
        icon: Icon(Icons.person_outline),
        activeIcon: Icon(Icons.person),
        label: 'Profile',
      ),
    ];

    // Compute active index based on visible items
    int computeIndex() {
      final rawIndex = getSelectedIndex();
      if (isAuthenticated) return rawIndex;
      if (rawIndex == 5) return 2; // Profile maps to 2 if authenticated tabs are hidden
      return rawIndex;
    }

    void handleTap(int displayIndex) {
      if (isAuthenticated) {
        onItemTapped(displayIndex);
      } else {
        // Map display index back to absolute targets
        if (displayIndex == 0) onItemTapped(0);
        if (displayIndex == 1) onItemTapped(1);
        if (displayIndex == 2) onItemTapped(5); // Profile
      }
    }

    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: computeIndex(),
        onTap: handleTap,
        items: items,
      ),
    );
  }
}
