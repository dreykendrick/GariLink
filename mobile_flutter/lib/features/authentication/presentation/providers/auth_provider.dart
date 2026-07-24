import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/storage_service.dart';
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

  const AuthState({
    this.user,
    this.isAuthenticated = false,
    this.isLoading = false,
    this.isHydrated = false,
    this.errorMessage,
  });

  AuthState copyWith({
    User? user,
    bool? isAuthenticated,
    bool? isLoading,
    bool? isHydrated,
    String? errorMessage,
    bool clearError = false,
    bool clearUser = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      isHydrated: isHydrated ?? this.isHydrated,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _authRepository;
  final StorageService _storageService;

  AuthNotifier(this._authRepository, this._storageService) : super(const AuthState());

  Future<void> hydrate() async {
    try {
      final token = await _storageService.getAccessToken();
      if (token != null) {
        final user = await _authRepository.getMe();
        state = AuthState(
          user: user,
          isAuthenticated: true,
          isHydrated: true,
        );
      } else {
        state = state.copyWith(isHydrated: true);
      }
    } catch (_) {
      await _storageService.clearTokens();
      state = state.copyWith(isHydrated: true, clearUser: true, isAuthenticated: false);
    }
  }

  Future<void> login(String identifier, String password) async {
    state = state.copyWith(isLoading: true, errorMessage: null, clearError: true);
    try {
      final response = await _authRepository.login(identifier, password);
      await _storageService.setTokens(response.accessToken, response.refreshToken);
      await _storageService.setUserId(response.user.id);
      
      state = state.copyWith(
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      );
      
      // Refresh to load full capabilities/profile asynchronously
      refreshMe();
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      rethrow;
    }
  }

  Future<void> register({
    required String phoneNumber,
    required String password,
    String? firstName,
    String? lastName,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null, clearError: true);
    try {
      final response = await _authRepository.register(
        phoneNumber: phoneNumber,
        password: password,
        firstName: firstName,
        lastName: lastName,
      );
      await _storageService.setTokens(response.accessToken, response.refreshToken);
      await _storageService.setUserId(response.user.id);

      state = state.copyWith(
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      await _authRepository.logout();
    } catch (_) {}
    await _storageService.clearTokens();
    state = const AuthState(isHydrated: true);
  }

  Future<void> refreshMe() async {
    try {
      final user = await _authRepository.getMe();
      state = state.copyWith(user: user);
    } catch (_) {}
  }

  Future<bool> verifyOtpCode(String code) async {
    if (state.user == null) return false;
    state = state.copyWith(isLoading: true, errorMessage: null, clearError: true);
    try {
      final verified = await _authRepository.verifyOtp(
        phoneNumber: state.user!.phoneNumber,
        code: code,
        purpose: 'PHONE_VERIFICATION',
      );
      if (verified) {
        final updatedUser = state.user!.copyWith(isPhoneVerified: true);
        state = state.copyWith(user: updatedUser, isLoading: false);
        return true;
      }
      state = state.copyWith(isLoading: false, errorMessage: 'Verification failed. Incorrect code.');
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      rethrow;
    }
  }
}
