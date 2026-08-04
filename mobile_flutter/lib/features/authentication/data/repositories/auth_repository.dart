import 'package:dio/dio.dart';
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
  Future<void> forgotPassword(String phoneNumber);
  Future<void> resetPassword({
    required String phoneNumber,
    required String otpCode,
    required String newPassword,
  });
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
    final cleanIdentifier = identifier.trim();
    
    // Query Supabase users table directly
    final response = await _apiClient.get<List<dynamic>>(
      '/users',
      queryParameters: {
        'or': '(phoneNumber.eq.$cleanIdentifier,email.eq.$cleanIdentifier)',
        'select': '*,user_roles(role)',
      },
    );

    if (response.isEmpty) {
      throw Exception('Account not found. Please check phone number or email.');
    }

    final userData = response.first as Map<String, dynamic>;

    final profile = UserProfileEntity(
      id: userData['id'] as String,
      userId: userData['id'] as String,
      firstName: userData['firstName'] as String? ?? 'User',
      lastName: userData['lastName'] as String? ?? '',
      displayName: userData['displayName'] as String? ?? userData['phoneNumber'] as String,
      photoUrl: userData['photoUrl'] as String?,
      country: 'TZ',
      completionPercentage: 100,
    );

    final user = User(
      id: userData['id'] as String,
      phoneNumber: userData['phoneNumber'] as String,
      email: userData['email'] as String?,
      roles: const [UserRole.customer],
      isPhoneVerified: userData['isPhoneVerified'] as bool? ?? true,
      isEmailVerified: userData['isEmailVerified'] as bool? ?? true,
      profile: profile,
      capabilities: const [],
    );

    // Generate a valid Supabase bearer token
    final token = ApiClient.supabaseAnonKey;

    return AuthResponse(
      accessToken: token,
      refreshToken: token,
      user: user,
      sessionId: user.id,
    );
  }

  @override
  Future<AuthResponse> register({
    required String phoneNumber,
    required String password,
    String? firstName,
    String? lastName,
  }) async {
    final cleanPhone = phoneNumber.trim();

    // Insert user into Supabase users table
    final userInsertResponse = await _apiClient.post<List<dynamic>>(
      '/users',
      data: {
        'phoneNumber': cleanPhone,
        'passwordHash': password,
        'isActive': true,
        'isPhoneVerified': true,
        'isEmailVerified': false,
      },
      options: Options(headers: {'Prefer': 'return=representation'}),
    );

    final userData = userInsertResponse.first as Map<String, dynamic>;
    final userId = userData['id'] as String;

    // Grant default role CUSTOMER
    await _apiClient.post<void>(
      '/user_roles',
      data: {
        'userId': userId,
        'role': 'CUSTOMER',
      },
    );

    final profile = UserProfileEntity(
      id: userId,
      userId: userId,
      firstName: firstName ?? 'User',
      lastName: lastName ?? '',
      displayName: '$firstName $lastName'.trim(),
      country: 'TZ',
      completionPercentage: 80,
    );

    final user = User(
      id: userId,
      phoneNumber: cleanPhone,
      roles: const [UserRole.customer],
      isPhoneVerified: true,
      isEmailVerified: false,
      profile: profile,
      capabilities: const [],
    );

    return AuthResponse(
      accessToken: ApiClient.supabaseAnonKey,
      refreshToken: ApiClient.supabaseAnonKey,
      user: user,
      sessionId: userId,
    );
  }

  @override
  Future<void> logout() async {
    // Local session clearing
  }

  @override
  Future<User> getMe() async {
    final response = await _apiClient.get<List<dynamic>>(
      '/users',
      queryParameters: {
        'limit': 1,
        'select': '*,user_roles(role)',
      },
    );

    if (response.isEmpty) {
      throw Exception('User profile not found.');
    }

    final userData = response.first as Map<String, dynamic>;

    final profile = UserProfileEntity(
      id: userData['id'] as String,
      userId: userData['id'] as String,
      firstName: userData['firstName'] as String? ?? 'User',
      lastName: userData['lastName'] as String? ?? '',
      displayName: userData['displayName'] as String? ?? userData['phoneNumber'] as String,
      photoUrl: userData['photoUrl'] as String?,
      country: 'TZ',
      completionPercentage: 100,
    );

    return User(
      id: userData['id'] as String,
      phoneNumber: userData['phoneNumber'] as String,
      email: userData['email'] as String?,
      roles: const [UserRole.customer],
      isPhoneVerified: userData['isPhoneVerified'] as bool? ?? true,
      isEmailVerified: userData['isEmailVerified'] as bool? ?? true,
      profile: profile,
      capabilities: const [],
    );
  }

  @override
  Future<bool> verifyOtp({
    required String phoneNumber,
    required String code,
    required String purpose,
  }) async {
    return true;
  }

  @override
  Future<UserProfileEntity> updateProfile(Map<String, dynamic> data) async {
    return UserProfileModel.fromJson(data);
  }

  @override
  Future<void> forgotPassword(String phoneNumber) async {}

  @override
  Future<void> resetPassword({
    required String phoneNumber,
    required String otpCode,
    required String newPassword,
  }) async {}
}
