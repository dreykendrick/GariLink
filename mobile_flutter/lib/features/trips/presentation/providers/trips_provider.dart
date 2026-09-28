import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../authentication/presentation/providers/auth_provider.dart';
import '../../data/repositories/rental_repository.dart';
import '../../domain/models/rental_summary.dart';
import '../../../owner/domain/operator_workspace.dart';

final myTripsProvider = FutureProvider<List<RentalSummary>>((ref) async {
  final userId = ref.watch(authStateProvider.select((state) => state.user?.id));
  if (userId == null) return [];
  final repo = ref.watch(rentalRepositoryProvider);
  return repo.getMyRentalRequests();
});

final myWorkspacesProvider = FutureProvider<List<OperatorWorkspace>>((
  ref,
) async {
  final userId = ref.watch(authStateProvider.select((state) => state.user?.id));
  if (userId == null) return [];
  return ref.watch(rentalRepositoryProvider).getMyWorkspaces();
});

final workspaceRentalsProvider = FutureProvider.autoDispose
    .family<List<RentalSummary>, String>((ref, workspaceId) async {
      final userId = ref.watch(
        authStateProvider.select((state) => state.user?.id),
      );
      if (userId == null) return [];
      return ref
          .watch(rentalRepositoryProvider)
          .getWorkspaceRentalRequests(workspaceId);
    });
