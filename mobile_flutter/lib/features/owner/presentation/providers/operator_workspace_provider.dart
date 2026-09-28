import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../explore/presentation/providers/explore_provider.dart';
import '../../../trips/presentation/providers/trips_provider.dart';
import '../../domain/operator_workspace.dart';

final selectedOperatorWorkspaceIdProvider = StateProvider<String?>((ref) {
  return null;
});

final operatorWorkspaceContextProvider =
    FutureProvider<OperatorWorkspaceContext>((ref) async {
      final workspaces = await ref.watch(myWorkspacesProvider.future);
      if (workspaces.isEmpty) {
        return const OperatorWorkspaceContext(available: [], selected: null);
      }
      final requested = ref.watch(selectedOperatorWorkspaceIdProvider);
      final selected = workspaces.cast<OperatorWorkspace?>().firstWhere(
        (workspace) => workspace?.id == requested,
        orElse: () => workspaces.first,
      );
      return OperatorWorkspaceContext(
        available: List.unmodifiable(workspaces),
        selected: selected,
      );
    });

final workspaceListingsProvider = FutureProvider.autoDispose
    .family<List<Map<String, dynamic>>, String>((ref, workspaceId) async {
      final listings = await ref.watch(myListingsProvider.future);
      return List.unmodifiable(
        listings.where((item) => item['workspaceId'] == workspaceId),
      );
    });

void selectOperatorWorkspace(WidgetRef ref, String workspaceId) {
  final context = ref.read(operatorWorkspaceContextProvider).valueOrNull;
  if (context == null ||
      !context.available.any((workspace) => workspace.id == workspaceId)) {
    return;
  }
  ref.read(selectedOperatorWorkspaceIdProvider.notifier).state = workspaceId;
}

void refreshOperatorWorkspace(WidgetRef ref, {String? workspaceId}) {
  ref.invalidate(myWorkspacesProvider);
  ref.invalidate(myListingsProvider);
  ref.invalidate(operatorWorkspaceContextProvider);
  if (workspaceId != null) {
    ref.invalidate(workspaceListingsProvider(workspaceId));
    ref.invalidate(workspaceRentalsProvider(workspaceId));
  }
}
