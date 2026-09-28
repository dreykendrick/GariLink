import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:garilink_mobile/core/theme/theme.dart';
import 'package:garilink_mobile/features/explore/presentation/pages/explore_page.dart';
import 'package:garilink_mobile/features/explore/presentation/providers/explore_provider.dart';
import 'package:garilink_mobile/shared/widgets/status_badge.dart';
import 'package:garilink_mobile/shared/widgets/vehicle_card.dart';
import 'package:garilink_mobile/shared/widgets/vehicle_image.dart';

Map<String, dynamic> _extremeListing([int index = 0]) => {
  'id': 'vehicle-$index',
  'title': 'Mercedes-Benz GLE 450 4MATIC AMG Line Premium Plus $index',
  'type': 'FOR_HIRE',
  'currency': 'TZS',
  'price': 485000000,
  'year': 2025,
  'county': 'Mbezi Beach, Kinondoni, Dar es Salaam',
  'mileage': 286450,
  'primaryImageUrl': '',
};

Widget _surface(Widget child, Size size, {double textScale = 1}) => MaterialApp(
  theme: AppTheme.lightTheme,
  home: MediaQuery(
    data: MediaQueryData(size: size, textScaler: TextScaler.linear(textScale)),
    child: Scaffold(body: child),
  ),
);

void main() {
  for (final size in const [Size(320, 640), Size(390, 800), Size(600, 900)]) {
    testWidgets('extreme vehicle content fits ${size.width}px', (tester) async {
      await tester.binding.setSurfaceSize(size);
      addTearDown(() => tester.binding.setSurfaceSize(null));
      await tester.pumpWidget(
        _surface(
          VehicleCard(listing: _extremeListing(), onTap: () {}),
          size,
          textScale: size.width == 320 ? 1.5 : 1,
        ),
      );
      expect(tester.takeException(), isNull);
      expect(find.textContaining('TZS 485,000,000'), findsOneWidget);
    });
  }

  testWidgets('missing vehicle photography has useful image semantics', (
    tester,
  ) async {
    await tester.pumpWidget(
      _surface(
        const VehicleImage(url: '', semanticLabel: 'Photo of Toyota Prado'),
        const Size(320, 640),
      ),
    );
    expect(
      find.bySemanticsLabel('Photo of Toyota Prado unavailable'),
      findsOneWidget,
    );
  });

  testWidgets('status remains readable at 200 percent text scale', (
    tester,
  ) async {
    await tester.pumpWidget(
      _surface(
        const Center(child: StatusBadge(status: 'READY_FOR_PICKUP')),
        const Size(320, 640),
        textScale: 2,
      ),
    );
    expect(find.text('READY FOR PICKUP'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('marketplace lazily handles a 100-vehicle fixture', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 800));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final fixtures = List.generate(100, _extremeListing);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          searchListingsProvider.overrideWith((ref, query) async => fixtures),
          savedListingsProvider.overrideWith((ref) async => []),
          marketplaceAuthenticatedProvider.overrideWithValue(false),
        ],
        child: MaterialApp(
          theme: AppTheme.lightTheme,
          home: const ExplorePage(),
        ),
      ),
    );
    await tester.pump();
    await tester.pump();
    expect(find.text('100 vehicles'), findsOneWidget);
    expect(find.textContaining('Premium Plus 0'), findsOneWidget);
    expect(find.textContaining('Premium Plus 99'), findsNothing);
    expect(tester.takeException(), isNull);
  });
}
