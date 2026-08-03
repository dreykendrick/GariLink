import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/api_client.dart';

final rentalRepositoryProvider = Provider<RentalRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return RentalRepositoryImpl(apiClient);
});

abstract class RentalRepository {
  Future<Map<String, dynamic>> createRentalRequest({
    required String workspaceId,
    required String vehicleId,
    required String listingId,
    required DateTime startDate,
    required DateTime endDate,
    required double dailyRate,
    required double totalAmount,
  });
  Future<List<Map<String, dynamic>>> getMyRentalRequests();
  Future<bool> cancelRentalRequest(String rentalId);

  // Owner methods
  Future<List<Map<String, dynamic>>> getWorkspaceRentalRequests(String workspaceId);
  Future<bool> approveRentalRequest(String workspaceId, String rentalId);
  Future<bool> rejectRentalRequest(String workspaceId, String rentalId, String reason);
}

class RentalRepositoryImpl implements RentalRepository {
  final ApiClient _apiClient;

  const RentalRepositoryImpl(this._apiClient);

  @override
  Future<Map<String, dynamic>> createRentalRequest({
    required String workspaceId,
    required String vehicleId,
    required String listingId,
    required DateTime startDate,
    required DateTime endDate,
    required double dailyRate,
    required double totalAmount,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/rentals',
      data: {
        'workspaceId': workspaceId,
        'vehicleId': vehicleId,
        'listingId': listingId,
        'startDate': startDate.toIso8601String(),
        'endDate': endDate.toIso8601String(),
        'dailyRate': dailyRate,
        'totalAmount': totalAmount,
      },
    );
    return response;
  }

  @override
  Future<List<Map<String, dynamic>>> getMyRentalRequests() async {
    try {
      final response = await _apiClient.get<List<dynamic>>('/rentals');
      return response.map((e) => e as Map<String, dynamic>).toList();
    } catch (_) {
      return [];
    }
  }

  @override
  Future<bool> cancelRentalRequest(String rentalId) async {
    try {
      final response = await _apiClient.patch<Map<String, dynamic>>('/rentals/$rentalId/cancel');
      return response['success'] as bool? ?? true;
    } catch (_) {
      return false;
    }
  }

  @override
  Future<List<Map<String, dynamic>>> getWorkspaceRentalRequests(String workspaceId) async {
    try {
      final response = await _apiClient.get<List<dynamic>>('/owner/workspaces/$workspaceId/rentals');
      return response.map((e) => e as Map<String, dynamic>).toList();
    } catch (_) {
      return [];
    }
  }

  @override
  Future<bool> approveRentalRequest(String workspaceId, String rentalId) async {
    try {
      final response = await _apiClient.patch<Map<String, dynamic>>(
        '/owner/workspaces/$workspaceId/rentals/$rentalId/approve',
      );
      return response['success'] as bool? ?? true;
    } catch (_) {
      return false;
    }
  }

  @override
  Future<bool> rejectRentalRequest(String workspaceId, String rentalId, String reason) async {
    try {
      final response = await _apiClient.patch<Map<String, dynamic>>(
        '/owner/workspaces/$workspaceId/rentals/$rentalId/reject',
        data: {'reason': reason},
      );
      return response['success'] as bool? ?? true;
    } catch (_) {
      return false;
    }
  }
}
