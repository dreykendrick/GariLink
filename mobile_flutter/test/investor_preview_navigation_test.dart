import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:go_router/go_router.dart';
import 'package:garilink_mobile/main.dart';
import 'package:garilink_mobile/core/navigation/app_router.dart';
import 'package:garilink_mobile/core/preview/investor_preview.dart';
import 'package:garilink_mobile/core/preview/preview_banner.dart';
import 'package:garilink_mobile/core/services/storage_service.dart';
import 'package:garilink_mobile/features/authentication/data/repositories/auth_repository.dart';
import 'email_auth_test.dart' as fixtures;

class PreviewProfiles extends fixtures.EmailRepository {
  final identifiers = <String>[];
  @override
  Future<AuthResponse> login(String identifier, String password) async {
    identifiers.add(identifier);
    return fixtures.emailSession;
  }
}

void main() {
  for (final width in [320.0, 390.0]) {
    testWidgets(
      'preview builder menu has Overlay and Navigator at $width / 200% text',
      (tester) async {
        tester.view.physicalSize = Size(width, 800);
        tester.view.devicePixelRatio = 1;
        tester.platformDispatcher.textScaleFactorTestValue = 2;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
        SharedPreferences.setMockInitialValues({});
        FlutterSecureStorage.setMockInitialValues({});
        final prefs = await SharedPreferences.getInstance();
        final profiles = PreviewProfiles();
        final router = GoRouter(
          routes: [
            GoRoute(
              path: '/',
              builder: (_, _) => const Scaffold(body: Text('Initial screen')),
            ),
            GoRoute(
              path: '/home',
              builder: (_, _) => const Scaffold(body: Text('Renter screen')),
            ),
            GoRoute(
              path: '/owner-dashboard',
              builder: (_, _) => const Scaffold(body: Text('Owner screen')),
            ),
          ],
        );
        addTearDown(router.dispose);
        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              storageServiceProvider.overrideWithValue(
                StorageService(const FlutterSecureStorage(), prefs),
              ),
              authRepositoryProvider.overrideWithValue(profiles),
              routerProvider.overrideWithValue(router),
            ],
            child: investorPreview
                ? const GariLinkApp()
                : MaterialApp.router(
                    routerConfig: router,
                    builder: (_, child) =>
                        InvestorPreviewNavigator(router: router, child: child!),
                  ),
          ),
        );
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
        final menu = find.byType(PopupMenuButton<String>);
        expect(menu, findsOneWidget);
        await tester.longPress(menu);
        await tester.pumpAndSettle();
        expect(find.text('Demo profiles and reset'), findsOneWidget);
        expect(tester.takeException(), isNull);
        await tester.pump(const Duration(seconds: 4));
        await tester.pumpAndSettle();
        await tester.tap(menu);
        await tester.pumpAndSettle();
        expect(find.text('Use Demo renter'), findsOneWidget);
        expect(find.text('Use Demo owner'), findsOneWidget);
        expect(find.text('Reset local demo'), findsOneWidget);
        await tester.tap(find.text('Use Demo owner'));
        await tester.pumpAndSettle();
        expect(find.text('Owner screen'), findsOneWidget);
        expect(profiles.identifiers.last, 'owner@investor.example.invalid');
        await tester.tap(menu);
        await tester.pumpAndSettle();
        await tester.tap(find.text('Use Demo renter'));
        await tester.pumpAndSettle();
        expect(find.text('Renter screen'), findsOneWidget);
        await tester.tap(menu);
        await tester.pumpAndSettle();
        await tester.tap(find.text('Reset local demo'));
        await tester.pumpAndSettle();
        expect(profiles.identifiers.last, 'renter@investor.example.invalid');
        expect(find.text('Renter screen'), findsOneWidget);
        expect(tester.takeException(), isNull);
      },
    );
  }
}
