import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:garilink_mobile/core/theme/colors.dart';
import 'package:garilink_mobile/core/theme/spacing.dart';
import 'package:garilink_mobile/core/theme/radius.dart';
import 'package:garilink_mobile/core/theme/typography.dart';
import 'package:garilink_mobile/features/authentication/presentation/providers/auth_provider.dart';



class ProfilePage extends ConsumerWidget {
  const ProfilePage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Read auth state
    final authState = ref.watch(authStateProvider);
    final isAuthenticated = authState.isAuthenticated;

    return Scaffold(
      backgroundColor: GariLinkColors.background,
      body: SafeArea(
        child: isAuthenticated ? _buildAuthenticatedProfile(context) : _buildUnauthenticatedProfile(context),
      ),
    );
  }

  Widget _buildUnauthenticatedProfile(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(GariLinkSpacing.lg),
        child: Container(
          padding: const EdgeInsets.all(GariLinkSpacing.xxl),
          decoration: BoxDecoration(
            color: GariLinkColors.surface,
            borderRadius: BorderRadius.circular(GariLinkRadius.card),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.account_circle_outlined,
                size: 64,
                color: GariLinkColors.primary,
              ),
              const SizedBox(height: GariLinkSpacing.lg),
              Text(
                'Welcome to GariLink',
                style: GoogleFonts.inter(
                  color: GariLinkColors.primary,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: GariLinkSpacing.sm),
              Text(
                'Sign in to manage your trips, vehicles, and account settings.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  color: GariLinkColors.textMuted,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: GariLinkSpacing.xl),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () {
                    // Navigate to sign in
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: GariLinkColors.accent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(GariLinkRadius.button),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
                    'Sign In',
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAuthenticatedProfile(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        children: [
          _buildHeader(),
          Padding(
            padding: const EdgeInsets.all(GariLinkSpacing.lg),
            child: Column(
              children: [
                _buildMenuSection(),
                const SizedBox(height: GariLinkSpacing.xl),
                const Divider(color: Color(0xFFE2E8F0), thickness: 1),
                const SizedBox(height: GariLinkSpacing.xl),
                _buildCtaBanner(),
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

  Widget _buildHeader() {
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
              'DM',
              style: GoogleFonts.inter(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: GariLinkSpacing.md),
          Text(
            'Dustan Mrema',
            style: GoogleFonts.inter(
              color: GariLinkColors.primary,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: GariLinkSpacing.xs),
          Text(
            'Makoa Rentals',
            style: GoogleFonts.inter(
              color: GariLinkColors.accent,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: GariLinkSpacing.sm),
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
                'Verified User',
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

  Widget _buildMenuSection() {
    return Container(
      decoration: BoxDecoration(
        color: GariLinkColors.surface,
        borderRadius: BorderRadius.circular(GariLinkRadius.card),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildMenuItem(Icons.person_outline, 'Personal Information'),
          _buildDivider(),
          _buildMenuItem(Icons.credit_card_outlined, 'Payment Methods'),
          _buildDivider(),
          _buildMenuItem(Icons.favorite_border, 'Saved Vehicles'),
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

  Widget _buildMenuItem(IconData icon, String title, {bool isLast = false}) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {},
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
                child: Icon(
                  icon,
                  color: GariLinkColors.primary,
                  size: 24,
                ),
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
        child: InkWell(
          onTap: () {},
          borderRadius: BorderRadius.circular(GariLinkRadius.card),
          child: Padding(
            padding: const EdgeInsets.all(GariLinkSpacing.lg),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(GariLinkSpacing.sm),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
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
                        'List your car and start earning',
                        style: GoogleFonts.inter(
                          color: Colors.white.withOpacity(0.8),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(GariLinkSpacing.xs),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.arrow_forward,
                    color: Color(0xFF1D4ED8),
                    size: 20,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
