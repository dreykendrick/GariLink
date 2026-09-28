import 'vehicle_suitability.dart';
import '../../location/domain/models/gari_location.dart';
import '../../trips/domain/models/transport_need.dart';

/// Per-navigation renter intent. It is never a rental pickup or stored snapshot.
class DiscoverySelection {
  const DiscoverySelection({
    required this.listingId,
    required this.need,
    required this.searchLocation,
    required this.suitability,
  });
  final String listingId;
  final TransportNeed need;
  final SearchLocation searchLocation;
  final SuitabilityResult suitability;
}

/// Ephemeral, typed criteria handed from renter Home to Explore.
/// This is discovery input only and must never be persisted as a rental snapshot.
class DiscoverySearchIntent {
  const DiscoverySearchIntent({
    required this.need,
    required this.searchLocation,
  });

  final TransportNeed need;
  final SearchLocation searchLocation;
}
