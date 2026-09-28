import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/errors/app_exception.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/spacing.dart';
import '../../../../shared/widgets/auth_content.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_text_field.dart';
import '../providers/auth_provider.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    try {
      await ref
          .read(authStateProvider.notifier)
          .login(_identifierController.text.trim(), _passwordController.text);
      if (mounted) {
        context.go('/home');
      }
    } catch (e) {
      if (mounted) {
        final message = userFacingError(e);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              message.isEmpty ? 'Login failed. Please try again.' : message,
            ),
            backgroundColor: GariLinkColors.error,
            behavior: SnackBarBehavior.floating,
            margin: const EdgeInsets.all(16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
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
                  title: 'Welcome back',
                  description: "Your next vehicle. Your next move.",
                ),
                const SizedBox(height: GariLinkSpacing.xxxl),
                AppTextField(
                  labelText: 'Email or phone',
                  hintText: 'Enter email or phone',
                  controller: _identifierController,
                  autofillHints: const [AutofillHints.username],
                  textInputAction: TextInputAction.next,
                  validator: (val) {
                    if (val == null || val.trim().isEmpty) {
                      return 'Please enter your email or phone';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: GariLinkSpacing.lg),
                AppTextField(
                  labelText: 'Password',
                  hintText: 'Enter your password',
                  controller: _passwordController,
                  autofillHints: const [AutofillHints.password],
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) {
                    if (!authState.isLoading) _submit();
                  },
                  isPassword: true,
                  validator: (val) {
                    if (val == null || val.isEmpty) {
                      return 'Please enter your password';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: GariLinkSpacing.md),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => context.push('/forgot-password'),
                    child: const Text('Forgot password?'),
                  ),
                ),
                const SizedBox(height: GariLinkSpacing.xxxl),
                AppButton(
                  text: 'Sign in',
                  isLoading: authState.isLoading,
                  onPressed: _submit,
                ),
                const SizedBox(height: GariLinkSpacing.xxxxl),
                Wrap(
                  alignment: WrapAlignment.center,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Text(
                      "Don't have an account? ",
                      style: GoogleFonts.inter(
                        color: GariLinkColors.textSecondary,
                      ),
                    ),
                    TextButton(
                      onPressed: () => context.push('/register'),
                      child: const Text('Register'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
