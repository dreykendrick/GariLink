import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:garilink_mobile/core/errors/app_exception.dart';
import 'package:garilink_mobile/core/services/storage_service.dart';
import 'package:garilink_mobile/features/authentication/data/repositories/auth_repository.dart';
import 'package:garilink_mobile/features/authentication/domain/entities/user.dart';
import 'package:garilink_mobile/features/authentication/presentation/providers/auth_provider.dart';

const phone = '+255700000001';
const verifiedUser = User(
  id: 'user',
  phoneNumber: phone,
  roles: [UserRole.customer],
  isPhoneVerified: true,
  isEmailVerified: false,
  profile: UserProfileEntity(
    id: 'profile',
    userId: 'user',
    firstName: 'Juma',
    country: 'TZ',
    completionPercentage: 50,
  ),
  capabilities: [],
);
const verifiedSession = AuthResponse(
  accessToken: 'access',
  refreshToken: 'refresh',
  user: verifiedUser,
  sessionId: 'session',
);

class PendingRepository extends AuthRepository {
  Future<RegistrationResult> Function() signup = () async =>
      const RegistrationResult.pending(phone);
  Future<OtpVerificationResult> Function() verify = () async =>
      const OtpVerificationResult(verified: true, session: verifiedSession);
  User me = verifiedUser;
  String? resendPhone;
  @override
  Future<RegistrationResult> register({
    required String phoneNumber,
    required String password,
    String? firstName,
    String? lastName,
  }) => signup();
  @override
  Future<OtpVerificationResult> verifyOtp({
    required String phoneNumber,
    required String code,
    required String purpose,
  }) => verify();
  @override
  Future<User> getMe() async => me;
  @override
  Future<void> logout() async {}
  @override
  Future<void> requestOtp(String phoneNumber) async {
    resendPhone = phoneNumber;
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late StorageService storage;
  late PendingRepository repository;
  late AuthNotifier notifier;
  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
    storage = StorageService(
      const FlutterSecureStorage(),
      await SharedPreferences.getInstance(),
    );
    repository = PendingRepository();
    notifier = AuthNotifier(repository, storage);
    await notifier.hydrate();
  });
  tearDown(() {
    if (notifier.mounted) notifier.dispose();
  });

  Future<void> register() => notifier.register(
    phoneNumber: phone,
    password: 'LongPassword123',
    firstName: 'Juma',
  );

  test(
    'Supabase signup waits for verification without storing tokens or a fake user',
    () async {
      await register();
      expect(notifier.state.pendingPhone, phone);
      expect(notifier.state.isAuthenticated, isFalse);
      expect(notifier.state.user, isNull);
      expect(await storage.getAccessToken(), isNull);
      expect(await storage.getPendingVerificationPhone(), phone);
    },
  );

  test(
    'pending verification survives app restart and supports real resend',
    () async {
      await register();
      notifier.dispose();
      notifier = AuthNotifier(repository, storage);
      await notifier.hydrate();
      expect(notifier.state.pendingPhone, phone);
      await notifier.resendOtp();
      expect(repository.resendPhone, phone);
    },
  );

  test(
    'successful verification installs real session and registered profile',
    () async {
      await register();
      expect(await notifier.verifyOtpCode('123456'), isTrue);
      expect(notifier.state.isAuthenticated, isTrue);
      expect(notifier.state.user?.profile?.firstName, 'Juma');
      expect(notifier.state.pendingPhone, isNull);
      expect(await storage.getPendingVerificationPhone(), isNull);
      expect(await storage.getAccessToken(), 'access');
    },
  );

  test('failed verification keeps the phone and permits retry', () async {
    await register();
    repository.verify = () async => throw const NetworkException('Offline');
    await expectLater(
      notifier.verifyOtpCode('123456'),
      throwsA(isA<NetworkException>()),
    );
    expect(notifier.state.pendingPhone, phone);
    expect(notifier.state.isLoading, isFalse);
    expect(await storage.getAccessToken(), isNull);
  });

  test(
    'verification cannot authenticate a pending user without session tokens',
    () async {
      await register();
      repository.verify = () async =>
          const OtpVerificationResult(verified: true);
      await expectLater(
        notifier.verifyOtpCode('123456'),
        throwsA(isA<ServerException>()),
      );
      expect(notifier.state.isAuthenticated, isFalse);
      expect(await storage.getAccessToken(), isNull);
    },
  );

  test('late verification cannot restore the account after sign-out', () async {
    await register();
    final completer = Completer<OtpVerificationResult>();
    repository.verify = () => completer.future;
    final pending = notifier.verifyOtpCode('123456');
    await notifier.logout();
    completer.complete(
      const OtpVerificationResult(verified: true, session: verifiedSession),
    );
    expect(await pending, isFalse);
    expect(notifier.state.isAuthenticated, isFalse);
    expect(await storage.getAccessToken(), isNull);
    expect(await storage.getPendingVerificationPhone(), isNull);
  });

  test(
    'late registration cannot restore pending verification after cancellation',
    () async {
      final completer = Completer<RegistrationResult>();
      repository.signup = () => completer.future;
      final pending = register();
      await notifier.logout();
      completer.complete(const RegistrationResult.pending(phone));
      await pending;
      expect(notifier.state.pendingPhone, isNull);
      expect(await storage.getPendingVerificationPhone(), isNull);
    },
  );

  test(
    'legacy backend registration remains compatible during migration',
    () async {
      repository.me = verifiedUser.copyWith(isPhoneVerified: false);
      repository.signup = () async => RegistrationResult.authenticated(
        AuthResponse(
          accessToken: 'legacy-access',
          refreshToken: 'legacy-refresh',
          user: repository.me,
          sessionId: 'legacy-session',
        ),
      );
      await register();
      expect(notifier.state.isAuthenticated, isTrue);
      expect(notifier.state.user?.isPhoneVerified, isFalse);
      expect(notifier.state.pendingPhone, isNull);
      expect(await storage.getAccessToken(), 'legacy-access');
    },
  );
}
