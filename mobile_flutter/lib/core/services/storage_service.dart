import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final storageServiceProvider = Provider<StorageService>((ref) {
  throw UnimplementedError('Initialize this provider in main.dart with SharedPreferences instance');
});

class StorageService {
  final FlutterSecureStorage _secureStorage;
  final SharedPreferences _sharedPrefs;

  static const String _accessTokenKey = 'gl_access_token';
  static const String _refreshTokenKey = 'gl_refresh_token';
  static const String _userIdKey = 'gl_user_id';

  const StorageService(this._secureStorage, this._sharedPrefs);

  // Secure Token Accessors
  Future<String?> getAccessToken() async {
    try {
      return await _secureStorage.read(key: _accessTokenKey);
    } catch (e) {
      return null;
    }
  }

  Future<String?> getRefreshToken() async {
    try {
      return await _secureStorage.read(key: _refreshTokenKey);
    } catch (e) {
      return null;
    }
  }

  Future<void> setTokens(String accessToken, String refreshToken) async {
    try {
      await Future.wait([
        _secureStorage.write(key: _accessTokenKey, value: accessToken),
        _secureStorage.write(key: _refreshTokenKey, value: refreshToken),
      ]);
    } catch (_) {}
  }

  Future<void> clearTokens() async {
    try {
      await Future.wait([
        _secureStorage.delete(key: _accessTokenKey),
        _secureStorage.delete(key: _refreshTokenKey),
        _secureStorage.delete(key: _userIdKey),
      ]);
    } catch (_) {}
  }

  // Non-Secure preferences / user ID
  Future<String?> getUserId() async {
    try {
      return await _secureStorage.read(key: _userIdKey);
    } catch (e) {
      return null;
    }
  }

  Future<void> setUserId(String userId) async {
    try {
      await _secureStorage.write(key: _userIdKey, value: userId);
    } catch (_) {}
  }

  // Generic non-secure storage
  String? getString(String key) => _sharedPrefs.getString(key);
  Future<void> setString(String key, String value) => _sharedPrefs.setString(key, value);
  Future<void> remove(String key) => _sharedPrefs.remove(key);
}
