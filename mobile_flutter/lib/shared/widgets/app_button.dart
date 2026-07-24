import 'package:flutter/material.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/radius.dart';
import '../../core/theme/spacing.dart';
import '../../core/theme/typography.dart';

enum AppButtonVariant { primary, secondary, outline }

class AppButton extends StatefulWidget {
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
  State<AppButton> createState() => _AppButtonState();
}

class _AppButtonState extends State<AppButton> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.96).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeIn),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isEnabled = widget.onPressed != null && !widget.isLoading;

    Color getBgColor() {
      if (!isEnabled) {
        return isDark ? const Color(0xFF1E2D4A) : GariLinkColors.border;
      }
      switch (widget.variant) {
        case AppButtonVariant.primary:
          return GariLinkColors.accent;
        case AppButtonVariant.secondary:
          return isDark ? const Color(0xFF0F1E33) : GariLinkColors.borderLight;
        case AppButtonVariant.outline:
          return Colors.transparent;
      }
    }

    Color getTextColor() {
      if (!isEnabled) {
        return isDark ? GariLinkColors.textMuted : GariLinkColors.textSecondary;
      }
      switch (widget.variant) {
        case AppButtonVariant.primary:
          return Colors.white;
        case AppButtonVariant.secondary:
          return isDark ? Colors.white : GariLinkColors.textPrimary;
        case AppButtonVariant.outline:
          return GariLinkColors.accent;
      }
    }

    Border? getBorder() {
      if (widget.variant == AppButtonVariant.outline && isEnabled) {
        return Border.all(color: GariLinkColors.accent, width: 1.5);
      }
      if (widget.variant == AppButtonVariant.outline && !isEnabled) {
        return Border.all(
          color: isDark ? const Color(0xFF1E2D4A) : GariLinkColors.border,
          width: 1.5,
        );
      }
      return null;
    }

    return GestureDetector(
      onTapDown: isEnabled ? (_) => _controller.forward() : null,
      onTapUp: isEnabled
          ? (_) {
              _controller.reverse();
              widget.onPressed?.call();
            }
          : null,
      onTapCancel: isEnabled ? () => _controller.reverse() : null,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          height: 52,
          decoration: BoxDecoration(
            color: getBgColor(),
            borderRadius: GariLinkRadius.buttonBorderRadius,
            border: getBorder(),
          ),
          alignment: Alignment.center,
          padding: const EdgeInsets.symmetric(horizontal: GariLinkSpacing.lg),
          child: widget.isLoading
              ? SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    valueColor: AlwaysStoppedAnimation<Color>(getTextColor()),
                  ),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (widget.icon != null) ...[
                      Icon(widget.icon, color: getTextColor(), size: 20),
                      const SizedBox(width: GariLinkSpacing.sm),
                    ],
                    Text(
                      widget.text,
                      style: GariLinkTypography.labelMedium.copyWith(
                        color: getTextColor(),
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
