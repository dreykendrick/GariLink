import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:garilink_mobile/main.dart';
import 'package:garilink_mobile/core/services/storage_service.dart';

void main() {
  testWidgets('GariLink splash and onboarding navigation test', (WidgetTester tester) async {
    // Set up mock values for SharedPreferences
    SharedPreferences.setMockInitialValues({});
    final sharedPrefs = await SharedPreferences.getInstance();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          storageServiceProvider.overrideWithValue(
            StorageService(const FlutterSecureStorage(), sharedPrefs),
          ),
        ],
        child: const GariLinkApp(),
      ),
    );

    // Verify that the Splash screen is loaded first and displays the logo image
    await tester.pump();
    expect(find.byType(Image), findsOneWidget);

    // Fast-forward virtual time to complete the splash transition delay (2.5 seconds)
    await tester.pump(const Duration(seconds: 3));
    await tester.pumpAndSettle();

    // Verify Onboarding Page 1 is loaded
    expect(find.text('Find Cars\nAnywhere'), findsOneWidget);
    expect(find.text('Rent nearby vehicles in minutes.'), findsOneWidget);

    // Tap "Next" to transition to Onboarding Page 2
    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();
    expect(find.text('Turn your vehicle\ninto income'), findsOneWidget);

    // Tap "Next" to transition to Onboarding Page 3
    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();
    expect(find.text('Know where your\nvehicle is'), findsOneWidget);

    // Tap "Get Started" to navigate to the Welcome screen
    await tester.tap(find.text('Get Started'));
    await tester.pumpAndSettle();

    // Verify that the Welcome screen displays
    expect(find.text('GariLink'), findsOneWidget);
    expect(find.text('Sign In'), findsOneWidget);

    // Tap "Sign In" to route to the LoginPage
    await tester.tap(find.text('Sign In'));
    await tester.pumpAndSettle();

    // Verify that the Login page is loaded
    expect(find.text('Welcome Back'), findsOneWidget);
    expect(find.text('Sign in to continue'), findsOneWidget);
  });
}
