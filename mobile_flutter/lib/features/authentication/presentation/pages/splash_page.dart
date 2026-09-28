import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/colors.dart';
import '../../../../shared/widgets/app_button.dart';
import '../providers/auth_provider.dart';

/// Navigation is owned by the router after hydration, not an arbitrary timer.
class SplashPage extends ConsumerWidget {
  const SplashPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authStateProvider);
    final error = auth.errorMessage;
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Image.asset(
                    'assets/images/logo.jpg',
                    width: 220,
                    height: 220,
                    semanticLabel: 'GariLink',
                    errorBuilder: (_, _, _) => const Text(
                      'GariLink',
                      style: TextStyle(
                        fontSize: 32,
                        color: GariLinkColors.primary,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  if (error == null) ...[
                    const CircularProgressIndicator(
                      semanticsLabel: 'Restoring your session',
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Getting things ready',
                      style: TextStyle(color: GariLinkColors.textSecondary),
                    ),
                  ] else ...[
                    Text(
                      error,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: GariLinkColors.textPrimary),
                    ),
                    const SizedBox(height: 24),
                    AppButton(
                      text: 'Try again',
                      onPressed: () =>
                          ref.read(authStateProvider.notifier).hydrate(),
                    ),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () =>
                          ref.read(authStateProvider.notifier).logout(),
                      child: const Text('Sign out of this device'),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
