import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'core/theme/app_theme.dart';
import 'core/navigation/app_router.dart';
import 'core/services/storage_service.dart';
import 'core/services/error_reporter.dart';

void main() {
  const reporter = SafeErrorReporter();
  runZonedGuarded(() async {
    WidgetsFlutterBinding.ensureInitialized();
    FlutterError.onError = (details) {
      FlutterError.presentError(details);
      reporter.record(
        details.exception,
        details.stack ?? StackTrace.current,
        fatal: false,
      );
    };
    PlatformDispatcher.instance.onError = (error, stack) {
      reporter.record(error, stack, fatal: true);
      return true;
    };
    final sharedPrefs = await SharedPreferences.getInstance();
    runApp(
      ProviderScope(
        overrides: [
          storageServiceProvider.overrideWithValue(
            StorageService(const FlutterSecureStorage(), sharedPrefs),
          ),
        ],
        child: const GariLinkApp(),
      ),
    );
  }, (error, stack) => reporter.record(error, stack, fatal: true));
}

class GariLinkApp extends ConsumerWidget {
  const GariLinkApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'GariLink',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      // The current screens and imagery were designed for the light palette.
      // Keep one coherent supported theme until every surface has a dark variant.
      themeMode: ThemeMode.light,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
