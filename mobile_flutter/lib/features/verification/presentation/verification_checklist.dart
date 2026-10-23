import 'package:flutter/material.dart';
import '../domain/verification_requirement.dart';
import '../../../shared/widgets/status_badge.dart';

/// Isolated component only: no route, uploads, approvals or resume-action authority.
class VerificationChecklist extends StatelessWidget {
  const VerificationChecklist({
    super.key,
    required this.requirements,
    this.notice =
        'Verification preview — document submission is not available.',
  });
  final String notice;
  final List<VerificationRequirement> requirements;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Text(notice),
      for (final requirement in requirements)
        ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(requirement.title),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(requirement.description),
              StatusBadge(
                status: switch (requirement.status) {
                  VerificationStatus.notStarted => 'Not started',
                  VerificationStatus.pendingReview => 'Pending review',
                  VerificationStatus.rejected => 'Rejected',
                  VerificationStatus.expired => 'Expired',
                  VerificationStatus.approved => 'Approved',
                  VerificationStatus.revoked => 'Revoked',
                },
              ),
            ],
          ),
        ),
    ],
  );
}
