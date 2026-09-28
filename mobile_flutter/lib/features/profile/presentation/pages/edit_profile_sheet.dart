import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/errors/app_exception.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../authentication/domain/entities/user.dart';
import '../../../authentication/presentation/providers/auth_provider.dart';

Future<bool?> showEditProfileSheet(BuildContext context, User user) {
  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    isDismissible: false,
    enableDrag: false,
    builder: (_) => _EditProfileSheet(user: user),
  );
}

class _EditProfileSheet extends ConsumerStatefulWidget {
  final User user;
  const _EditProfileSheet({required this.user});

  @override
  ConsumerState<_EditProfileSheet> createState() => _EditProfileSheetState();
}

class _EditProfileSheetState extends ConsumerState<_EditProfileSheet> {
  final _form = GlobalKey<FormState>();
  late final TextEditingController _firstName;
  late final TextEditingController _lastName;
  late final TextEditingController _displayName;
  late final TextEditingController _city;
  late final TextEditingController _bio;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final profile = widget.user.profile;
    _firstName = TextEditingController(text: profile?.firstName ?? '');
    _lastName = TextEditingController(text: profile?.lastName ?? '');
    _displayName = TextEditingController(text: profile?.displayName ?? '');
    _city = TextEditingController(text: profile?.city ?? '');
    _bio = TextEditingController(text: profile?.bio ?? '');
  }

  @override
  void dispose() {
    for (final controller in [
      _firstName,
      _lastName,
      _displayName,
      _city,
      _bio,
    ]) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (_saving || !_form.currentState!.validate()) return;
    FocusManager.instance.primaryFocus?.unfocus();
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await ref.read(authStateProvider.notifier).updateProfile({
        'firstName': _firstName.text.trim(),
        'lastName': _lastName.text.trim(),
        'displayName': _displayName.text.trim(),
        'city': _city.text.trim(),
        'bio': _bio.text.trim(),
      });
      if (mounted) Navigator.of(context).pop(true);
    } catch (error) {
      if (mounted) {
        setState(() {
          _saving = false;
          _error = error is AppException
              ? error.message
              : 'Could not save your profile. Please try again.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return PopScope(
      canPop: !_saving,
      child: Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.viewInsetsOf(context).bottom,
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: AutofillGroup(
                child: Form(
                  key: _form,
                  autovalidateMode: AutovalidateMode.onUserInteraction,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              'Personal information',
                              style: theme.textTheme.titleLarge,
                            ),
                          ),
                          IconButton(
                            tooltip: 'Close',
                            onPressed: _saving
                                ? null
                                : () => Navigator.pop(context),
                            icon: const Icon(Icons.close),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Keep your name and profile up to date.',
                        style: theme.textTheme.bodyMedium,
                      ),
                      const SizedBox(height: 24),
                      _field(
                        'First name',
                        _firstName,
                        80,
                        hints: const [AutofillHints.givenName],
                        isRequired: true,
                      ),
                      _field(
                        'Last name',
                        _lastName,
                        80,
                        hints: const [AutofillHints.familyName],
                      ),
                      _field('Display name', _displayName, 80),
                      _field(
                        'City',
                        _city,
                        100,
                        hints: const [AutofillHints.addressCity],
                      ),
                      _field('About you', _bio, 500, lines: 3),
                      Text(
                        'Verified phone: ${widget.user.phoneNumber}',
                        style: theme.textTheme.bodySmall,
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 16),
                        Semantics(
                          liveRegion: true,
                          child: Text(
                            _error!,
                            style: TextStyle(color: theme.colorScheme.error),
                          ),
                        ),
                      ],
                      const SizedBox(height: 24),
                      AppButton(
                        text: 'Save changes',
                        isLoading: _saving,
                        onPressed: _save,
                      ),
                      const SizedBox(height: 8),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _field(
    String label,
    TextEditingController controller,
    int limit, {
    Iterable<String>? hints,
    bool isRequired = false,
    int lines = 1,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: controller,
        enabled: !_saving,
        maxLength: limit,
        maxLines: lines,
        autofillHints: hints,
        textCapitalization: label == 'About you'
            ? TextCapitalization.sentences
            : TextCapitalization.words,
        textInputAction: lines > 1
            ? TextInputAction.newline
            : TextInputAction.next,
        onTapOutside: (_) => FocusManager.instance.primaryFocus?.unfocus(),
        decoration: InputDecoration(labelText: label, errorMaxLines: 2),
        validator: (value) => isRequired && (value?.trim().isEmpty ?? true)
            ? 'Enter your first name'
            : null,
      ),
    );
  }
}
