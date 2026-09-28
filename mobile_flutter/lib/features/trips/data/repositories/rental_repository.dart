import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:math';
import 'dart:convert';
import '../../../../core/services/api_client.dart';
import '../../domain/models/rental_summary.dart';
import '../../domain/models/transport_need.dart';
import '../../../location/domain/models/gari_location.dart';
import '../../../vehicle/domain/models/rental_pricing.dart';
import '../../../owner/domain/operator_workspace.dart';

final rentalRepositoryProvider = Provider<RentalRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return RentalRepositoryImpl(apiClient);
});

abstract class RentalRepository {
  Future<Map<String, dynamic>> createRentalRequest({
    required String listingId,
    required DateTime startDate,
    required DateTime endDate,
    String? pickupNotes,
    TransportNeed? transportNeed,
    String? requestId,
    GariLocation? pickupLocation,
    GariLocation? destinationLocation,
  });
  Future<List<RentalSummary>> getMyRentalRequests();
  Future<void> cancelRentalRequest(String rentalId);
  Future<RentalPriceEstimate> estimateRental({
    required String listingId,
    required DateTime startDate,
    required DateTime endDate,
    GariLocation? pickupLocation,
    GariLocation? destinationLocation,
  });

  // Owner methods
  Future<List<OperatorWorkspace>> getMyWorkspaces();
  Future<List<RentalSummary>> getWorkspaceRentalRequests(String workspaceId);
  Future<void> approveRentalRequest(String workspaceId, String rentalId);
  Future<void> rejectRentalRequest(
    String workspaceId,
    String rentalId,
    String reason,
  );
  Future<void> markRentalReady(String workspaceId, String rentalId);
  Future<void> startRental(String workspaceId, String rentalId);
  Future<void> completeRental(String workspaceId, String rentalId);
}

class RentalRepositoryImpl implements RentalRepository {
  final ApiClient _apiClient;

  const RentalRepositoryImpl(this._apiClient);

  @override
  Future<RentalPriceEstimate> estimateRental({
    required String listingId,
    required DateTime startDate,
    required DateTime endDate,
    GariLocation? pickupLocation,
    GariLocation? destinationLocation,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/v2/rentals/estimate',
      data: {
        'listingId': listingId,
        'startDate': startDate.toIso8601String(),
        'endDate': endDate.toIso8601String(),
        if (pickupLocation != null) 'pickupLocation': pickupLocation.toJson(),
        if (destinationLocation != null)
          'destinationLocation': destinationLocation.toJson(),
      },
    );
    return RentalPriceEstimate.fromJson(response);
  }

  String _requestId() {
    final bytes = List<int>.generate(16, (_) => Random.secure().nextInt(256));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    final hex = bytes
        .map((byte) => byte.toRadixString(16).padLeft(2, '0'))
        .join();
    return '${hex.substring(0, 8)}-${hex.substring(8, 12)}-'
        '${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}';
  }

  @override
  Future<Map<String, dynamic>> createRentalRequest({
    required String listingId,
    required DateTime startDate,
    required DateTime endDate,
    String? pickupNotes,
    TransportNeed? transportNeed,
    String? requestId,
    GariLocation? pickupLocation,
    GariLocation? destinationLocation,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/rentals',
      data: {
        'listingId': listingId,
        'requestId': requestId ?? _requestId(),
        'startDate': startDate.toIso8601String(),
        'endDate': endDate.toIso8601String(),
        if (pickupNotes?.trim().isNotEmpty ?? false)
          'pickupNotes': pickupNotes!.trim(),
        if (transportNeed != null) 'transportNeed': transportNeed.toJson(),
        if (pickupLocation != null) 'pickupLocation': pickupLocation.toJson(),
        if (destinationLocation != null)
          'destinationLocation': destinationLocation.toJson(),
      },
    );
    return response;
  }

  @override
  Future<List<RentalSummary>> getMyRentalRequests() async {
    final response = await _apiClient.get<List<dynamic>>('/rentals');
    return response
        .map((item) => RentalSummary.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<void> cancelRentalRequest(String rentalId) async {
    await _apiClient.patch<Map<String, dynamic>>('/rentals/$rentalId/cancel');
  }

  @override
  Future<List<OperatorWorkspace>> getMyWorkspaces() async {
    final response = await _apiClient.get<List<dynamic>>('/workspaces');
    return response
        .map((item) => OperatorWorkspace.fromJson(item as Map<String, dynamic>))
        .where((workspace) => workspace.id.isNotEmpty)
        .toList();
  }

  @override
  Future<List<RentalSummary>> getWorkspaceRentalRequests(
    String workspaceId,
  ) async {
    final response = await _apiClient.get<List<dynamic>>(
      '/owner/workspaces/$workspaceId/rentals',
    );
    return response
        .map((item) => RentalSummary.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<void> approveRentalRequest(String workspaceId, String rentalId) async {
    await _ownerAction(workspaceId, rentalId, 'approve');
  }

  @override
  Future<void> rejectRentalRequest(
    String workspaceId,
    String rentalId,
    String reason,
  ) async {
    await _apiClient.patch<Map<String, dynamic>>(
      '/owner/workspaces/$workspaceId/rentals/$rentalId/reject',
      data: {'reason': reason},
    );
  }

  @override
  Future<void> markRentalReady(String workspaceId, String rentalId) =>
      _ownerAction(workspaceId, rentalId, 'ready');

  @override
  Future<void> startRental(String workspaceId, String rentalId) =>
      _ownerAction(workspaceId, rentalId, 'start');

  @override
  Future<void> completeRental(String workspaceId, String rentalId) =>
      _ownerAction(workspaceId, rentalId, 'complete');

  Future<void> _ownerAction(
    String workspaceId,
    String rentalId,
    String action,
  ) async {
    await _apiClient.patch<Map<String, dynamic>>(
      '/owner/workspaces/$workspaceId/rentals/$rentalId/$action',
    );
  }
}

/// Keeps the same idempotency key for an unchanged booking retry while giving
/// edited dates or notes a fresh intent key.
class RentalRetryRequest {
  String? _payload;
  String? _requestId;

  String prepare({
    required String listingId,
    required DateTime startDate,
    required DateTime endDate,
    String? pickupNotes,
    TransportNeed? transportNeed,
    GariLocation? pickupLocation,
    GariLocation? destinationLocation,
  }) {
    final payload = jsonEncode({
      'listingId': listingId,
      'startDate': DateTime(
        startDate.year,
        startDate.month,
        startDate.day,
      ).toIso8601String(),
      'endDate': DateTime(
        endDate.year,
        endDate.month,
        endDate.day,
      ).toIso8601String(),
      'pickupNotes': pickupNotes?.trim(),
      'transportNeed': transportNeed?.toJson(),
      'pickupLocation': pickupLocation?.toJson(),
      'destinationLocation': destinationLocation?.toJson(),
    });
    if (payload != _payload) {
      _payload = payload;
      final bytes = List<int>.generate(16, (_) => Random.secure().nextInt(256));
      bytes[6] = (bytes[6] & 15) | 64;
      bytes[8] = (bytes[8] & 63) | 128;
      final hex = bytes
          .map((byte) => byte.toRadixString(16).padLeft(2, '0'))
          .join();
      _requestId =
          '${hex.substring(0, 8)}-${hex.substring(8, 12)}-'
          '${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}';
    }
    return _requestId!;
  }
}
