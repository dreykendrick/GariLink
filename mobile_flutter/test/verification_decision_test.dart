import 'package:flutter_test/flutter_test.dart';
import 'package:garilink_mobile/features/verification/domain/verification_decision.dart';
import 'package:garilink_mobile/features/verification/domain/verification_requirement.dart';

class Source implements VerificationDecisionSource {
  Source(this.status, {this.allowed = true, this.enabled = true});
  final VerificationStatus status;
  final bool? allowed;
  final bool enabled;
  int calls = 0;
  @override
  Future<VerificationDecision> evaluate({
    required String subjectId,
    required VerificationJourney journey,
  }) async {
    calls++;
    return VerificationDecision(
      actorId: 'actor',
      subjectId: subjectId,
      journey: journey,
      expiresAt: DateTime.utc(2030),
      gateEnabled: enabled,
      allowed: allowed,
      requirements: [
        VerificationRequirement(
          title: 'Identity',
          description: '',
          status: status,
        ),
      ],
    );
  }
}

void main() {
  Future<bool> review(
    Source source, {
    String? actor = 'actor',
    DateTime? time,
  }) => canReviewAfterVerification(
    source: source,
    actorId: 'actor',
    subjectId: 'vehicle',
    journey: VerificationJourney.selfDrive,
    currentActorId: () => actor,
    now: () => time ?? DateTime.utc(2026),
  );
  for (final status in VerificationStatus.values.where(
    (s) => s != VerificationStatus.approved,
  )) {
    test('$status cannot resume even with allowed=true', () async {
      expect(await review(Source(status)), isFalse);
    });
  }
  test(
    'fresh decision required each time; result does not invoke a mutation',
    () async {
      final source = Source(VerificationStatus.approved);
      expect(await review(source), isTrue);
      expect(await review(source), isTrue);
      expect(source.calls, 2);
    },
  );
  test('account switch and logout deny continuation', () async {
    expect(
      await review(Source(VerificationStatus.approved), actor: 'other'),
      isFalse,
    );
    expect(
      await review(Source(VerificationStatus.approved), actor: null),
      isFalse,
    );
  });
  test('expired policy denies', () async {
    expect(
      await review(
        Source(VerificationStatus.approved),
        time: DateTime.utc(2030),
      ),
      isFalse,
    );
  });
  test('disabled/unconfigured policy is never approval', () async {
    expect(
      await review(Source(VerificationStatus.approved, enabled: false)),
      isFalse,
    );
    expect(
      await review(Source(VerificationStatus.approved, allowed: null)),
      isFalse,
    );
  });
}
