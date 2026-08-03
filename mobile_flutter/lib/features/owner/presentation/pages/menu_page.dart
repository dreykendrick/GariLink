import 'package:flutter/material.dart';
import 'package:garilink_mobile/core/theme/theme.dart';

class MenuPage extends StatelessWidget {
  const MenuPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: GariLinkColors.background,
      appBar: AppBar(
        backgroundColor: GariLinkColors.surface,
        elevation: 0,
        title: Text('Menu', style: GariLinkTypography.titleLarge),
        centerTitle: false,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: GariLinkSpacing.lg),
            _buildSectionHeader('BUSINESS SETTINGS'),
            _buildMenuItem('Business Profile', Icons.business_outlined),
            _buildMenuItem('Payment & Payouts', Icons.payments_outlined),
            _buildMenuItem('Team Management', Icons.group_outlined),
            _buildMenuItem('Subscription', Icons.workspace_premium_outlined),
            
            const SizedBox(height: GariLinkSpacing.xl),
            _buildSectionHeader('SUPPORT'),
            _buildMenuItem('Help Center', Icons.help_outline),
            _buildMenuItem('Contact Support', Icons.headset_mic_outlined),
            _buildMenuItem('Feedback', Icons.rate_review_outlined),
            
            const SizedBox(height: GariLinkSpacing.xl),
            _buildLogoutButton(),
            const SizedBox(height: GariLinkSpacing.xxl),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: GariLinkSpacing.lg, vertical: GariLinkSpacing.sm),
      child: Text(
        title,
        style: GariLinkTypography.bodySmall.copyWith(
          color: GariLinkColors.textMuted,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildMenuItem(String title, IconData icon) {
    return InkWell(
      onTap: () {},
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: GariLinkSpacing.lg, vertical: GariLinkSpacing.md),
        decoration: BoxDecoration(
          color: GariLinkColors.surface,
          border: Border(
            bottom: BorderSide(color: GariLinkColors.neutral100, width: 1),
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(GariLinkSpacing.sm),
              decoration: BoxDecoration(
                color: GariLinkColors.neutral100,
                borderRadius: BorderRadius.circular(GariLinkRadius.badge),
              ),
              child: Icon(icon, color: GariLinkColors.textPrimary, size: 20),
            ),
            const SizedBox(width: GariLinkSpacing.md),
            Expanded(
              child: Text(title, style: GariLinkTypography.bodyLarge.copyWith(fontWeight: FontWeight.w500)),
            ),
            const Icon(Icons.chevron_right, color: GariLinkColors.textMuted),
          ],
        ),
      ),
    );
  }

  Widget _buildLogoutButton() {
    return InkWell(
      onTap: () {},
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: GariLinkSpacing.lg, vertical: GariLinkSpacing.lg),
        decoration: const BoxDecoration(
          color: GariLinkColors.surface,
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(GariLinkSpacing.sm),
              decoration: BoxDecoration(
                color: GariLinkColors.error.withOpacity(0.1),
                borderRadius: BorderRadius.circular(GariLinkRadius.badge),
              ),
              child: const Icon(Icons.logout_rounded, color: GariLinkColors.error, size: 20),
            ),
            const SizedBox(width: GariLinkSpacing.md),
            Text('Logout', style: GariLinkTypography.bodyLarge.copyWith(color: GariLinkColors.error, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}

