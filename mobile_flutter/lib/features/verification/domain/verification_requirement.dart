/// Presentation-only types. Never authorize an action from client state.
enum VerificationStatus {
  notStarted,
  pendingReview,
  rejected,
  expired,
  approved,
  revoked,
}

enum VerificationJourney {
  withDriver,
  selfDrive,
  vehiclePublication,
  driverActivation,
}

class VerificationRequirement {
  const VerificationRequirement({
    required this.title,
    required this.description,
    required this.status,
  });
  final String title;
  final String description;
  final VerificationStatus status;
}

class VerificationPreview {
  VerificationPreview._();
  static const enabled =
      !bool.fromEnvironment('dart.vm.product') &&
      bool.fromEnvironment('ENABLE_VERIFICATION_PREVIEW', defaultValue: false);
}

/// Draft checklist scopes from the architecture, not a deployed policy engine.
List<String> previewRequirementKeys(VerificationJourney journey) =>
    switch (journey) {
      VerificationJourney.withDriver => ['identity', 'contact'],
      VerificationJourney.selfDrive => [
        'identity',
        'contact',
        'designatedDriverLicence',
      ],
      VerificationJourney.vehiclePublication => [
        'ownerIdentity',
        'contact',
        'vehicleDocuments',
        'ownershipOrMandate',
        'insurance',
      ],
      VerificationJourney.driverActivation => [
        'identity',
        'contact',
        'driverLicence',
        'operatingQualifications',
      ],
    };
