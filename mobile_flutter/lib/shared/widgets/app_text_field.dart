import 'package:flutter/material.dart';
import '../../core/theme/tokens.dart';

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

    Widget? getSuffixWidget() {
      if (widget.isPassword) {
        return IconButton(
          icon: Icon(
            _obscureText ? Icons.visibility_off_outlined : Icons.visibility_outlined,
            color: theme.brightness == Brightness.dark
                ? AppColors.darkTextMuted
                : AppColors.neutral[500],
          ),
          onPressed: () {
            setState(() {
              _obscureText = !_obscureText;
            });
          },
        );
      }

      if (widget.suffixIcon != null) {
        return GestureDetector(
          onTap: widget.onSuffixTap,
          child: Icon(
            widget.suffixIcon,
            color: theme.brightness == Brightness.dark
                ? AppColors.darkTextMuted
                : AppColors.neutral[500],
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
          style: theme.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
            color: theme.brightness == Brightness.dark
                ? AppColors.darkText
                : AppColors.neutral[800],
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        TextFormField(
          controller: widget.controller,
          validator: widget.validator,
          obscureText: _obscureText,
          keyboardType: widget.keyboardType,
          style: theme.textTheme.bodyLarge,
          decoration: InputDecoration(
            hintText: widget.hintText,
            hintStyle: TextStyle(
              color: theme.brightness == Brightness.dark
                  ? AppColors.darkTextMuted
                  : AppColors.neutral[400],
            ),
            prefixIcon: widget.prefixIcon != null
                ? Icon(
                    widget.prefixIcon,
                    color: theme.brightness == Brightness.dark
                        ? AppColors.darkTextMuted
                        : AppColors.neutral[500],
                  )
                : null,
            suffixIcon: getSuffixWidget(),
          ),
        ),
      ],
    );
  }
}
