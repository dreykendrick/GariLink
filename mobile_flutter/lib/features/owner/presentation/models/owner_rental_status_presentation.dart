import 'package:flutter/material.dart';

import '../../../../core/errors/app_exception.dart';
import '../../../../core/theme/theme.dart';
import '../../../trips/domain/models/rental_summary.dart';

enum OwnerRentalQueueGroup { needsAttention, upcoming, active, history }

enum OwnerRentalAction { accept, decline, markReady, start, complete }

class OwnerRentalStatusPresentation {
  const OwnerRentalStatusPresentation({
    required this.label,
    required this.title,
    required this.explanation,
    required this.nextStep,
    required this.color,
    required this.icon,
    required this.group,
    this.primaryAction,
    this.primaryActionLabel,
    this.secondaryAction,
    this.secondaryActionLabel,
  });

  final String label;
  final String title;
  final String explanation;
  final String nextStep;
  final Color color;
  final IconData icon;
  final OwnerRentalQueueGroup group;
  final OwnerRentalAction? primaryAction;
  final String? primaryActionLabel;
  final OwnerRentalAction? secondaryAction;
  final String? secondaryActionLabel;

  bool get isTerminal => group == OwnerRentalQueueGroup.history;
}

OwnerRentalStatusPresentation ownerRentalStatusPresentation(String status) =>
    switch (status) {
      'REQUESTED' => const OwnerRentalStatusPresentation(
        label: 'New request',
        title: 'New rental request',
        explanation: 'Review the customer’s dates and transport requirements.',
        nextStep: 'Accept the request or decline it with a short reason.',
        color: GariLinkColors.warning,
        icon: Icons.notifications_active_outlined,
        group: OwnerRentalQueueGroup.needsAttention,
        primaryAction: OwnerRentalAction.accept,
        primaryActionLabel: 'Accept request',
        secondaryAction: OwnerRentalAction.decline,
        secondaryActionLabel: 'Decline',
      ),
      'UNDER_REVIEW' => const OwnerRentalStatusPresentation(
        label: 'Under review',
        title: 'Request under review',
        explanation: 'This request is waiting for your decision.',
        nextStep: 'Accept the request or decline it with a short reason.',
        color: GariLinkColors.warning,
        icon: Icons.manage_search_rounded,
        group: OwnerRentalQueueGroup.needsAttention,
        primaryAction: OwnerRentalAction.accept,
        primaryActionLabel: 'Accept request',
        secondaryAction: OwnerRentalAction.decline,
        secondaryActionLabel: 'Decline',
      ),
      'APPROVED' => const OwnerRentalStatusPresentation(
        label: 'Accepted',
        title: 'Request accepted',
        explanation: 'The dates are reserved for this customer.',
        nextStep: 'Prepare the vehicle, then mark it ready for pickup.',
        color: GariLinkColors.success,
        icon: Icons.check_circle_outline_rounded,
        group: OwnerRentalQueueGroup.upcoming,
        primaryAction: OwnerRentalAction.markReady,
        primaryActionLabel: 'Mark ready for pickup',
      ),
      'READY_FOR_PICKUP' => const OwnerRentalStatusPresentation(
        label: 'Ready for pickup',
        title: 'Vehicle ready for pickup',
        explanation: 'The vehicle is prepared for the customer.',
        nextStep: 'Start the rental only when the handover takes place.',
        color: GariLinkColors.accent,
        icon: Icons.key_rounded,
        group: OwnerRentalQueueGroup.upcoming,
        primaryAction: OwnerRentalAction.start,
        primaryActionLabel: 'Start rental',
      ),
      'ACTIVE' => const OwnerRentalStatusPresentation(
        label: 'Rental active',
        title: 'Rental in progress',
        explanation: 'The vehicle is currently with the customer.',
        nextStep: 'Complete the rental after the vehicle is returned.',
        color: GariLinkColors.accent,
        icon: Icons.route_rounded,
        group: OwnerRentalQueueGroup.active,
        primaryAction: OwnerRentalAction.complete,
        primaryActionLabel: 'Complete rental',
      ),
      'COMPLETED' => const OwnerRentalStatusPresentation(
        label: 'Completed',
        title: 'Rental completed',
        explanation: 'This rental has finished and is kept for your records.',
        nextStep: 'No further action is required.',
        color: GariLinkColors.success,
        icon: Icons.task_alt_rounded,
        group: OwnerRentalQueueGroup.history,
      ),
      'REJECTED' => const OwnerRentalStatusPresentation(
        label: 'Declined',
        title: 'Request declined',
        explanation: 'This request was declined and cannot progress.',
        nextStep: 'No further action is required.',
        color: GariLinkColors.error,
        icon: Icons.block_rounded,
        group: OwnerRentalQueueGroup.history,
      ),
      'CANCELLED' => const OwnerRentalStatusPresentation(
        label: 'Cancelled',
        title: 'Request cancelled',
        explanation: 'The customer cancelled this request.',
        nextStep: 'No further action is required.',
        color: GariLinkColors.textMuted,
        icon: Icons.cancel_outlined,
        group: OwnerRentalQueueGroup.history,
      ),
      _ => const OwnerRentalStatusPresentation(
        label: 'Status unavailable',
        title: 'Status unavailable',
        explanation: 'The latest rental status could not be understood.',
        nextStep: 'Refresh the request before taking action.',
        color: GariLinkColors.textMuted,
        icon: Icons.info_outline_rounded,
        group: OwnerRentalQueueGroup.history,
      ),
    };

List<RentalSummary> orderOwnerRentals(
  Iterable<RentalSummary> rentals,
  OwnerRentalQueueGroup group,
) {
  final ordered = rentals.toList();
  ordered.sort(switch (group) {
    OwnerRentalQueueGroup.needsAttention => (a, b) => b.createdAt.compareTo(
      a.createdAt,
    ),
    OwnerRentalQueueGroup.upcoming => (a, b) => a.startDate.compareTo(
      b.startDate,
    ),
    OwnerRentalQueueGroup.active || OwnerRentalQueueGroup.history =>
      (a, b) => b.updatedAt.compareTo(a.updatedAt),
  });
  return ordered;
}

String ownerRentalActionError(Object error) {
  if (error is ConflictException) {
    return 'This vehicle already has an overlapping accepted rental. Refresh the requests and review the dates.';
  }
  return userFacingError(error);
}
