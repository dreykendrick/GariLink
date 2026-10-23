import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:garilink_mobile/features/verification/presentation/verification_action_preview.dart';
import 'package:garilink_mobile/features/verification/domain/verification_requirement.dart';
import 'package:garilink_mobile/features/verification/presentation/verification_checklist.dart';

void main() {
  for (final journey in VerificationJourney.values) {
    testWidgets('$journey action preview stops without mutation at 200%', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(320, 640);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      bool? stopped;
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            verificationActionPreviewProvider.overrideWithValue(true),
          ],
          child: MaterialApp(
            builder: (context, child) => MediaQuery(
              data: MediaQuery.of(
                context,
              ).copyWith(textScaler: const TextScaler.linear(2)),
              child: child!,
            ),
            home: Scaffold(
              body: Consumer(
                builder: (context, ref, _) => TextButton(
                  onPressed: () async {
                    stopped = await showVerificationActionPreview(
                      context,
                      ref,
                      journey,
                    );
                  },
                  child: const Text('Review'),
                ),
              ),
            ),
          ),
        ),
      );
      await tester.tap(find.text('Review'));
      await tester.pumpAndSettle();
      expect(find.byType(VerificationChecklist), findsOneWidget);
      expect(find.text('APPROVED'), findsNothing);
      expect(find.text('Upload'), findsNothing);
      if (journey == VerificationJourney.withDriver) {
        expect(find.textContaining('licence'), findsNothing);
      }
      expect(tester.takeException(), isNull);
      Navigator.of(tester.element(find.byType(VerificationChecklist))).pop();
      await tester.pumpAndSettle();
      expect(stopped, isTrue);
    });
  }
  test('with-driver preview never asks the renter for a driving licence', () {
    expect(previewRequirementKeys(VerificationJourney.withDriver), [
      'identity',
      'contact',
    ]);
    expect(
      previewRequirementKeys(VerificationJourney.selfDrive),
      contains('designatedDriverLicence'),
    );
  });
  test('verification preview is disabled by default', () {
    expect(VerificationPreview.enabled, isFalse);
  });
  testWidgets(
    'pending review is not approval and no collection action exists',
    (tester) async {
      tester.view.physicalSize = const Size(320, 640);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      await tester.pumpWidget(
        MaterialApp(
          home: MediaQuery(
            data: const MediaQueryData(textScaler: TextScaler.linear(2)),
            child: const Scaffold(
              body: SingleChildScrollView(
                child: VerificationChecklist(
                  requirements: [
                    VerificationRequirement(
                      title: 'Identity',
                      description: 'Development fixture only',
                      status: VerificationStatus.pendingReview,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
      expect(find.text('PENDING REVIEW'), findsOneWidget);
      expect(find.text('APPROVED'), findsNothing);
      expect(find.byType(ElevatedButton), findsNothing);
      expect(tester.takeException(), isNull);
    },
  );
}
