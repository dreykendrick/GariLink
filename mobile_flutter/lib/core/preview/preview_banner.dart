import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/authentication/presentation/providers/auth_provider.dart';
import 'investor_preview.dart';

class InvestorPreviewFrame extends ConsumerWidget {
  const InvestorPreviewFrame({
    super.key,
    required this.child,
    required this.router,
  });
  final Widget child;
  final GoRouter router;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final busy = ref.watch(authStateProvider).isLoading;
    Future<void> select(String profile) async {
      try {
        if (profile == 'reset') await InvestorPreviewStore.instance.reset();
        final role = profile == 'owner' ? 'owner' : 'renter';
        await ref
            .read(authStateProvider.notifier)
            .login(
              '$role@investor.example.invalid',
              'local-preview-no-password',
            );
        router.go(role == 'owner' ? '/owner-dashboard' : '/home');
      } catch (_) {
        if (context.mounted) {
          ScaffoldMessenger.maybeOf(context)?.showSnackBar(
            const SnackBar(
              content: Text(
                'Local preview could not switch. Restart the app and try again.',
              ),
            ),
          );
        }
      }
    }

    return Column(
      children: [
        Material(
          color: const Color(0xFFFFE5C2),
          child: SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              child: Row(
                children: [
                  const Expanded(
                    child: Text(
                      'LOCAL INVESTOR PREVIEW\nAll requests and profiles are simulated.',
                      style: TextStyle(fontSize: 11, color: Color(0xFF522300)),
                    ),
                  ),
                  PopupMenuButton<String>(
                    tooltip: 'Demo profiles and reset',
                    enabled: !busy,
                    onSelected: select,
                    itemBuilder: (_) => const [
                      PopupMenuItem(
                        value: 'renter',
                        child: Text('Use Demo renter'),
                      ),
                      PopupMenuItem(
                        value: 'owner',
                        child: Text('Use Demo owner'),
                      ),
                      PopupMenuItem(
                        value: 'reset',
                        child: Text('Reset local demo'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
        Expanded(child: child),
      ],
    );
  }
}
