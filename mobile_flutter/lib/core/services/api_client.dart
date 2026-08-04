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

  static const String supabaseUrl = 'https://orlrgjjbmnjxqbhheago.supabase.co';
  static const String supabaseAnonKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybHJnampibW5qeHFiaGhlYWdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTQ0MzAsImV4cCI6MjEwMTM3MDQzMH0.0sLlOKNF20Nf0qDBzgVaTozHVA8nEv4HbKeCl2bDOuo';

  static const String _defaultBaseUrl = '$supabaseUrl/rest/v1';

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
          'apikey': supabaseAnonKey,
          'Authorization': 'Bearer $supabaseAnonKey',
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
          final userToken = await _storageService.getAccessToken();
          if (userToken != null && userToken.isNotEmpty) {
            // Include user session bearer token if available
            options.headers['Authorization'] = 'Bearer $userToken';
          } else {
            options.headers['Authorization'] = 'Bearer $supabaseAnonKey';
          }
          options.headers['apikey'] = supabaseAnonKey;
          return handler.next(options);
        },
        onError: (options, handler) async {
          final error = options;
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
      String message = 'An error occurred';
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
