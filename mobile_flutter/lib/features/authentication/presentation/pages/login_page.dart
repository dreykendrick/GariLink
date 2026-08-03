import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/spacing.dart';
import '../../../../core/theme/radius.dart';
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
      await ref.read(authStateProvider.notifier).login(
            _identifierController.text.trim(),
            _passwordController.text,
          );
      if (mounted) {
        context.go('/home');
      }
    } catch (e) {
      if (mounted) {
        final message = e.toString()
            .replaceAll('Exception: ', '')
            .replaceAll('AppException: ', '')
            .trim();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message.isEmpty ? 'Login failed. Please try again.' : message),
            backgroundColor: GariLinkColors.error,
            behavior: SnackBarBehavior.floating,
            margin: const EdgeInsets.all(16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
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
      backgroundColor: isDark ? const Color(0xFF070F1A) : GariLinkColors.background,
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
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: GariLinkSpacing.xxl),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Welcome Back',
                    style: GoogleFonts.inter(
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : GariLinkColors.textPrimary,
                      letterSpacing: -1.0,
                    ),
                  ),
                  const SizedBox(height: GariLinkSpacing.xs),
                  Text(
                    'Sign in to continue',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: GariLinkColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: GariLinkSpacing.xxxl),
                  AppTextField(
                    labelText: 'Email or Phone',
                    hintText: 'Enter email or phone',
                    controller: _identifierController,
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
                    child: GestureDetector(
                      onTap: () => context.push('/forgot-password'),
                      child: Text(
                        'Forgot Password?',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: GariLinkColors.accent,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: GariLinkSpacing.xxxl),
                  AppButton(
                    text: 'Login',
                    isLoading: authState.isLoading,
                    onPressed: _submit,
                  ),
                  const SizedBox(height: GariLinkSpacing.xxl),
                  Row(
                    children: [
                      Expanded(
                        child: Divider(
                          color: isDark ? const Color(0xFF1E2D4A) : GariLinkColors.border,
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: GariLinkSpacing.md),
                        child: Text(
                          'or continue with',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: GariLinkColors.textSecondary,
                          ),
                        ),
                      ),
                      Expanded(
                        child: Divider(
                          color: isDark ? const Color(0xFF1E2D4A) : GariLinkColors.border,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: GariLinkSpacing.xxl),
                  _socialButton(
                    text: 'Continue with Google',
                    icon: Icons.g_mobiledata, // We can style this or show a placeholder
                    onTap: () {},
                    isDark: isDark,
                  ),
                  const SizedBox(height: GariLinkSpacing.md),
                  _socialButton(
                    text: 'Continue with Apple',
                    icon: Icons.apple,
                    onTap: () {},
                    isDark: isDark,
                  ),
                  const SizedBox(height: GariLinkSpacing.xxxxl),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        "Don't have an account? ",
                        style: GoogleFonts.inter(
                          color: GariLinkColors.textSecondary,
                        ),
                      ),
                      GestureDetector(
                        onTap: () => context.push('/register'),
                        child: Text(
                          'Register',
                          style: GoogleFonts.inter(
                            color: GariLinkColors.accent,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _socialButton({
    required String text,
    required IconData icon,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 24, color: isDark ? Colors.white : GariLinkColors.textPrimary),
      label: Text(
        text,
        style: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: isDark ? Colors.white : GariLinkColors.textPrimary,
        ),
      ),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: GariLinkSpacing.md),
        side: BorderSide(
          color: isDark ? const Color(0xFF1E2D4A) : GariLinkColors.border,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: GariLinkRadius.buttonBorderRadius,
        ),
      ),
    );
  }
}
