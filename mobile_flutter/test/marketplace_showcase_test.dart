import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:garilink_mobile/core/formatters/marketplace_formatters.dart';
import 'package:garilink_mobile/features/explore/domain/marketplace_query.dart';
import 'package:garilink_mobile/features/explore/presentation/pages/explore_page.dart';
import 'package:garilink_mobile/features/explore/presentation/providers/explore_provider.dart';
import 'package:garilink_mobile/features/vehicle/presentation/pages/vehicle_details_page.dart';
import 'package:garilink_mobile/shared/widgets/vehicle_card.dart';

Map<String, dynamic> listing({
  String id = 'listing-1',
  String title = 'Toyota Land Cruiser',
  String type = 'FOR_HIRE',
}) => {
  'id': id,
  'title': title,
  'type': type,
  'currency': 'TZS',
  'price': 125000,
  'year': 2022,
  'county': 'Dar es Salaam',
  'mileage': 42000,
  'primaryImageUrl': '',
  'eligibility': {'discoverable': true, 'requestable': true},
};

void main() {
  test('formats Tanzanian marketplace prices and mileage consistently', () {
    expect(formatMarketplacePrice(48500000), 'TZS 48,500,000');
    expect(formatMarketplacePrice('80000'), 'TZS 80,000');
    expect(formatMileage(12500), '12,500 km');
    expect(formatMileage(null), isNull);
  });

  test('marketplace query tracks, removes and clears real filters', () {
    const query = MarketplaceQuery(
      text: 'Toyota',
      type: 'FOR_HIRE',
      location: 'Arusha',
      minPrice: 50000,
      transmission: 'AUTOMATIC',
      sort: MarketplaceSort.priceLow,
    );
    expect(query.filterCount, 3);
    expect(query.hasFilters, isTrue);
    expect(query.copyWith(clearType: true).type, isNull);
    final cleared = query.clearFilters();
    expect(cleared.text, 'Toyota');
    expect(cleared.type, 'FOR_HIRE');
    expect(cleared.sort, MarketplaceSort.priceLow);
    expect(cleared.hasFilters, isFalse);
  });

  testWidgets('premium card handles real data and missing media', (
    tester,
  ) async {
    var tapped = false;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: VehicleCard(
            listing: listing(),
            saved: false,
            onSaved: () {},
            onTap: () => tapped = true,
          ),
        ),
      ),
    );

    expect(find.text('Toyota Land Cruiser'), findsOneWidget);
    expect(find.text('TZS 125,000 / day'), findsOneWidget);
    expect(find.text('2022  •  Dar es Salaam'), findsOneWidget);
    expect(find.byIcon(Icons.directions_car_filled_outlined), findsOneWidget);
    expect(find.byTooltip('Save vehicle'), findsOneWidget);
    await tester.tap(find.text('Toyota Land Cruiser'));
    expect(tapped, isTrue);
  });

  testWidgets('search waits for debounce and renders matching results', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          searchListingsProvider.overrideWith((ref, query) async {
            return query.text == 'Toyota' ? [listing()] : [];
          }),
          savedListingsProvider.overrideWith((ref) async => []),
          marketplaceAuthenticatedProvider.overrideWithValue(false),
        ],
        child: const MaterialApp(home: ExplorePage()),
      ),
    );
    await tester.pump();
    expect(find.text('Toyota Land Cruiser'), findsNothing);

    await tester.enterText(
      find.widgetWithText(SearchBar, 'Search make, model or location'),
      'Toyota',
    );
    await tester.pump(const Duration(milliseconds: 349));
    expect(find.text('Toyota Land Cruiser'), findsNothing);
    await tester.pump(const Duration(milliseconds: 1));
    await tester.pump();
    expect(find.text('Toyota Land Cruiser'), findsOneWidget);
    expect(find.text('1 vehicles'), findsOneWidget);
  });

  testWidgets('search failure is recoverable without exposing internals', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          searchListingsProvider.overrideWith(
            (ref, query) => throw Exception('private database detail'),
          ),
          savedListingsProvider.overrideWith((ref) async => []),
          marketplaceAuthenticatedProvider.overrideWithValue(false),
        ],
        child: const MaterialApp(home: ExplorePage()),
      ),
    );
    await tester.pump();
    await tester.pump();
    expect(find.text('Vehicles could not be loaded'), findsOneWidget);
    expect(find.textContaining('private database'), findsNothing);
    expect(find.text('Try again'), findsOneWidget);
  });

  testWidgets('rental details hide missing values and expose real rental CTA', (
    tester,
  ) async {
    final detail = {
      ...listing(),
      'images': <String>[],
      'description': '',
      'features': <String>[],
      'workspace': {
        'name': 'Kilimanjaro Motors',
        'type': 'DEALER',
        'isVerified': true,
      },
    };
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          listingDetailsProvider(
            'listing-1',
          ).overrideWith((ref) async => detail),
          savedListingsProvider.overrideWith((ref) async => []),
          marketplaceAuthenticatedProvider.overrideWithValue(false),
        ],
        child: const MaterialApp(
          home: VehicleDetailsPage(listingId: 'listing-1'),
        ),
      ),
    );
    await tester.pump();
    await tester.pump();

    expect(find.text('Toyota Land Cruiser'), findsOneWidget);
    expect(find.text('Confirm price with owner'), findsWidgets);
    expect(find.text('TZS 125,000 per day'), findsNothing);
    expect(find.text('Request this vehicle'), findsOneWidget);
    expect(find.textContaining('N/A'), findsNothing);
    await tester.scrollUntilVisible(
      find.text('Kilimanjaro Motors'),
      250,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('Kilimanjaro Motors'), findsOneWidget);
    expect(find.text('Vehicle operator'), findsOneWidget);
  });

  testWidgets('sale details do not offer a rental request', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          listingDetailsProvider(
            'listing-1',
          ).overrideWith((ref) async => listing(type: 'FOR_SALE')),
          savedListingsProvider.overrideWith((ref) async => []),
          marketplaceAuthenticatedProvider.overrideWithValue(false),
        ],
        child: const MaterialApp(
          home: VehicleDetailsPage(listingId: 'listing-1'),
        ),
      ),
    );
    await tester.pump();
    await tester.pump();
    expect(find.text('Not requestable'), findsOneWidget);
    expect(find.text('Request this vehicle'), findsNothing);
  });

  testWidgets('stale unavailable rental cannot open booking', (tester) async {
    final detail = listing();
    detail['eligibility'] = {
      'discoverable': true,
      'requestable': false,
      'operationalAvailability': 'BUSY',
    };
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          listingDetailsProvider(
            'listing-1',
          ).overrideWith((ref) async => detail),
          savedListingsProvider.overrideWith((ref) async => []),
          marketplaceAuthenticatedProvider.overrideWithValue(true),
        ],
        child: const MaterialApp(
          home: VehicleDetailsPage(listingId: 'listing-1'),
        ),
      ),
    );
    await tester.pump();
    await tester.pump();
    expect(find.text('Not requestable'), findsOneWidget);
    expect(find.text('Request this vehicle'), findsNothing);
    expect(find.textContaining('currently busy'), findsWidgets);
  });
}
