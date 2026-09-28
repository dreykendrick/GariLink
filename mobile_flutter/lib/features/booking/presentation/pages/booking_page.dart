import 'package:flutter/material.dart';
import 'transport_need_form.dart';
import 'rental_location_form.dart';
import '../../../explore/domain/discovery_selection.dart';
import '../../../trips/presentation/providers/trips_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:garilink_mobile/core/formatters/marketplace_formatters.dart';
import 'package:garilink_mobile/core/theme/theme.dart';
import 'package:garilink_mobile/core/errors/app_exception.dart';
import 'package:garilink_mobile/features/trips/data/repositories/rental_repository.dart';
import 'package:garilink_mobile/features/vehicle/domain/models/rental_pricing.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../trips/presentation/pages/transport_need_summary.dart';
import '../../../trips/domain/models/transport_need.dart';

class BookingPage extends ConsumerStatefulWidget {
  final DiscoverySelection? selection;
  final String listingId;
  final double dailyRate;
  final String currency;
  final String? vehicleTitle;
  final String? vehicleCategory;
  final String? publicLocality;
  final String? availability;
  final String? coverUrl;

  const BookingPage({
    super.key,
    required this.listingId,
    required this.dailyRate,
    required this.currency,
    this.vehicleTitle,
    this.vehicleCategory,
    this.publicLocality,
    this.availability,
    this.coverUrl,
    this.selection,
  });

  @override
  ConsumerState<BookingPage> createState() => _BookingPageState();
}

class _VehicleFallback extends StatelessWidget {
  const _VehicleFallback();

  @override
  Widget build(BuildContext context) => const ColoredBox(
    color: GariLinkColors.neutral200,
    child: Icon(
      Icons.directions_car_filled_outlined,
      color: GariLinkColors.textMuted,
    ),
  );
}

class _BookingPageState extends ConsumerState<BookingPage> {
  int? selectedStart;
  int? selectedEnd;
  late DateTime visibleMonth;
  final _notesController = TextEditingController();
  final _retryRequest = RentalRetryRequest();
  final _transportForm = GlobalKey<TransportNeedFormState>();
  final _locationForm = GlobalKey<RentalLocationFormState>();
  bool _submitting = false;
  bool _estimating = false;
  RentalPriceEstimate? _estimate;
  final _estimateGuard = RentalEstimateRequestGuard();

  TransportNeed? get _transportNeed =>
      widget.selection?.listingId == widget.listingId
      ? widget.selection!.need
      : _transportForm.currentState?.need;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    visibleMonth = DateTime(now.year, now.month + 1);
  }

  int get rentalDays {
    if (selectedStart == null || selectedEnd == null) return 0;
    return DateTime(visibleMonth.year, visibleMonth.month, selectedEnd!)
        .difference(
          DateTime(visibleMonth.year, visibleMonth.month, selectedStart!),
        )
        .inDays;
  }

  DateTime? get _startDate => selectedStart == null
      ? null
      : DateTime(visibleMonth.year, visibleMonth.month, selectedStart!);
  DateTime? get _endDate => selectedEnd == null
      ? null
      : DateTime(visibleMonth.year, visibleMonth.month, selectedEnd!);

  Future<void> _requestEstimate() async {
    if (_startDate == null || _endDate == null) return;
    final generation = _estimateGuard.begin();
    setState(() => _estimating = true);
    try {
      final value = await ref
          .read(rentalRepositoryProvider)
          .estimateRental(
            listingId: widget.listingId,
            startDate: _startDate!,
            endDate: _endDate!,
            pickupLocation: _locationForm.currentState?.pickup,
            destinationLocation: _locationForm.currentState?.destination,
          );
      if (mounted && _estimateGuard.isCurrent(generation)) {
        setState(() => _estimate = value);
      }
    } catch (_) {
      if (mounted && _estimateGuard.isCurrent(generation)) {
        setState(
          () => _estimate = const RentalPriceEstimate(
            status: RentalEstimateStatus.error,
            estimateVersion: 1,
            pricingPolicyVersion: 1,
            currency: 'TZS',
          ),
        );
      }
    } finally {
      if (mounted && _estimateGuard.isCurrent(generation)) {
        setState(() => _estimating = false);
      }
    }
  }

  void _invalidateEstimate() {
    _estimateGuard.invalidate();
    _estimate = null;
    _estimating = false;
  }

  @override
  void didUpdateWidget(covariant BookingPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.listingId != widget.listingId) {
      _invalidateEstimate();
    }
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

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
                  _buildVehicleSummary(),
                  const SizedBox(height: GariLinkSpacing.xl),
                  Text(
                    'When do you need it?',
                    style: GariLinkTypography.sectionTitle,
                  ),
                  const SizedBox(height: GariLinkSpacing.sm),
                  const Text('Choose a start date and an end date.'),
                  const SizedBox(height: GariLinkSpacing.md),
                  _buildCalendar(),
                  if (rentalDays > 0) ...[
                    const SizedBox(height: GariLinkSpacing.sm),
                    Text(
                      '$rentalDays rental day${rentalDays == 1 ? '' : 's'}',
                      style: GariLinkTypography.bodyMedium,
                    ),
                  ],
                  const SizedBox(height: GariLinkSpacing.xl),
                  RentalLocationForm(
                    key: _locationForm,
                    onChanged: () {
                      if (_estimate != null || _estimating) {
                        setState(_invalidateEstimate);
                      }
                    },
                  ),
                  const SizedBox(height: GariLinkSpacing.xl),
                  Text(
                    'Your transport need',
                    style: GariLinkTypography.sectionTitle,
                  ),
                  const SizedBox(height: GariLinkSpacing.sm),
                  if (widget.selection?.listingId == widget.listingId)
                    TransportNeedSummary(need: widget.selection!.need)
                  else
                    TransportNeedForm(key: _transportForm),
                  const SizedBox(height: GariLinkSpacing.md),
                  const Text(
                    'Your search area is not your pickup location. Enter the pickup separately.',
                  ),
                  const SizedBox(height: GariLinkSpacing.lg),
                  Semantics(
                    label:
                        'Availability is confirmed by the owner when the request is approved',
                    child: const Row(
                      children: [
                        Icon(
                          Icons.verified_user_outlined,
                          color: GariLinkColors.accent,
                        ),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Final availability is confirmed when the owner approves your request.',
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: GariLinkSpacing.lg),
                  _buildNotesField(),
                  const SizedBox(height: GariLinkSpacing.xxl),
                  _buildPriceSummaryCard(),
                  const SizedBox(height: GariLinkSpacing.xl),
                  _buildReviewCard(),
                  const SizedBox(height: GariLinkSpacing.xxxl),
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
      centerTitle: false,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: GariLinkColors.textPrimary),
        onPressed: () => context.pop(),
      ),
      title: const Text("Rental request"),
    );
  }

  Widget _buildVehicleSummary() {
    final title = widget.vehicleTitle?.trim();
    return Semantics(
      label:
          'Selected vehicle. ${title?.isNotEmpty == true ? title : 'Vehicle selected'}',
      child: Container(
        padding: const EdgeInsets.all(GariLinkSpacing.md),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: GariLinkRadius.cardBorderRadius,
          border: Border.all(color: GariLinkColors.border),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(GariLinkRadius.small),
              child: SizedBox.square(
                dimension: 76,
                child: widget.coverUrl?.isNotEmpty == true
                    ? CachedNetworkImage(
                        imageUrl: widget.coverUrl!,
                        fit: BoxFit.cover,
                        memCacheWidth: 240,
                        errorWidget: (_, _, _) => const _VehicleFallback(),
                      )
                    : const _VehicleFallback(),
              ),
            ),
            const SizedBox(width: GariLinkSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title?.isNotEmpty == true ? title! : 'Selected vehicle',
                    style: GariLinkTypography.titleMedium,
                  ),
                  if (widget.vehicleCategory?.isNotEmpty == true)
                    Text(
                      widget.vehicleCategory!,
                      style: GariLinkTypography.bodySmall,
                    ),
                  if (widget.publicLocality?.isNotEmpty == true)
                    Text(
                      'Operates around ${widget.publicLocality}',
                      style: GariLinkTypography.bodySmall,
                    ),
                  if (widget.availability?.isNotEmpty == true)
                    Text(
                      widget.availability!.toLowerCase().replaceAll('_', ' '),
                      style: GariLinkTypography.labelSmall.copyWith(
                        color: GariLinkColors.success,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReviewCard() => Container(
    padding: const EdgeInsets.all(GariLinkSpacing.lg),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: GariLinkRadius.cardBorderRadius,
      border: Border.all(color: GariLinkColors.border),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Review your request', style: GariLinkTypography.sectionTitle),
        const SizedBox(height: GariLinkSpacing.sm),
        if (_startDate != null && _endDate != null)
          Text(
            '${DateFormat('d MMM y').format(_startDate!)} – ${DateFormat('d MMM y').format(_endDate!)}',
          ),
        Text(
          _locationForm.currentState?.pickup == null
              ? 'Pickup location required'
              : 'Pickup: ${_locationForm.currentState!.pickup!.locality}',
        ),
        if (_locationForm.currentState?.destination != null)
          Text(
            'Destination: ${_locationForm.currentState!.destination!.locality}',
          ),
        const SizedBox(height: GariLinkSpacing.md),
        const Text(
          "Sending a request doesn't confirm the rental yet. The owner will review your request first. No payment is taken in GariLink.",
          style: TextStyle(color: GariLinkColors.textSecondary),
        ),
      ],
    ),
  );

  Widget _buildCalendar() {
    return Container(
      padding: const EdgeInsets.all(GariLinkSpacing.lg),
      decoration: BoxDecoration(
        color: GariLinkColors.surface,
        borderRadius: GariLinkRadius.cardBorderRadius,
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
                onPressed: () {
                  final previous = DateTime(
                    visibleMonth.year,
                    visibleMonth.month - 1,
                  );
                  final current = DateTime(
                    DateTime.now().year,
                    DateTime.now().month,
                  );
                  if (!previous.isBefore(current)) {
                    setState(() {
                      visibleMonth = previous;
                      selectedStart = null;
                      selectedEnd = null;
                      _invalidateEstimate();
                    });
                  }
                },
                color: GariLinkColors.textSecondary,
              ),
              Expanded(
                child: Text(
                  DateFormat('MMMM yyyy').format(visibleMonth),
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: GariLinkColors.textPrimary,
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.chevron_right),
                onPressed: () => setState(() {
                  visibleMonth = DateTime(
                    visibleMonth.year,
                    visibleMonth.month + 1,
                  );
                  selectedStart = null;
                  selectedEnd = null;
                  _invalidateEstimate();
                }),
                color: GariLinkColors.textSecondary,
              ),
            ],
          ),
          const SizedBox(height: GariLinkSpacing.md),
          // Weekday labels
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                .map(
                  (day) => Expanded(
                    child: Semantics(
                      label: day,
                      excludeSemantics: true,
                      child: Center(
                        child: Text(
                          day.substring(0, 1),
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: GariLinkColors.textSecondary,
                          ),
                        ),
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: GariLinkSpacing.sm),
          // Calendar Grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount:
                (((DateTime(visibleMonth.year, visibleMonth.month + 1, 0).day +
                            DateTime(
                              visibleMonth.year,
                              visibleMonth.month,
                              1,
                            ).weekday -
                            1) /
                        7)
                    .ceil() *
                7),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              childAspectRatio: 1,
            ),
            itemBuilder: (context, index) {
              final dayOffset =
                  DateTime(visibleMonth.year, visibleMonth.month, 1).weekday -
                  1;
              int dayNumber = index - dayOffset + 1;
              final daysInMonth = DateTime(
                visibleMonth.year,
                visibleMonth.month + 1,
                0,
              ).day;

              if (dayNumber < 1 || dayNumber > daysInMonth) {
                return const SizedBox();
              }

              bool isStart = dayNumber == selectedStart;
              bool isEnd = dayNumber == selectedEnd;
              bool isInRange =
                  selectedStart != null &&
                  selectedEnd != null &&
                  dayNumber > selectedStart! &&
                  dayNumber < selectedEnd!;

              BoxDecoration? decoration;
              Color textColor = GariLinkColors.textPrimary;
              final date = DateTime(
                visibleMonth.year,
                visibleMonth.month,
                dayNumber,
              );
              final today = DateTime.now();
              final disabled = !date.isAfter(
                DateTime(today.year, today.month, today.day),
              );

              if (isStart || isEnd) {
                decoration = const BoxDecoration(
                  color: GariLinkColors.accent,
                  shape: BoxShape.circle,
                );
                textColor = Colors.white;
              } else if (isInRange) {
                decoration = BoxDecoration(
                  color: GariLinkColors.accent.withValues(alpha: 0.1),
                  shape: BoxShape.rectangle,
                );
              }

              return Semantics(
                button: true,
                enabled: !disabled,
                label: DateFormat('d MMMM yyyy').format(date),
                child: GestureDetector(
                  onTap: disabled
                      ? null
                      : () {
                          setState(() {
                            if (selectedStart == null ||
                                (selectedStart != null &&
                                    selectedEnd != null)) {
                              selectedStart = dayNumber;
                              selectedEnd = null;
                              _invalidateEstimate();
                            } else if (selectedStart != null &&
                                selectedEnd == null) {
                              if (dayNumber < selectedStart!) {
                                selectedEnd = selectedStart;
                                selectedStart = dayNumber;
                              } else {
                                selectedEnd = dayNumber;
                              }
                              _invalidateEstimate();
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
                          fontWeight: (isStart || isEnd)
                              ? FontWeight.w600
                              : FontWeight.w500,
                          color: disabled
                              ? GariLinkColors.textMuted.withValues(alpha: 0.45)
                              : textColor,
                        ),
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
          controller: _notesController,
          maxLines: 3,
          style: GoogleFonts.inter(
            fontSize: 14,
            color: GariLinkColors.textPrimary,
          ),
          decoration: InputDecoration(
            hintText: "Add any special requests...",
            hintStyle: GoogleFonts.inter(color: GariLinkColors.textMuted),
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
    final estimate = _estimate;
    final amount = estimate?.finalEstimatedAmountMinor;
    final message = switch (estimate?.status) {
      RentalEstimateStatus.pricingNotConfigured =>
        'Price will be confirmed with the owner. You can still send your request.',
      RentalEstimateStatus.incompleteInput =>
        'Add the required pickup and destination details.',
      RentalEstimateStatus.routeUnavailable =>
        "We couldn't calculate the trip estimate right now. You can still send your request and confirm the price with the owner.",
      RentalEstimateStatus.error =>
        'We could not load an estimate. You can retry or request without one.',
      RentalEstimateStatus.unsupportedPolicy =>
        'This pricing setup cannot be estimated here. Confirm the price with the owner.',
      _ => null,
    };
    return Container(
      padding: const EdgeInsets.all(GariLinkSpacing.lg),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Estimated rental price',
            style: GariLinkTypography.sectionTitle,
          ),
          const SizedBox(height: GariLinkSpacing.md),
          if (estimate?.status == RentalEstimateStatus.estimated &&
              amount != null) ...[
            Text(
              formatMarketplacePrice(amount, currency: estimate!.currency),
              style: GariLinkTypography.price,
            ),
            const SizedBox(height: GariLinkSpacing.sm),
            Text(
              '${estimate.rentalDays ?? rentalDays} day${(estimate.rentalDays ?? rentalDays) == 1 ? '' : 's'}',
              style: GariLinkTypography.bodySmall,
            ),
            if (estimate.baseChargeMinor != null)
              _estimateLine(
                'Base charge',
                estimate.baseChargeMinor!,
                estimate.currency,
              ),
            if (estimate.durationChargeMinor != null)
              _estimateLine(
                'Rental duration',
                estimate.durationChargeMinor!,
                estimate.currency,
              ),
            if (estimate.distanceChargeMinor != null)
              _estimateLine(
                'Distance charge',
                estimate.distanceChargeMinor!,
                estimate.currency,
              ),
          ] else if (message != null)
            Text(message, style: GariLinkTypography.bodyMedium)
          else
            Text(
              'Select dates, then request a current server estimate.',
              style: GariLinkTypography.bodyMedium,
            ),
          const SizedBox(height: GariLinkSpacing.md),
          OutlinedButton.icon(
            onPressed: rentalDays > 0 && !_estimating ? _requestEstimate : null,
            icon: _estimating
                ? const SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.calculate_outlined),
            label: Text(_estimating ? 'Calculating…' : 'Check estimate'),
          ),
          const SizedBox(height: GariLinkSpacing.md),
          Text(
            'This is an estimate based on your current trip details. Payment is arranged with the owner outside GariLink.',
            style: GariLinkTypography.bodySmall,
          ),
        ],
      ),
    );
  }

  Widget _estimateLine(String label, int amount, String currency) => Padding(
    padding: const EdgeInsets.only(top: GariLinkSpacing.sm),
    child: Row(
      children: [
        Expanded(child: Text(label, style: GariLinkTypography.bodySmall)),
        Text(
          formatMarketplacePrice(amount, currency: currency),
          style: GariLinkTypography.bodySmall,
        ),
      ],
    ),
  );

  Widget _buildBottomBar(BuildContext context) {
    return Container(
      padding:
          const EdgeInsets.symmetric(
            horizontal: GariLinkSpacing.lg,
            vertical: GariLinkSpacing.md,
          ).copyWith(
            bottom: MediaQuery.of(context).padding.bottom + GariLinkSpacing.md,
          ),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            offset: const Offset(0, -4),
            blurRadius: 16,
          ),
        ],
      ),
      child: SizedBox(
        width: double.infinity,
        height: 56,
        child: ElevatedButton(
          onPressed: _submitting
              ? null
              : () async {
                  if (!(_transportForm.currentState?.validate() ?? true)) {
                    return;
                  }
                  if (!(_locationForm.currentState?.validate() ?? false)) {
                    return;
                  }
                  final scaffoldMessenger = ScaffoldMessenger.of(context);
                  final router = GoRouter.of(context);
                  if (selectedStart == null || selectedEnd == null) {
                    scaffoldMessenger.showSnackBar(
                      const SnackBar(
                        content: Text('Select pickup and return dates'),
                      ),
                    );
                    return;
                  }
                  final startDate = DateTime(
                    visibleMonth.year,
                    visibleMonth.month,
                    selectedStart!,
                  );
                  final endDate = DateTime(
                    visibleMonth.year,
                    visibleMonth.month,
                    selectedEnd!,
                  );
                  final today = DateTime.now();
                  if (!endDate.isAfter(startDate) ||
                      !startDate.isAfter(
                        DateTime(today.year, today.month, today.day),
                      )) {
                    scaffoldMessenger.showSnackBar(
                      const SnackBar(
                        content: Text(
                          'Choose future dates with return after pickup.',
                        ),
                      ),
                    );
                    return;
                  }
                  setState(() => _submitting = true);
                  try {
                    await ref
                        .read(rentalRepositoryProvider)
                        .createRentalRequest(
                          listingId: widget.listingId,
                          startDate: startDate,
                          endDate: endDate,
                          pickupNotes: _notesController.text,
                          transportNeed: _transportNeed,
                          pickupLocation: _locationForm.currentState?.pickup,
                          destinationLocation:
                              _locationForm.currentState?.destination,
                          requestId: _retryRequest.prepare(
                            pickupLocation: _locationForm.currentState?.pickup,
                            destinationLocation:
                                _locationForm.currentState?.destination,
                            listingId: widget.listingId,
                            startDate: startDate,
                            endDate: endDate,
                            pickupNotes: _notesController.text,
                            transportNeed: _transportNeed,
                          ),
                        );
                    if (!context.mounted) return;
                    ref.invalidate(myTripsProvider);
                    await showDialog<void>(
                      context: context,
                      barrierDismissible: false,
                      builder: (dialogContext) => AlertDialog(
                        icon: const Icon(
                          Icons.check_circle,
                          color: GariLinkColors.success,
                          size: 48,
                        ),
                        title: const Text('Request sent'),
                        content: Text(
                          'Your request for ${DateFormat('d MMM').format(startDate)} – ${DateFormat('d MMM y').format(endDate)} has been sent to the owner. It is not approved yet.',
                        ),
                        actions: [
                          FilledButton(
                            onPressed: () => Navigator.pop(dialogContext),
                            child: const Text('View my rentals'),
                          ),
                        ],
                      ),
                    );
                    if (!context.mounted) return;
                    router.go('/trips');
                  } on AppException catch (error) {
                    if (!mounted) return;
                    scaffoldMessenger.showSnackBar(
                      SnackBar(content: Text(error.message)),
                    );
                  } catch (_) {
                    if (!mounted) return;
                    scaffoldMessenger.showSnackBar(
                      const SnackBar(
                        content: Text(
                          'We could not submit your request. Please try again.',
                        ),
                      ),
                    );
                  } finally {
                    if (mounted) setState(() => _submitting = false);
                  }
                },
          style: ElevatedButton.styleFrom(
            backgroundColor: GariLinkColors.accent,
            foregroundColor: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          child: _submitting
              ? const SizedBox.square(
                  dimension: 22,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : Text(
                  'Send rental request',
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
