import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/api_client.dart';
import '../../domain/marketplace_query.dart';

final marketplaceRepositoryProvider = Provider<MarketplaceRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return MarketplaceRepositoryImpl(apiClient);
});

abstract class MarketplaceRepository {
  Future<List<Map<String, dynamic>>> searchListings(MarketplaceQuery query);
  Future<Map<String, dynamic>> getListingDetails(String id);
  Future<List<Map<String, dynamic>>> getMyListings();
  Future<List<Map<String, dynamic>>> getSavedListings();
  Future<bool> setSaved(String listingId, bool saved);
  Future<void> publishListing(String listingId);
  Future<void> pauseListing(String listingId);
  Future<void> archiveListing(String listingId);
}

class MarketplaceRepositoryImpl implements MarketplaceRepository {
  final ApiClient _apiClient;

  const MarketplaceRepositoryImpl(this._apiClient);

  @override
  Future<List<Map<String, dynamic>>> searchListings(
    MarketplaceQuery query,
  ) async {
    final queryParams = <String, dynamic>{
      'page': query.page,
      'limit': query.limit,
      'sort': query.sort.apiValue,
    };

    if (query.text.trim().isNotEmpty) queryParams['q'] = query.text.trim();
    if (query.type != null) queryParams['type'] = query.type;
    if (query.location.trim().isNotEmpty) {
      queryParams['county'] = query.location.trim();
    }
    if (query.minPrice != null) queryParams['priceMin'] = query.minPrice;
    if (query.maxPrice != null) queryParams['priceMax'] = query.maxPrice;
    if (query.transmission != null) {
      queryParams['transmission'] = query.transmission;
    }
    if (query.fuelType != null) queryParams['fuelType'] = query.fuelType;

    final response = await _apiClient.get<Map<String, dynamic>>(
      '/listings',
      queryParameters: queryParams,
    );
    final items = response['data'] as List<dynamic>? ?? const [];
    return items
        .map((item) => _mapListing(Map<String, dynamic>.from(item as Map)))
        .toList();
  }

  @override
  Future<Map<String, dynamic>> getListingDetails(String id) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/listings/$id',
    );
    final candidates = await _apiClient.get<List<dynamic>>(
      '/v2/vehicles/discoverable',
    );
    final current = candidates.whereType<Map>().where((row) => row['id'] == id);
    final v2 = current.isEmpty
        ? const <String, dynamic>{}
        : Map<String, dynamic>.from(current.first);
    return _mapListing({
      ...response,
      // The listing endpoint owns the detail payload. The public V2 discovery
      // projection adds only server-authoritative renter decision fields.
      if (v2['vehicleCategory'] != null)
        'vehicleCategory': v2['vehicleCategory'],
      if (v2['capabilities'] != null) 'capabilities': v2['capabilities'],
      if (v2['publicLocality'] != null) 'publicLocality': v2['publicLocality'],
      if (v2['rentalPricing'] != null) 'rentalPricing': v2['rentalPricing'],
      'eligibility':
          v2['eligibility'] ?? const <String, dynamic>{'requestable': false},
      'operationalAvailability': current.isEmpty
          ? 'UNAVAILABLE'
          : v2['operationalAvailability'],
    });
  }

  @override
  Future<List<Map<String, dynamic>>> getMyListings() async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/listings/mine',
    );
    final items = response['data'] as List<dynamic>? ?? const [];
    return items
        .map((item) => _mapListing(Map<String, dynamic>.from(item as Map)))
        .toList();
  }

  @override
  Future<List<Map<String, dynamic>>> getSavedListings() async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/listings/saved',
    );
    final items = response['data'] as List<dynamic>? ?? const [];
    return items
        .map((item) => _mapListing(Map<String, dynamic>.from(item as Map)))
        .toList();
  }

  @override
  Future<bool> setSaved(String listingId, bool saved) async {
    final response = saved
        ? await _apiClient.post<Map<String, dynamic>>(
            '/listings/$listingId/save',
          )
        : await _apiClient.delete<Map<String, dynamic>>(
            '/listings/$listingId/save',
          );
    return response['saved'] as bool? ?? saved;
  }

  @override
  Future<void> publishListing(String listingId) =>
      _listingAction(listingId, 'publish');

  @override
  Future<void> pauseListing(String listingId) =>
      _listingAction(listingId, 'pause');

  @override
  Future<void> archiveListing(String listingId) =>
      _listingAction(listingId, 'archive');

  Future<void> _listingAction(String listingId, String action) async {
    await _apiClient.post<Map<String, dynamic>>('/listings/$listingId/$action');
  }

  Map<String, dynamic> _mapListing(Map<String, dynamic> map) {
    final vehicle = map['vehicle'] is Map
        ? Map<String, dynamic>.from(map['vehicle'] as Map)
        : <String, dynamic>{};
    final images = vehicle['images'] as List<dynamic>? ?? const [];
    final imageUrls = images
        .map((image) => image is Map ? image['media'] : null)
        .whereType<Map>()
        .map((media) => media['publicUrl'] as String? ?? '')
        .where((url) => url.isNotEmpty)
        .toList();

    return {
      ...map,
      'price': map['askingPrice'] ?? map['rentalConfig']?['dailyRate'] ?? 0,
      'make': vehicle['make'] ?? '',
      'model': vehicle['model'] ?? '',
      'year': vehicle['year'],
      'mileage': vehicle['mileage'] ?? 0,
      'fuelType': vehicle['fuelType'] ?? '',
      'transmission': vehicle['transmission'] ?? '',
      'condition': vehicle['condition'] ?? '',
      'description': map['description'] ?? vehicle['description'] ?? '',
      'features': vehicle['features'] ?? const [],
      'isVerified': vehicle['isVerified'] ?? false,
      'images': imageUrls,
      'mediaItems': images
          .map((image) => image is Map ? image['media'] : null)
          .whereType<Map>()
          .map((media) => Map<String, dynamic>.from(media))
          .toList(),
      'primaryImageUrl': imageUrls.isEmpty ? '' : imageUrls.first,
      'rentalPricing': map['rentalPricing'] ?? vehicle['rentalPricing'],
    };
  }
}
