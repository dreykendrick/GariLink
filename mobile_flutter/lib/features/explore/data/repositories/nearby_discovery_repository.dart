import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/api_client.dart';
import '../../domain/nearby_discovery.dart';

final nearbyDiscoveryRepositoryProvider = Provider<NearbyDiscoveryRepository>(
  (ref) => NearbyDiscoveryRepository(ref.watch(apiClientProvider)),
);

class NearbyDiscoveryRepository {
  const NearbyDiscoveryRepository(this._api);
  final ApiClient _api;
  Future<NearbyDiscoveryResult> discover(NearbySearchQuery query) async {
    final json = await _api.get<Map<String, dynamic>>(
      '/v2/vehicles/nearby',
      queryParameters: query.toQueryParameters(),
    );
    return NearbyDiscoveryResult.fromJson(json);
  }
}
