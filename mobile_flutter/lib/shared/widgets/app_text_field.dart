import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/spacing.dart';
import '../../core/theme/typography.dart';

class AppTextField extends StatefulWidget {
  final String labelText;
  final String? hintText;
  final TextEditingController? controller;
  final String? Function(String?)? validator;
  final bool isPassword;
  final TextInputType keyboardType;
  final IconData? prefixIcon;
  final IconData? suffixIcon;
  final VoidCallback? onSuffixTap;
  final String? suffixTooltip;
  final Iterable<String>? autofillHints;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;
  final List<TextInputFormatter>? inputFormatters;
  final bool enabled;

  const AppTextField({
    required this.labelText,
    this.hintText,
    this.controller,
    this.validator,
    this.isPassword = false,
    this.keyboardType = TextInputType.text,
    this.prefixIcon,
    this.suffixIcon,
    this.onSuffixTap,
    this.suffixTooltip,
    this.autofillHints,
    this.textInputAction,
    this.onSubmitted,
    this.inputFormatters,
    this.enabled = true,
    super.key,
  });

  @override
  State<AppTextField> createState() => _AppTextFieldState();
}

class _AppTextFieldState extends State<AppTextField> {
  late bool _obscureText;

  @override
  void initState() {
    super.initState();
    _obscureText = widget.isPassword;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    Widget? getSuffixWidget() {
      if (widget.isPassword) {
        return IconButton(
          tooltip: _obscureText ? 'Show password' : 'Hide password',
          icon: Icon(
            _obscureText
                ? Icons.visibility_off_outlined
                : Icons.visibility_outlined,
            color: isDark
                ? GariLinkColors.textMuted
                : GariLinkColors.textSecondary,
          ),
          onPressed: () {
            setState(() {
              _obscureText = !_obscureText;
            });
          },
        );
      }

      if (widget.suffixIcon != null) {
        return IconButton(
          tooltip: widget.suffixTooltip,
          onPressed: widget.onSuffixTap,
          icon: Icon(
            widget.suffixIcon,
            color: isDark
                ? GariLinkColors.textMuted
                : GariLinkColors.textSecondary,
          ),
        );
      }

      return null;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.labelText,
          style: GariLinkTypography.labelMedium.copyWith(
            color: isDark ? Colors.white : GariLinkColors.textPrimary,
          ),
        ),
        const SizedBox(height: GariLinkSpacing.xs),
        TextFormField(
          enabled: widget.enabled,
          autofillHints: widget.autofillHints,
          textInputAction: widget.textInputAction,
          onFieldSubmitted: widget.onSubmitted,
          inputFormatters: widget.inputFormatters,
          autocorrect: !widget.isPassword,
          enableSuggestions: !widget.isPassword,
          onTapOutside: (_) => FocusManager.instance.primaryFocus?.unfocus(),
          autovalidateMode: AutovalidateMode.onUserInteraction,
          controller: widget.controller,
          validator: widget.validator,
          obscureText: _obscureText,
          keyboardType: widget.keyboardType,
          style: GariLinkTypography.bodyLarge.copyWith(
            color: isDark ? Colors.white : GariLinkColors.textPrimary,
          ),
          decoration: InputDecoration(
            errorMaxLines: 3,
            hintText: widget.hintText,
            hintStyle: GariLinkTypography.bodyMedium.copyWith(
              color: isDark
                  ? GariLinkColors.textMuted
                  : GariLinkColors.textSecondary.withValues(alpha: 0.6),
            ),
            prefixIcon: widget.prefixIcon != null
                ? Icon(
                    widget.prefixIcon,
                    color: isDark
                        ? GariLinkColors.textMuted
                        : GariLinkColors.textSecondary,
                  )
                : null,
            suffixIcon: getSuffixWidget(),
          ),
        ),
      ],
    );
  }
}
