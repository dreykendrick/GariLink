import 'package:flutter/material.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/spacing.dart';
import '../../core/theme/dimensions.dart';
import '../../core/theme/typography.dart';
import 'app_button.dart';

class EmptyState extends StatelessWidget {
  final String title;
  final String description;
  final IconData icon;
  final String? actionLabel;
  final VoidCallback? onAction;

  const EmptyState({
    required this.title,
    required this.description,
    this.icon = Icons.info_outline,
    this.actionLabel,
    this.onAction,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(GariLinkSpacing.xl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: GariLinkDimensions.emptyStateIcon,
              color: isDark
                  ? GariLinkColors.darkTextMuted
                  : GariLinkColors.textMuted,
            ),
            const SizedBox(height: GariLinkSpacing.lg),
            Text(
              title,
              style: GariLinkTypography.sectionTitle,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: GariLinkSpacing.sm),
            Text(
              description,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: isDark
                    ? GariLinkColors.darkTextMuted
                    : GariLinkColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: GariLinkSpacing.xl),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 260),
                child: AppButton(text: actionLabel!, onPressed: onAction),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
