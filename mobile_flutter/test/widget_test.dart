import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:garilink_mobile/main.dart';
import 'package:garilink_mobile/core/services/storage_service.dart';

void main() {
  testWidgets('GariLink welcome screen boots successfully', (WidgetTester tester) async {
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
  });
}
