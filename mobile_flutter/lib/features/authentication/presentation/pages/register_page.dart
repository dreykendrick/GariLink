import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/errors/app_exception.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/spacing.dart';
import '../../../../core/validation/tanzanian_phone.dart';
import '../../../../shared/widgets/auth_content.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_text_field.dart';
import '../providers/auth_provider.dart';

class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    try {
      await ref
          .read(authStateProvider.notifier)
          .register(
            phoneNumber: _phoneController.text.trim(),
            password: _passwordController.text,
            firstName: _firstNameController.text.trim().isEmpty
                ? null
                : _firstNameController.text.trim(),
            lastName: _lastNameController.text.trim().isEmpty
                ? null
                : _lastNameController.text.trim(),
          );
      if (mounted) {
        context.replace('/verify-phone');
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
                  title: 'Make your next move',
                  description:
                      "Save vehicles, contact sellers and manage rentals in one place.",
                ),
                const SizedBox(height: GariLinkSpacing.xxl),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    AppTextField(
                      labelText: 'First name',
                      hintText: 'John',
                      controller: _firstNameController,
                    ),
                    const SizedBox(height: GariLinkSpacing.md),
                    AppTextField(
                      labelText: 'Last name',
                      hintText: 'Doe',
                      controller: _lastNameController,
                    ),
                  ],
                ),
                const SizedBox(height: GariLinkSpacing.md),
                AppTextField(
                  labelText: 'Phone number *',
                  hintText: '0712 345 678',
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  validator: validateTanzanianPhone,
                ),
                const SizedBox(height: GariLinkSpacing.md),
                AppTextField(
                  labelText: 'Password *',
                  hintText: 'Create strong password',
                  controller: _passwordController,
                  isPassword: true,
                  validator: (val) {
                    if (val == null || val.isEmpty) {
                      return 'Password is required';
                    }
                    if (val.length < 10) {
                      return 'At least 10 characters';
                    }
                    final passRegex = RegExp(
                      r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,128}$',
                    );
                    if (!passRegex.hasMatch(val)) {
                      return 'Must include uppercase, lowercase, and a number';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: GariLinkSpacing.md),
                AppTextField(
                  labelText: 'Confirm password *',
                  hintText: 'Repeat password',
                  controller: _confirmPasswordController,
                  isPassword: true,
                  validator: (val) {
                    if (val == null || val.isEmpty) {
                      return 'Please confirm your password';
                    }
                    if (val != _passwordController.text) {
                      return 'Passwords do not match';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: GariLinkSpacing.xxl),
                AppButton(
                  text: 'Create account',
                  isLoading: authState.isLoading,
                  onPressed: _submit,
                ),
                const SizedBox(height: GariLinkSpacing.xl),
                Wrap(
                  alignment: WrapAlignment.center,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Text(
                      'Already have an account? ',
                      style: GoogleFonts.inter(
                        color: GariLinkColors.textSecondary,
                      ),
                    ),
                    TextButton(
                      onPressed: () => context.pop(),
                      child: const Text('Sign in'),
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
