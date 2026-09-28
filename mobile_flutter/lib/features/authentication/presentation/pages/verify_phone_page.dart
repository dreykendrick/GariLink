import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/spacing.dart';
import '../../../../shared/widgets/auth_content.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_text_field.dart';
import '../providers/auth_provider.dart';

class VerifyPhonePage extends ConsumerStatefulWidget {
  const VerifyPhonePage({super.key});

  @override
  ConsumerState<VerifyPhonePage> createState() => _VerifyPhonePageState();
}

class _VerifyPhonePageState extends ConsumerState<VerifyPhonePage> {
  final _formKey = GlobalKey<FormState>();
  final _codeController = TextEditingController();
  Timer? _cooldownTimer;
  int _secondsRemaining = 0;

  @override
  void initState() {
    super.initState();
    _startCooldown();
  }

  void _startCooldown() {
    final availableAt = DateTime.now().add(const Duration(seconds: 60));
    _secondsRemaining = 60;
    _cooldownTimer?.cancel();
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      final remaining = availableAt.difference(DateTime.now()).inSeconds;
      setState(() => _secondsRemaining = remaining > 0 ? remaining : 0);
      if (_secondsRemaining == 0) timer.cancel();
    });
  }

  Future<void> _resend() async {
    if (_secondsRemaining > 0 || ref.read(authStateProvider).isLoading) return;
    try {
      await ref.read(authStateProvider.notifier).resendOtp();
      if (!mounted) return;
      _startCooldown();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('A new verification code has been requested.'),
        ),
      );
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              ref.read(authStateProvider).errorMessage ??
                  'We could not send a new code. Please try again.',
            ),
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    _cooldownTimer?.cancel();
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (ref.read(authStateProvider).isLoading) return;
    if (!_formKey.currentState!.validate()) return;

    try {
      final success = await ref
          .read(authStateProvider.notifier)
          .verifyOtpCode(_codeController.text.trim());
      if (!success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              ref.read(authStateProvider).errorMessage ??
                  'Please check your code and try again.',
            ),
          ),
        );
      } else if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Phone number verified successfully!'),
            backgroundColor: GariLinkColors.success,
          ),
        );
        context.go('/home');
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              ref.read(authStateProvider).errorMessage ??
                  'We could not verify that code. Please try again.',
            ),
            backgroundColor: GariLinkColors.error,
          ),
        );
      }
    }
  }

  String _maskedPhone(String? phone) {
    if (phone == null || phone.length < 5) return 'your phone number';
    return '${phone.substring(0, 6)} ••• ••${phone.substring(phone.length - 2)}';
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final phone = authState.pendingPhone ?? authState.user?.phoneNumber;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFF070F1A)
          : GariLinkColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          tooltip: 'Sign out and use another account',
          icon: Icon(
            Icons.arrow_back,
            color: isDark ? Colors.white : GariLinkColors.textPrimary,
          ),
          onPressed: authState.isLoading
              ? null
              : () => ref.read(authStateProvider.notifier).logout(),
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
                  title: 'Verify your phone',
                  description:
                      'Enter the 6-digit code sent to ${_maskedPhone(phone)}.',
                ),
                const SizedBox(height: GariLinkSpacing.xxxl),
                AppTextField(
                  labelText: 'Verification code',
                  hintText: 'Enter 6-digit code',
                  controller: _codeController,
                  keyboardType: TextInputType.number,
                  autofillHints: const [AutofillHints.oneTimeCode],
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(6),
                  ],
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _submit(),
                  enabled: !authState.isLoading,
                  validator: (val) {
                    if (val == null || val.trim().isEmpty) {
                      return 'Verification code is required';
                    }
                    if (!RegExp(r'^\d{6}$').hasMatch(val.trim())) {
                      return 'Code must be exactly 6 digits';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: GariLinkSpacing.xxxl),
                AppButton(
                  text: 'Verify code',
                  isLoading: authState.isLoading,
                  onPressed: _submit,
                ),
                const SizedBox(height: GariLinkSpacing.xl),
                Wrap(
                  alignment: WrapAlignment.center,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Text(
                      "Didn't receive the code? ",
                      style: GoogleFonts.inter(
                        color: GariLinkColors.textSecondary,
                      ),
                    ),
                    TextButton(
                      onPressed: authState.isLoading || _secondsRemaining > 0
                          ? null
                          : _resend,
                      child: Text(
                        _secondsRemaining > 0
                            ? 'Resend in ${_secondsRemaining}s'
                            : 'Resend code',
                        style: GoogleFonts.inter(
                          color: GariLinkColors.accent,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
                TextButton(
                  onPressed: authState.isLoading
                      ? null
                      : () => ref.read(authStateProvider.notifier).logout(),
                  child: const Text(
                    'Wrong number? Sign out to use another account',
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
