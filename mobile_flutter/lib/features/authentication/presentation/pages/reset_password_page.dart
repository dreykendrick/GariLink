import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/errors/app_exception.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/spacing.dart';
import '../../../../core/validation/tanzanian_phone.dart';
import '../../../../shared/widgets/auth_content.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_text_field.dart';
import '../providers/auth_provider.dart';

class ResetPasswordPage extends ConsumerStatefulWidget {
  const ResetPasswordPage({super.key});

  @override
  ConsumerState<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends ConsumerState<ResetPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _codeController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      await ref
          .read(authStateProvider.notifier)
          .resetPassword(
            phoneNumber: _phoneController.text.trim(),
            otpCode: _codeController.text.trim(),
            newPassword: _passwordController.text,
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Password updated. Sign in to continue.'),
            backgroundColor: GariLinkColors.success,
          ),
        );
        context.go('/login');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(userFacingError(e)),
            backgroundColor: GariLinkColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFF070F1A)
          : GariLinkColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back,
            color: isDark ? Colors.white : GariLinkColors.textPrimary,
          ),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: AuthContent(
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AuthHeading(
                  title: 'Set a new password',
                  description:
                      "Use the code sent to your phone to secure your account.",
                ),
                const SizedBox(height: GariLinkSpacing.xxxl),
                AppTextField(
                  labelText: 'Phone number',
                  hintText: '0712 345 678',
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  validator: validateTanzanianPhone,
                ),
                const SizedBox(height: GariLinkSpacing.md),
                AppTextField(
                  labelText: 'Verification code',
                  hintText: 'Enter 6-digit verification code',
                  controller: _codeController,
                  keyboardType: TextInputType.number,
                  validator: (val) {
                    if (val == null || val.trim().isEmpty) {
                      return 'Code is required';
                    }
                    if (val.trim().length != 6) {
                      return 'Must be exactly 6 digits';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: GariLinkSpacing.md),
                AppTextField(
                  labelText: 'New password',
                  hintText: 'Enter new password',
                  controller: _passwordController,
                  isPassword: true,
                  validator: (val) {
                    if (val == null || val.isEmpty) {
                      return 'New password is required';
                    }
                    if (val.length < 10 || val.length > 128) {
                      return 'Use 10 to 128 characters';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: GariLinkSpacing.xxxl),
                AppButton(
                  text: 'Reset password',
                  isLoading: _isLoading,
                  onPressed: _submit,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
