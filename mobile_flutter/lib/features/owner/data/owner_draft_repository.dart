import 'dart:convert';
import 'dart:math';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/api_client.dart';

// The hosted Supabase facade now owns workspace and draft creation. This can
// still be disabled explicitly for a temporary legacy-backend build.
const supabaseOwnerToolsEnabled = bool.fromEnvironment(
  'ENABLE_SUPABASE_OWNER_TOOLS',
  defaultValue: true,
);

final ownerDraftRepositoryProvider = Provider<OwnerDraftRepository>((ref) {
  return OwnerDraftRepository(ref.watch(apiClientProvider));
});

class OwnerDraftRepository {
  const OwnerDraftRepository(this.api);
  final ApiClient api;

  Future<List<Map<String, dynamic>>> workspaces() async {
    final result = await api.get<List<dynamic>>('/workspaces');
    return result
        .map((item) => Map<String, dynamic>.from(item as Map))
        .toList();
  }

  Future<Map<String, dynamic>> createWorkspace(Map<String, dynamic> input) =>
      api.post<Map<String, dynamic>>('/workspaces', data: input);

  Future<Map<String, dynamic>> createDraft(Map<String, dynamic> input) =>
      api.post<Map<String, dynamic>>('/listings/drafts', data: input);

  /// Rental-first V2 draft. The server creates the physical vehicle and its
  /// FOR_HIRE publication together, after validating capabilities.
  Future<Map<String, dynamic>> createV2VehicleDraft(
    Map<String, dynamic> input,
  ) => api.post<Map<String, dynamic>>('/v2/vehicles/drafts', data: input);

  Future<Map<String, dynamic>> updateListing(
    String listingId,
    Map<String, dynamic> patch,
  ) => api.patch<Map<String, dynamic>>('/listings/$listingId', data: patch);

  Future<Map<String, dynamic>> updateV2Vehicle(
    String vehicleId,
    Map<String, dynamic> patch,
  ) => api.patch<Map<String, dynamic>>('/v2/vehicles/$vehicleId', data: patch);

  Future<Map<String, dynamic>> vehicleEligibility(String vehicleId) =>
      api.get<Map<String, dynamic>>('/v2/vehicles/$vehicleId/eligibility');

  Future<Map<String, dynamic>> vehicleRentalPricing(String vehicleId) =>
      api.get<Map<String, dynamic>>('/v2/vehicles/$vehicleId/pricing');

  Future<Map<String, dynamic>> updateVehicleRentalPricing(
    String vehicleId,
    Map<String, dynamic> policy,
  ) => api.patch<Map<String, dynamic>>(
    '/v2/vehicles/$vehicleId/pricing',
    data: policy,
  );

  Future<Map<String, dynamic>> setV2Publication(
    String vehicleId,
    String action,
  ) => api.post<Map<String, dynamic>>(
    '/v2/vehicles/$vehicleId/publication',
    data: {'action': action},
  );
}

/// Reuses an idempotency key for identical retries; edited details are a new intent.
class DraftRetryRequest {
  String? _payload;
  String? _requestId;

  Map<String, dynamic> prepare(Map<String, dynamic> input) {
    final payload = jsonEncode(input);
    if (payload != _payload) {
      _payload = payload;
      final random = Random.secure();
      final bytes = List.generate(16, (_) => random.nextInt(256));
      bytes[6] = (bytes[6] & 15) | 64;
      bytes[8] = (bytes[8] & 63) | 128;
      final hex = bytes
          .map((byte) => byte.toRadixString(16).padLeft(2, '0'))
          .join();
      _requestId =
          '${hex.substring(0, 8)}-${hex.substring(8, 12)}-'
          '${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}';
    }
    return {...input, 'requestId': _requestId};
  }
}
