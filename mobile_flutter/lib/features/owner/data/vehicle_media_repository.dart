import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/app_exception.dart';
import '../../../core/services/api_client.dart';

const vehicleMediaMaxCount = 10;
const vehicleMediaMaxOriginalBytes = 20 * 1024 * 1024;
const vehicleMediaMaxUploadBytes = 6 * 1024 * 1024;

bool isSupportedVehicleImage(Uint8List bytes) {
  if (bytes.length < 12) return false;
  final jpeg = bytes[0] == 0xff && bytes[1] == 0xd8 && bytes[2] == 0xff;
  final png =
      bytes[0] == 0x89 &&
      bytes[1] == 0x50 &&
      bytes[2] == 0x4e &&
      bytes[3] == 0x47;
  final webp =
      String.fromCharCodes(bytes.sublist(0, 4)) == 'RIFF' &&
      String.fromCharCodes(bytes.sublist(8, 12)) == 'WEBP';
  return jpeg || png || webp;
}

List<T> moveMediaToCover<T>(List<T> media, int index) {
  if (index <= 0 || index >= media.length) return [...media];
  final result = [...media];
  result.insert(0, result.removeAt(index));
  return result;
}

final vehicleMediaRepositoryProvider = Provider<VehicleMediaRepository>((ref) {
  return VehicleMediaRepository(ref.watch(apiClientProvider));
});

class VehicleMediaRepository {
  VehicleMediaRepository(this._api);
  final ApiClient _api;

  Future<Map<String, dynamic>> upload({
    required String vehicleId,
    required Uint8List bytes,
    required int width,
    required int height,
    required void Function(int, int) onProgress,
  }) async {
    if (bytes.isEmpty || bytes.length > vehicleMediaMaxUploadBytes) {
      throw const ValidationException('This optimized image is too large.');
    }
    final reservation = await _api.post<Map<String, dynamic>>(
      '/media/reserve',
      data: {'vehicleId': vehicleId, 'mimeType': 'image/jpeg'},
    );
    final id = reservation['id']?.toString() ?? '';
    final uploadUrl = reservation['uploadUrl']?.toString() ?? '';
    final apiKey = reservation['apiKey']?.toString() ?? '';
    final token = await _api.accessToken();
    if (id.isEmpty || uploadUrl.isEmpty || apiKey.isEmpty || token == null) {
      throw const ServerException('Image upload could not be prepared.');
    }
    try {
      // Supabase standard uploads are POST requests. PUT is the overwrite path
      // and unnecessarily requires UPDATE/SELECT authorization.
      await Dio().post<void>(
        uploadUrl,
        data: Stream.value(bytes),
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'apikey': apiKey,
            'Content-Type': 'image/jpeg',
            'Content-Length': bytes.length,
          },
        ),
        onSendProgress: onProgress,
      );
      return await _api.post<Map<String, dynamic>>(
        '/media/finalize',
        data: {
          'mediaId': id,
          'byteSize': bytes.length,
          'width': width,
          'height': height,
        },
      );
    } catch (_) {
      try {
        await _api.delete<Map<String, dynamic>>('/media/$id');
      } catch (_) {
        // A two-hour server cleanup window handles an unreachable rollback.
      }
      rethrow;
    }
  }

  Future<void> delete(String mediaId) =>
      _api.delete<Map<String, dynamic>>('/media/$mediaId');

  Future<List<Map<String, dynamic>>> reorder(
    String vehicleId,
    List<String> mediaIds,
  ) async {
    final result = await _api.post<List<dynamic>>(
      '/media/reorder',
      data: {'vehicleId': vehicleId, 'mediaIds': mediaIds},
    );
    return result.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }
}
