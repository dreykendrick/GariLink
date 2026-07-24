import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/tokens.dart';
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
      await ref.read(authStateProvider.notifier).register(
            phoneNumber: _phoneController.text.trim(),
            password: _passwordController.text,
            firstName: _firstNameController.text.trim().isEmpty ? null : _firstNameController.text.trim(),
            lastName: _lastNameController.text.trim().isEmpty ? null : _lastNameController.text.trim(),
          );
      if (mounted) {
        context.replace('/verify-phone');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppColors.error[500],
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
      appBar: AppBar(
        title: const Text('Register'),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl, vertical: AppSpacing.lg),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Create account',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: isDark ? AppColors.darkText : AppColors.neutral[900],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'Join GariLink today',
                    style: TextStyle(
                      fontSize: 16,
                      color: isDark ? AppColors.darkTextMuted : AppColors.neutral[500],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  Row(
                    children: [
                      Expanded(
                        child: AppTextField(
                          labelText: 'First name',
                          hintText: 'John',
                          controller: _firstNameController,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.base),
                      Expanded(
                        child: AppTextField(
                          labelText: 'Last name',
                          hintText: 'Doe',
                          controller: _lastNameController,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.base),
                  AppTextField(
                    labelText: 'Phone number *',
                    hintText: '+254712345678',
                    controller: _phoneController,
                    prefixIcon: Icons.phone_android_outlined,
                    keyboardType: TextInputType.phone,
                    validator: (val) {
                      if (val == null || val.trim().isEmpty) {
                        return 'Phone number is required';
                      }
                      final phoneRegex = RegExp(r'^\+[1-9]\d{6,14}$');
                      if (!phoneRegex.hasMatch(val.trim())) {
                        return 'Must be in format +254712345678';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: AppSpacing.base),
                  AppTextField(
                    labelText: 'Password *',
                    hintText: 'Min 8 chars, uppercase, lowercase, number',
                    controller: _passwordController,
                    prefixIcon: Icons.lock_outline,
                    isPassword: true,
                    validator: (val) {
                      if (val == null || val.isEmpty) {
                        return 'Password is required';
                      }
                      if (val.length < 8) {
                        return 'At least 8 characters';
                      }
                      final passRegex = RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$');
                      if (!passRegex.hasMatch(val)) {
                        return 'Must include uppercase, lowercase, and a number';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: AppSpacing.base),
                  AppTextField(
                    labelText: 'Confirm password *',
                    hintText: 'Repeat password',
                    controller: _confirmPasswordController,
                    prefixIcon: Icons.lock_outline,
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
                  const SizedBox(height: AppSpacing.xl),
                  AppButton(
                    text: 'Create Account',
                    isLoading: authState.isLoading,
                    onPressed: _submit,
                  ),
                  const SizedBox(height: AppSpacing.base),
                  Text(
                    'By registering, you agree to our Terms of Service and Privacy Policy.',
                    style: TextStyle(
                      fontSize: 11,
                      color: isDark ? AppColors.darkTextMuted : AppColors.neutral[500],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Already have an account? ',
                        style: TextStyle(
                          color: isDark ? AppColors.darkTextMuted : AppColors.neutral[600],
                        ),
                      ),
                      GestureDetector(
                        onTap: () => context.pop(),
                        child: Text(
                          'Sign In',
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.primary,
                            fontWeight: FontWeight.bold,
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
}
