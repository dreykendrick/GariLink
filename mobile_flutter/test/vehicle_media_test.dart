import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:garilink_mobile/features/owner/data/vehicle_media_repository.dart';
import 'package:garilink_mobile/features/owner/presentation/pages/vehicle_media_page.dart';
import 'package:garilink_mobile/shared/widgets/vehicle_image.dart';

void main() {
  test('validates image content signatures instead of extensions', () {
    expect(
      isSupportedVehicleImage(
        Uint8List.fromList([0xff, 0xd8, 0xff, ...List.filled(9, 0)]),
      ),
      isTrue,
    );
    expect(
      isSupportedVehicleImage(
        Uint8List.fromList([0x89, 0x50, 0x4e, 0x47, ...List.filled(8, 0)]),
      ),
      isTrue,
    );
    expect(
      isSupportedVehicleImage(Uint8List.fromList('RIFF0000WEBP'.codeUnits)),
      isTrue,
    );
    expect(
      isSupportedVehicleImage(Uint8List.fromList('not-an-image'.codeUnits)),
      isFalse,
    );
  });

  test('cover selection is deterministic and does not mutate input', () {
    final original = ['a', 'b', 'c'];
    expect(moveMediaToCover(original, 2), ['c', 'a', 'b']);
    expect(original, ['a', 'b', 'c']);
    expect(moveMediaToCover(original, 9), original);
  });

  test('centralized limits protect data usage and gallery size', () {
    expect(vehicleMediaMaxCount, 10);
    expect(vehicleMediaMaxUploadBytes, 6 * 1024 * 1024);
    expect(vehicleMediaMaxOriginalBytes, 20 * 1024 * 1024);
  });

  testWidgets('vehicle cards render an intentional fallback without a URL', (
    tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: 300,
            height: 180,
            child: VehicleImage(url: null),
          ),
        ),
      ),
    );

    expect(find.byIcon(Icons.directions_car_filled_outlined), findsOneWidget);
    expect(find.bySemanticsLabel('Vehicle photo unavailable'), findsOneWidget);
    expect(find.byType(Image), findsNothing);
  });

  testWidgets('media editor explains empty draft and centralized image limit', (
    tester,
  ) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(home: VehicleMediaPage(vehicleId: 'vehicle-id')),
      ),
    );

    expect(find.text('No photos yet'), findsOneWidget);
    expect(find.text('Drafts can be saved without photos.'), findsOneWidget);
    expect(find.text('Choose photos  ·  0/10'), findsOneWidget);
    expect(
      find.bySemanticsLabel('Add vehicle photos, 0 of 10 used'),
      findsOneWidget,
    );
  });
}
