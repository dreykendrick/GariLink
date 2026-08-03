import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:garilink_mobile/core/theme/colors.dart';
import 'package:garilink_mobile/core/theme/spacing.dart';
import 'package:garilink_mobile/core/theme/radius.dart';
import '../providers/trips_provider.dart';

class TripsPage extends ConsumerStatefulWidget {
  const TripsPage({Key? key}) : super(key: key);

  @override
  ConsumerState<TripsPage> createState() => _TripsPageState();
}

class _TripsPageState extends ConsumerState<TripsPage> {
  int _selectedTabIndex = 0;

  final List<String> _tabs = ['Upcoming', 'Active', 'Completed', 'Cancelled'];

  final List<Map<String, dynamic>> _allTrips = [
    {
      'type': 'Upcoming',
      'name': 'Toyota RAV4',
      'dates': '23 May – 27 May 2025',
      'price': '\$240',
      'status': 'Confirmed',
    },
    {
      'type': 'Upcoming',
      'name': 'Toyota Land Cruiser',
      'dates': '10 Jun – 15 Jun 2025',
      'price': '\$450',
      'status': 'Confirmed',
    },
    {
      'type': 'Active',
      'name': 'Ford Ranger',
      'dates': '12 May – 16 May 2025',
      'price': '\$320',
      'status': 'On Going',
    },
    {
      'type': 'Completed',
      'name': 'Hilux Double Cab',
      'dates': '01 May – 05 May 2025',
      'price': '\$280',
      'status': 'Completed',
    },
  ];

  @override
  Widget build(BuildContext context) {
    final apiRentals = ref.watch(myTripsProvider).valueOrNull ?? [];
    final mappedApiTrips = apiRentals.map((r) => {
      'type': 'Upcoming',
      'name': 'GariLink Rental #${r['id'].toString().substring(0, 6)}',
      'dates': '${r['startDate'] ?? ''} – ${r['endDate'] ?? ''}',
      'price': r['status'] ?? 'PENDING',
      'status': r['status'] ?? 'Confirmed',
    }).toList();

    final combinedTrips = [...mappedApiTrips, ..._allTrips];
    final filteredTrips = combinedTrips
        .where((trip) => trip['type'] == _tabs[_selectedTabIndex])
        .toList();

    return Scaffold(
      backgroundColor: GariLinkColors.background,
      appBar: AppBar(
        backgroundColor: GariLinkColors.background,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Text(
          'Trips',
          style: GoogleFonts.inter(
            color: GariLinkColors.primary,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: Column(
        children: [
          _buildTabBar(),
          Expanded(
            child: _buildTripsList(filteredTrips),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      height: 48,
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: Color(0xFFE2E8F0),
            width: 1,
          ),
        ),
      ),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: GariLinkSpacing.lg),
        itemCount: _tabs.length,
        itemBuilder: (context, index) {
          final isSelected = _selectedTabIndex == index;
          return GestureDetector(
            onTap: () {
              setState(() {
                _selectedTabIndex = index;
              });
            },
            child: Container(
              margin: const EdgeInsets.only(right: GariLinkSpacing.lg),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: isSelected
                        ? GariLinkColors.accent
                        : Colors.transparent,
                    width: 2,
                  ),
                ),
              ),
              alignment: Alignment.center,
              child: Text(
                _tabs[index],
                style: GoogleFonts.inter(
                  color: isSelected
                      ? GariLinkColors.accent
                      : GariLinkColors.textMuted,
                  fontSize: 14,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTripsList(List<Map<String, dynamic>> trips) {
    if (trips.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.directions_car_outlined,
              size: 48,
              color: GariLinkColors.textMuted.withOpacity(0.5),
            ),
            const SizedBox(height: GariLinkSpacing.md),
            Text(
              'No ${_tabs[_selectedTabIndex].toLowerCase()} trips',
              style: GoogleFonts.inter(
                color: GariLinkColors.textMuted,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(GariLinkSpacing.lg),
      itemCount: trips.length,
      itemBuilder: (context, index) {
        final trip = trips[index];
        return _buildTripCard(trip);
      },
    );
  }

  Widget _buildTripCard(Map<String, dynamic> trip) {
    Color statusColor;
    switch (trip['status']) {
      case 'Confirmed':
        statusColor = GariLinkColors.success;
        break;
      case 'On Going':
        statusColor = GariLinkColors.accent;
        break;
      case 'Cancelled':
        statusColor = GariLinkColors.error;
        break;
      case 'Completed':
      default:
        statusColor = GariLinkColors.textMuted;
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: GariLinkSpacing.lg),
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
      child: Padding(
        padding: const EdgeInsets.all(GariLinkSpacing.md),
        child: Row(
          children: [
            // Image Placeholder
            Container(
              width: 90,
              height: 80,
              decoration: BoxDecoration(
                color: const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(GariLinkRadius.image),
              ),
              child: const Center(
                child: Icon(
                  Icons.directions_car,
                  color: GariLinkColors.textMuted,
                ),
              ),
            ),
            const SizedBox(width: GariLinkSpacing.md),
            
            // Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          trip['name'],
                          style: GoogleFonts.inter(
                            color: GariLinkColors.textPrimary,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: GariLinkSpacing.xs),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: GariLinkSpacing.sm,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          trip['status'],
                          style: GoogleFonts.inter(
                            color: statusColor,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: GariLinkSpacing.xs),
                  Text(
                    trip['dates'],
                    style: GoogleFonts.inter(
                      color: GariLinkColors.textMuted,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: GariLinkSpacing.sm),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        trip['price'],
                        style: GoogleFonts.inter(
                          color: GariLinkColors.accent,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const Icon(
                        Icons.chevron_right,
                        color: GariLinkColors.textMuted,
                        size: 20,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
