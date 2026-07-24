import 'package:flutter/material.dart';
import '../../core/theme/tokens.dart';

class StatusBadge extends StatelessWidget {
  final String status;

  const StatusBadge({
    required this.status,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    Color getBgColor(String label) {
      switch (label.toUpperCase()) {
        case 'ACTIVE':
        case 'APPROVED':
        case 'COMPLETED':
        case 'AVAILABLE':
          return isDark ? AppColors.success[700]!.withOpacity(0.2) : AppColors.success[50]!;
        case 'PENDING':
        case 'DRAFT':
        case 'PAUSED':
          return isDark ? AppColors.warning[700]!.withOpacity(0.2) : AppColors.warning[50]!;
        case 'REJECTED':
        case 'CANCELLED':
        case 'REVOKED':
        case 'SUSPENDED':
          return isDark ? AppColors.error[700]!.withOpacity(0.2) : AppColors.error[50]!;
        default:
          return isDark ? AppColors.neutral[800]! : AppColors.neutral[50]!;
      }
    }

    Color getTextColor(String label) {
      switch (label.toUpperCase()) {
        case 'ACTIVE':
        case 'APPROVED':
        case 'COMPLETED':
        case 'AVAILABLE':
          return AppColors.success[500]!;
        case 'PENDING':
        case 'DRAFT':
        case 'PAUSED':
          return AppColors.warning[500]!;
        case 'REJECTED':
        case 'CANCELLED':
        case 'REVOKED':
        case 'SUSPENDED':
          return AppColors.error[500]!;
        default:
          return isDark ? AppColors.darkTextMuted : AppColors.neutral[600]!;
      }
    }

    final formattedText = status.replaceAll('_', ' ').toUpperCase();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
      decoration: BoxDecoration(
        color: getBgColor(status),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        formattedText,
        style: TextStyle(
          color: getTextColor(status),
          fontSize: 10,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
