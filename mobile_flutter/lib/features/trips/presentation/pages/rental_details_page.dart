import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/theme.dart';
import '../../../owner/presentation/models/owner_rental_status_presentation.dart';
import '../../domain/models/rental_summary.dart';
import '../models/rental_status_presentation.dart';
import 'transport_need_summary.dart';

class RentalDetailsPage extends StatelessWidget {
  const RentalDetailsPage({
    super.key,
    required this.rental,
    this.ownerView = false,
    this.ownerWorkspaceActive = true,
    this.onCancel,
    this.onApprove,
    this.onReject,
    this.primaryAction,
  });

  final RentalSummary rental;
  final bool ownerView;
  final bool ownerWorkspaceActive;
  final VoidCallback? onCancel;
  final VoidCallback? onApprove;
  final VoidCallback? onReject;
  final ({String label, VoidCallback run})? primaryAction;

  @override
  Widget build(BuildContext context) {
    final dates =
        '${DateFormat('EEE, d MMM y').format(rental.startDate)} – ${DateFormat('EEE, d MMM y').format(rental.endDate)}';
    final estimatedAmount = rental.estimatedAmountMinor;
    final estimate = NumberFormat.currency(
      name: rental.currency,
      symbol: '${rental.currency} ',
      decimalDigits: 0,
    ).format(estimatedAmount ?? 0);
    final renterPresentation = rentalStatusPresentation(rental.status);
    final ownerPresentation = ownerRentalStatusPresentation(rental.status);
    final statusLabel = ownerView
        ? ownerPresentation.label
        : renterPresentation.label;
    final statusTitle = ownerView
        ? ownerPresentation.title
        : renterPresentation.title;
    final statusExplanation = ownerView
        ? ownerPresentation.explanation
        : renterPresentation.explanation;
    final statusNextStep = ownerView
        ? ownerPresentation.nextStep
        : renterPresentation.nextStep;
    final statusColor = ownerView
        ? ownerPresentation.color
        : renterPresentation.color;
    final statusIcon = ownerView
        ? ownerPresentation.icon
        : renterPresentation.icon;
    return Scaffold(
      backgroundColor: GariLinkColors.background,
      appBar: AppBar(
        title: Text(ownerView ? 'Rental request' : 'Rental details'),
      ),
      bottomNavigationBar: _actions(context),
      body: ListView(
        padding: const EdgeInsets.all(GariLinkSpacing.lg),
        children: [
          Container(
            padding: const EdgeInsets.all(GariLinkSpacing.lg),
            decoration: BoxDecoration(
              color: GariLinkColors.surface,
              borderRadius: GariLinkRadius.cardBorderRadius,
            ),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: GariLinkRadius.inputBorderRadius,
                  child: SizedBox(
                    width: 96,
                    height: 88,
                    child: rental.vehicle.imageUrl == null
                        ? const ColoredBox(
                            color: GariLinkColors.neutral100,
                            child: Icon(Icons.directions_car_rounded),
                          )
                        : CachedNetworkImage(
                            imageUrl: rental.vehicle.imageUrl!,
                            fit: BoxFit.cover,
                            memCacheWidth: 320,
                            placeholder: (_, _) => const ColoredBox(
                              color: GariLinkColors.neutral100,
                            ),
                            errorWidget: (_, _, _) => const ColoredBox(
                              color: GariLinkColors.neutral100,
                              child: Icon(Icons.broken_image_outlined),
                            ),
                          ),
                  ),
                ),
                const SizedBox(width: GariLinkSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(rental.title, style: GariLinkTypography.titleMedium),
                      const SizedBox(height: 8),
                      Semantics(
                        label: 'Rental status $statusLabel',
                        child: Chip(
                          label: Text(statusLabel),
                          avatar: Icon(
                            statusIcon,
                            size: 18,
                            color: statusColor,
                          ),
                          side: BorderSide.none,
                          backgroundColor: statusColor.withValues(alpha: .1),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: GariLinkSpacing.lg),
          _section('Current status', [
            Text(statusTitle, style: GariLinkTypography.titleMedium),
            const SizedBox(height: 8),
            Text(statusExplanation),
            const SizedBox(height: 8),
            Text(
              'Last updated ${DateFormat('d MMM y').format(rental.updatedAt)}',
              style: GariLinkTypography.bodySmall,
            ),
          ]),
          const SizedBox(height: GariLinkSpacing.lg),
          _section('What happens next', [Text(statusNextStep)]),
          if (ownerView && !ownerWorkspaceActive) ...[
            const SizedBox(height: GariLinkSpacing.lg),
            _section('Workspace changed', const [
              Text(
                'This request belongs to another workspace. Return to Rental requests to continue safely.',
              ),
            ]),
          ],
          const SizedBox(height: GariLinkSpacing.lg),
          _section('Rental period', [
            _row(Icons.calendar_month_outlined, 'Dates', dates),
            _row(
              Icons.nights_stay_outlined,
              'Rental days',
              '${rental.rentalDays}',
            ),
          ]),
          const SizedBox(height: GariLinkSpacing.lg),
          _section('Estimated rental price', [
            if (estimatedAmount != null) ...[
              _moneyRow('Estimate recorded at request', estimate, strong: true),
              const SizedBox(height: 8),
              Text(
                'This historical estimate will not change if the owner updates pricing later.',
                style: GariLinkTypography.bodySmall,
              ),
            ] else
              Text(
                'No authoritative price estimate was recorded for this request. Confirm the rental price with the vehicle owner.',
                style: GariLinkTypography.bodyMedium,
              ),
            const SizedBox(height: 8),
            Text(
              'Estimate only. Payment arrangements are made directly with the owner.',
              style: GariLinkTypography.bodySmall,
            ),
          ]),
          if (ownerView && rental.customer != null) ...[
            const SizedBox(height: GariLinkSpacing.lg),
            _section('Customer details', [
              _row(Icons.person_outline, 'Name', rental.customer!.displayName),
              if (rental.customer!.phoneNumber.isNotEmpty)
                _row(
                  Icons.phone_outlined,
                  'Contact number',
                  rental.customer!.phoneNumber,
                ),
            ]),
          ],
          if (rental.pickupNotes?.isNotEmpty ?? false) ...[
            const SizedBox(height: GariLinkSpacing.lg),
          ],
          if (rental.pickupLocation != null)
            _section('Pickup', [
              Text(
                [
                  rental.pickupLocation!.locality,
                  rental.pickupLocation!.city,
                  rental.pickupLocation!.region,
                ].whereType<String>().where((s) => s.isNotEmpty).join(', '),
              ),
            ]),
          if (rental.destinationLocation != null)
            _section('Destination', [
              Text(
                [
                  rental.destinationLocation!.locality,
                  rental.destinationLocation!.city,
                  rental.destinationLocation!.region,
                ].whereType<String>().where((s) => s.isNotEmpty).join(', '),
              ),
            ]),
          if (rental.transportNeed != null) ...[
            _section(
              ownerView ? 'Transport requirements' : 'What you requested',
              [TransportNeedSummary(need: rental.transportNeed!)],
            ),
          ],
          if (rental.pickupNotes?.isNotEmpty ?? false) ...[
            const SizedBox(height: GariLinkSpacing.lg),
            _section('Request note', [Text(rental.pickupNotes!)]),
          ],
          if (rental.rejectionReason?.isNotEmpty ?? false) ...[
            const SizedBox(height: GariLinkSpacing.lg),
            _section('Why it was declined', [Text(rental.rejectionReason!)]),
          ],
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  Widget? _actions(BuildContext context) {
    if (onCancel == null &&
        onApprove == null &&
        onReject == null &&
        primaryAction == null) {
      return null;
    }
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(GariLinkSpacing.lg),
        child: Row(
          children: [
            if (onReject != null)
              Expanded(
                child: OutlinedButton(
                  onPressed: onReject,
                  child: const Text('Decline'),
                ),
              ),
            if (onReject != null) const SizedBox(width: 12),
            if (onApprove != null)
              Expanded(
                child: FilledButton(
                  onPressed: onApprove,
                  child: const Text('Accept request'),
                ),
              ),
            if (primaryAction != null)
              Expanded(
                child: FilledButton(
                  onPressed: primaryAction!.run,
                  child: Text(primaryAction!.label),
                ),
              ),
            if (onCancel != null)
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onCancel,
                  icon: const Icon(Icons.close),
                  label: const Text('Cancel request'),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _section(String title, List<Widget> children) => Container(
    padding: const EdgeInsets.all(GariLinkSpacing.lg),
    decoration: BoxDecoration(
      color: GariLinkColors.surface,
      borderRadius: GariLinkRadius.cardBorderRadius,
      border: Border.all(color: GariLinkColors.borderLight),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: GariLinkTypography.titleMedium),
        const SizedBox(height: 12),
        ...children,
      ],
    ),
  );
  Widget _row(IconData icon, String label, String value) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: GariLinkColors.accent),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: GariLinkTypography.bodySmall),
              Text(value, style: GariLinkTypography.bodyMedium),
            ],
          ),
        ),
      ],
    ),
  );
  Widget _moneyRow(String label, String value, {bool strong = false}) =>
      Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Row(
          children: [
            Expanded(child: Text(label)),
            Text(
              value,
              style: strong
                  ? GariLinkTypography.titleMedium.copyWith(
                      color: GariLinkColors.accent,
                    )
                  : GariLinkTypography.labelMedium,
            ),
          ],
        ),
      );
}
