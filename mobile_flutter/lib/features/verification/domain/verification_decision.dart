import 'verification_requirement.dart';

/// Advisory response only. Sensitive mutation RPCs must check again atomically.
class VerificationDecision {
  const VerificationDecision({
    required this.actorId,
    required this.subjectId,
    required this.journey,
    required this.expiresAt,
    required this.gateEnabled,
    required this.allowed,
    required this.requirements,
  });
  final String actorId;
  final String subjectId;
  final VerificationJourney journey;
  final DateTime expiresAt;
  final bool gateEnabled;
  final bool? allowed;
  final List<VerificationRequirement> requirements;
}

abstract interface class VerificationDecisionSource {
  Future<VerificationDecision> evaluate({
    required String subjectId,
    required VerificationJourney journey,
  });
}

/// An in-memory fresh-check boundary, separate from authentication continuation.
/// No price, document, credential, route, or mutation command is retained.
/// Result permits reviewing context, NEVER submitting/publishing automatically.
Future<bool> canReviewAfterVerification({
  required VerificationDecisionSource source,
  required String actorId,
  required String subjectId,
  required VerificationJourney journey,
  required String? Function() currentActorId,
  required DateTime Function() now,
}) async {
  try {
    final decision = await source.evaluate(
      subjectId: subjectId,
      journey: journey,
    );
    return actorId.isNotEmpty &&
        currentActorId() == actorId &&
        decision.actorId == actorId &&
        decision.subjectId == subjectId &&
        decision.journey == journey &&
        decision.expiresAt.isAfter(now()) &&
        decision.gateEnabled &&
        decision.allowed == true &&
        decision.requirements.isNotEmpty &&
        decision.requirements.every(
          (r) => r.status == VerificationStatus.approved,
        );
  } catch (_) {
    // Offline, malformed/unavailable policy and expired session fail closed.
    return false;
  }
}
