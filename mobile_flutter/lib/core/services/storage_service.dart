import 'dart:async';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final storageServiceProvider = Provider<StorageService>((ref) {
  throw UnimplementedError(
    'Initialize this provider in main.dart with SharedPreferences instance',
  );
});

class StorageService {
  final FlutterSecureStorage _secureStorage;
  final SharedPreferences _sharedPrefs;

  static const String _accessTokenKey = 'gl_access_token';
  static const String _refreshTokenKey = 'gl_refresh_token';
  static const String _userIdKey = 'gl_user_id';
  static const String _pendingPhoneKey = 'gl_pending_verification_phone';

  StorageService(this._secureStorage, this._sharedPrefs);

  Future<void> _pendingWrite = Future.value();
  final _sessionEnded = StreamController<void>.broadcast();
  int _sessionRevision = 0;
  int get sessionRevision => _sessionRevision;
  Stream<void> get sessionEnded => _sessionEnded.stream;

  Future<T> _serialize<T>(Future<T> Function() operation) {
    final result = _pendingWrite.then((_) => operation());
    _pendingWrite = result.then<void>(
      (_) {},
      onError: (Object _, StackTrace _) {},
    );
    return result;
  }

  // Secure Token Accessors
  Future<String?> getAccessToken() async {
    await _pendingWrite;
    return _secureStorage.read(key: _accessTokenKey);
  }

  Future<String?> getRefreshToken() async {
    await _pendingWrite;
    return _secureStorage.read(key: _refreshTokenKey);
  }

  Future<void> setTokens(String accessToken, String refreshToken) {
    _sessionRevision++;
    return _serialize(() => _writeTokens(accessToken, refreshToken));
  }

  Future<void> _writeTokens(String accessToken, String refreshToken) async {
    await Future.wait([
      _secureStorage.write(key: _accessTokenKey, value: accessToken),
      _secureStorage.write(key: _refreshTokenKey, value: refreshToken),
      _secureStorage.delete(key: _pendingPhoneKey),
    ]);
  }

  // Prevent a refresh that finishes after logout from restoring the old account.
  Future<bool> rotateTokens(
    String accessToken,
    String refreshToken,
    int revision,
  ) {
    return _serialize(() async {
      if (revision != _sessionRevision) return false;
      await _writeTokens(accessToken, refreshToken);
      return revision == _sessionRevision;
    });
  }

  Future<void> clearTokens({int? expectedRevision}) {
    if (expectedRevision != null && expectedRevision != _sessionRevision) {
      return Future.value();
    }
    _sessionRevision++;
    _sessionEnded.add(null);
    return _serialize(() async {
      await Future.wait([
        _secureStorage.delete(key: _accessTokenKey),
        _secureStorage.delete(key: _refreshTokenKey),
        _secureStorage.delete(key: _userIdKey),
        _secureStorage.delete(key: _pendingPhoneKey),
      ]);
    });
  }

  // Non-Secure preferences / user ID
  Future<String?> getPendingVerificationPhone() async {
    await _pendingWrite;
    return _secureStorage.read(key: _pendingPhoneKey);
  }

  Future<void> setPendingVerificationPhone(String phone) {
    _sessionRevision++;
    return _serialize(() async {
      await Future.wait([
        _secureStorage.delete(key: _accessTokenKey),
        _secureStorage.delete(key: _refreshTokenKey),
        _secureStorage.delete(key: _userIdKey),
        _secureStorage.write(key: _pendingPhoneKey, value: phone),
      ]);
    });
  }

  Future<String?> getUserId() async {
    await _pendingWrite;
    return _secureStorage.read(key: _userIdKey);
  }

  Future<void> setUserId(String userId) {
    final revision = _sessionRevision;
    return _serialize(() async {
      if (revision != _sessionRevision) return;
      await _secureStorage.write(key: _userIdKey, value: userId);
    });
  }

  // Generic non-secure storage
  String? getString(String key) => _sharedPrefs.getString(key);
  Future<void> setString(String key, String value) =>
      _sharedPrefs.setString(key, value);
  Future<void> remove(String key) => _sharedPrefs.remove(key);
}
