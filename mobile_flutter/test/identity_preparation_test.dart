import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:garilink_mobile/features/verification/data/identity_repository.dart';
import 'package:garilink_mobile/features/verification/presentation/identity_preparation_page.dart';

class FakeIdentity implements IdentityRepository {
  String state = 'NOT_STARTED';
  int loads = 0;
  bool failSave = false;
  bool allowResubmission = false;
  final keys = <String>[];
  @override
  Future<IdentitySnapshot> load() async {
    loads++;
    return IdentitySnapshot(
      caseId: state == 'NOT_STARTED' ? null : 'case',
      state: state,
      revision: state == 'NOT_STARTED' ? 0 : 1,
      policyVersion: 1,
      resubmissionAvailable: allowResubmission && state != 'DRAFT',
    );
  }

  @override
  Future<IdentitySnapshot> create(String requestId, int policyVersion) async {
    keys.add(requestId);
    if (failSave) {
      throw Exception('SQLSTATE private technical data must not render');
    }
    state = 'DRAFT';
    return load();
  }
}

void main() {
  test(
    'identity preparation disabled by default; future grant responses rejected',
    () {
      expect(identityPreparationEnabled, isFalse);
      expect(
        () => IdentitySnapshot.fromJson({
          'state': 'APPROVED',
          'revision': 1,
          'policyVersion': 1,
          'eligible': true,
          'collectionEnabled': true,
        }),
        throwsFormatException,
      );
    },
  );
  Future<void> pump(WidgetTester tester, FakeIdentity fake) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(
      MaterialApp(
        home: MediaQuery(
          data: const MediaQueryData(textScaler: TextScaler.linear(2)),
          child: Scaffold(body: IdentityPreparationView(repository: fake)),
        ),
      ),
    );
    await tester.pumpAndSettle();
  }

  testWidgets(
    'server draft creation reloads status and never exposes upload or booking actions',
    (tester) async {
      final fake = FakeIdentity();
      await pump(tester, fake);
      await tester.ensureVisible(find.text('Start identity preparation'));
      await tester.tap(find.text('Start identity preparation'));
      await tester.pumpAndSettle();
      expect(find.text('Draft saved'), findsOneWidget);
      expect(fake.loads, greaterThanOrEqualTo(2));
      expect(find.text('Upload document'), findsNothing);
      expect(find.text('Book'), findsNothing);
      expect(tester.takeException(), isNull);
    },
  );
  testWidgets(
    'server-authorized resubmission creates a draft and retains retry key',
    (tester) async {
      final fake = FakeIdentity()
        ..state = 'REJECTED'
        ..allowResubmission = true
        ..failSave = true;
      await pump(tester, fake);
      final action = find.text('Start a new verification draft');
      await tester.ensureVisible(action);
      await tester.tap(action);
      await tester.pumpAndSettle();
      fake.failSave = false;
      await tester.ensureVisible(action);
      await tester.tap(action);
      await tester.pumpAndSettle();
      expect(fake.keys.length, 2);
      expect(fake.keys[0], fake.keys[1]);
      expect(find.text('Draft saved'), findsOneWidget);
      expect(find.text('Upload document'), findsNothing);
      expect(tester.takeException(), isNull);
    },
  );
  testWidgets(
    'failed save retains idempotency key and hides technical errors',
    (tester) async {
      final fake = FakeIdentity()..failSave = true;
      await pump(tester, fake);
      await tester.ensureVisible(find.text('Start identity preparation'));
      await tester.tap(find.text('Start identity preparation'));
      await tester.pumpAndSettle();
      expect(find.textContaining('SQLSTATE'), findsNothing);
      fake.failSave = false;
      await tester.ensureVisible(find.text('Start identity preparation'));
      await tester.tap(find.text('Start identity preparation'));
      await tester.pumpAndSettle();
      expect(fake.keys.length, 2);
      expect(fake.keys[0], fake.keys[1]);
    },
  );
  for (final state in [
    'PENDING_REVIEW',
    'APPROVED',
    'REJECTED',
    'EXPIRED',
    'REVOKED',
  ]) {
    testWidgets(
      '$state displays server status without submission/approval buttons',
      (tester) async {
        await pump(tester, FakeIdentity()..state = state);
        expect(find.text('Start identity preparation'), findsNothing);
        expect(find.text('Upload document'), findsNothing);
        expect(find.text('Refresh status'), findsOneWidget);
        expect(tester.takeException(), isNull);
      },
    );
  }
}
