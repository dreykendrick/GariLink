import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:garilink_mobile/core/theme/colors.dart';
import 'package:garilink_mobile/core/theme/spacing.dart';
import 'package:garilink_mobile/core/theme/radius.dart';
import 'package:garilink_mobile/core/theme/typography.dart';
import '../providers/explore_provider.dart';

class ExplorePage extends ConsumerStatefulWidget {
  const ExplorePage({super.key});

  @override
  ConsumerState<ExplorePage> createState() => _ExplorePageState();
}

class _ExplorePageState extends ConsumerState<ExplorePage> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  final List<Map<String, dynamic>> _mockResults = [
    {
      'name': 'Toyota RAV4',
      'price': 80.0,
      'rating': 4.6,
      'status': 'Available',
      'subtitle': '2022 • Nairobi',
      'image': 'assets/images/vehicles/placeholder.jpg',
    },
    {
      'name': 'Ford Ranger',
      'price': 80.0,
      'rating': 4.7,
      'status': 'Available',
      'subtitle': '2021 • Mombasa',
      'image': 'assets/images/vehicles/placeholder.jpg',
    },
    {
      'name': 'Range Rover Sport',
      'price': 150.0,
      'rating': 4.9,
      'status': 'Available',
      'subtitle': '2023 • Nairobi',
      'image': 'assets/images/vehicles/placeholder.jpg',
    },
    {
      'name': 'Hilux Double Cab',
      'price': 70.0,
      'rating': 4.5,
      'status': 'Available',
      'subtitle': '2020 • Nakuru',
      'image': 'assets/images/vehicles/placeholder.jpg',
    },
    {
      'name': 'Toyota Land Cruiser',
      'price': 120.0,
      'rating': 4.8,
      'status': 'Available',
      'subtitle': '2022 • Kisumu',
      'image': 'assets/images/vehicles/placeholder.jpg',
    },
  ];

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.toLowerCase();
      });
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filteredResults = _mockResults.where((vehicle) {
      final name = vehicle['name'].toString().toLowerCase();
      final subtitle = vehicle['subtitle'].toString().toLowerCase();
      return name.contains(_searchQuery) || subtitle.contains(_searchQuery);
    }).toList();

    final apiListings = ref.watch(searchListingsProvider(_searchQuery)).valueOrNull ?? [];
    final activeResults = apiListings.isNotEmpty
        ? apiListings.map((item) => {
            'name': item['title'] ?? item['name'] ?? 'Vehicle Listing',
            'subtitle': item['pickupCity'] ?? item['subtitle'] ?? 'Dar es Salaam',
            'price': '\$${item['rentalConfig']?['dailyRate'] ?? item['price'] ?? 80}/day',
            'rating': item['rating'] ?? 4.8,
            'image': 'assets/images/vehicles/placeholder.jpg',
            'isAvailable': true,
          }).toList()
        : filteredResults;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () {
                      if (context.canPop()) {
                        context.pop();
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.all(8.0),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12.0),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: const Icon(Icons.arrow_back_ios_new, size: 18, color: Color(0xFF0B1F3A)),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      'Explore / Search',
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF0B1F3A),
                      ),
                    ),
                  ),
                  Container(
                    height: 40,
                    width: 40,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20.0),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.notifications_none_rounded,
                      color: Color(0xFF0B1F3A),
                      size: 20,
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Container(
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24.0),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Row(
                  children: [
                    const Icon(Icons.search, color: Color(0xFF94A3B8)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _searchController,
                        style: GoogleFonts.inter(fontSize: 14),
                        decoration: InputDecoration(
                          hintText: 'Search vehicles, services...',
                          hintStyle: GoogleFonts.inter(
                            color: const Color(0xFF94A3B8),
                            fontSize: 14,
                          ),
                          border: InputBorder.none,
                          isDense: true,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 36,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                children: [
                  _buildFilterChip(Icons.location_on_outlined, 'Location'),
                  _buildFilterChip(Icons.attach_money_rounded, 'Price'),
                  _buildFilterChip(Icons.directions_car_outlined, 'SUV'),
                  _buildFilterChip(Icons.tune_rounded, 'Filters', isLast: true),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${activeResults.length} vehicles found',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF0B1F3A),
                    ),
                  ),
                  Row(
                    children: [
                      Text(
                        'Sort',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(Icons.sort, size: 16, color: Color(0xFF64748B)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
                itemCount: activeResults.length,
                itemBuilder: (context, index) {
                  final vehicle = activeResults[index];
                  return GestureDetector(
                    onTap: () => context.push('/vehicle-details'),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 12.0),
                      padding: const EdgeInsets.all(12.0),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14.0),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.04),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12.0),
                            child: Container(
                              width: 120,
                              height: 100,
                              color: const Color(0xFFE2E8F0),
                              child: Image.asset(
                                vehicle['image'] as String,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) =>
                                    const Center(child: Icon(Icons.directions_car, color: Colors.grey)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        vehicle['name'] as String,
                                        style: GoogleFonts.inter(
                                          fontSize: 15,
                                          fontWeight: FontWeight.bold,
                                          color: const Color(0xFF0B1F3A),
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    const Icon(Icons.favorite_border, size: 18, color: Color(0xFF94A3B8)),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  vehicle['subtitle'] as String,
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    color: const Color(0xFF64748B),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    Text(
                                      '\$${vehicle['price']}/day',
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: const Color(0xFF2D7FF9),
                                      ),
                                    ),
                                    const Spacer(),
                                    Row(
                                      children: [
                                        const Icon(Icons.star, color: Colors.amber, size: 14),
                                        const SizedBox(width: 4),
                                        Text(
                                          '${vehicle['rating']}',
                                          style: GoogleFonts.inter(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: const Color(0xFF0B1F3A),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.green.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(6.0),
                                  ),
                                  child: Text(
                                    vehicle['status'] as String,
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.green,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(IconData icon, String label, {bool isLast = false}) {
    return Container(
      margin: const EdgeInsets.only(right: 8.0),
      padding: const EdgeInsets.symmetric(horizontal: 12.0),
      decoration: BoxDecoration(
        color: isLast ? const Color(0xFF2D7FF9).withOpacity(0.1) : Colors.white,
        borderRadius: BorderRadius.circular(18.0),
        border: Border.all(
          color: isLast ? const Color(0xFF2D7FF9) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            size: 16,
            color: isLast ? const Color(0xFF2D7FF9) : const Color(0xFF64748B),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: isLast ? FontWeight.w600 : FontWeight.w500,
              color: isLast ? const Color(0xFF2D7FF9) : const Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }
}
