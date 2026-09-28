import 'package:flutter/material.dart';
import '../../domain/models/transport_need.dart';

class TransportNeedSummary extends StatelessWidget {
  const TransportNeedSummary({super.key, required this.need});
  final TransportNeed need;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(need.purpose.label),
      if (need.passengerCount != null)
        Text('Passengers: ${need.passengerCount}'),
      if (need.cargo?.estimatedWeightKg != null)
        Text('Approx. cargo weight: ${need.cargo!.estimatedWeightKg} kg'),
      if (need.cargo?.estimatedVolumeM3 != null)
        Text('Approx. cargo volume: ${need.cargo!.estimatedVolumeM3} m³'),
      if (need.cargo?.cargoType?.isNotEmpty ?? false)
        Text('Cargo: ${need.cargo!.cargoType}'),
      if (need.cargo?.fragile ?? false) const Text('Fragile cargo'),
      if (need.cargo?.requiresCoveredBody ?? false)
        const Text('Covered body required'),
      Text(
        'Driver preference: ${const ['Any', 'With driver', 'Self-drive'][need.driverPreference.index]}',
      ),
      if (need.longDistance) const Text('Long-distance trip'),
      if (need.returnTrip) const Text('Return trip'),
      if (need.notes?.isNotEmpty ?? false) Text(need.notes!),
    ],
  );
}
