import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/theme.dart';
import '../../../../shared/widgets/app_skeleton.dart';
import '../../../../shared/widgets/vehicle_card.dart';
import '../../data/repositories/marketplace_repository.dart';
import '../providers/explore_provider.dart';

class SavedVehiclesPage extends ConsumerWidget {
  const SavedVehiclesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final saved = ref.watch(savedListingsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Saved vehicles')),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(savedListingsProvider.future),
        child: saved.when(
          loading: () => ListView.separated(
            padding: const EdgeInsets.all(20),
            itemCount: 4,
            separatorBuilder: (_, _) => const SizedBox(height: 14),
            itemBuilder: (_, _) =>
                const AppSkeleton(width: double.infinity, height: 132),
          ),
          error: (_, _) => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              SizedBox(
                height: MediaQuery.sizeOf(context).height * .65,
                child: _SavedState(
                  icon: Icons.cloud_off_outlined,
                  title: 'Saved vehicles could not be loaded',
                  message: 'Check your connection and try again.',
                  action: 'Try again',
                  onAction: () => ref.invalidate(savedListingsProvider),
                ),
              ),
            ],
          ),
          data: (items) => items.isEmpty
              ? ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: [
                    SizedBox(
                      height: MediaQuery.sizeOf(context).height * .65,
                      child: _SavedState(
                        icon: Icons.favorite_border_rounded,
                        title: 'No saved vehicles yet',
                        message:
                            'Save vehicles while browsing to compare them later.',
                        action: 'Explore vehicles',
                        onAction: () => context.go('/explore'),
                      ),
                    ),
                  ],
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(20),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 14),
                  itemBuilder: (_, index) {
                    final item = items[index];
                    final id = item['id']?.toString() ?? '';
                    return VehicleCard(
                      listing: item,
                      saved: true,
                      onSaved: () async {
                        try {
                          await ref
                              .read(marketplaceRepositoryProvider)
                              .setSaved(id, false);
                          ref.invalidate(savedListingsProvider);
                        } catch (_) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'This vehicle could not be removed.',
                                ),
                              ),
                            );
                          }
                        }
                      },
                      onTap: () => context.push(
                        '/vehicle-details?listingId=${Uri.encodeComponent(id)}',
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }
}

class _SavedState extends StatelessWidget {
  const _SavedState({
    required this.icon,
    required this.title,
    required this.message,
    required this.action,
    required this.onAction,
  });
  final IconData icon;
  final String title;
  final String message;
  final String action;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 56, color: GariLinkColors.textMuted),
          const SizedBox(height: 16),
          Text(
            title,
            style: GariLinkTypography.titleMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: GariLinkTypography.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 18),
          OutlinedButton(onPressed: onAction, child: Text(action)),
        ],
      ),
    ),
  );
}
