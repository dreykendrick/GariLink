import 'package:flutter/material.dart';

import '../../../../core/theme/theme.dart';

enum RentalLifecycleGroup { upcoming, active, past }

class RentalStatusPresentation {
  const RentalStatusPresentation({
    required this.label,
    required this.title,
    required this.explanation,
    required this.nextStep,
    required this.color,
    required this.icon,
    required this.group,
  });

  final String label;
  final String title;
  final String explanation;
  final String nextStep;
  final Color color;
  final IconData icon;
  final RentalLifecycleGroup group;
}

RentalStatusPresentation rentalStatusPresentation(String status) =>
    switch (status) {
      'REQUESTED' => const RentalStatusPresentation(
        label: 'Waiting',
        title: 'Waiting for the owner',
        explanation: 'Your request was sent, but it is not confirmed yet.',
        nextStep: 'The owner needs to review your request.',
        color: GariLinkColors.warning,
        icon: Icons.schedule_rounded,
        group: RentalLifecycleGroup.upcoming,
      ),
      'UNDER_REVIEW' => const RentalStatusPresentation(
        label: 'In review',
        title: 'The owner is reviewing it',
        explanation:
            'Your request is being considered and is not confirmed yet.',
        nextStep: 'You will see the owner’s decision here.',
        color: GariLinkColors.warning,
        icon: Icons.manage_search_rounded,
        group: RentalLifecycleGroup.upcoming,
      ),
      'APPROVED' => const RentalStatusPresentation(
        label: 'Accepted',
        title: 'Your request was accepted',
        explanation: 'The owner accepted your dates for this vehicle.',
        nextStep: 'The owner will prepare the vehicle for your trip.',
        color: GariLinkColors.success,
        icon: Icons.check_circle_outline_rounded,
        group: RentalLifecycleGroup.upcoming,
      ),
      'READY_FOR_PICKUP' => const RentalStatusPresentation(
        label: 'Ready',
        title: 'Ready for your trip',
        explanation: 'The owner has marked the vehicle ready for pickup.',
        nextStep: 'Follow the pickup arrangements agreed with the owner.',
        color: GariLinkColors.accent,
        icon: Icons.key_rounded,
        group: RentalLifecycleGroup.upcoming,
      ),
      'ACTIVE' => const RentalStatusPresentation(
        label: 'In progress',
        title: 'Your rental is in progress',
        explanation: 'This vehicle is currently on your active rental.',
        nextStep: 'Return it according to the arrangements with the owner.',
        color: GariLinkColors.accent,
        icon: Icons.route_rounded,
        group: RentalLifecycleGroup.active,
      ),
      'COMPLETED' => const RentalStatusPresentation(
        label: 'Completed',
        title: 'Rental completed',
        explanation: 'This rental has been completed.',
        nextStep: 'The trip remains here for your records.',
        color: GariLinkColors.success,
        icon: Icons.task_alt_rounded,
        group: RentalLifecycleGroup.past,
      ),
      'REJECTED' => const RentalStatusPresentation(
        label: 'Declined',
        title: 'Request declined',
        explanation: 'The owner could not accept this rental request.',
        nextStep: 'You can explore another suitable vehicle.',
        color: GariLinkColors.error,
        icon: Icons.block_rounded,
        group: RentalLifecycleGroup.past,
      ),
      'CANCELLED' => const RentalStatusPresentation(
        label: 'Cancelled',
        title: 'Request cancelled',
        explanation: 'This rental request was cancelled.',
        nextStep: 'You can make a new request when you are ready.',
        color: GariLinkColors.textMuted,
        icon: Icons.cancel_outlined,
        group: RentalLifecycleGroup.past,
      ),
      'EXPIRED' => const RentalStatusPresentation(
        label: 'Expired',
        title: 'Request expired',
        explanation: 'This request is no longer active.',
        nextStep: 'Choose a vehicle and send a new request.',
        color: GariLinkColors.textMuted,
        icon: Icons.timer_off_outlined,
        group: RentalLifecycleGroup.past,
      ),
      _ => const RentalStatusPresentation(
        label: 'Unavailable',
        title: 'Status unavailable',
        explanation: 'The latest rental status could not be understood.',
        nextStep: 'Refresh your trips to check for an update.',
        color: GariLinkColors.textMuted,
        icon: Icons.info_outline_rounded,
        group: RentalLifecycleGroup.past,
      ),
    };
