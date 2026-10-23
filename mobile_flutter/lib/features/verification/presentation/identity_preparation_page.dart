import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/theme.dart';
import '../../authentication/presentation/providers/auth_provider.dart';
import '../data/identity_repository.dart';
import '../domain/verification_requirement.dart';
import 'verification_checklist.dart';

class IdentityPreparationPage extends ConsumerWidget {
  const IdentityPreparationPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final actor = ref.watch(authStateProvider).user?.id;
    return Scaffold(
      appBar: AppBar(title: const Text('Identity verification')),
      body: actor == null
          ? const Center(child: Text('Sign in to view your identity status.'))
          : IdentityPreparationView(
              key: ValueKey(actor),
              repository: ref.watch(identityRepositoryProvider),
            ),
    );
  }
}

/// Fresh server-backed preparation, not a document picker or approval simulator.
/// Actor-keyed parent disposes state/request key on account switch/logout.
class IdentityPreparationView extends StatefulWidget {
  const IdentityPreparationView({super.key, required this.repository});
  final IdentityRepository repository;
  @override
  State<IdentityPreparationView> createState() =>
      _IdentityPreparationViewState();
}

class _IdentityPreparationViewState extends State<IdentityPreparationView> {
  late Future<IdentitySnapshot> _status;
  late String _requestId;
  String? _creationSource;
  bool _creating = false;
  String? _error;
  @override
  void initState() {
    super.initState();
    _requestId = _newRequestId();
    _status = widget.repository.load();
  }

  String _newRequestId() {
    final random = Random.secure();
    final bytes = List.generate(16, (_) => random.nextInt(256));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    final hex = bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    return '${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}';
  }

  void _reload() => setState(() {
    _error = null;
    _status = widget.repository.load();
  });
  Future<void> _create(int policy, {String? previousCaseId}) async {
    if (_creationSource != previousCaseId) {
      _requestId = _newRequestId();
      _creationSource = previousCaseId;
    }
    setState(() => _creating = true);
    try {
      await widget.repository.create(_requestId, policy);
      if (mounted) {
        _reload(); // Re-fetch; creation response never authorizes an action.
      }
    } catch (_) {
      if (mounted) {
        setState(
          () => _error = 'Identity preparation could not be saved. Try again.',
        );
      }
    } finally {
      if (mounted) setState(() => _creating = false);
    }
  }

  @override
  Widget build(BuildContext context) => SingleChildScrollView(
    padding: const EdgeInsets.all(GariLinkSpacing.lg),
    child: FutureBuilder<IdentitySnapshot>(
      future: _status,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError || !snapshot.hasData) {
          return Column(
            children: [
              const Text('Your identity status could not be loaded.'),
              TextButton(onPressed: _reload, child: const Text('Retry')),
            ],
          );
        }
        final data = snapshot.data!;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Identity preparation',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: GariLinkSpacing.md),
            const Text(
              'This development flow saves a private draft and shows your latest review status. Document uploads are not available. It does not unlock bookings or publication.',
            ),
            const SizedBox(height: GariLinkSpacing.md),
            Text(
              data.state == 'DRAFT'
                  ? 'Draft saved'
                  : switch (data.presentationStatus) {
                      VerificationStatus.notStarted => 'Not started',
                      VerificationStatus.pendingReview => 'Pending review',
                      VerificationStatus.approved => 'Approved',
                      VerificationStatus.rejected => 'Rejected',
                      VerificationStatus.expired => 'Expired',
                      VerificationStatus.revoked => 'Revoked',
                    },
            ),
            VerificationChecklist(
              notice:
                  'Server-backed preparation — document submission is unavailable.',
              requirements: [
                VerificationRequirement(
                  title: 'Identity evidence',
                  description:
                      'Accepted evidence and retention rules still require approval.',
                  status: data.presentationStatus,
                ),
              ],
            ),
            if (_error != null) Text(_error!),
            if (data.caseId == null || data.resubmissionAvailable)
              FilledButton(
                onPressed: _creating
                    ? null
                    : () => _create(
                        data.policyVersion,
                        previousCaseId: data.caseId,
                      ),
                child: Text(
                  _creating
                      ? 'Saving…'
                      : data.resubmissionAvailable
                      ? 'Start a new verification draft'
                      : 'Start identity preparation',
                ),
              ),
            TextButton(
              onPressed: _creating ? null : _reload,
              child: const Text('Refresh status'),
            ),
          ],
        );
      },
    ),
  );
}
