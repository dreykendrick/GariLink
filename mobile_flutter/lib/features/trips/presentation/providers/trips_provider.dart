import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/rental_repository.dart';

final myTripsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.watch(rentalRepositoryProvider);
  return repo.getMyRentalRequests();
});
