import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../errors/app_exception.dart';
import 'storage_service.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  final storageService = ref.watch(storageServiceProvider);
  return ApiClient(storageService);
});

class ApiClient {
  final StorageService _storageService;
  late final Dio _dio;
  late final Dio _refreshDio;

  static const String _defaultBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api/v1',
  );

  ApiClient(this._storageService, {String? baseUrl}) {
    final finalBaseUrl = baseUrl ?? _defaultBaseUrl;

    _dio = Dio(
      BaseOptions(
        baseUrl: finalBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _refreshDio = Dio(
      BaseOptions(
        baseUrl: finalBaseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _setupInterceptors();
  }

  Dio get dio => _dio;

  void _setupInterceptors() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storageService.getAccessToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (options, handler) async {
          final error = options;
          final response = error.response;

          // Silent JWT refresh handler for 401 errors
          if (response != null && response.statusCode == 401) {
            final refreshToken = await _storageService.getRefreshToken();
            if (refreshToken != null) {
              try {
                // Request token refresh using refreshDio to avoid cyclic loops
                final refreshResponse = await _refreshDio.post(
                  '/auth/refresh',
                  data: {'refreshToken': refreshToken},
                );

                if (refreshResponse.statusCode == 201 || refreshResponse.statusCode == 200) {
                  final data = refreshResponse.data as Map<String, dynamic>;
                  final newAccessToken = data['accessToken'] as String;
                  final newRefreshToken = data['refreshToken'] as String;

                  // Save new credentials
                  await _storageService.setTokens(newAccessToken, newRefreshToken);

                  // Retry the original request with the new bearer token
                  error.requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
                  
                  final retryResponse = await _dio.fetch(error.requestOptions);
                  return handler.resolve(retryResponse);
                }
              } catch (_) {
                // Refresh failed: clear storage credentials to trigger Welcome redirect
                await _storageService.clearTokens();
              }
            } else {
              await _storageService.clearTokens();
            }
          }

          // Map other response/network exceptions to Domain AppException
          return handler.next(
            DioException(
              requestOptions: error.requestOptions,
              response: error.response,
              type: error.type,
              error: _mapError(error),
            ),
          );
        },
      ),
    );
  }

  AppException _mapError(DioException error) {
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout) {
      return const NetworkException('Connection timed out. Please try again.');
    }

    if (error.type == DioExceptionType.connectionError) {
      return const NetworkException('No internet connection. Please check your network.');
    }

    final response = error.response;
    if (response != null) {
      final statusCode = response.statusCode;
      final data = response.data;
      String message = 'An unexpected server error occurred';
      String? errorCode;

      if (data is Map<String, dynamic>) {
        message = data['message'] ?? message;
        errorCode = data['code'];
      }

      switch (statusCode) {
        case 400:
          return ValidationException(message, code: errorCode);
        case 401:
          return UnauthorizedException(message, code: errorCode);
        case 403:
          return ForbiddenException(message, code: errorCode);
        case 404:
          return NotFoundException(message, code: errorCode);
        case 409:
          return ConflictException(message, code: errorCode);
        case 500:
          return ServerException(message, code: errorCode);
        default:
          return AppException(message, code: errorCode, statusCode: statusCode);
      }
    }

    return AppException(error.message ?? 'An unknown error occurred');
  }

  // HTTP helper utilities mapping directly to API call shapes
  Future<T> get<T>(String path, {Map<String, dynamic>? queryParameters, Options? options}) async {
    try {
      final response = await _dio.get<T>(path, queryParameters: queryParameters, options: options);
      return response.data!;
    } on DioException catch (e) {
      throw e.error is AppException ? e.error as AppException : AppException(e.message ?? '');
    }
  }

  Future<T> post<T>(String path, {dynamic data, Map<String, dynamic>? queryParameters, Options? options}) async {
    try {
      final response = await _dio.post<T>(path, data: data, queryParameters: queryParameters, options: options);
      return response.data!;
    } on DioException catch (e) {
      throw e.error is AppException ? e.error as AppException : AppException(e.message ?? '');
    }
  }

  Future<T> patch<T>(String path, {dynamic data, Map<String, dynamic>? queryParameters, Options? options}) async {
    try {
      final response = await _dio.patch<T>(path, data: data, queryParameters: queryParameters, options: options);
      return response.data!;
    } on DioException catch (e) {
      throw e.error is AppException ? e.error as AppException : AppException(e.message ?? '');
    }
  }

  Future<T> delete<T>(String path, {dynamic data, Map<String, dynamic>? queryParameters, Options? options}) async {
    try {
      final response = await _dio.delete<T>(path, data: data, queryParameters: queryParameters, options: options);
      return response.data!;
    } on DioException catch (e) {
      throw e.error is AppException ? e.error as AppException : AppException(e.message ?? '');
    }
  }
}
