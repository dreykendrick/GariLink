import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../authentication/domain/entities/user.dart';
import 'edit_profile_sheet.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:garilink_mobile/core/theme/colors.dart';
import 'package:garilink_mobile/core/theme/spacing.dart';
import 'package:garilink_mobile/core/theme/radius.dart';
import 'package:garilink_mobile/core/theme/shadows.dart';
import 'package:garilink_mobile/core/theme/typography.dart';
import 'package:garilink_mobile/features/authentication/presentation/providers/auth_provider.dart';
import 'package:garilink_mobile/shared/widgets/empty_state.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Read auth state
    final authState = ref.watch(authStateProvider);
    final isAuthenticated = authState.isAuthenticated;

    return Scaffold(
      backgroundColor: GariLinkColors.background,
      body: SafeArea(
        child: isAuthenticated
            ? _buildAuthenticatedProfile(context, ref)
            : _buildUnauthenticatedProfile(context),
      ),
    );
  }

  Widget _buildUnauthenticatedProfile(BuildContext context) {
    return EmptyState(
      icon: Icons.account_circle_outlined,
      title: 'Your GariLink profile',
      description: 'Sign in to manage your rentals, vehicles, and account.',
      actionLabel: 'Sign in',
      onAction: () => context.push('/login'),
    );
  }

  Widget _buildAuthenticatedProfile(BuildContext context, WidgetRef ref) {
    return SingleChildScrollView(
      child: Column(
        children: [
          _buildHeader(ref.watch(authStateProvider).user),
          Padding(
            padding: const EdgeInsets.all(GariLinkSpacing.lg),
            child: Column(
              children: [
                _buildMenuSection(context, ref),
                const SizedBox(height: GariLinkSpacing.xl),
                const Divider(),
                const SizedBox(height: GariLinkSpacing.xl),
                _buildCtaBanner(),
                const SizedBox(height: GariLinkSpacing.lg),
                OutlinedButton.icon(
                  onPressed: ref.watch(authStateProvider).isLoading
                      ? null
                      : () => ref.read(authStateProvider.notifier).logout(),
                  icon: const Icon(Icons.logout_rounded),
                  label: const Text('Sign out'),
                ),
                const SizedBox(height: GariLinkSpacing.xxl),
                Text(
                  'GariLink v1.0.0',
                  style: GoogleFonts.inter(
                    color: GariLinkColors.textMuted,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: GariLinkSpacing.xl),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(User? user) {
    final name = user?.profile?.fullName ?? 'GariLink member';
    final initials = name
        .trim()
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .take(2)
        .map((part) => part.characters.first.toUpperCase())
        .join();
    return Container(
      padding: const EdgeInsets.symmetric(vertical: GariLinkSpacing.xxl),
      width: double.infinity,
      child: Column(
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: const BoxDecoration(
              color: GariLinkColors.accent,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              initials,
              style: GoogleFonts.inter(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: GariLinkSpacing.md),
          Text(name, style: GariLinkTypography.sectionTitle),
          const SizedBox(height: GariLinkSpacing.xs),
          Text(
            user?.phoneNumber ?? '',
            style: GoogleFonts.inter(
              color: GariLinkColors.accent,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: GariLinkSpacing.sm),
          if (user?.isPhoneVerified == true)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.check_circle,
                  color: GariLinkColors.success,
                  size: 16,
                ),
                const SizedBox(width: GariLinkSpacing.xs),
                Text(
                  'Phone verified',
                  style: GoogleFonts.inter(
                    color: GariLinkColors.success,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildMenuSection(BuildContext context, WidgetRef ref) {
    return Container(
      decoration: BoxDecoration(
        color: GariLinkColors.surface,
        borderRadius: BorderRadius.circular(GariLinkRadius.card),
        boxShadow: const [GariLinkShadows.card],
      ),
      child: Column(
        children: [
          _buildMenuItem(
            Icons.person_outline,
            'Personal Information',
            onTap: () async {
              final user = ref.read(authStateProvider).user;
              if (user == null) return;
              final saved = await showEditProfileSheet(context, user);
              if (saved == true && context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Profile updated')),
                );
              }
            },
          ),
          _buildDivider(),
          _buildMenuItem(Icons.credit_card_outlined, 'Payment Methods'),
          _buildDivider(),
          _buildMenuItem(
            Icons.favorite_border,
            'Saved Vehicles',
            onTap: () => context.push('/saved-vehicles'),
          ),
          _buildDivider(),
          _buildMenuItem(Icons.notifications_outlined, 'Notifications'),
          _buildDivider(),
          _buildMenuItem(Icons.help_outline, 'Help & Support'),
          _buildDivider(),
          _buildMenuItem(Icons.settings_outlined, 'Settings', isLast: true),
        ],
      ),
    );
  }

  Widget _buildDivider() {
    return const Divider(
      color: Color(0xFFF1F5F9),
      height: 1,
      thickness: 1,
      indent: 16,
      endIndent: 16,
    );
  }

  Widget _buildMenuItem(
    IconData icon,
    String title, {
    bool isLast = false,
    VoidCallback? onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: isLast
            ? const BorderRadius.only(
                bottomLeft: Radius.circular(GariLinkRadius.card),
                bottomRight: Radius.circular(GariLinkRadius.card),
              )
            : null,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: GariLinkSpacing.lg,
            vertical: GariLinkSpacing.md,
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: GariLinkColors.background,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: GariLinkColors.primary, size: 24),
              ),
              const SizedBox(width: GariLinkSpacing.md),
              Expanded(
                child: Text(
                  title,
                  style: GoogleFonts.inter(
                    color: GariLinkColors.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              const Icon(
                Icons.chevron_right,
                color: GariLinkColors.textMuted,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCtaBanner() {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0B1F3A), Color(0xFF1D4ED8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(GariLinkRadius.card),
      ),
      child: Material(
        color: Colors.transparent,
        child: Semantics(
          label:
              'Vehicle owner onboarding. Use the add button in the main navigation.',
          child: Padding(
            padding: const EdgeInsets.all(GariLinkSpacing.lg),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(GariLinkSpacing.sm),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.directions_car,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
                const SizedBox(width: GariLinkSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Become a Vehicle Owner',
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: GariLinkSpacing.xs),
                      Text(
                        'Use the + button below to create your first private draft',
                        style: GoogleFonts.inter(
                          color: Colors.white.withValues(alpha: 0.8),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.add_circle_outline,
                  color: Colors.white,
                  size: 28,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
