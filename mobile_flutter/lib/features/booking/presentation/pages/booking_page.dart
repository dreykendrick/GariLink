import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:garilink_mobile/core/theme/colors.dart';
import 'package:garilink_mobile/core/theme/spacing.dart';
import 'package:garilink_mobile/core/theme/radius.dart';
import 'package:garilink_mobile/core/theme/typography.dart';

class BookingPage extends StatefulWidget {
  final String vehicleId;
  const BookingPage({super.key, required this.vehicleId});

  @override
  State<BookingPage> createState() => _BookingPageState();
}

class _BookingPageState extends State<BookingPage> {
  int? selectedStart = 10;
  int? selectedEnd = 14;
  TimeOfDay pickupTime = const TimeOfDay(hour: 10, minute: 0);
  TimeOfDay returnTime = const TimeOfDay(hour: 10, minute: 0);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: GariLinkColors.background,
      appBar: _buildAppBar(context),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(GariLinkSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Select Dates",
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: GariLinkColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: GariLinkSpacing.md),
                  _buildCalendar(),
                  const SizedBox(height: GariLinkSpacing.lg),
                  _buildTimeSelectionRow(context),
                  const SizedBox(height: GariLinkSpacing.lg),
                  _buildNotesField(),
                  const SizedBox(height: GariLinkSpacing.xxl),
                  _buildPriceSummaryCard(),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
          _buildBottomBar(context),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      centerTitle: true,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: GariLinkColors.textPrimary),
        onPressed: () => context.pop(),
      ),
      title: Text(
        "Booking",
        style: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: GariLinkColors.textPrimary,
        ),
      ),
      actions: [
        Padding(
          padding: const EdgeInsets.only(right: GariLinkSpacing.lg),
          child: Row(
            children: [
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    "Toyota Land Cruiser",
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: GariLinkColors.textPrimary,
                    ),
                  ),
                  Text(
                    "\$120 / day",
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: GariLinkColors.textSecondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(width: GariLinkSpacing.sm),
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: GariLinkColors.neutral300,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.directions_car,
                  color: GariLinkColors.neutral500,
                  size: 20,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCalendar() {
    return Container(
      padding: const EdgeInsets.all(GariLinkSpacing.lg),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: GariLinkColors.border),
      ),
      child: Column(
        children: [
          // Month navigation
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left),
                onPressed: () {},
                color: GariLinkColors.textSecondary,
              ),
              Text(
                "May 2025",
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: GariLinkColors.textPrimary,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.chevron_right),
                onPressed: () {},
                color: GariLinkColors.textSecondary,
              ),
            ],
          ),
          const SizedBox(height: GariLinkSpacing.md),
          // Weekday labels
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                .map((day) => Expanded(
                      child: Center(
                        child: Text(
                          day,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: GariLinkColors.textSecondary,
                          ),
                        ),
                      ),
                    ))
                .toList(),
          ),
          const SizedBox(height: GariLinkSpacing.sm),
          // Calendar Grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: 35, // 5 rows x 7 days
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              childAspectRatio: 1,
            ),
            itemBuilder: (context, index) {
              // May 1st 2025 is Thursday (index 3)
              int dayOffset = 3;
              int dayNumber = index - dayOffset + 1;
              
              if (dayNumber < 1 || dayNumber > 31) {
                return const SizedBox();
              }

              bool isStart = dayNumber == selectedStart;
              bool isEnd = dayNumber == selectedEnd;
              bool isInRange = selectedStart != null &&
                  selectedEnd != null &&
                  dayNumber > selectedStart! &&
                  dayNumber < selectedEnd!;

              BoxDecoration? decoration;
              Color textColor = GariLinkColors.textPrimary;

              if (isStart || isEnd) {
                decoration = const BoxDecoration(
                  color: GariLinkColors.accent,
                  shape: BoxShape.circle,
                );
                textColor = Colors.white;
              } else if (isInRange) {
                decoration = BoxDecoration(
                  color: GariLinkColors.accent.withOpacity(0.1),
                  shape: BoxShape.rectangle,
                );
              }

              return GestureDetector(
                onTap: () {
                  setState(() {
                    if (selectedStart == null || (selectedStart != null && selectedEnd != null)) {
                      selectedStart = dayNumber;
                      selectedEnd = null;
                    } else if (selectedStart != null && selectedEnd == null) {
                      if (dayNumber < selectedStart!) {
                        selectedEnd = selectedStart;
                        selectedStart = dayNumber;
                      } else {
                        selectedEnd = dayNumber;
                      }
                    }
                  });
                },
                child: Container(
                  margin: EdgeInsets.symmetric(
                    vertical: 4,
                    // If in range, remove horizontal margin to connect background
                    horizontal: isInRange ? 0 : 4, 
                  ),
                  decoration: decoration,
                  child: Center(
                    child: Text(
                      dayNumber.toString(),
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: (isStart || isEnd) ? FontWeight.w600 : FontWeight.w500,
                        color: textColor,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildTimeSelectionRow(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _buildTimePickerBox(
            label: "Pickup Time",
            time: pickupTime,
            onTap: () async {
              final selected = await showTimePicker(
                context: context,
                initialTime: pickupTime,
              );
              if (selected != null) {
                setState(() => pickupTime = selected);
              }
            },
          ),
        ),
        const SizedBox(width: GariLinkSpacing.md),
        Expanded(
          child: _buildTimePickerBox(
            label: "Return Time",
            time: returnTime,
            onTap: () async {
              final selected = await showTimePicker(
                context: context,
                initialTime: returnTime,
              );
              if (selected != null) {
                setState(() => returnTime = selected);
              }
            },
          ),
        ),
      ],
    );
  }

  Widget _buildTimePickerBox({
    required String label,
    required TimeOfDay time,
    required VoidCallback onTap,
  }) {
    // Format TimeOfDay
    final String formattedTime =
        "\${time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod}:\${time.minute.toString().padLeft(2, '0')} \${time.period == DayPeriod.am ? 'AM' : 'PM'}";

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: GariLinkSpacing.md,
          vertical: GariLinkSpacing.md,
        ),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: GariLinkColors.border),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12,
                color: GariLinkColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  formattedTime,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: GariLinkColors.textPrimary,
                  ),
                ),
                const Icon(
                  Icons.access_time,
                  size: 16,
                  color: GariLinkColors.textSecondary,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotesField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Notes (Optional)",
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: GariLinkColors.textPrimary,
          ),
        ),
        const SizedBox(height: GariLinkSpacing.sm),
        TextField(
          maxLines: 3,
          style: GoogleFonts.inter(
            fontSize: 14,
            color: GariLinkColors.textPrimary,
          ),
          decoration: InputDecoration(
            hintText: "Add any special requests...",
            hintStyle: GoogleFonts.inter(
              color: GariLinkColors.textMuted,
            ),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: GariLinkColors.border),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: GariLinkColors.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: GariLinkColors.accent),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPriceSummaryCard() {
    return Container(
      padding: const EdgeInsets.all(GariLinkSpacing.lg),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "4 Days",
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: GariLinkColors.textSecondary,
                ),
              ),
              Text(
                "\$480",
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: GariLinkColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: GariLinkSpacing.md),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Installation fees",
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: GariLinkColors.textSecondary,
                ),
              ),
              Text(
                "\$60",
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: GariLinkColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: GariLinkSpacing.md),
          const Divider(color: GariLinkColors.border),
          const SizedBox(height: GariLinkSpacing.md),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Total before taxes",
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: GariLinkColors.textPrimary,
                ),
              ),
              Text(
                "\$540",
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: GariLinkColors.accent,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar(BuildContext context) {
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
      child: SizedBox(
        width: double.infinity,
        height: 56,
        child: ElevatedButton(
          onPressed: () {
            // Handle booking request
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: GariLinkColors.accent,
            foregroundColor: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          child: Text(
            "Request Booking",
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}
