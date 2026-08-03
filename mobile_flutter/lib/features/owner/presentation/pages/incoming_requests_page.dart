import 'package:flutter/material.dart';
import 'package:garilink_mobile/core/theme/theme.dart';

class IncomingRequestsPage extends StatelessWidget {
  const IncomingRequestsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        backgroundColor: GariLinkColors.background,
        appBar: AppBar(
          backgroundColor: GariLinkColors.surface,
          elevation: 0,
          title: Text('Incoming Requests', style: GariLinkTypography.titleLarge),
          centerTitle: false,
          iconTheme: const IconThemeData(color: GariLinkColors.textPrimary),
          bottom: TabBar(
            isScrollable: true,
            labelColor: GariLinkColors.accent,
            unselectedLabelColor: GariLinkColors.textMuted,
            indicatorColor: GariLinkColors.accent,
            labelStyle: GariLinkTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600),
            tabs: const [
              Tab(text: 'Pending'),
              Tab(text: 'Accepted'),
              Tab(text: 'Completed'),
              Tab(text: 'Rejected'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildRequestsList(),
            const Center(child: Text('No accepted requests')),
            const Center(child: Text('No completed requests')),
            const Center(child: Text('No rejected requests')),
          ],
        ),
      ),
    );
  }

  Widget _buildRequestsList() {
    final List<Map<String, dynamic>> requests = [
      {
        'vehicle': 'Toyota Land Cruiser',
        'renter': 'Amina Hassan',
        'dates': '22 May–26 May',
        'price': '\$480',
        'time': '2 mins ago',
      },
      {
        'vehicle': 'Ford Ranger',
        'renter': 'John Mwangi',
        'dates': '13 May–15 May',
        'price': '\$168',
        'time': '11 mins ago',
      },
      {
        'vehicle': 'Range Rover Sport',
        'renter': 'Sarah Kimani',
        'dates': '25 May–30 May',
        'price': '\$750',
        'time': '15 mins ago',
      },
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(GariLinkSpacing.lg),
      itemCount: requests.length,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: GariLinkSpacing.lg),
          child: _buildRequestCard(requests[index]),
        );
      },
    );
  }

  Widget _buildRequestCard(Map<String, dynamic> request) {
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
                      children: [
                        Expanded(child: Text(request['vehicle'], style: GariLinkTypography.bodyLarge, maxLines: 1, overflow: TextOverflow.ellipsis)),
                        Text(request['time'], style: GariLinkTypography.bodySmall.copyWith(color: GariLinkColors.textMuted)),
                      ],
                    ),
                    const SizedBox(height: GariLinkSpacing.xs),
                    Text('Renter: ${request['renter']}', style: GariLinkTypography.bodyMedium),
                    const SizedBox(height: GariLinkSpacing.xs),
                    Text(request['dates'], style: GariLinkTypography.bodyMedium.copyWith(color: GariLinkColors.textMuted)),
                    const SizedBox(height: GariLinkSpacing.xs),
                    Text(request['price'], style: GariLinkTypography.bodyLarge.copyWith(color: GariLinkColors.accent)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: GariLinkSpacing.md),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {},
                  style: OutlinedButton.styleFrom(
                    foregroundColor: GariLinkColors.error,
                    side: const BorderSide(color: GariLinkColors.error),
                    padding: const EdgeInsets.symmetric(vertical: GariLinkSpacing.md),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(GariLinkRadius.badge)),
                  ),
                  child: const Text('Reject', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(width: GariLinkSpacing.md),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: GariLinkColors.success,
                    foregroundColor: GariLinkColors.surface,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: GariLinkSpacing.md),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(GariLinkRadius.badge)),
                  ),
                  child: const Text('Accept', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

