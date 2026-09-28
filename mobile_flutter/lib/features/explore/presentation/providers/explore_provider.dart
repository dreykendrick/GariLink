import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../authentication/presentation/providers/auth_provider.dart';
import '../../data/repositories/marketplace_repository.dart';
import '../../domain/marketplace_query.dart';

final marketplaceAuthenticatedProvider = Provider<bool>(
  (ref) =>
      ref.watch(authStateProvider.select((state) => state.isAuthenticated)),
);

final searchListingsProvider =
    FutureProvider.family<List<Map<String, dynamic>>, MarketplaceQuery>((
      ref,
      query,
    ) async {
      final repo = ref.watch(marketplaceRepositoryProvider);
      return repo.searchListings(query);
    });

final savedListingsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) {
  final userId = ref.watch(authStateProvider.select((state) => state.user?.id));
  if (userId == null) return const [];
  return ref.watch(marketplaceRepositoryProvider).getSavedListings();
});

final myListingsProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final userId = ref.watch(authStateProvider.select((state) => state.user?.id));
  if (userId == null) return [];
  final repo = ref.watch(marketplaceRepositoryProvider);
  return repo.getMyListings();
});
