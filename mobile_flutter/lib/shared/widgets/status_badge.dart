import 'package:flutter/material.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/spacing.dart';

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
          return GariLinkColors.success.withOpacity(0.12);
        case 'PENDING':
        case 'DRAFT':
        case 'PAUSED':
          return GariLinkColors.warning.withOpacity(0.12);
        case 'REJECTED':
        case 'CANCELLED':
        case 'REVOKED':
        case 'SUSPENDED':
          return GariLinkColors.error.withOpacity(0.12);
        default:
          return isDark ? const Color(0xFF1E2D4A) : GariLinkColors.borderLight;
      }
    }

    Color getTextColor(String label) {
      switch (label.toUpperCase()) {
        case 'ACTIVE':
        case 'APPROVED':
        case 'COMPLETED':
        case 'AVAILABLE':
          return GariLinkColors.success;
        case 'PENDING':
        case 'DRAFT':
        case 'PAUSED':
          return GariLinkColors.warning;
        case 'REJECTED':
        case 'CANCELLED':
        case 'REVOKED':
        case 'SUSPENDED':
          return GariLinkColors.error;
        default:
          return isDark ? GariLinkColors.textMuted : GariLinkColors.textSecondary;
      }
    }

    final formattedText = status.replaceAll('_', ' ').toUpperCase();

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: GariLinkSpacing.sm,
        vertical: GariLinkSpacing.xs,
      ),
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
