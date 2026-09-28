import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:garilink_mobile/core/services/api_client.dart';
import 'package:garilink_mobile/features/explore/data/repositories/matched_discovery_repository.dart';
import 'package:garilink_mobile/features/explore/presentation/pages/explore_page.dart';
import 'package:garilink_mobile/features/location/domain/models/gari_location.dart';
import 'package:garilink_mobile/features/trips/domain/models/transport_need.dart';

class TestApi implements ApiClient {
  final requests = <Map<String, dynamic>>[];
  final nearbyRequests = <Map<String, dynamic>>[];
  List<Map<String, dynamic>> rows = [];
  bool nearby = false;
  bool fail = false;
  Completer<void>? pending;
  @override
  Future<T> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    expect(path, '/v2/vehicles/match');
    requests.add(Map<String, dynamic>.from(data as Map));
    if (pending != null) await pending!.future;
    if (fail) throw StateError('SQLSTATE must never reach the screen');
    return {'data': rows, 'radiusMeters': data['radiusMeters']} as T;
  }

  @override
  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    expect(path, '/v2/vehicles/nearby');
    nearbyRequests.add(queryParameters!);
    return {
          'data': nearby
              ? [
                  {'id': 'candidate'},
                ]
              : [],
        }
        as T;
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

Map<String, dynamic> vehicle({String status = 'SUITABLE', bool busy = false}) =>
    {
      'id': 'listing',
      'vehicle': {
        'make': 'Toyota',
        'model': 'Fortuner',
        'capabilities': {'passenger_capacity': 7},
        'rentalPricing': {
          'configured': true,
          'currency': 'TZS',
          'durationRateMinorPerDay': 80000,
        },
      },
      'distanceMeters': 2200,
      'publicLocality': 'Mikocheni',
      'vehicleCategory': 'SUV',
      'operationalAvailability': busy ? 'BUSY' : 'AVAILABLE',
      'eligibility': {'requestable': !busy},
      'suitability': {
        'matchingVersion': 1,
        'status': status,
        'reasons': ['PASSENGER_CAPACITY_OK', 'FUTURE_REASON'],
      },
    };

void main() {
  const origin = SearchLocation(
    location: GariLocation(
      latitude: -6.8,
      longitude: 39.2,
      city: 'Dar es Salaam',
    ),
  );
  const need = TransportNeed(
    purpose: TransportPurpose.familyOrGroup,
    passengerCount: 6,
  );
  Future<void> render(WidgetTester tester, TestApi api) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          matchedDiscoveryRepositoryProvider.overrideWithValue(
            MatchedDiscoveryRepository(api),
          ),
        ],
        child: const MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: NearbyDiscoveryPanel(
                initialSearchLocation: origin,
                initialTransportNeed: need,
              ),
            ),
          ),
        ),
      ),
    );
    await tester.pump();
  }

  testWidgets(
    'loading then suitable results show readable reasons and AVAILABLE authority',
    (tester) async {
      final api = TestApi()
        ..rows = [vehicle()]
        ..pending = Completer<void>();
      await render(tester, api);
      expect(find.byType(LinearProgressIndicator), findsOneWidget);
      api.pending!.complete();
      await tester.pumpAndSettle();
      expect(find.text('Toyota Fortuner'), findsOneWidget);
      expect(find.text('Requestable'), findsOneWidget);
      expect(find.text('Seats 7 passengers'), findsOneWidget);
      expect(find.text('2.2 km away'), findsOneWidget);
      expect(find.text('TZS 80,000 daily component'), findsOneWidget);
      expect(find.textContaining('Family or group travel'), findsOneWidget);
      expect(find.textContaining('Searching near'), findsOneWidget);
      expect(find.textContaining('PASSENGER_CAPACITY_OK'), findsNothing);
      expect(find.textContaining('FUTURE_REASON'), findsNothing);
      expect(find.textContaining('92%'), findsNothing);
      expect(find.textContaining('-6.8'), findsNothing);
      expect(api.nearbyRequests, isEmpty);
    },
  );
  testWidgets('BUSY suitable result is explicitly not requestable', (
    tester,
  ) async {
    final api = TestApi()..rows = [vehicle(busy: true)];
    await render(tester, api);
    await tester.pumpAndSettle();
    expect(find.text('Busy'), findsOneWidget);
    expect(find.text('Requestable'), findsNothing);
  });
  testWidgets('empty match checks geography and shows true no-nearby state', (
    tester,
  ) async {
    final api = TestApi();
    await render(tester, api);
    await tester.pumpAndSettle();
    expect(find.text('No vehicles within 10 km.'), findsOneWidget);
    expect(
      find.text('No nearby vehicles match all your requirements.'),
      findsNothing,
    );
    expect(api.nearbyRequests.single, {
      'lat': -6.8,
      'lng': 39.2,
      'radiusMeters': 10000,
      'limit': 1,
      'offset': 0,
    });
  });
  testWidgets(
    'nearby but no suitable is distinct and expansion preserves all intent',
    (tester) async {
      final api = TestApi()..nearby = true;
      await render(tester, api);
      await tester.pumpAndSettle();
      expect(
        find.text('No nearby vehicles match all your requirements.'),
        findsOneWidget,
      );
      final first = Map<String, dynamic>.from(api.requests.single);
      api.rows = [vehicle()];
      await tester.tap(find.text('Search within 25 km'));
      await tester.pumpAndSettle();
      expect(api.requests.last, {...first, 'radiusMeters': 25000});
      expect(find.text('Toyota Fortuner'), findsOneWidget);
      expect(
        find.text('No nearby vehicles match all your requirements.'),
        findsNothing,
      );
    },
  );
  testWidgets('CANNOT_VERIFY never appears as a confirmed suitable result', (
    tester,
  ) async {
    final api = TestApi()
      ..nearby = true
      ..rows = [vehicle(status: 'CANNOT_VERIFY')];
    await render(tester, api);
    await tester.pumpAndSettle();
    expect(find.text('Toyota Fortuner'), findsNothing);
    expect(
      find.text('No nearby vehicles match all your requirements.'),
      findsOneWidget,
    );
  });
  testWidgets(
    'failure retry preserves expanded radius, need, and search location',
    (tester) async {
      final api = TestApi()..nearby = true;
      await render(tester, api);
      await tester.pumpAndSettle();
      api.fail = true;
      await tester.tap(find.text('Search within 25 km'));
      await tester.pumpAndSettle();
      expect(find.textContaining('SQLSTATE'), findsNothing);
      final failed = Map<String, dynamic>.from(api.requests.last);
      api.fail = false;
      api.rows = [vehicle()];
      await tester.tap(
        find.text('Matching vehicles could not be loaded. Try again.'),
      );
      await tester.pumpAndSettle();
      expect(api.requests.last, failed);
      expect(api.requests.last['radiusMeters'], 25000);
      expect(api.requests.last['transportNeed'], need.toJson());
      expect(api.requests.last['searchLocation'], {
        'latitude': -6.8,
        'longitude': 39.2,
      });
      expect(find.text('Toyota Fortuner'), findsOneWidget);
    },
  );
}
