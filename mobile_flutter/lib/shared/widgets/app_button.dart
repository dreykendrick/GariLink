import 'package:flutter/material.dart';
import '../../core/theme/tokens.dart';

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
    final isEnabled = widget.onPressed != null && !widget.isLoading;

    Color getBgColor() {
      if (!isEnabled) {
        return theme.brightness == Brightness.dark
            ? AppColors.neutral[800]!
            : AppColors.neutral[200]!;
      }
      switch (widget.variant) {
        case AppButtonVariant.primary:
          return theme.colorScheme.primary;
        case AppButtonVariant.secondary:
          return theme.brightness == Brightness.dark
              ? AppColors.darkSurface
              : AppColors.neutral[100]!;
        case AppButtonVariant.outline:
          return Colors.transparent;
      }
    }

    Color getTextColor() {
      if (!isEnabled) {
        return AppColors.neutral[500]!;
      }
      switch (widget.variant) {
        case AppButtonVariant.primary:
          return theme.colorScheme.onPrimary;
        case AppButtonVariant.secondary:
          return theme.brightness == Brightness.dark
              ? AppColors.darkText
              : AppColors.neutral[800]!;
        case AppButtonVariant.outline:
          return theme.colorScheme.primary;
      }
    }

    Border? getBorder() {
      if (widget.variant == AppButtonVariant.outline && isEnabled) {
        return Border.all(color: theme.colorScheme.primary, width: 1.5);
      }
      if (widget.variant == AppButtonVariant.outline && !isEnabled) {
        return Border.all(color: AppColors.neutral[400]!, width: 1.5);
      }
      return null;
    }

    return GestureDetector(
      onTapDown: isEnabled
          ? (_) => _controller.forward()
          : null,
      onTapUp: isEnabled
          ? (_) {
              _controller.reverse();
              widget.onPressed?.call();
            }
          : null,
      onTapCancel: isEnabled
          ? () => _controller.reverse()
          : null,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          height: 52,
          decoration: BoxDecoration(
            color: getBgColor(),
            borderRadius: AppBorderRadius.mdBorderRadius,
            border: getBorder(),
          ),
          alignment: Alignment.center,
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
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
                      const SizedBox(width: AppSpacing.sm),
                    ],
                    Text(
                      widget.text,
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: getTextColor(),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
