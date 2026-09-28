import 'package:flutter/material.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/radius.dart';
import '../../core/theme/dimensions.dart';
import '../../core/theme/spacing.dart';
import '../../core/theme/typography.dart';
import '../../core/theme/animations.dart';

enum AppButtonVariant { primary, secondary, outline, danger, text }

/// Standard Material interaction, keyboard focus and screen-reader semantics.
/// The minimum height grows with text scaling instead of clipping the label.
class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final bool isLoading;
  final IconData? icon;

  const AppButton({
    required this.text,
    this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.isLoading = false,
    this.icon,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final child = Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (isLoading || icon != null) ...[
          AnimatedSwitcher(
            duration: GariLinkAnimations.duration(
              context,
              GariLinkAnimations.short,
            ),
            child: isLoading
                ? const SizedBox(
                    key: ValueKey('loading'),
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Icon(
                    icon,
                    key: const ValueKey('icon'),
                    size: GariLinkDimensions.iconSmall,
                  ),
          ),
          const SizedBox(width: GariLinkSpacing.sm),
        ],
        Flexible(child: Text(text, textAlign: TextAlign.center)),
      ],
    );
    final style = FilledButton.styleFrom(
      minimumSize: const Size(double.infinity, GariLinkDimensions.buttonHeight),
      padding: const EdgeInsets.symmetric(
        horizontal: GariLinkSpacing.xl,
        vertical: GariLinkSpacing.md,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: GariLinkRadius.buttonBorderRadius,
      ),
      textStyle: GariLinkTypography.buttonLabel,
    );
    final action = isLoading ? null : onPressed;
    final Widget button;
    switch (variant) {
      case AppButtonVariant.primary:
        button = FilledButton(
          onPressed: action,
          style: style.copyWith(
            backgroundColor: WidgetStateProperty.resolveWith(
              (states) => states.contains(WidgetState.disabled)
                  ? scheme.onSurface.withValues(alpha: 0.12)
                  : GariLinkColors.accent,
            ),
            foregroundColor: WidgetStateProperty.resolveWith(
              (states) => states.contains(WidgetState.disabled)
                  ? scheme.onSurface.withValues(alpha: 0.6)
                  : Colors.white,
            ),
          ),
          child: child,
        );
      case AppButtonVariant.secondary:
        button = FilledButton.tonal(
          onPressed: action,
          style: style,
          child: child,
        );
      case AppButtonVariant.outline:
        button = OutlinedButton(onPressed: action, style: style, child: child);
      case AppButtonVariant.danger:
        button = FilledButton(
          onPressed: action,
          style: style.copyWith(
            backgroundColor: const WidgetStatePropertyAll(GariLinkColors.error),
            foregroundColor: const WidgetStatePropertyAll(Colors.white),
          ),
          child: child,
        );
      case AppButtonVariant.text:
        button = TextButton(onPressed: action, child: child);
    }
    return Semantics(
      liveRegion: isLoading,
      label: isLoading ? 'In progress' : null,
      child: button,
    );
  }
}
