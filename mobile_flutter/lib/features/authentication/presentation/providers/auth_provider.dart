import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/storage_service.dart';
import '../../../../core/errors/app_exception.dart';
import '../../domain/entities/user.dart';
import '../../data/repositories/auth_repository.dart';

final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authRepository = ref.watch(authRepositoryProvider);
  final storageService = ref.watch(storageServiceProvider);
  return AuthNotifier(authRepository, storageService)..hydrate();
});

class AuthState {
  final User? user;
  final bool isAuthenticated;
  final bool isLoading;
  final bool isHydrated;
  final String? errorMessage;
  final String? pendingPhone;

  const AuthState({
    this.user,
    this.isAuthenticated = false,
    this.isLoading = false,
    this.isHydrated = false,
    this.errorMessage,
    this.pendingPhone,
  });

  AuthState copyWith({
    User? user,
    bool? isAuthenticated,
    bool? isLoading,
    bool? isHydrated,
    String? errorMessage,
    String? pendingPhone,
    bool clearError = false,
    bool clearUser = false,
    bool clearPendingPhone = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      isHydrated: isHydrated ?? this.isHydrated,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      pendingPhone: clearPendingPhone
          ? null
          : (pendingPhone ?? this.pendingPhone),
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _authRepository;
  final StorageService _storageService;
  late final StreamSubscription<void> _sessionSubscription;
  int _operation = 0;

  AuthNotifier(this._authRepository, this._storageService)
    : super(const AuthState()) {
    _sessionSubscription = _storageService.sessionEnded.listen((_) {
      if (!mounted) return;
      _operation++;
      state = const AuthState(isHydrated: true);
    });
  }

  @override
  void dispose() {
    _operation++;
    _sessionSubscription.cancel();
    super.dispose();
  }

  bool _current(int operation) => mounted && operation == _operation;
  String _message(Object error) => error is AppException
      ? error.message
      : 'We could not complete that action. Please try again.';

  Future<void> hydrate() async {
    final operation = ++_operation;
    state = const AuthState(isLoading: true);
    try {
      final token = await _storageService.getAccessToken();
      if (!_current(operation)) return;
      if (token == null || token.isEmpty) {
        final pending = await _storageService.getPendingVerificationPhone();
        if (!_current(operation)) return;
        state = AuthState(isHydrated: true, pendingPhone: pending);
        return;
      }
      final user = await _authRepository.getMe();
      if (_current(operation)) {
        state = AuthState(user: user, isAuthenticated: true, isHydrated: true);
      }
    } on UnauthorizedException {
      if (_current(operation)) {
        await _storageService.clearTokens();
        if (mounted) state = const AuthState(isHydrated: true);
      }
    } catch (error) {
      if (_current(operation)) {
        // Keep the stored session and offer retry; never guess verification or
        // owner privileges when the current profile could not be loaded.
        state = AuthState(errorMessage: _message(error));
      }
    }
  }

  Future<void> _authenticate(Future<AuthResponse> Function() request) async {
    if (state.isLoading) return;
    final operation = ++_operation;
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await request();
      await _acceptSession(response, operation);
    } catch (error) {
      if (_current(operation)) {
        if (error is UnauthorizedException) await _storageService.clearTokens();
        if (mounted) {
          state = AuthState(isHydrated: true, errorMessage: _message(error));
        }
      }
      throw error is AppException ? error : AppException(_message(error));
    }
  }

  Future<void> login(String identifier, String password) =>
      _authenticate(() => _authRepository.login(identifier, password));

  Future<void> _acceptSession(AuthResponse response, int operation) async {
    if (!_current(operation)) return;
    await _storageService.setTokens(
      response.accessToken,
      response.refreshToken,
    );
    if (!_current(operation)) return;
    await _storageService.setUserId(response.user.id);
    var user = response.user;
    try {
      user = await _authRepository.getMe();
    } on UnauthorizedException {
      if (_current(operation)) await _storageService.clearTokens();
      rethrow;
    } on NetworkException {
      // The auth response already contains a server-confirmed identity.
    } on ServerException {
      // Preserve the real session through a secondary profile outage.
    }
    if (_current(operation)) {
      state = AuthState(user: user, isAuthenticated: true, isHydrated: true);
    }
  }

  Future<void> register({
    required String phoneNumber,
    required String password,
    String? firstName,
    String? lastName,
  }) async {
    if (state.isLoading) return;
    final operation = ++_operation;
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _authRepository.register(
        phoneNumber: phoneNumber,
        password: password,
        firstName: firstName,
        lastName: lastName,
      );
      if (!_current(operation)) return;
      final session = result.session;
      if (session != null) {
        await _acceptSession(session, operation);
      } else {
        final phone = result.pendingPhone;
        if (phone == null || phone.isEmpty) {
          throw const ServerException(
            'Registration could not be completed. Please try again.',
          );
        }
        await _storageService.setPendingVerificationPhone(phone);
        if (_current(operation)) {
          state = AuthState(isHydrated: true, pendingPhone: phone);
        }
      }
    } catch (error) {
      if (_current(operation)) {
        state = state.copyWith(isLoading: false, errorMessage: _message(error));
      }
      throw error is AppException ? error : AppException(_message(error));
    }
  }

  Future<void> logout() async {
    final operation = ++_operation;
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _authRepository.logout();
    } on AppException {
      // Local sign-out remains available when the server is unreachable.
    } finally {
      if (_current(operation)) {
        await _storageService.clearTokens();
        if (mounted) state = const AuthState(isHydrated: true);
      }
    }
  }

  Future<void> refreshMe() async {
    final operation = _operation;
    try {
      final user = await _authRepository.getMe();
      if (_current(operation)) {
        state = state.copyWith(user: user, clearError: true);
      }
    } on UnauthorizedException {
      if (_current(operation)) await _storageService.clearTokens();
    } catch (error) {
      if (_current(operation)) {
        state = state.copyWith(errorMessage: _message(error));
      }
    }
  }

  Future<bool> verifyOtpCode(String code) async {
    final user = state.user;
    final phone = state.pendingPhone ?? user?.phoneNumber;
    if (phone == null || state.isLoading) return false;
    final operation = ++_operation;
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _authRepository.verifyOtp(
        phoneNumber: phone,
        code: code,
        purpose: 'PHONE_VERIFICATION',
      );
      if (!_current(operation)) return false;
      final verified = result.verified;
      if (verified && result.session != null) {
        await _acceptSession(result.session!, operation);
        return _current(operation) && state.isAuthenticated;
      }
      if (verified && user == null) {
        throw const ServerException(
          'Verification did not return a session. Please sign in again.',
        );
      }
      state = state.copyWith(
        user: verified ? user?.copyWith(isPhoneVerified: true) : user,
        isLoading: false,
        errorMessage: verified
            ? null
            : 'That code could not be verified. Check it and try again.',
      );
      return verified;
    } catch (error) {
      if (_current(operation)) {
        state = state.copyWith(isLoading: false, errorMessage: _message(error));
      }
      throw error is AppException ? error : AppException(_message(error));
    }
  }

  Future<void> _action(Future<void> Function() action) async {
    if (state.isLoading) return;
    final operation = ++_operation;
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await action();
      if (_current(operation)) state = state.copyWith(isLoading: false);
    } catch (error) {
      if (_current(operation)) {
        state = state.copyWith(isLoading: false, errorMessage: _message(error));
      }
      throw error is AppException ? error : AppException(_message(error));
    }
  }

  Future<void> resendOtp() async {
    final phone = state.pendingPhone ?? state.user?.phoneNumber;
    if (phone == null) {
      throw const UnauthorizedException('Please sign in to verify your phone.');
    }
    await _action(() => _authRepository.requestOtp(phone));
  }

  Future<void> updateProfile(Map<String, dynamic> fields) async {
    final user = state.user;
    if (user == null) {
      throw const UnauthorizedException('Please sign in to edit your profile.');
    }
    if (state.isLoading) {
      throw const AppException('Please wait for the current action to finish.');
    }
    final operation = ++_operation;
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final profile = await _authRepository.updateProfile(fields);
      if (!_current(operation)) {
        throw const UnauthorizedException(
          'Your session has changed. Please try again.',
        );
      }
      state = state.copyWith(
        user: user.copyWith(profile: profile),
        isLoading: false,
      );
    } catch (error) {
      if (_current(operation)) {
        state = state.copyWith(isLoading: false, errorMessage: _message(error));
      }
      throw error is AppException ? error : AppException(_message(error));
    }
  }

  Future<void> forgotPassword(String phoneNumber) =>
      _action(() => _authRepository.forgotPassword(phoneNumber));

  Future<void> resetPassword({
    required String phoneNumber,
    required String otpCode,
    required String newPassword,
  }) => _action(
    () => _authRepository.resetPassword(
      phoneNumber: phoneNumber,
      otpCode: otpCode,
      newPassword: newPassword,
    ),
  );
}
