import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/radius.dart';
import '../../../../core/theme/spacing.dart';
import '../../../../core/theme/typography.dart';
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
        backgroundColor: isDark ? const Color(0xFF070F1A) : GariLinkColors.background,
        appBar: AppBar(title: const Text('Profile')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(GariLinkSpacing.xl),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.account_circle_outlined,
                  size: 80,
                  color: isDark ? GariLinkColors.textMuted : GariLinkColors.textSecondary,
                ),
                const SizedBox(height: GariLinkSpacing.md),
                Text(
                  'Sign in to view your profile',
                  style: GariLinkTypography.titleMedium,
                ),
                const SizedBox(height: GariLinkSpacing.lg),
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
      backgroundColor: isDark ? const Color(0xFF070F1A) : GariLinkColors.background,
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
        padding: const EdgeInsets.all(GariLinkSpacing.lg),
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
                  const SizedBox(height: GariLinkSpacing.md),
                  Text(
                    displayName,
                    style: GariLinkTypography.titleMedium.copyWith(
                      color: isDark ? Colors.white : GariLinkColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: GariLinkSpacing.xs),
                  Text(
                    user.phoneNumber,
                    style: GariLinkTypography.bodyMedium.copyWith(
                      color: GariLinkColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: GariLinkSpacing.md),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Phone Verification: ',
                        style: GariLinkTypography.bodyMedium,
                      ),
                      StatusBadge(status: user.isPhoneVerified ? 'ACTIVE' : 'PENDING'),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: GariLinkSpacing.lg),

            // Account Information Section
            Text(
              'Account Information',
              style: GariLinkTypography.labelMedium.copyWith(
                color: isDark ? Colors.white : GariLinkColors.textPrimary,
              ),
            ),
            const SizedBox(height: GariLinkSpacing.sm),
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
            const SizedBox(height: GariLinkSpacing.xxxl),

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
        Icon(
          icon,
          color: isDark ? GariLinkColors.textMuted : GariLinkColors.textSecondary,
          size: 22,
        ),
        const SizedBox(width: GariLinkSpacing.md),
        Text(
          label,
          style: GariLinkTypography.bodyMedium.copyWith(
            color: isDark ? GariLinkColors.textMuted : GariLinkColors.textSecondary,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: GariLinkTypography.labelMedium.copyWith(
            color: isDark ? Colors.white : GariLinkColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
