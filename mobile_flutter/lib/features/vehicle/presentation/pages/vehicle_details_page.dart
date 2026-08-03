import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:garilink_mobile/core/theme/colors.dart';
import 'package:garilink_mobile/core/theme/spacing.dart';
import 'package:garilink_mobile/core/theme/radius.dart';
import 'package:garilink_mobile/core/theme/typography.dart';

class VehicleDetailsPage extends StatelessWidget {
  final String vehicleId;

  const VehicleDetailsPage({
    super.key,
    required this.vehicleId,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: GariLinkColors.background,
      body: Stack(
        children: [
          // Background/Hero Image
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: _buildHeroImage(context),
          ),
          
          // Foreground Scrollable Sheet
          Positioned.fill(
            top: 250, // Slightly overlapping the image
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(24),
                  topRight: Radius.circular(24),
                ),
              ),
              child: CustomScrollView(
                physics: const ClampingScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(GariLinkSpacing.lg),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildHeaderAndRating(),
                          const SizedBox(height: GariLinkSpacing.md),
                          _buildPriceInfo(),
                          const SizedBox(height: GariLinkSpacing.lg),
                          _buildOwnerInfo(),
                          const SizedBox(height: GariLinkSpacing.lg),
                          _buildSpecChips(),
                          const SizedBox(height: GariLinkSpacing.lg),
                          const Divider(color: GariLinkColors.border),
                          const SizedBox(height: GariLinkSpacing.lg),
                          _buildAboutSection(),
                          const SizedBox(height: GariLinkSpacing.lg),
                          const Divider(color: GariLinkColors.border),
                          const SizedBox(height: GariLinkSpacing.lg),
                          _buildLocationInfo(),
                          // Extra space for bottom bar
                          const SizedBox(height: 100),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Sticky Bottom Bar
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _buildStickyBottomBar(context),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroImage(BuildContext context) {
    return SizedBox(
      height: 280,
      width: double.infinity,
      child: Stack(
        children: [
          // Using placeholder container since image asset might not exist yet
          Container(
            color: GariLinkColors.neutral300,
            width: double.infinity,
            height: double.infinity,
            child: Icon(
              Icons.directions_car,
              size: 100,
              color: GariLinkColors.neutral400,
            ),
          ),
          
          // Safe area overlays
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: GariLinkSpacing.lg,
                vertical: GariLinkSpacing.sm,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Back button
                  _buildIconBtn(
                    icon: Icons.arrow_back,
                    onTap: () => context.pop(),
                  ),
                  
                  // Top right actions
                  Row(
                    children: [
                      _buildIconBtn(
                        icon: Icons.bookmark_border,
                        onTap: () {},
                      ),
                      const SizedBox(width: GariLinkSpacing.sm),
                      _buildIconBtn(
                        icon: Icons.share,
                        onTap: () {},
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          
          // Image counter badge
          Positioned(
            bottom: 46, // Above the curved border
            right: GariLinkSpacing.lg,
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: GariLinkSpacing.md,
                vertical: 6,
              ),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.6),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                "1/12",
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIconBtn({required IconData icon, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(GariLinkSpacing.sm),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.4),
          shape: BoxShape.circle,
        ),
        child: Icon(
          icon,
          color: Colors.white,
          size: 20,
        ),
      ),
    );
  }

  Widget _buildHeaderAndRating() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Text(
            "Toyota Land Cruiser",
            style: GoogleFonts.inter(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: GariLinkColors.textPrimary,
            ),
          ),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              "2022",
              style: GoogleFonts.inter(
                fontSize: 14,
                color: GariLinkColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(
                  Icons.star,
                  color: GariLinkColors.starFilled,
                  size: 16,
                ),
                const SizedBox(width: 4),
                Text(
                  "4.8",
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: GariLinkColors.textPrimary,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  "(320)",
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: GariLinkColors.textSecondary,
                  ),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPriceInfo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              "\$120",
              style: GoogleFonts.inter(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: GariLinkColors.accent,
              ),
            ),
            Text(
              " / day",
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: GariLinkColors.textSecondary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          "Total before taxes",
          style: GoogleFonts.inter(
            fontSize: 12,
            color: GariLinkColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildOwnerInfo() {
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: GariLinkColors.neutral200,
          ),
          child: const Icon(
            Icons.person,
            color: GariLinkColors.neutral500,
          ),
        ),
        const SizedBox(width: GariLinkSpacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Makoa Rentals",
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: GariLinkColors.textPrimary,
                ),
              ),
              Text(
                "Owner",
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: GariLinkColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
        OutlinedButton(
          onPressed: () {},
          style: OutlinedButton.styleFrom(
            side: const BorderSide(color: GariLinkColors.accent),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(GariLinkRadius.button),
            ),
            padding: const EdgeInsets.symmetric(
              horizontal: GariLinkSpacing.lg,
              vertical: GariLinkSpacing.sm,
            ),
          ),
          child: Text(
            "Message",
            style: GoogleFonts.inter(
              color: GariLinkColors.accent,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSpecChips() {
    final specs = [
      {'icon': Icons.directions_car, 'label': 'SUV'},
      {'icon': Icons.local_gas_station, 'label': 'Diesel'},
      {'icon': Icons.airline_seat_recline_normal, 'label': '7 Seats'},
      {'icon': Icons.settings, 'label': 'Automatic'},
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: specs.map((spec) {
          return Container(
            margin: const EdgeInsets.only(right: GariLinkSpacing.sm),
            padding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 8,
            ),
            decoration: BoxDecoration(
              color: GariLinkColors.surfaceVariant, // #F1F5F9
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  spec['icon'] as IconData,
                  size: 16,
                  color: GariLinkColors.textPrimary,
                ),
                const SizedBox(width: 6),
                Text(
                  spec['label'] as String,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: GariLinkColors.textPrimary,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildAboutSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "About this car",
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: GariLinkColors.textPrimary,
          ),
        ),
        const SizedBox(height: GariLinkSpacing.sm),
        Text(
          "Powerful, comfortable and perfect for safari, business and long drives.",
          style: GoogleFonts.inter(
            fontSize: 14,
            height: 1.5,
            color: GariLinkColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildLocationInfo() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(
          Icons.location_on,
          color: GariLinkColors.accent,
          size: 20,
        ),
        const SizedBox(width: GariLinkSpacing.sm),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Nairobi, Kenya",
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: GariLinkColors.textPrimary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                "Westlands, Near Sarit Centre",
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: GariLinkColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStickyBottomBar(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: GariLinkSpacing.lg,
        vertical: GariLinkSpacing.md,
      ).copyWith(
        bottom: MediaQuery.of(context).padding.bottom + GariLinkSpacing.md,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            offset: const Offset(0, -4),
            blurRadius: 16,
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Price",
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: GariLinkColors.textSecondary,
                ),
              ),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    "\$120",
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: GariLinkColors.textPrimary,
                    ),
                  ),
                  Text(
                    " / day",
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: GariLinkColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ],
          ),
          ElevatedButton(
            onPressed: () {
              context.push('/booking');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: GariLinkColors.accent,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              padding: const EdgeInsets.symmetric(
                horizontal: GariLinkSpacing.xxl,
                vertical: GariLinkSpacing.md,
              ),
            ),
            child: Text(
              "Book Now",
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
