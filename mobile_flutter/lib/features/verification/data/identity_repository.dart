import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/api_client.dart';
import '../domain/verification_requirement.dart';

const identityPreparationEnabled =
    !bool.fromEnvironment('dart.vm.product') &&
    bool.fromEnvironment('ENABLE_IDENTITY_PREPARATION', defaultValue: false);
final identityRepositoryProvider = Provider<IdentityRepository>(
  (ref) => ApiIdentityRepository(ref.watch(apiClientProvider)),
);

class IdentitySnapshot {
  const IdentitySnapshot({
    required this.caseId,
    required this.state,
    required this.revision,
    required this.policyVersion,
    this.resubmissionAvailable = false,
  });
  final String? caseId;
  final String state;
  final int revision;
  final int policyVersion;
  final bool resubmissionAvailable;
  factory IdentitySnapshot.fromJson(Map<String, dynamic> json) {
    const states = {
      'NOT_STARTED',
      'DRAFT',
      'PENDING_REVIEW',
      'APPROVED',
      'REJECTED',
      'EXPIRED',
      'REVOKED',
      'SUPERSEDED',
    };
    if (!states.contains(json['state']) ||
        json['revision'] is! int ||
        json['policyVersion'] is! int ||
        (json['revision'] as int) < 0 ||
        (json['policyVersion'] as int) < 1 ||
        json['collectionEnabled'] != false ||
        json['eligible'] != false ||
        (json.containsKey('resubmissionAvailable') &&
            json['resubmissionAvailable'] is! bool) ||
        (json['caseId'] != null && json['caseId'] is! String)) {
      throw const FormatException('Unsupported identity preparation response');
    }
    return IdentitySnapshot(
      caseId: json['caseId'] as String?,
      state: json['state'] as String,
      revision: json['revision'] as int,
      policyVersion: json['policyVersion'] as int,
      resubmissionAvailable: json['resubmissionAvailable'] == true,
    );
  }
  VerificationStatus get presentationStatus => switch (state) {
    'PENDING_REVIEW' => VerificationStatus.pendingReview,
    'APPROVED' => VerificationStatus.approved,
    'REJECTED' => VerificationStatus.rejected,
    'EXPIRED' => VerificationStatus.expired,
    'REVOKED' => VerificationStatus.revoked,
    _ => VerificationStatus.notStarted,
  };
}

abstract interface class IdentityRepository {
  Future<IdentitySnapshot> load();
  Future<IdentitySnapshot> create(String requestId, int policyVersion);
}

class ApiIdentityRepository implements IdentityRepository {
  const ApiIdentityRepository(this.api);
  final ApiClient api;
  @override
  Future<IdentitySnapshot> load() async => IdentitySnapshot.fromJson(
    await api.get<Map<String, dynamic>>('/verification/identity'),
  );
  @override
  Future<IdentitySnapshot> create(String requestId, int policyVersion) async =>
      IdentitySnapshot.fromJson(
        await api.post<Map<String, dynamic>>(
          '/verification/identity/cases',
          data: {'requestId': requestId, 'policyVersion': policyVersion},
        ),
      );
}
