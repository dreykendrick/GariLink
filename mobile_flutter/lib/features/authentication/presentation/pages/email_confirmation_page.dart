import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/errors/app_exception.dart';
import '../../../../core/theme/spacing.dart';
import '../../../../shared/widgets/auth_content.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_text_field.dart';
import '../providers/auth_provider.dart';

class EmailConfirmationPage extends ConsumerStatefulWidget {
  const EmailConfirmationPage({
    super.key,
    this.tokenHash,
    this.recovery = false,
    this.invalidLink = false,
  });
  final String? tokenHash;
  final bool recovery;
  final bool invalidLink;
  @override
  ConsumerState<EmailConfirmationPage> createState() =>
      _EmailConfirmationPageState();
}

class _EmailConfirmationPageState extends ConsumerState<EmailConfirmationPage> {
  final _password = TextEditingController();
  final _form = GlobalKey<FormState>();
  Timer? _timer;
  int _remaining = 60;
  String? _message;
  bool _busy = false;
  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted && _remaining > 0) setState(() => _remaining--);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _password.dispose();
    super.dispose();
  }

  Future<void> _confirm() async {
    setState(() => _busy = true);
    try {
      await ref
          .read(authStateProvider.notifier)
          .confirmEmail(widget.tokenHash!);
      if (mounted) context.go('/home');
    } catch (error) {
      if (mounted) {
        setState(
          () => _message =
              '${userFacingError(error)} Request a fresh email if this link has expired or was already used.',
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _resend() async {
    if (_remaining > 0 || _busy) return;
    setState(() {
      _busy = true;
      _remaining = 60;
    });
    try {
      await ref.read(authStateProvider.notifier).resendEmail();
      if (mounted) {
        setState(
          () => _message =
              'If your account can receive a confirmation email, instructions have been sent.',
        );
      }
    } catch (error) {
      if (mounted) setState(() => _message = userFacingError(error));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _reset() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      await ref
          .read(authStateProvider.notifier)
          .resetEmail(widget.tokenHash!, _password.text);
      await ref.read(authStateProvider.notifier).logout();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Password updated. Sign in with your new password.'),
          ),
        );
        context.go('/login');
      }
    } catch (error) {
      if (mounted) setState(() => _message = userFacingError(error));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);
    final email = auth.pendingEmail;
    final ready = auth.isHydrated && !auth.isLoading && !_busy;
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.recovery ? 'Reset password' : 'Confirm email'),
      ),
      body: SafeArea(
        child: AuthContent(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AuthHeading(
                title: widget.recovery
                    ? 'Choose a new password'
                    : 'Check your inbox',
                description: widget.recovery
                    ? 'Use a strong password to secure your account.'
                    : 'Open the confirmation email${email == null ? '' : ' sent to $email'}. You can keep exploring while you wait.',
              ),
              const SizedBox(height: GariLinkSpacing.xl),
              if (_message != null)
                Semantics(liveRegion: true, child: Text(_message!)),
              if (widget.invalidLink) ...[
                const Text(
                  'This link is incomplete or unsupported. Request a fresh email.',
                ),
                TextButton(
                  onPressed: () => context.go('/forgot-password'),
                  child: const Text('Request password recovery'),
                ),
              ],
              if (widget.recovery) ...[
                Form(
                  key: _form,
                  child: AppTextField(
                    labelText: 'New password',
                    controller: _password,
                    isPassword: true,
                    validator: (value) =>
                        value != null &&
                            value.length >= 10 &&
                            value.length <= 128 &&
                            RegExp('[a-z]').hasMatch(value) &&
                            RegExp('[A-Z]').hasMatch(value) &&
                            RegExp('[0-9]').hasMatch(value)
                        ? null
                        : 'Use 10–128 characters, uppercase, lowercase and a number',
                  ),
                ),
                const SizedBox(height: GariLinkSpacing.lg),
                AppButton(
                  text: 'Update password',
                  isLoading: _busy,
                  onPressed:
                      widget.tokenHash == null || !ready || widget.invalidLink
                      ? null
                      : _reset,
                ),
              ] else ...[
                if (widget.tokenHash != null && !widget.invalidLink)
                  AppButton(
                    text: 'Confirm email',
                    isLoading: _busy,
                    onPressed: ready ? _confirm : null,
                  ),
                if (_busy) const Center(child: CircularProgressIndicator()),
                if (email != null)
                  TextButton(
                    onPressed: _remaining == 0 && ready ? _resend : null,
                    child: Text(
                      _remaining == 0
                          ? 'Resend confirmation'
                          : 'Resend in ${_remaining}s',
                    ),
                  ),
                AppButton(
                  text: 'Continue exploring',
                  onPressed: () => context.go('/home'),
                ),
                TextButton(
                  onPressed: () => context.go('/login'),
                  child: const Text('I confirmed my email — sign in'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
