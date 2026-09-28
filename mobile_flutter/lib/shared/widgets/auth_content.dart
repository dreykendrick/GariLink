import 'package:flutter/material.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/spacing.dart';
import '../../core/theme/typography.dart';

/// A readable form column that stays scrollable with large text and keyboards.
class AuthContent extends StatelessWidget {
  const AuthContent({required this.child, super.key});
  final Widget child;

  @override
  Widget build(BuildContext context) => Align(
    alignment: Alignment.topCenter,
    child: ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 480),
      child: SingleChildScrollView(
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        padding: const EdgeInsets.fromLTRB(
          GariLinkSpacing.xl,
          GariLinkSpacing.lg,
          GariLinkSpacing.xl,
          GariLinkSpacing.xxl,
        ),
        child: AutofillGroup(child: child),
      ),
    ),
  );
}

class AuthHeading extends StatelessWidget {
  const AuthHeading({
    required this.title,
    required this.description,
    super.key,
  });
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        'GariLink',
        style: GariLinkTypography.labelMedium.copyWith(
          color: GariLinkColors.accent,
        ),
      ),
      const SizedBox(height: GariLinkSpacing.xxl),
      Semantics(
        header: true,
        child: Text(
          title,
          style: GariLinkTypography.largeTitle.copyWith(height: 1.15),
        ),
      ),
      const SizedBox(height: GariLinkSpacing.md),
      Text(
        description,
        style: GariLinkTypography.bodyMedium.copyWith(height: 1.5),
      ),
    ],
  );
}
