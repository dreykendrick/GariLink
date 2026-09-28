import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/services/api_client.dart';
import '../../domain/vehicle_suitability.dart';

final matchedDiscoveryRepositoryProvider = Provider<MatchedDiscoveryRepository>(
  (ref) => MatchedDiscoveryRepository(ref.watch(apiClientProvider)),
);

class MatchedDiscoveryRepository {
  const MatchedDiscoveryRepository(this._api);
  final ApiClient _api;
  Future<MatchedDiscoveryResult> discover(MatchedDiscoveryQuery query) async {
    final json = await _api.post<Map<String, dynamic>>(
      '/v2/vehicles/match',
      data: query.toJson(),
    );
    final result = MatchedDiscoveryResult.fromJson(json);
    final suitable = result.vehicles
        .where(
          (vehicle) => vehicle.suitability.status == SuitabilityStatus.suitable,
        )
        .toList();
    // An empty match response alone cannot distinguish geography from suitability.
    // Ask the existing nearby API only on this branch, using the same search.
    var hasNearby = true;
    if (suitable.isEmpty) {
      final location = query.searchLocation.location!;
      final nearby = await _api.get<Map<String, dynamic>>(
        '/v2/vehicles/nearby',
        queryParameters: {
          'lat': location.latitude,
          'lng': location.longitude,
          'radiusMeters': query.radiusMeters,
          'limit': 1,
          'offset': 0,
        },
      );
      hasNearby = (nearby['data'] as List).isNotEmpty;
    }
    return MatchedDiscoveryResult(
      vehicles: suitable,
      radiusMeters: result.radiusMeters,
      hasNearbyCandidates: hasNearby,
    );
  }
}
