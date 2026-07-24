import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/tokens.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/avatar.dart';
import '../../../../shared/widgets/status_badge.dart';
import 'package:garilink_mobile/features/authentication/presentation/providers/auth_provider.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);
    final user = authState.user;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    Future<void> handleLogout() async {
      await ref.read(authStateProvider.notifier).logout();
      if (context.mounted) {
        context.go('/welcome');
      }
    }

    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Profile')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.account_circle_outlined, size: 80, color: Colors.grey),
                const SizedBox(height: AppSpacing.base),
                const Text(
                  'Sign in to view your profile',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: AppSpacing.lg),
                AppButton(
                  text: 'Sign In',
                  onPressed: () => context.go('/welcome'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final String displayName = user.profile?.fullName ?? user.phoneNumber;
    final String initials = user.profile?.firstName != null && user.profile!.firstName!.isNotEmpty
        ? '${user.profile!.firstName![0]}${user.profile!.lastName != null && user.profile!.lastName!.isNotEmpty ? user.profile!.lastName![0] : ""}'
        : 'U';

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: handleLogout,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.base),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Profile Header Card
            AppCard(
              child: Column(
                children: [
                  Avatar(
                    size: 80,
                    imageUrl: user.profile?.photoUrl,
                    initials: initials,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    displayName,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: isDark ? AppColors.darkText : AppColors.neutral[900],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    user.phoneNumber,
                    style: TextStyle(
                      fontSize: 14,
                      color: isDark ? AppColors.darkTextMuted : AppColors.neutral[500],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Phone Verification: '),
                      StatusBadge(status: user.isPhoneVerified ? 'ACTIVE' : 'PENDING'),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.base),

            // Account Information Section
            Text(
              'Account Information',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.darkText : AppColors.neutral[800],
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            AppCard(
              child: Column(
                children: [
                  _infoRow(
                    context: context,
                    icon: Icons.badge_outlined,
                    label: 'Roles',
                    value: user.roles.map((e) => e.toString().split('.').last.toUpperCase()).join(', '),
                  ),
                  const Divider(height: 24),
                  _infoRow(
                    context: context,
                    icon: Icons.email_outlined,
                    label: 'Email',
                    value: user.email ?? 'Not set',
                  ),
                  const Divider(height: 24),
                  _infoRow(
                    context: context,
                    icon: Icons.location_on_outlined,
                    label: 'Location',
                    value: user.profile?.city != null ? '${user.profile!.city}, ${user.profile!.country}' : 'Not set',
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xx2l),

            // Logout Action Button
            AppButton(
              text: 'Sign Out',
              variant: AppButtonVariant.outline,
              onPressed: handleLogout,
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoRow({
    required BuildContext context,
    required IconData icon,
    required String label,
    required String value,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Row(
      children: [
        Icon(icon, color: isDark ? AppColors.darkTextMuted : AppColors.neutral[500], size: 22),
        const SizedBox(width: AppSpacing.md),
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: isDark ? AppColors.darkTextMuted : AppColors.neutral[600],
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: isDark ? AppColors.darkText : AppColors.neutral[800],
          ),
        ),
      ],
    );
  }
}
