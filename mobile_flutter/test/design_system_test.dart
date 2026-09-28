import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:garilink_mobile/core/theme/theme.dart';
import 'package:garilink_mobile/shared/widgets/app_button.dart';
import 'package:garilink_mobile/shared/widgets/empty_state.dart';
import 'package:garilink_mobile/shared/widgets/price_text.dart';
import 'package:garilink_mobile/shared/widgets/status_badge.dart';

Widget _app(Widget child, {double textScale = 1}) => MaterialApp(
  theme: AppTheme.lightTheme,
  home: MediaQuery(
    data: MediaQueryData(textScaler: TextScaler.linear(textScale)),
    child: Scaffold(body: child),
  ),
);

void main() {
  testWidgets('motion tokens collapse when platform animations are disabled', (
    tester,
  ) async {
    late Duration resolved;
    await tester.pumpWidget(
      MaterialApp(
        home: MediaQuery(
          data: const MediaQueryData(disableAnimations: true),
          child: Builder(
            builder: (context) {
              resolved = GariLinkAnimations.duration(
                context,
                GariLinkAnimations.emphasized,
              );
              return const SizedBox();
            },
          ),
        ),
      ),
    );
    expect(resolved, Duration.zero);
  });

  testWidgets('button exposes loading state and disables interaction', (
    tester,
  ) async {
    var presses = 0;
    await tester.pumpWidget(
      _app(
        Center(
          child: AppButton(
            text: 'Publish listing',
            isLoading: true,
            onPressed: () => presses++,
          ),
        ),
      ),
    );

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    await tester.tap(find.byType(FilledButton));
    expect(presses, 0);
  });

  testWidgets(
    'empty state action remains usable on a narrow large-text screen',
    (tester) async {
      await tester.binding.setSurfaceSize(const Size(320, 640));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      var pressed = false;
      await tester.pumpWidget(
        _app(
          EmptyState(
            title: 'No saved vehicles yet',
            description: 'Save a vehicle to compare it later.',
            actionLabel: 'Explore vehicles',
            onAction: () => pressed = true,
          ),
          textScale: 1.5,
        ),
      );

      expect(tester.takeException(), isNull);
      await tester.tap(find.text('Explore vehicles'));
      expect(pressed, isTrue);
    },
  );

  testWidgets('status badge combines icon and readable status text', (
    tester,
  ) async {
    await tester.pumpWidget(
      _app(const Center(child: StatusBadge(status: 'APPROVED'))),
    );
    expect(find.text('APPROVED'), findsOneWidget);
    expect(find.byIcon(Icons.check_circle_outline_rounded), findsOneWidget);
  });

  testWidgets('price text uses grouped TZS formatting', (tester) async {
    await tester.pumpWidget(
      _app(const Center(child: PriceText(amount: 125000, suffix: '/ day'))),
    );
    expect(find.text('TZS 125,000 / day'), findsOneWidget);
  });
}
