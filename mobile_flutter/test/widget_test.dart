import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:garilink_mobile/main.dart';
import 'package:garilink_mobile/core/services/storage_service.dart';
import 'package:garilink_mobile/features/authentication/presentation/pages/login_page.dart';

void main() {
  testWidgets('GariLink welcome screen boots and navigates to login successfully', (WidgetTester tester) async {
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

    // Let the GoRouter animations settle
    await tester.pumpAndSettle();

    // Verify that the GariLink title and buttons are shown on the welcome page
    expect(find.text('GariLink'), findsOneWidget);
    expect(find.text('Sign In'), findsOneWidget);
    expect(find.text('Browse without signing in'), findsOneWidget);

    // Tap the "Sign In" button and trigger navigation frame transitions
    await tester.tap(find.text('Sign In'));
    await tester.pumpAndSettle();

    // Verify that the Login page is loaded and displays login header texts
    expect(find.text('Welcome back'), findsOneWidget);
    expect(find.text('Sign in to your GariLink account'), findsOneWidget);
  });
}
