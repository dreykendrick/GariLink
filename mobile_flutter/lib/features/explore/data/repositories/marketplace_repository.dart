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
      'select': '*,vehicles(*,vehicle_images(*))',
      'order': 'createdAt.desc',
      'limit': limit,
      'offset': (page - 1) * limit,
    };

    if (minPrice != null) queryParams['askingPrice'] = 'gte.$minPrice';
    if (maxPrice != null) queryParams['askingPrice'] = 'lte.$maxPrice';

    try {
      final response = await _apiClient.get<List<dynamic>>(
        '/listings',
        queryParameters: queryParams,
      );

      return response.map((item) {
        final map = Map<String, dynamic>.from(item as Map);
        final vehicle = map['vehicles'] != null ? Map<String, dynamic>.from(map['vehicles'] as Map) : <String, dynamic>{};
        final imagesList = (vehicle['vehicle_images'] as List<dynamic>?) ?? [];
        final imageUrls = imagesList.map((img) => img['publicUrl'] as String? ?? '').where((u) => u.isNotEmpty).toList();

        return {
          'id': map['id'],
          'title': map['title'] ?? '${vehicle['year'] ?? ''} ${vehicle['make'] ?? ''} ${vehicle['model'] ?? ''}'.trim(),
          'price': map['askingPrice'] ?? 0,
          'currency': map['currency'] ?? 'TZS',
          'make': vehicle['make'] ?? '',
          'model': vehicle['model'] ?? '',
          'year': vehicle['year'] ?? 2022,
          'mileage': vehicle['mileage'] ?? 0,
          'fuelType': vehicle['fuelType'] ?? 'PETROL',
          'transmission': vehicle['transmission'] ?? 'AUTOMATIC',
          'condition': vehicle['condition'] ?? 'FOREIGN_USED',
          'county': map['county'] ?? 'Dar es Salaam',
          'images': imageUrls.isNotEmpty ? imageUrls : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800'],
          'primaryImageUrl': imageUrls.isNotEmpty ? imageUrls.first : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800',
          'isVerified': vehicle['isVerified'] ?? true,
          'status': map['status'] ?? 'PUBLISHED',
          'description': vehicle['description'] ?? map['description'] ?? '',
          'features': vehicle['features'] ?? [],
        };
      }).toList();
    } catch (_) {
      return [];
    }
  }

  @override
  Future<Map<String, dynamic>> getListingDetails(String id) async {
    try {
      final response = await _apiClient.get<List<dynamic>>(
        '/listings',
        queryParameters: {
          'id': 'eq.$id',
          'select': '*,vehicles(*,vehicle_images(*))',
        },
      );

      if (response.isEmpty) return {};

      final map = Map<String, dynamic>.from(response.first as Map);
      final vehicle = map['vehicles'] != null ? Map<String, dynamic>.from(map['vehicles'] as Map) : <String, dynamic>{};
      final imagesList = (vehicle['vehicle_images'] as List<dynamic>?) ?? [];
      final imageUrls = imagesList.map((img) => img['publicUrl'] as String? ?? '').where((u) => u.isNotEmpty).toList();

      return {
        'id': map['id'],
        'title': map['title'] ?? '${vehicle['year'] ?? ''} ${vehicle['make'] ?? ''} ${vehicle['model'] ?? ''}'.trim(),
        'price': map['askingPrice'] ?? 0,
        'currency': map['currency'] ?? 'TZS',
        'make': vehicle['make'] ?? '',
        'model': vehicle['model'] ?? '',
        'year': vehicle['year'] ?? 2022,
        'mileage': vehicle['mileage'] ?? 0,
        'fuelType': vehicle['fuelType'] ?? 'PETROL',
        'transmission': vehicle['transmission'] ?? 'AUTOMATIC',
        'condition': vehicle['condition'] ?? 'FOREIGN_USED',
        'county': map['county'] ?? 'Dar es Salaam',
        'images': imageUrls.isNotEmpty ? imageUrls : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800'],
        'primaryImageUrl': imageUrls.isNotEmpty ? imageUrls.first : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800',
        'isVerified': vehicle['isVerified'] ?? true,
        'status': map['status'] ?? 'PUBLISHED',
        'description': vehicle['description'] ?? map['description'] ?? '',
        'features': vehicle['features'] ?? [],
      };
    } catch (_) {
      return {};
    }
  }

  @override
  Future<List<Map<String, dynamic>>> getMyListings() async {
    return searchListings();
  }

  @override
  Future<bool> toggleFavourite(String listingId) async {
    return true;
  }
}
