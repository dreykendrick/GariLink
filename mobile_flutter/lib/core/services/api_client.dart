import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../errors/app_exception.dart';
import 'storage_service.dart';
import '../config/app_environment.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  final client = ApiClient(ref.watch(storageServiceProvider));
  ref.onDispose(client.close);
  return client;
});

class ApiClient {
  final StorageService _storageService;
  late final Dio _dio;
  Future<String?>? _refreshFuture;
  int? _refreshRevision;

  static const _publicAuthPaths = {
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/otp/request',
    '/auth/otp/verify',
    '/auth/password/forgot',
    '/auth/password/reset',
  };

  ApiClient(this._storageService, {String? baseUrl, Dio? dio}) {
    _dio = dio ?? Dio();
    _dio.options = BaseOptions(
      baseUrl: baseUrl ?? AppEnvironment.validatedApiBaseUrl(),
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 20),
      sendTimeout: const Duration(seconds: 20),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    );
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          try {
            final revision = _storageService.sessionRevision;
            options.extra.putIfAbsent('sessionRevision', () => revision);
            if (options.extra['sessionRevision'] != revision) {
              throw const UnauthorizedException(
                'Your session has changed. Please try again.',
              );
            }
            if (!_publicAuthPaths.contains(options.path)) {
              final token = await _storageService.getAccessToken();
              if (revision != _storageService.sessionRevision) {
                throw const UnauthorizedException(
                  'Your session has changed. Please try again.',
                );
              }
              if (token != null && token.isNotEmpty) {
                options.headers['Authorization'] = 'Bearer $token';
              }
            }
            handler.next(options);
          } catch (error) {
            handler.reject(DioException(requestOptions: options, error: error));
          }
        },
        onError: (error, handler) async {
          final request = error.requestOptions;
          final revision = request.extra['sessionRevision'] as int?;
          if (error.response?.statusCode == 401 &&
              !_publicAuthPaths.contains(request.path) &&
              revision == _storageService.sessionRevision &&
              request.headers['Authorization'] != null) {
            try {
              if (request.extra['retried'] == true) {
                await _storageService.clearTokens(expectedRevision: revision);
              } else {
                final current = await _storageService.getAccessToken();
                // A late 401 may belong to the previous token; don't rotate twice.
                final token =
                    current != null &&
                        request.headers['Authorization'] != 'Bearer $current'
                    ? current
                    : await _refresh();
                if (token != null &&
                    revision == _storageService.sessionRevision) {
                  request.extra['retried'] = true;
                  request.headers['Authorization'] = 'Bearer $token';
                  handler.resolve(await _dio.fetch<dynamic>(request));
                  return;
                }
              }
            } on DioException catch (refreshError) {
              handler.reject(refreshError);
              return;
            } catch (refreshError) {
              handler.reject(
                DioException(requestOptions: request, error: refreshError),
              );
              return;
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  Dio get dio => _dio;
  Future<String?> accessToken() => _storageService.getAccessToken();
  void close() => _dio.close(force: true);

  Future<String?> _refresh() async {
    final pending = _refreshFuture;
    if (pending != null &&
        _refreshRevision == _storageService.sessionRevision) {
      return pending;
    }
    _refreshRevision = _storageService.sessionRevision;
    final future = _refreshTokens();
    _refreshFuture = future;
    try {
      return await future;
    } finally {
      if (identical(_refreshFuture, future)) _refreshFuture = null;
    }
  }

  Future<String?> _refreshTokens() async {
    final revision = _storageService.sessionRevision;
    final token = await _storageService.getRefreshToken();
    if (revision != _storageService.sessionRevision) return null;
    if (token == null || token.isEmpty) {
      await _storageService.clearTokens(expectedRevision: revision);
      return null;
    }
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': token},
        options: Options(extra: {'sessionRevision': revision}),
      );
      final access = response.data?['accessToken'];
      final refresh = response.data?['refreshToken'];
      if (access is! String ||
          access.isEmpty ||
          refresh is! String ||
          refresh.isEmpty) {
        throw const ServerException(
          'We could not renew your session. Please try again.',
        );
      }
      return await _storageService.rotateTokens(access, refresh, revision)
          ? access
          : null;
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        await _storageService.clearTokens(expectedRevision: revision);
      }
      // Network errors and server outages do not invalidate credentials.
      rethrow;
    }
  }

  AppException _mapError(DioException error) {
    if (error.error is AppException) return error.error as AppException;
    if ({
      DioExceptionType.connectionTimeout,
      DioExceptionType.receiveTimeout,
      DioExceptionType.sendTimeout,
    }.contains(error.type)) {
      return const NetworkException('Connection timed out. Please try again.');
    }
    if (error.type == DioExceptionType.connectionError) {
      return const NetworkException(
        'Cannot reach GariLink. Check your connection and try again.',
      );
    }
    final status = error.response?.statusCode;
    if (status != null && status >= 500) {
      return const ServerException(
        'GariLink is temporarily unavailable. Please try again shortly.',
      );
    }
    if (status == 429) {
      return const AppException(
        'Too many attempts. Please wait a moment and try again.',
        statusCode: 429,
      );
    }
    final data = error.response?.data;
    final raw = data is Map ? data['message'] : null;
    final messages = raw is List
        ? raw.whereType<String>().take(3).join('\n')
        : raw;
    final message =
        messages is String && messages.isNotEmpty && messages.length <= 500
        ? messages
        : 'We could not complete your request. Please try again.';
    final code = data is Map && data['code'] is String
        ? data['code'] as String
        : null;
    switch (status) {
      case 400:
        return ValidationException(message, code: code);
      case 401:
        return UnauthorizedException(
          'Please sign in again or check your login details.',
          code: code,
        );
      case 403:
        return ForbiddenException(message, code: code);
      case 404:
        return NotFoundException(message, code: code);
      case 409:
        return ConflictException(message, code: code);
      default:
        return AppException(message, code: code, statusCode: status);
    }
  }

  Future<T> _request<T>(
    String method,
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.request<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: (options ?? Options()).copyWith(method: method),
      );
      if (response.requestOptions.extra['sessionRevision'] !=
          _storageService.sessionRevision) {
        throw const UnauthorizedException(
          'Your session has changed. Please try again.',
        );
      }
      // Null is valid for void/dynamic responses, but not a required model.
      if (response.data is T) return response.data as T;
      throw const ServerException(
        'We received an incomplete response. Please try again.',
      );
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) => _request<T>(
    'GET',
    path,
    queryParameters: queryParameters,
    options: options,
  );
  Future<T> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) => _request<T>(
    'POST',
    path,
    data: data,
    queryParameters: queryParameters,
    options: options,
  );
  Future<T> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) => _request<T>(
    'PATCH',
    path,
    data: data,
    queryParameters: queryParameters,
    options: options,
  );
  Future<T> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) => _request<T>(
    'DELETE',
    path,
    data: data,
    queryParameters: queryParameters,
    options: options,
  );
}
