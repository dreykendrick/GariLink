import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:garilink_mobile/core/errors/app_exception.dart';
import 'package:garilink_mobile/core/services/api_client.dart';
import 'package:garilink_mobile/features/owner/data/owner_draft_repository.dart';
import 'package:garilink_mobile/features/owner/presentation/pages/create_listing_page.dart';

void main() {
  test('identical draft retries reuse a valid v4 UUID', () {
    final request = DraftRetryRequest();
    final first = request.prepare({
      'price': 50000,
      'vehicle': {'make': 'Toyota'},
    });
    final retry = request.prepare({
      'price': 50000,
      'vehicle': {'make': 'Toyota'},
    });
    expect(
      first['requestId'],
      matches(
        RegExp(
          r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
        ),
      ),
    );
    expect(retry, first);
  });
  test('edited details receive a new key without mutating the input', () {
    final request = DraftRetryRequest();
    final input = <String, dynamic>{'price': 50000};
    final first = request.prepare(input);
    input['price'] = 60000;
    final edited = request.prepare(input);
    expect(first['requestId'], isNot(edited['requestId']));
    expect(input.containsKey('requestId'), isFalse);
    expect(edited['price'], 60000);
  });
  test('independent submissions do not share request IDs', () {
    final a = DraftRetryRequest().prepare({'name': 'My vehicles'});
    final b = DraftRetryRequest().prepare({'name': 'My vehicles'});
    expect(a['requestId'], isNot(b['requestId']));
  });

  Future<void> openForm(
    WidgetTester tester,
    DraftRepositoryFake repository,
  ) async {
    tester.view.physicalSize = const Size(900, 2400);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [ownerDraftRepositoryProvider.overrideWithValue(repository)],
        child: MaterialApp(
          home: Builder(
            builder: (context) => Scaffold(
              body: TextButton(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const CreateListingPage(),
                  ),
                ),
                child: const Text('Open form'),
              ),
            ),
          ),
        ),
      ),
    );
    await tester.tap(find.text('Open form'));
    await tester.pumpAndSettle();
  }

  testWidgets('invalid draft stays local and shows validation', (tester) async {
    final repository = DraftRepositoryFake();
    await openForm(tester, repository);
    await tester.ensureVisible(find.text('Save private draft'));
    await tester.tap(find.text('Save private draft'));
    await tester.pumpAndSettle();
    expect(repository.drafts, isEmpty);
    expect(find.text('Enter Make.'), findsOneWidget);
  });

  testWidgets(
    'failed submission retains details and retries the same request',
    (tester) async {
      final repository = DraftRepositoryFake()..failDraft = true;
      await openForm(tester, repository);
      for (final field in {
        'make': 'Toyota',
        'model': 'Corolla',
        'year': '2020',
        'mileage': '45000',
        'county': 'Dar es Salaam',
        'price': '45000000',
      }.entries) {
        final finder = find.byKey(ValueKey('draft-${field.key}'));
        await tester.ensureVisible(finder);
        await tester.enterText(finder, field.value);
      }
      await tester.ensureVisible(find.text('Vehicle category'));
      await tester.tap(find.text('Vehicle category'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('SUV').last);
      await tester.pumpAndSettle();
      final passengers = find.byKey(const ValueKey('draft-passengerCapacity'));
      await tester.ensureVisible(passengers);
      await tester.enterText(passengers, '5');
      await tester.ensureVisible(find.text('Save private draft'));
      await tester.tap(find.text('Save private draft'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Save draft'));
      await tester.pumpAndSettle();
      expect(repository.drafts, hasLength(1));
      expect(
        find.textContaining('Your details are still here.'),
        findsOneWidget,
      );
      expect(find.text('Toyota'), findsOneWidget);
      repository.failDraft = false;
      await tester.ensureVisible(find.text('Save private draft'));
      await tester.tap(find.text('Save private draft'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Save draft'));
      await tester.pumpAndSettle();
      expect(repository.drafts, hasLength(2));
      expect(repository.drafts[0], repository.drafts[1]);
      expect(find.text('Open form'), findsOneWidget);
    },
  );

  testWidgets('workspace outage is not mistaken for an empty account', (
    tester,
  ) async {
    final repository = DraftRepositoryFake()..failWorkspaces = true;
    await openForm(tester, repository);
    expect(find.text('Try again'), findsOneWidget);
    expect(find.text('Save private draft'), findsNothing);
    repository.failWorkspaces = false;
    await tester.tap(find.text('Try again'));
    await tester.pumpAndSettle();
    expect(find.text('Save private draft'), findsOneWidget);
    expect(repository.drafts, isEmpty);
  });
}

class DraftRepositoryFake implements OwnerDraftRepository {
  bool failDraft = false;
  bool failWorkspaces = false;
  final drafts = <Map<String, dynamic>>[];

  @override
  ApiClient get api => throw UnimplementedError('No HTTP in widget tests');

  @override
  Future<List<Map<String, dynamic>>> workspaces() async {
    if (failWorkspaces) throw const ServerException('Connection unavailable');
    return [
      {'id': '11111111-1111-4111-8111-111111111111', 'name': 'My vehicles'},
    ];
  }

  @override
  Future<Map<String, dynamic>> createWorkspace(
    Map<String, dynamic> input,
  ) async => {
    'id': '11111111-1111-4111-8111-111111111111',
    'name': input['name'],
  };

  @override
  Future<Map<String, dynamic>> createDraft(Map<String, dynamic> input) async {
    drafts.add(input);
    if (failDraft) throw const ServerException('Connection unavailable');
    return {'id': 'listing', 'status': 'DRAFT'};
  }

  @override
  Future<Map<String, dynamic>> createV2VehicleDraft(
    Map<String, dynamic> input,
  ) async {
    drafts.add(input);
    if (failDraft) throw const ServerException('Connection unavailable');
    return {
      'id': 'listing',
      'status': 'DRAFT',
      'vehicle': {'id': ''},
    };
  }

  @override
  Future<Map<String, dynamic>> updateListing(
    String listingId,
    Map<String, dynamic> patch,
  ) async => {'id': listingId, ...patch};

  @override
  Future<Map<String, dynamic>> updateV2Vehicle(
    String vehicleId,
    Map<String, dynamic> patch,
  ) async => {'id': vehicleId, ...patch};

  @override
  Future<Map<String, dynamic>> vehicleEligibility(String vehicleId) async => {};

  @override
  Future<Map<String, dynamic>> vehicleRentalPricing(String vehicleId) async => {
    'configured': false,
  };

  @override
  Future<Map<String, dynamic>> updateVehicleRentalPricing(
    String vehicleId,
    Map<String, dynamic> policy,
  ) async => {'configured': true, ...policy};

  @override
  Future<Map<String, dynamic>> setV2Publication(
    String vehicleId,
    String action,
  ) async => {'id': vehicleId, 'action': action};
}
