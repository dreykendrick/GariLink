import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/marketplace_repository.dart';

final searchListingsProvider = FutureProvider.family<List<Map<String, dynamic>>, String>((ref, query) async {
  final repo = ref.watch(marketplaceRepositoryProvider);
  return repo.searchListings(query: query);
});

final myListingsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.watch(marketplaceRepositoryProvider);
  return repo.getMyListings();
});
