import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/api_client.dart';

final marketplaceRepositoryProvider = Provider<MarketplaceRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return MarketplaceRepositoryImpl(apiClient);
});

abstract class MarketplaceRepository {
  Future<List<Map<String, dynamic>>> searchListings({
    String? query,
    String? vehicleType,
    String? location,
    double? minPrice,
    double? maxPrice,
    int page = 1,
    int limit = 20,
  });
  Future<Map<String, dynamic>> getListingDetails(String id);
  Future<List<Map<String, dynamic>>> getMyListings();
  Future<bool> toggleFavourite(String listingId);
}

class MarketplaceRepositoryImpl implements MarketplaceRepository {
  final ApiClient _apiClient;

  const MarketplaceRepositoryImpl(this._apiClient);

  @override
  Future<List<Map<String, dynamic>>> searchListings({
    String? query,
    String? vehicleType,
    String? location,
    double? minPrice,
    double? maxPrice,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
    };
    if (query != null && query.isNotEmpty) queryParams['query'] = query;
    if (vehicleType != null && vehicleType.isNotEmpty) queryParams['vehicleType'] = vehicleType;
    if (location != null && location.isNotEmpty) queryParams['location'] = location;
    if (minPrice != null) queryParams['minPrice'] = minPrice;
    if (maxPrice != null) queryParams['maxPrice'] = maxPrice;

    try {
      final response = await _apiClient.get<Map<String, dynamic>>(
        '/listings',
        queryParameters: queryParams,
      );
      final dataList = response['data'] as List<dynamic>? ?? [];
      return dataList.map((e) => e as Map<String, dynamic>).toList();
    } catch (_) {
      // Fallback empty list if backend is unreachable or returning format difference
      return [];
    }
  }

  @override
  Future<Map<String, dynamic>> getListingDetails(String id) async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>('/listings/$id');
      return response;
    } catch (_) {
      return {};
    }
  }

  @override
  Future<List<Map<String, dynamic>>> getMyListings() async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>('/listings/mine');
      final dataList = response['data'] as List<dynamic>? ?? [];
      return dataList.map((e) => e as Map<String, dynamic>).toList();
    } catch (_) {
      return [];
    }
  }

  @override
  Future<bool> toggleFavourite(String listingId) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>('/listings/$listingId/favourite');
      return response['isSaved'] as bool? ?? true;
    } catch (_) {
      return false;
    }
  }
}
