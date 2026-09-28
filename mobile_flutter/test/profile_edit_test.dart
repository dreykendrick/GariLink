import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:garilink_mobile/core/errors/app_exception.dart';
import 'package:garilink_mobile/core/services/storage_service.dart';
import 'package:garilink_mobile/features/authentication/data/repositories/auth_repository.dart';
import 'package:garilink_mobile/features/authentication/domain/entities/user.dart';
import 'package:garilink_mobile/features/authentication/presentation/providers/auth_provider.dart';
import 'package:garilink_mobile/features/profile/presentation/pages/edit_profile_sheet.dart';

const originalProfile = UserProfileEntity(
  id: 'profile',
  userId: 'user',
  firstName: 'Juma',
  lastName: 'Rashid',
  country: 'TZ',
  completionPercentage: 40,
);
const changedProfile = UserProfileEntity(
  id: 'profile',
  userId: 'user',
  firstName: 'Asha',
  lastName: 'Rashid',
  country: 'TZ',
  completionPercentage: 40,
);
const testUser = User(
  id: 'user',
  phoneNumber: '+255700000001',
  roles: [UserRole.customer],
  isPhoneVerified: true,
  isEmailVerified: false,
  profile: originalProfile,
  capabilities: [],
);

class ProfileRepositoryFake implements AuthRepository {
  Future<UserProfileEntity> Function(Map<String, dynamic>) save = (_) async =>
      changedProfile;
  Map<String, dynamic>? submitted;
  @override
  Future<User> getMe() async => testUser;
  @override
  Future<void> logout() async {}
  @override
  Future<UserProfileEntity> updateProfile(Map<String, dynamic> data) {
    submitted = data;
    return save(data);
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late AuthNotifier notifier;
  late ProfileRepositoryFake repository;
  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
    final storage = StorageService(
      const FlutterSecureStorage(),
      await SharedPreferences.getInstance(),
    );
    await storage.setTokens('access', 'refresh');
    repository = ProfileRepositoryFake();
    notifier = AuthNotifier(repository, storage);
    await notifier.hydrate();
  });
  tearDown(() {
    if (notifier.mounted) notifier.dispose();
  });

  test(
    'saving publishes the server-confirmed profile to account state',
    () async {
      await notifier.updateProfile({'firstName': 'Asha'});
      expect(notifier.state.user?.profile?.firstName, 'Asha');
      expect(notifier.state.isLoading, isFalse);
    },
  );

  test(
    'a failed save preserves the existing profile and allows retry',
    () async {
      repository.save = (_) async =>
          throw const NetworkException('Check your connection');
      await expectLater(
        notifier.updateProfile({'firstName': 'Asha'}),
        throwsA(isA<NetworkException>()),
      );
      expect(notifier.state.user?.profile, originalProfile);
      expect(notifier.state.isLoading, isFalse);
      expect(notifier.state.errorMessage, 'Check your connection');
    },
  );

  test('a late save cannot restore a signed-out account', () async {
    final pending = Completer<UserProfileEntity>();
    repository.save = (_) => pending.future;
    final result = expectLater(
      notifier.updateProfile({'firstName': 'Asha'}),
      throwsA(isA<UnauthorizedException>()),
    );
    await notifier.logout();
    pending.complete(changedProfile);
    await result;
    expect(notifier.state.isAuthenticated, isFalse);
    expect(notifier.state.user, isNull);
  });

  testWidgets(
    'profile form validates, submits trimmed input and closes on success',
    (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [authStateProvider.overrideWith((_) => notifier)],
          child: MaterialApp(
            home: Scaffold(
              body: Builder(
                builder: (context) => TextButton(
                  onPressed: () => showEditProfileSheet(context, testUser),
                  child: const Text('Edit profile'),
                ),
              ),
            ),
          ),
        ),
      );
      await tester.tap(find.text('Edit profile'));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).first, '');
      await tester.ensureVisible(find.text('Save changes'));
      await tester.tap(find.text('Save changes'));
      await tester.pumpAndSettle();
      expect(find.text('Enter your first name'), findsOneWidget);
      expect(repository.submitted, isNull);
      await tester.enterText(find.byType(TextFormField).first, '  Asha  ');
      await tester.ensureVisible(find.text('Save changes'));
      await tester.tap(find.text('Save changes'));
      await tester.pumpAndSettle();
      expect(repository.submitted?['firstName'], 'Asha');
      expect(find.text('Personal information'), findsNothing);
      expect(notifier.state.user?.profile?.firstName, 'Asha');
    },
  );
}
