import 'dart:ui' show Tristate;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:garilink_mobile/core/services/storage_service.dart';
import 'package:garilink_mobile/core/navigation/app_router.dart';
import 'package:garilink_mobile/features/authentication/data/repositories/auth_repository.dart';
import 'package:garilink_mobile/features/authentication/presentation/providers/auth_provider.dart';
import 'package:garilink_mobile/features/home/presentation/pages/home_page.dart';
import 'package:garilink_mobile/features/location/data/device_location_service.dart';
import 'package:garilink_mobile/features/location/domain/models/gari_location.dart';

class _AuthRepositoryFake implements AuthRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

String _assetName(ImageProvider<Object> provider) {
  final source = provider is ResizeImage ? provider.imageProvider : provider;
  return (source as AssetImage).assetName;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late AuthNotifier auth;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
    auth = AuthNotifier(
      _AuthRepositoryFake(),
      StorageService(
        const FlutterSecureStorage(),
        await SharedPreferences.getInstance(),
      ),
    );
    await auth.hydrate();
  });

  Future<GoRouter> pumpHome(
    WidgetTester tester, {
    Size size = const Size(390, 844),
    double textScale = 1,
    Future<DeviceLocationResult> Function()? currentLocation,
  }) async {
    await tester.binding.setSurfaceSize(size);
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final router = GoRouter(
      initialLocation: '/',
      routes: [
        GoRoute(
          path: '/',
          builder: (_, _) => HomePage(currentLocation: currentLocation),
        ),
        GoRoute(
          path: '/explore',
          builder: (_, _) =>
              const Scaffold(body: Center(key: Key('explore-destination'))),
        ),
        GoRoute(
          path: '/profile',
          builder: (_, _) =>
              const Scaffold(body: Center(key: Key('profile-destination'))),
        ),
      ],
    );
    await tester.pumpWidget(
      ProviderScope(
        overrides: [authStateProvider.overrideWith((_) => auth)],
        child: MaterialApp.router(
          routerConfig: router,
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(
              context,
            ).copyWith(textScaler: TextScaler.linear(textScale)),
            child: child!,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    return router;
  }

  testWidgets('renders approved renter Home hierarchy and purpose grid', (
    tester,
  ) async {
    await pumpHome(tester);
    expect(find.text('GariLink'), findsOneWidget);
    expect(find.text('Vehicles for the jobs that move you'), findsOneWidget);
    expect(find.byKey(const Key('home-hero-headline')), findsOneWidget);
    expect(find.text('Transport for\nevery move.'), findsOneWidget);
    expect(find.byKey(const Key('home-hero-gradient')), findsOneWidget);
    expect(find.byKey(const Key('home-hero-supporting-copy')), findsOneWidget);
    expect(find.byType(PageView), findsNothing);
    expect(find.byKey(const Key('home-vehicle-hero')), findsOneWidget);
    final hero = tester.widget<Image>(find.byKey(const Key('home-hero-photo')));
    expect(_assetName(hero.image), 'assets/images/home/garilink_home_hero.jpg');
    expect(
      find.descendant(
        of: find.byKey(const Key('home-vehicle-hero')),
        matching: find.byType(CustomPaint),
      ),
      findsNothing,
    );
    for (final label in [
      'Personal trip',
      'Family or group travel',
      'Airport transfer',
      'Deliver goods',
      'Moving goods',
      'Business transport',
      'Heavy cargo & long distance',
    ]) {
      expect(find.byKey(Key('home-purpose-$label')), findsOneWidget);
    }
  });

  testWidgets('approved Popular category thumbnails render locally', (
    tester,
  ) async {
    await pumpHome(tester);
    const expectedAssets = <String, String>{
      'Comfortable cars': 'assets/images/home/category_cars.jpg',
      'SUVs': 'assets/images/home/category_suvs.jpg',
      'Pickups': 'assets/images/home/category_pickups.jpg',
    };
    await tester.ensureVisible(find.byKey(const Key('popular-category-list')));
    await tester.pumpAndSettle();
    for (final entry in expectedAssets.entries) {
      final imageFinder = find.byKey(Key('popular-image-${entry.key}'));
      await tester.scrollUntilVisible(
        imageFinder,
        180,
        scrollable: find.descendant(
          of: find.byKey(const Key('popular-category-list')),
          matching: find.byType(Scrollable),
        ),
      );
      final image = tester.widget<Image>(imageFinder);
      expect(_assetName(image.image), entry.value);
    }
  });

  testWidgets('purpose selection is semantic and reveals progressive fields', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await pumpHome(tester);
    final personal = find.byKey(const Key('home-purpose-Personal trip'));
    await tester.ensureVisible(personal);
    await tester.pumpAndSettle();
    await tester.tap(personal);
    await tester.pumpAndSettle();
    expect(find.text('Passengers (optional)'), findsOneWidget);
    final selectedCard = tester.getSemantics(
      find.bySemanticsLabel(RegExp('Personal trip.*City and nearby travel')),
    );
    expect(selectedCard.flagsCollection.isSelected, Tristate.isTrue);
    final selectedSurface = tester.widget<AnimatedContainer>(
      find.byKey(const Key('home-purpose-surface-Personal trip')),
    );
    expect(selectedSurface.duration, const Duration(milliseconds: 220));

    final deliver = find.byKey(const Key('home-purpose-Deliver goods'));
    await tester.ensureVisible(deliver);
    await tester.pumpAndSettle();
    await tester.tap(deliver);
    await tester.pumpAndSettle();
    expect(find.text('Parcel delivery'), findsOneWidget);
    await tester.tap(find.text('Small cargo'));
    await tester.pumpAndSettle();
    expect(find.text('Approx. cargo weight (kg)'), findsOneWidget);
    expect(find.text('Covered cargo space required'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('manual location and valid need navigate to Explore', (
    tester,
  ) async {
    await pumpHome(tester);
    final personal = find.byKey(const Key('home-purpose-Personal trip'));
    await tester.ensureVisible(personal);
    await tester.pumpAndSettle();
    await tester.tap(personal);
    await tester.ensureVisible(find.byKey(const Key('manual-location-field')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('manual-location-field')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Dar es Salaam'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.byKey(const Key('find-vehicles-button')));
    await tester.tap(find.byKey(const Key('find-vehicles-button')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('explore-destination')), findsOneWidget);
  });

  testWidgets('current location works and missing purpose is validated', (
    tester,
  ) async {
    await pumpHome(
      tester,
      currentLocation: () async => const DeviceLocationSuccess(
        GariLocation(
          latitude: -6.7924,
          longitude: 39.2083,
          city: 'Dar es Salaam',
          source: LocationSource.device,
        ),
      ),
    );
    await tester.ensureVisible(find.byKey(const Key('use-current-location')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('use-current-location')));
    await tester.pumpAndSettle();
    expect(find.text('Dar es Salaam'), findsOneWidget);
    await tester.ensureVisible(find.byKey(const Key('find-vehicles-button')));
    await tester.tap(find.byKey(const Key('find-vehicles-button')));
    await tester.pump();
    expect(find.text('Choose what you need transport for.'), findsOneWidget);
  });

  testWidgets('popular and profile actions preserve existing navigation', (
    tester,
  ) async {
    final router = await pumpHome(tester);
    await tester.tap(find.byKey(const Key('home-profile-action')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('profile-destination')), findsOneWidget);
    router.go('/');
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.byKey(const Key('popular-see-all')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('popular-see-all')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('explore-destination')), findsOneWidget);
  });

  testWidgets('popular category shortcut enters existing Explore route', (
    tester,
  ) async {
    await pumpHome(tester);
    await tester.ensureVisible(find.text('Comfortable cars'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Comfortable cars'));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('explore-destination')), findsOneWidget);
  });

  testWidgets('renter shell has clean four-item navigation without owner FAB', (
    tester,
  ) async {
    final router = GoRouter(
      initialLocation: '/home',
      routes: [
        ShellRoute(
          builder: (_, _, child) => ScaffoldWithNavBar(child: child),
          routes: [
            GoRoute(path: '/home', builder: (_, _) => const HomePage()),
            GoRoute(
              path: '/explore',
              builder: (_, _) => const SizedBox.shrink(),
            ),
            GoRoute(path: '/trips', builder: (_, _) => const SizedBox.shrink()),
            GoRoute(
              path: '/profile',
              builder: (_, _) => const SizedBox.shrink(),
            ),
          ],
        ),
        GoRoute(path: '/login', builder: (_, _) => const SizedBox.shrink()),
      ],
    );
    await tester.pumpWidget(
      ProviderScope(
        overrides: [authStateProvider.overrideWith((_) => auth)],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Explore'), findsOneWidget);
    expect(find.text('Trips'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);
    expect(find.byTooltip('Add a vehicle'), findsNothing);
    expect(find.byType(FloatingActionButton), findsNothing);
    final heavyCard = find.byKey(
      const Key('home-purpose-Heavy cargo & long distance'),
    );
    await tester.ensureVisible(heavyCard);
    await tester.pumpAndSettle();
    expect(
      tester.getBottomLeft(heavyCard).dy,
      lessThan(tester.getTopLeft(find.byType(BottomAppBar)).dy),
    );
  });

  testWidgets('390px cards use intentional word-boundary title lines', (
    tester,
  ) async {
    await pumpHome(tester, size: const Size(390, 844));
    for (final entry in <(String, String)>[
      ('Personal trip', 'Personal trip'),
      ('Business transport', 'Business\ntransport'),
    ]) {
      final card = find.byKey(Key('home-purpose-${entry.$1}'));
      final title = tester.widget<Text>(
        find.descendant(of: card, matching: find.text(entry.$2)),
      );
      expect(title.softWrap, isFalse);
      expect(title.maxLines, 2);
    }
  });

  for (final scenario in <(Size, double)>[
    (const Size(320, 720), 1),
    (const Size(360, 800), 1),
    (const Size(390, 844), 1),
    (const Size(430, 900), 1),
    (const Size(600, 960), 1),
    (const Size(390, 844), 2),
  ]) {
    testWidgets(
      'Home has no overflow at ${scenario.$1.width}px and ${scenario.$2}x text',
      (tester) async {
        await pumpHome(tester, size: scenario.$1, textScale: scenario.$2);
        await tester.fling(
          find.byKey(const Key('renter-home-scroll')),
          const Offset(0, -3000),
          2500,
        );
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
        expect(find.text('Popular for you'), findsOneWidget);
      },
    );
  }
}
