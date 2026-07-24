import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/api_client.dart';
import '../../domain/entities/user.dart';
import '../models/user_model.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AuthRepositoryImpl(apiClient);
});

abstract class AuthRepository {
  Future<AuthResponse> login(String identifier, String password);
  Future<AuthResponse> register({
    required String phoneNumber,
    required String password,
    String? firstName,
    String? lastName,
  });
  Future<void> logout();
  Future<User> getMe();
  Future<bool> verifyOtp({
    required String phoneNumber,
    required String code,
    required String purpose,
  });
  Future<UserProfileEntity> updateProfile(Map<String, dynamic> data);
}

class AuthResponse {
  final String accessToken;
  final String refreshToken;
  final User user;
  final String sessionId;

  const AuthResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
    required this.sessionId,
  });
}

class AuthRepositoryImpl implements AuthRepository {
  final ApiClient _apiClient;

  const AuthRepositoryImpl(this._apiClient);

  @override
  Future<AuthResponse> login(String identifier, String password) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/auth/login',
      data: {
        'identifier': identifier,
        'password': password,
      },
    );

    final user = UserModel.fromJson(response['user'] as Map<String, dynamic>);
    final session = response['session'] as Map<String, dynamic>;

    return AuthResponse(
      accessToken: response['accessToken'] as String,
      refreshToken: response['refreshToken'] as String,
      user: user,
      sessionId: session['id'] as String,
    );
  }

  @override
  Future<AuthResponse> register({
    required String phoneNumber,
    required String password,
    String? firstName,
    String? lastName,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/auth/register',
      data: {
        'phoneNumber': phoneNumber,
        'password': password,
        if (firstName != null) 'firstName': firstName,
        if (lastName != null) 'lastName': lastName,
      },
    );

    final user = UserModel.fromJson(response['user'] as Map<String, dynamic>);
    final session = response['session'] as Map<String, dynamic>;

    return AuthResponse(
      accessToken: response['accessToken'] as String,
      refreshToken: response['refreshToken'] as String,
      user: user,
      sessionId: session['id'] as String,
    );
  }

  @override
  Future<void> logout() async {
    try {
      await _apiClient.post<void>('/auth/logout');
    } catch (_) {
      // Allow local logout even if API call fails
    }
  }

  @override
  Future<User> getMe() async {
    final response = await _apiClient.get<Map<String, dynamic>>('/me');
    return UserModel.fromJson(response);
  }

  @override
  Future<bool> verifyOtp({
    required String phoneNumber,
    required String code,
    required String purpose,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/auth/otp/verify',
      data: {
        'phoneNumber': phoneNumber,
        'code': code,
        'purpose': purpose,
      },
    );
    return response['verified'] as bool? ?? false;
  }

  @override
  Future<UserProfileEntity> updateProfile(Map<String, dynamic> data) async {
    final response = await _apiClient.post<Map<String, dynamic>>('/profile', data: data);
    return UserProfileModel.fromJson(response);
  }
}
