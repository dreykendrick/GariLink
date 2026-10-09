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

class ForgotPasswordPage extends ConsumerStatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  ConsumerState<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends ConsumerState<ForgotPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  bool _legacyPhone = false;
  bool _isLoading = false;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final notifier = ref.read(authStateProvider.notifier);
      if (_legacyPhone) {
        await notifier.forgotPassword(_phoneController.text.trim());
      } else {
        await notifier.recoverEmail(_phoneController.text.trim());
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'If the account exists, recovery instructions were sent.',
            ),
            backgroundColor: GariLinkColors.success,
          ),
        );
        if (_legacyPhone) context.push('/reset-password');
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
                  title: 'Recover your account',
                  description:
                      'Enter your email to receive password recovery instructions.',
                ),
                const SizedBox(height: GariLinkSpacing.xxxl),
                AppTextField(
                  labelText: _legacyPhone ? 'Phone number' : 'Email',
                  hintText: _legacyPhone ? '0712 345 678' : 'you@example.com',
                  controller: _phoneController,
                  keyboardType: _legacyPhone
                      ? TextInputType.phone
                      : TextInputType.emailAddress,
                  validator: (value) => _legacyPhone
                      ? validateTanzanianPhone(value)
                      : (value != null &&
                                RegExp(
                                  r'^[^\s@]+@[^\s@]+\.[^\s@]+$',
                                ).hasMatch(value.trim())
                            ? null
                            : 'Enter a valid email address'),
                ),
                const SizedBox(height: GariLinkSpacing.xxxl),
                AppButton(
                  text: _legacyPhone ? 'Send reset code' : 'Send reset email',
                  isLoading: _isLoading,
                  onPressed: _submit,
                ),
                TextButton(
                  onPressed: _isLoading
                      ? null
                      : () => setState(() {
                          _legacyPhone = !_legacyPhone;
                          _phoneController.clear();
                        }),
                  child: Text(
                    _legacyPhone
                        ? 'Use email recovery'
                        : 'Recover a legacy phone account',
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
