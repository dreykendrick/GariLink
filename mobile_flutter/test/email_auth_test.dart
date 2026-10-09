import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:garilink_mobile/core/services/storage_service.dart';
import 'package:garilink_mobile/core/navigation/app_router.dart';
import 'package:garilink_mobile/core/theme/app_theme.dart';
import 'package:garilink_mobile/core/errors/app_exception.dart';
import 'package:garilink_mobile/features/authentication/data/models/user_model.dart';
import 'package:garilink_mobile/features/authentication/data/repositories/auth_repository.dart';
import 'package:garilink_mobile/features/authentication/domain/entities/user.dart';
import 'package:garilink_mobile/features/authentication/presentation/providers/auth_provider.dart';

const emailUser = User(
  id: 'email-user',
  phoneNumber: '',
  email: 'team@example.com',
  roles: [UserRole.customer],
  isPhoneVerified: false,
  isEmailVerified: true,
  capabilities: [],
);
const emailSession = AuthResponse(
  accessToken: 'access',
  refreshToken: 'refresh',
  user: emailUser,
  sessionId: 'session',
);

class EmailRepository extends AuthRepository {
  String? registeredEmail;
  bool expiredConfirmation = false;
  @override
  Future<RegistrationResult> registerEmail(
    String email,
    String password,
  ) async {
    registeredEmail = email;
    return RegistrationResult.email(email);
  }

  @override
  Future<AuthResponse> login(String identifier, String password) async =>
      emailSession;
  @override
  Future<AuthResponse> confirmEmail(String tokenHash) async {
    if (expiredConfirmation) {
      throw const ForbiddenException('This link has expired.');
    }
    return emailSession;
  }

  @override
  Future<User> getMe() async => emailUser;
  @override
  Future<void> logout() async {}
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late StorageService storage;
  late EmailRepository repository;
  late AuthNotifier auth;
  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
    storage = StorageService(
      const FlutterSecureStorage(),
      await SharedPreferences.getInstance(),
    );
    repository = EmailRepository();
    auth = AuthNotifier(repository, storage);
    await auth.hydrate();
  });
  tearDown(() {
    if (auth.mounted) auth.dispose();
  });
  test('absent and null phone deserialize and round-trip safely', () {
    for (final json in [
      <String, dynamic>{'id': 'user'},
      <String, dynamic>{'id': 'user', 'phoneNumber': null},
    ]) {
      final user = UserModel.fromJson(json);
      expect(user.phoneNumber, '');
      expect(UserModel.toJson(user)['phoneNumber'], '');
    }
  });
  test(
    'email signup persists pending confirmation without a phone or session',
    () async {
      await auth.registerEmail('team@example.com', 'StrongPass123');
      expect(auth.state.pendingEmail, 'team@example.com');
      expect(auth.state.pendingPhone, isNull);
      expect(auth.state.isAuthenticated, isFalse);
      expect(await storage.getAccessToken(), isNull);
      final restored = AuthNotifier(repository, storage);
      addTearDown(restored.dispose);
      await restored.hydrate();
      expect(restored.state.pendingEmail, 'team@example.com');
    },
  );
  test('expired confirmation preserves pending account for retry', () async {
    await auth.registerEmail('team@example.com', 'StrongPass123');
    repository.expiredConfirmation = true;
    await expectLater(
      auth.confirmEmail('expired'),
      throwsA(isA<ForbiddenException>()),
    );
    expect(auth.state.pendingEmail, 'team@example.com');
    expect(auth.state.isAuthenticated, isFalse);
    expect(await storage.getAccessToken(), isNull);
  });
  test(
    'confirmation accepts server session and clears pending state',
    () async {
      await auth.registerEmail('team@example.com', 'StrongPass123');
      await auth.confirmEmail('one-time');
      expect(auth.state.isAuthenticated, isTrue);
      expect(auth.state.user!.isPhoneVerified, isFalse);
      expect(await storage.getPendingEmail(), isNull);
      expect(await storage.getAccessToken(), 'access');
    },
  );
  test(
    'confirmed email session restores without phone and logout clears it',
    () async {
      await auth.login('team@example.com', 'StrongPass123');
      final restored = AuthNotifier(repository, storage);
      addTearDown(restored.dispose);
      await restored.hydrate();
      expect(restored.state.isAuthenticated, isTrue);
      await auth.logout();
      expect(await storage.getAccessToken(), isNull);
    },
  );
  testWidgets(
    'confirmed email account is not globally redirected to phone verification',
    (tester) async {
      await tester.runAsync(
        () => auth.login('team@example.com', 'StrongPass123'),
      );
      final container = ProviderContainer(
        overrides: [
          authStateProvider.overrideWith((ref) => auth),
          storageServiceProvider.overrideWithValue(storage),
        ],
      );
      final router = container.read(routerProvider);
      router.go('/profile');
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp.router(
            routerConfig: router,
            theme: AppTheme.lightTheme,
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 500));
      expect(router.routeInformationProvider.value.uri.path, '/profile');
      await tester.pumpWidget(const SizedBox());
      container.dispose();
    },
  );
  for (final width in [320.0, 360.0, 390.0, 430.0, 600.0]) {
    testWidgets('email-only signup fits $width at 200% text', (tester) async {
      tester.view.physicalSize = Size(width, 720);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final container = ProviderContainer(
        overrides: [
          authStateProvider.overrideWith((ref) => auth),
          storageServiceProvider.overrideWithValue(storage),
        ],
      );
      final router = container.read(routerProvider);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp.router(
            theme: AppTheme.lightTheme,
            routerConfig: router,
            builder: (context, child) => MediaQuery(
              data: MediaQuery.of(
                context,
              ).copyWith(textScaler: TextScaler.linear(2)),
              child: child!,
            ),
          ),
        ),
      );
      router.go('/register');
      await tester.pumpAndSettle();
      expect(find.text('Email'), findsOneWidget);
      expect(find.text('Phone number *'), findsNothing);
      expect(find.byType(TextFormField), findsNWidgets(2));
      expect(tester.takeException(), isNull);
      await tester.ensureVisible(find.text('Create account'));
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      container.dispose();
    });
  }
}
