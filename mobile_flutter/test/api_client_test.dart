import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:garilink_mobile/core/errors/app_exception.dart';
import 'package:garilink_mobile/core/services/api_client.dart';
import 'package:garilink_mobile/core/services/storage_service.dart';

class TestAdapter implements HttpClientAdapter {
  final Future<ResponseBody> Function(RequestOptions) respond;
  TestAdapter(this.respond);
  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) => respond(options);
  @override
  void close({bool force = false}) {}
}

ResponseBody jsonResponse(int status, Object? body) => ResponseBody.fromString(
  body == null ? '' : jsonEncode(body),
  status,
  headers: {
    Headers.contentTypeHeader: [Headers.jsonContentType],
  },
);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late StorageService storage;
  late ApiClient client;
  setUp(() async {
    FlutterSecureStorage.setMockInitialValues({});
    SharedPreferences.setMockInitialValues({});
    storage = StorageService(
      const FlutterSecureStorage(),
      await SharedPreferences.getInstance(),
    );
    client = ApiClient(storage, baseUrl: 'https://example.test/api/v1');
  });
  tearDown(() => client.close());

  test('204 responses are valid for void actions', () async {
    client.dio.httpClientAdapter = TestAdapter(
      (_) async => jsonResponse(204, null),
    );
    await client.post<void>('/auth/logout');
  });

  test(
    'a missing required response body produces a recoverable error',
    () async {
      client.dio.httpClientAdapter = TestAdapter(
        (_) async => jsonResponse(204, null),
      );
      await expectLater(
        client.get<Map<String, dynamic>>('/me'),
        throwsA(isA<ServerException>()),
      );
    },
  );

  test('validation arrays do not crash error parsing', () async {
    client.dio.httpClientAdapter = TestAdapter(
      (_) async => jsonResponse(400, {
        'message': ['Phone number is required', 'Password is too short'],
      }),
    );
    await expectLater(
      client.post<void>('/auth/register'),
      throwsA(
        isA<ValidationException>().having(
          (e) => e.message,
          'message',
          contains('Phone number is required'),
        ),
      ),
    );
  });

  test('server internals are not shown to users', () async {
    client.dio.httpClientAdapter = TestAdapter(
      (_) async =>
          jsonResponse(503, {'message': 'secret database stack trace'}),
    );
    await expectLater(
      client.get<void>('/listings'),
      throwsA(
        isA<ServerException>().having(
          (e) => e.message,
          'message',
          isNot(contains('database')),
        ),
      ),
    );
  });

  test('concurrent expired requests share one refresh', () async {
    await storage.setTokens('old-access', 'old-refresh');
    final bothExpired = Completer<void>();
    var expired = 0;
    var refreshCount = 0;
    client.dio.httpClientAdapter = TestAdapter((request) async {
      if (request.path == '/auth/refresh') {
        refreshCount++;
        await bothExpired.future;
        return jsonResponse(200, {
          'accessToken': 'new-access',
          'refreshToken': 'new-refresh',
        });
      }
      if (request.headers['Authorization'] == 'Bearer old-access') {
        expired++;
        if (expired == 2) bothExpired.complete();
        return jsonResponse(401, {});
      }
      return jsonResponse(200, {'ok': true});
    });
    final responses = await Future.wait([
      client.get<Map<String, dynamic>>('/me'),
      client.get<Map<String, dynamic>>('/trips'),
    ]);
    expect(responses.every((response) => response['ok'] == true), isTrue);
    expect(refreshCount, 1);
    expect(await storage.getRefreshToken(), 'new-refresh');
  });

  test('a temporary refresh outage preserves credentials', () async {
    await storage.setTokens('old-access', 'old-refresh');
    client.dio.httpClientAdapter = TestAdapter(
      (request) async =>
          jsonResponse(request.path == '/auth/refresh' ? 503 : 401, {}),
    );
    await expectLater(client.get<void>('/me'), throwsA(isA<ServerException>()));
    expect(await storage.getRefreshToken(), 'old-refresh');
  });

  test('invalid credentials never cause a refresh request', () async {
    await storage.setTokens('existing-access', 'existing-refresh');
    var calls = 0;
    client.dio.httpClientAdapter = TestAdapter((request) async {
      calls++;
      expect(request.path, '/auth/login');
      expect(request.headers['Authorization'], isNull);
      return jsonResponse(401, {});
    });
    await expectLater(
      client.post<void>('/auth/login'),
      throwsA(isA<UnauthorizedException>()),
    );
    expect(calls, 1);
    expect(await storage.getRefreshToken(), 'existing-refresh');
  });

  test('logout prevents a pending refresh from restoring tokens', () async {
    await storage.setTokens('old-access', 'old-refresh');
    final refreshing = Completer<void>();
    final release = Completer<void>();
    client.dio.httpClientAdapter = TestAdapter((request) async {
      if (request.path == '/auth/refresh') {
        refreshing.complete();
        await release.future;
        return jsonResponse(200, {
          'accessToken': 'new-access',
          'refreshToken': 'new-refresh',
        });
      }
      return jsonResponse(401, {});
    });
    final result = expectLater(
      client.get<void>('/me'),
      throwsA(isA<UnauthorizedException>()),
    );
    await refreshing.future;
    await storage.clearTokens();
    release.complete();
    await result;
    expect(await storage.getAccessToken(), isNull);
    expect(await storage.getRefreshToken(), isNull);
  });
}
