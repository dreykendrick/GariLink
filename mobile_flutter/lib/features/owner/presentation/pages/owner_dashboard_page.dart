import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:garilink_mobile/core/theme/theme.dart';

class OwnerDashboardPage extends StatelessWidget {
  const OwnerDashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: GariLinkColors.background,
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            Padding(
              padding: const EdgeInsets.all(GariLinkSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildEarningsRow(),
                  const SizedBox(height: GariLinkSpacing.lg),
                  _buildSecondaryStatsRow(),
                  const SizedBox(height: GariLinkSpacing.xxl),
                  Text('Quick Actions', style: GariLinkTypography.titleMedium),
                  const SizedBox(height: GariLinkSpacing.lg),
                  _buildQuickActionsGrid(context),
                  const SizedBox(height: GariLinkSpacing.xxl),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Recent Bookings', style: GariLinkTypography.titleMedium),
                      Text('See all', style: GariLinkTypography.bodyMedium.copyWith(color: GariLinkColors.accent, fontWeight: FontWeight.w600)),
                    ],
                  ),
                  const SizedBox(height: GariLinkSpacing.lg),
                  _buildRecentBookings(),
                  const SizedBox(height: GariLinkSpacing.xxl),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.only(
        top: 60,
        left: GariLinkSpacing.lg,
        right: GariLinkSpacing.lg,
        bottom: GariLinkSpacing.xl,
      ),
      decoration: const BoxDecoration(
        color: GariLinkColors.primary,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(GariLinkRadius.card),
          bottomRight: Radius.circular(GariLinkRadius.card),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Welcome back,',
                style: GariLinkTypography.bodyMedium.copyWith(color: GariLinkColors.surface.withOpacity(0.8)),
              ),
              const SizedBox(height: GariLinkSpacing.xs),
              Row(
                children: [
                  Text(
                    'Makoa Rentals',
                    style: GariLinkTypography.titleMedium.copyWith(color: GariLinkColors.surface),
                  ),
                  const SizedBox(width: GariLinkSpacing.xs),
                  const Text('👋', style: TextStyle(fontSize: 18)),
                ],
              ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.notifications_none, color: GariLinkColors.surface),
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildEarningsRow() {
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            'Total Earnings',
            '\$12,420',
            '+7% this month',
            true,
          ),
        ),
        const SizedBox(width: GariLinkSpacing.lg),
        Expanded(
          child: _buildStatCard(
            'Total Bookings',
            '42',
            '+8% this month',
            true,
          ),
        ),
      ],
    );
  }

  Widget _buildSecondaryStatsRow() {
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            'Vehicles',
            '12',
            'Active',
            false,
          ),
        ),
        const SizedBox(width: GariLinkSpacing.lg),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(GariLinkSpacing.lg),
            decoration: BoxDecoration(
              color: GariLinkColors.surface,
              borderRadius: BorderRadius.circular(GariLinkRadius.card),
              boxShadow: [
                BoxShadow(color: GariLinkColors.textPrimary.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Rating', style: GariLinkTypography.bodyMedium.copyWith(color: GariLinkColors.textMuted)),
                const SizedBox(height: GariLinkSpacing.sm),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text('4.8', style: GariLinkTypography.titleLarge),
                    const SizedBox(width: GariLinkSpacing.xs),
                    const Icon(Icons.star, color: Colors.amber, size: 24),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, String subLabel, bool isPositive) {
    return Container(
      padding: const EdgeInsets.all(GariLinkSpacing.lg),
      decoration: BoxDecoration(
        color: GariLinkColors.surface,
        borderRadius: BorderRadius.circular(GariLinkRadius.card),
        boxShadow: [
          BoxShadow(color: GariLinkColors.textPrimary.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: GariLinkTypography.bodyMedium.copyWith(color: GariLinkColors.textMuted)),
          const SizedBox(height: GariLinkSpacing.sm),
          Text(value, style: GariLinkTypography.titleLarge),
          const SizedBox(height: GariLinkSpacing.xs),
          Text(
            subLabel,
            style: GariLinkTypography.bodySmall.copyWith(
              color: isPositive ? GariLinkColors.success : GariLinkColors.textMuted,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionsGrid(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: GariLinkSpacing.lg,
      mainAxisSpacing: GariLinkSpacing.lg,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.2,
      children: [
        _buildActionCard(
          context,
          'Add Vehicle',
          Icons.add_circle_outline,
          '/my-vehicles',
        ),
        _buildActionCard(
          context,
          'Manage Listings',
          Icons.list_alt_rounded,
          '/my-vehicles',
        ),
        _buildActionCard(
          context,
          'Requests',
          Icons.inbox_outlined,
          '/incoming-requests',
        ),
        _buildActionCard(
          context,
          'Analytics',
          Icons.bar_chart_rounded,
          '/analytics',
        ),
      ],
    );
  }

  Widget _buildActionCard(BuildContext context, String label, IconData icon, String route) {
    return GestureDetector(
      onTap: () {
        try {
          context.go(route);
        } catch (e) {
          // Fallback if GoRouter is not set up
          debugPrint('Navigate to \$route');
        }
      },
      child: Container(
        decoration: BoxDecoration(
          color: GariLinkColors.surface,
          borderRadius: BorderRadius.circular(GariLinkRadius.card),
          boxShadow: [
            BoxShadow(color: GariLinkColors.textPrimary.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 48, color: GariLinkColors.accent),
            const SizedBox(height: GariLinkSpacing.sm),
            Text(label, style: GariLinkTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentBookings() {
    return Column(
      children: [
        _buildBookingTile('Toyota Land Cruiser', '18 Apr – 22 May', '\$480'),
        const SizedBox(height: GariLinkSpacing.md),
        _buildBookingTile('Ford Ranger', '18 Apr – 22 May', '\$320'),
      ],
    );
  }

  Widget _buildBookingTile(String vehicle, String dates, String price) {
    return Container(
      padding: const EdgeInsets.all(GariLinkSpacing.md),
      decoration: BoxDecoration(
        color: GariLinkColors.surface,
        borderRadius: BorderRadius.circular(GariLinkRadius.card),
        boxShadow: [
          BoxShadow(color: GariLinkColors.textPrimary.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 80,
            height: 60,
            decoration: BoxDecoration(
              color: GariLinkColors.neutral100,
              borderRadius: BorderRadius.circular(GariLinkRadius.input),
            ),
            child: const Icon(Icons.directions_car, color: GariLinkColors.textMuted, size: 32),
          ),
          const SizedBox(width: GariLinkSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(vehicle, style: GariLinkTypography.bodyLarge),
                const SizedBox(height: GariLinkSpacing.xs),
                Text(dates, style: GariLinkTypography.bodySmall.copyWith(color: GariLinkColors.textMuted)),
              ],
            ),
          ),
          Text(price, style: GariLinkTypography.bodyLarge.copyWith(color: GariLinkColors.accent)),
        ],
      ),
    );
  }
}

