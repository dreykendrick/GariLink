import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:garilink_mobile/core/theme/app_theme.dart';
import 'package:garilink_mobile/shared/widgets/auth_content.dart';
import 'package:garilink_mobile/shared/widgets/app_button.dart';
import 'package:garilink_mobile/shared/widgets/app_text_field.dart';

void main() {
  for (final width in [320.0, 360.0, 390.0, 412.0, 600.0]) {
    for (final scale in [1.0, 1.5, 2.0]) {
      testWidgets('auth form at $width with text scale $scale', (tester) async {
        tester.view.physicalSize = Size(width, 640);
        tester.view.devicePixelRatio = 1;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        var submitted = false;
        await tester.pumpWidget(
          MaterialApp(
            theme: AppTheme.lightTheme,
            home: MediaQuery(
              data: MediaQueryData(
                size: Size(width, 640),
                textScaler: TextScaler.linear(scale),
              ),
              child: Scaffold(
                body: SafeArea(
                  child: AuthContent(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const AuthHeading(
                          title: 'Recover your account',
                          description:
                              'Enter your phone number to receive a verification code.',
                        ),
                        for (var i = 0; i < 5; i++)
                          AppTextField(labelText: 'Account detail $i'),
                        AppButton(
                          text: 'Continue',
                          onPressed: () => submitted = true,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
        final button = find.byType(AppButton);
        await tester.ensureVisible(button);
        await tester.pumpAndSettle();
        await tester.tap(button);
        expect(submitted, isTrue);
        expect(
          tester.getSize(find.byType(AuthContent)).width,
          lessThanOrEqualTo(width),
        );
        expect(tester.takeException(), isNull);
      });
    }
  }
}
