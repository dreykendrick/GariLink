import 'package:flutter/material.dart';
import 'package:garilink_mobile/core/theme/theme.dart';

class MyVehiclesPage extends StatelessWidget {
  const MyVehiclesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        backgroundColor: GariLinkColors.background,
        appBar: AppBar(
          backgroundColor: GariLinkColors.surface,
          elevation: 0,
          title: Text('My Vehicles', style: GariLinkTypography.titleLarge),
          centerTitle: false,
          iconTheme: const IconThemeData(color: GariLinkColors.textPrimary),
          bottom: TabBar(
            isScrollable: true,
            labelColor: GariLinkColors.accent,
            unselectedLabelColor: GariLinkColors.textMuted,
            indicatorColor: GariLinkColors.accent,
            labelStyle: GariLinkTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600),
            tabs: const [
              Tab(text: 'All'),
              Tab(text: 'Published'),
              Tab(text: 'Paused'),
              Tab(text: 'Drafts'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildVehicleList(),
            _buildVehicleList(filterStatus: 'Published'),
            _buildVehicleList(filterStatus: 'Paused'),
            _buildVehicleList(filterStatus: 'Drafts'),
          ],
        ),
        floatingActionButton: FloatingActionButton(
          backgroundColor: GariLinkColors.accent,
          onPressed: () {},
          child: const Icon(Icons.add, color: GariLinkColors.surface),
        ),
      ),
    );
  }

  Widget _buildVehicleList({String? filterStatus}) {
    final List<Map<String, dynamic>> vehicles = [
      {
        'name': 'Toyota Land Cruiser',
        'price': '\$120',
        'status': 'Published',
        'views': 320,
        'bookings': 18,
        'earnings': '\$2,560',
      },
      {
        'name': 'Ford Ranger',
        'price': '\$80',
        'status': 'Published',
        'views': 210,
        'bookings': 11,
        'earnings': '\$880',
      },
      {
        'name': 'Hilux Double Cab',
        'price': '\$70',
        'status': 'Paused',
        'views': 150,
        'bookings': 6,
        'earnings': '\$420',
      },
    ];

    final filteredVehicles = filterStatus == null 
        ? vehicles 
        : vehicles.where((v) => v['status'] == filterStatus).toList();

    return ListView.builder(
      padding: const EdgeInsets.all(GariLinkSpacing.lg),
      itemCount: filteredVehicles.length,
      itemBuilder: (context, index) {
        final vehicle = filteredVehicles[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: GariLinkSpacing.lg),
          child: _buildVehicleCard(vehicle),
        );
      },
    );
  }

  Widget _buildVehicleCard(Map<String, dynamic> vehicle) {
    final bool isPublished = vehicle['status'] == 'Published';
    
    return Container(
      padding: const EdgeInsets.all(GariLinkSpacing.md),
      decoration: BoxDecoration(
        color: GariLinkColors.surface,
        borderRadius: BorderRadius.circular(GariLinkRadius.card),
        boxShadow: [
          BoxShadow(color: GariLinkColors.textPrimary.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 100,
                height: 90,
                decoration: BoxDecoration(
                  color: GariLinkColors.neutral100,
                  borderRadius: BorderRadius.circular(GariLinkRadius.input),
                ),
                child: const Icon(Icons.directions_car, color: GariLinkColors.textMuted, size: 40),
              ),
              const SizedBox(width: GariLinkSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(vehicle['name'], style: GariLinkTypography.bodyLarge, maxLines: 2, overflow: TextOverflow.ellipsis),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: GariLinkSpacing.sm, vertical: GariLinkSpacing.xs),
                          decoration: BoxDecoration(
                            color: isPublished ? GariLinkColors.success.withOpacity(0.1) : GariLinkColors.textMuted.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(GariLinkRadius.badge),
                          ),
                          child: Text(
                            vehicle['status'],
                            style: GariLinkTypography.bodySmall.copyWith(
                              color: isPublished ? GariLinkColors.success : GariLinkColors.textMuted,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: GariLinkSpacing.xs),
                    Text('${vehicle['price']}/day', style: GariLinkTypography.bodyMedium.copyWith(color: GariLinkColors.accent, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: GariLinkSpacing.md),
          Divider(color: GariLinkColors.neutral100),
          const SizedBox(height: GariLinkSpacing.sm),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildStatItem('Views', vehicle['views'].toString()),
              _buildStatItem('Bookings', vehicle['bookings'].toString()),
              _buildStatItem('Earnings', vehicle['earnings'].toString()),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(label, style: GariLinkTypography.bodySmall.copyWith(color: GariLinkColors.textMuted)),
        const SizedBox(height: 2),
        Text(value, style: GariLinkTypography.bodyMedium.copyWith(fontWeight: FontWeight.bold)),
      ],
    );
  }
}

