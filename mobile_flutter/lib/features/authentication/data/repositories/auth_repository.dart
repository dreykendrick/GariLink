import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/api_client.dart';
import '../../../../core/errors/app_exception.dart';
import '../../../../core/validation/tanzanian_phone.dart';
import '../../domain/entities/user.dart';
import '../models/user_model.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AuthRepositoryImpl(apiClient);
});

abstract class AuthRepository {
  Future<AuthResponse> login(String identifier, String password);
  Future<RegistrationResult> register({
    required String phoneNumber,
    required String password,
    String? firstName,
    String? lastName,
  });
  Future<void> logout();
  Future<void> requestOtp(String phoneNumber);
  Future<User> getMe();
  Future<OtpVerificationResult> verifyOtp({
    required String phoneNumber,
    required String code,
    required String purpose,
  });
  Future<UserProfileEntity> updateProfile(Map<String, dynamic> data);
  Future<void> forgotPassword(String phoneNumber);
  Future<void> resetPassword({
    required String phoneNumber,
    required String otpCode,
    required String newPassword,
  });
}

class RegistrationResult {
  final AuthResponse? session;
  final String? pendingPhone;
  const RegistrationResult.authenticated(AuthResponse value)
    : session = value,
      pendingPhone = null;
  const RegistrationResult.pending(String phone)
    : session = null,
      pendingPhone = phone;
}

class OtpVerificationResult {
  final bool verified;
  final AuthResponse? session;
  const OtpVerificationResult({required this.verified, this.session});
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
    final trimmed = identifier.trim();
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/auth/login',
      data: {
        'identifier': trimmed.contains('@')
            ? trimmed.toLowerCase()
            : normalizeTanzanianPhone(trimmed),
        'password': password,
      },
    );
    return _parseAuthResponse(response);
  }

  @override
  Future<RegistrationResult> register({
    required String phoneNumber,
    required String password,
    String? firstName,
    String? lastName,
  }) async {
    final normalizedPhone = normalizeTanzanianPhone(phoneNumber);
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/auth/register',
      data: {
        'phoneNumber': normalizedPhone,
        'password': password,
        'firstName': ?firstName,
        'lastName': ?lastName,
      },
    );
    if (response['requiresVerification'] == true) {
      return RegistrationResult.pending(normalizedPhone);
    }
    return RegistrationResult.authenticated(_parseAuthResponse(response));
  }

  @override
  Future<void> logout() async {
    await _apiClient.post<void>('/auth/logout');
  }

  @override
  Future<User> getMe() async {
    final response = await _apiClient.get<Map<String, dynamic>>('/me');
    return UserModel.fromJson(response);
  }

  @override
  Future<OtpVerificationResult> verifyOtp({
    required String phoneNumber,
    required String code,
    required String purpose,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/auth/otp/verify',
      data: {
        'phoneNumber': normalizeTanzanianPhone(phoneNumber),
        'code': code,
        'purpose': purpose,
      },
    );
    return OtpVerificationResult(
      verified: response['verified'] == true,
      session: response['accessToken'] is String
          ? _parseAuthResponse(response)
          : null,
    );
  }

  @override
  Future<void> requestOtp(String phoneNumber) async {
    await _apiClient.post<void>(
      '/auth/otp/request',
      data: {
        'phoneNumber': normalizeTanzanianPhone(phoneNumber),
        'purpose': 'PHONE_VERIFICATION',
      },
    );
  }

  @override
  Future<UserProfileEntity> updateProfile(Map<String, dynamic> data) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/profile',
      data: data,
    );
    return UserProfileModel.fromJson(response);
  }

  @override
  Future<void> forgotPassword(String phoneNumber) async {
    await _apiClient.post<void>(
      '/auth/password/forgot',
      data: {'phoneNumber': normalizeTanzanianPhone(phoneNumber)},
    );
  }

  @override
  Future<void> resetPassword({
    required String phoneNumber,
    required String otpCode,
    required String newPassword,
  }) async {
    await _apiClient.post<void>(
      '/auth/password/reset',
      data: {
        'phoneNumber': normalizeTanzanianPhone(phoneNumber),
        'otpCode': otpCode,
        'newPassword': newPassword,
      },
    );
  }

  AuthResponse _parseAuthResponse(Map<String, dynamic> json) {
    final accessToken = json['accessToken'];
    final refreshToken = json['refreshToken'];
    if (accessToken is! String ||
        accessToken.isEmpty ||
        refreshToken is! String ||
        refreshToken.isEmpty ||
        json['user'] is! Map<String, dynamic>) {
      throw const ServerException(
        'Sign-in returned an incomplete session. Please try again.',
      );
    }
    final session = json['session'] as Map<String, dynamic>?;
    return AuthResponse(
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: UserModel.fromJson(json['user'] as Map<String, dynamic>),
      sessionId: session?['id'] as String? ?? '',
    );
  }
}
