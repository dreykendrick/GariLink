import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/verification_requirement.dart';
import 'verification_checklist.dart';

/// Debug-only action integration; never approval, collection or a resume command.
final verificationActionPreviewProvider = Provider<bool>(
  (ref) => VerificationPreview.enabled,
);

Future<bool> showVerificationActionPreview(
  BuildContext context,
  WidgetRef ref,
  VerificationJourney journey,
) async {
  if (!ref.read(verificationActionPreviewProvider)) return false;
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (context) => SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: VerificationChecklist(
        requirements: [
          for (final key in previewRequirementKeys(journey))
            VerificationRequirement(
              title: _labels[key] ?? 'Verification requirement',
              description:
                  'Required for this action when verification is activated.',
              status: VerificationStatus.notStarted,
            ),
        ],
      ),
    ),
  );
  // Caller must stop the attempted mutation in preview mode. Dismissal is not
  // verification completion; no automatic publication or rental submission.
  return true;
}

const _labels = {
  'identity': 'Identity',
  'contact': 'Verified contact',
  'designatedDriverLicence': 'Receiving driver licence',
  'ownerIdentity': 'Owner identity',
  'vehicleDocuments': 'Vehicle documents',
  'ownershipOrMandate': 'Ownership or rental authority',
  'insurance': 'Applicable insurance',
  'driverLicence': 'Driver licence',
  'operatingQualifications': 'Applicable driver qualifications',
};
