import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/api_client.dart';

final vehicleRepositoryProvider = Provider<VehicleRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return VehicleRepositoryImpl(apiClient);
});

abstract class VehicleRepository {
  Future<Map<String, dynamic>> createVehicle(Map<String, dynamic> data);
  Future<Map<String, dynamic>> getVehicle(String id);
  Future<List<Map<String, dynamic>>> listWorkspaceVehicles(String workspaceId);
}

class VehicleRepositoryImpl implements VehicleRepository {
  final ApiClient _apiClient;

  const VehicleRepositoryImpl(this._apiClient);

  @override
  Future<Map<String, dynamic>> createVehicle(Map<String, dynamic> data) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/vehicles',
      data: data,
    );
    return response;
  }

  @override
  Future<Map<String, dynamic>> getVehicle(String id) async {
    final response = await _apiClient.get<Map<String, dynamic>>('/vehicles/$id');
    return response;
  }

  @override
  Future<List<Map<String, dynamic>>> listWorkspaceVehicles(String workspaceId) async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>('/vehicles/workspace/$workspaceId');
      final dataList = response['data'] as List<dynamic>? ?? [];
      return dataList.map((e) => e as Map<String, dynamic>).toList();
    } catch (_) {
      return [];
    }
  }
}
