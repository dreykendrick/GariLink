import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:garilink_mobile/core/errors/app_exception.dart';
import 'package:garilink_mobile/features/owner/domain/operator_workspace.dart';
import 'package:garilink_mobile/features/owner/presentation/models/owner_rental_status_presentation.dart';
import 'package:garilink_mobile/features/owner/presentation/pages/incoming_requests_page.dart';
import 'package:garilink_mobile/features/owner/presentation/providers/operator_workspace_provider.dart';
import 'package:garilink_mobile/features/trips/domain/models/rental_summary.dart';
import 'package:garilink_mobile/features/trips/presentation/pages/rental_details_page.dart';
import 'package:garilink_mobile/features/trips/presentation/providers/trips_provider.dart';
import 'package:garilink_mobile/features/vehicle/domain/models/rental_pricing.dart';

void main() {
  const expected = {
    'REQUESTED': OwnerRentalQueueGroup.needsAttention,
    'UNDER_REVIEW': OwnerRentalQueueGroup.needsAttention,
    'APPROVED': OwnerRentalQueueGroup.upcoming,
    'READY_FOR_PICKUP': OwnerRentalQueueGroup.upcoming,
    'ACTIVE': OwnerRentalQueueGroup.active,
    'COMPLETED': OwnerRentalQueueGroup.history,
    'REJECTED': OwnerRentalQueueGroup.history,
    'CANCELLED': OwnerRentalQueueGroup.history,
  };

  test('all lifecycle states have owner-specific presentation', () {
    for (final entry in expected.entries) {
      final presentation = ownerRentalStatusPresentation(entry.key);
      expect(presentation.group, entry.value);
      expect(presentation.label, isNot(entry.key));
      expect(presentation.explanation, isNotEmpty);
      expect(presentation.nextStep, isNotEmpty);
      expect(presentation.title, isNot(contains('Waiting for the owner')));
    }
  });

  test('only authoritative non-terminal states expose next actions', () {
    expect(
      ownerRentalStatusPresentation('REQUESTED').primaryAction,
      OwnerRentalAction.accept,
    );
    expect(
      ownerRentalStatusPresentation('APPROVED').primaryAction,
      OwnerRentalAction.markReady,
    );
    expect(
      ownerRentalStatusPresentation('READY_FOR_PICKUP').primaryAction,
      OwnerRentalAction.start,
    );
    expect(
      ownerRentalStatusPresentation('ACTIVE').primaryAction,
      OwnerRentalAction.complete,
    );
    for (final status in ['COMPLETED', 'REJECTED', 'CANCELLED']) {
      expect(ownerRentalStatusPresentation(status).primaryAction, isNull);
      expect(ownerRentalStatusPresentation(status).isTerminal, isTrue);
    }
  });

  test('request groups use deterministic operational ordering', () {
    final older = _sample(
      id: 'older',
      createdAt: DateTime(2029, 12, 1),
      startDate: DateTime(2030, 2, 1),
    );
    final newer = _sample(
      id: 'newer',
      createdAt: DateTime(2029, 12, 2),
      startDate: DateTime(2030, 1, 20),
    );
    expect(
      orderOwnerRentals([
        older,
        newer,
      ], OwnerRentalQueueGroup.needsAttention).map((rental) => rental.id),
      ['newer', 'older'],
    );
    expect(
      orderOwnerRentals([
        older,
        newer,
      ], OwnerRentalQueueGroup.upcoming).map((rental) => rental.id),
      ['newer', 'older'],
    );
  });

  test('known conflict has owner-safe recovery copy', () {
    final message = ownerRentalActionError(
      const ConflictException('This item has changed.'),
    );
    expect(message, contains('overlapping accepted rental'));
    expect(message, contains('Refresh'));
    expect(message, isNot(contains('SQL')));
  });

  test(
    'late Workspace A response cannot replace Workspace B rentals',
    () async {
      final a = Completer<List<RentalSummary>>();
      final b = Completer<List<RentalSummary>>();
      const workspaceA = OperatorWorkspace(
        id: 'workspace-a',
        name: 'A',
        businessMode: WorkspaceBusinessMode.individual,
      );
      const workspaceB = OperatorWorkspace(
        id: 'workspace-b',
        name: 'B',
        businessMode: WorkspaceBusinessMode.fleet,
      );
      final container = ProviderContainer(
        overrides: [
          myWorkspacesProvider.overrideWith(
            (ref) async => const [workspaceA, workspaceB],
          ),
          workspaceRentalsProvider(
            'workspace-a',
          ).overrideWith((ref) => a.future),
          workspaceRentalsProvider(
            'workspace-b',
          ).overrideWith((ref) => b.future),
        ],
      );
      addTearDown(container.dispose);

      final lateA = container.read(
        workspaceRentalsProvider('workspace-a').future,
      );
      container.read(selectedOperatorWorkspaceIdProvider.notifier).state =
          'workspace-b';
      final selected = await container.read(
        operatorWorkspaceContextProvider.future,
      );
      expect(selected.selectedId, 'workspace-b');

      final rentalB = _sample(id: 'rental-b');
      b.complete([rentalB]);
      expect(
        (await container.read(
          workspaceRentalsProvider('workspace-b').future,
        )).single.id,
        'rental-b',
      );

      a.complete([_sample(id: 'rental-a')]);
      expect((await lateA).single.id, 'rental-a');
      expect(
        container
            .read(workspaceRentalsProvider('workspace-b'))
            .valueOrNull
            ?.single
            .id,
        'rental-b',
      );
    },
  );

  testWidgets('owner detail uses operator language and historical estimate', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: RentalDetailsPage(
          rental: _sample(),
          ownerView: true,
          onApprove: () {},
          onReject: () {},
        ),
      ),
    );

    expect(find.text('New request'), findsOneWidget);
    expect(find.text('Waiting for the owner'), findsNothing);
    expect(find.text('Accept request'), findsOneWidget);
    expect(find.text('Decline'), findsOneWidget);
    await tester.scrollUntilVisible(find.textContaining('TZS 240,000'), 250);
    expect(find.textContaining('TZS 240,000'), findsWidgets);
  });

  testWidgets('owner detail stays usable at narrow width and large text', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(
      MediaQuery(
        data: const MediaQueryData(textScaler: TextScaler.linear(1.5)),
        child: MaterialApp(
          home: RentalDetailsPage(
            rental: _sample(status: 'APPROVED'),
            ownerView: true,
            primaryAction: (label: 'Mark ready for pickup', run: () {}),
          ),
        ),
      ),
    );
    expect(tester.takeException(), isNull);
    expect(find.text('Accepted'), findsOneWidget);
    expect(find.text('Mark ready for pickup'), findsOneWidget);
  });

  testWidgets('terminal owner state has no lifecycle control', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: RentalDetailsPage(
          rental: _sample(status: 'CANCELLED'),
          ownerView: true,
        ),
      ),
    );
    expect(find.text('Cancelled'), findsWidgets);
    expect(find.byType(FilledButton), findsNothing);
  });

  testWidgets('workspace change makes an open owner detail non-actionable', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: RentalDetailsPage(
          rental: _sample(),
          ownerView: true,
          ownerWorkspaceActive: false,
        ),
      ),
    );
    expect(find.text('Workspace changed'), findsOneWidget);
    expect(find.text('Accept request'), findsNothing);
    expect(find.text('Decline'), findsNothing);
  });

  for (final width in [320.0, 390.0, 600.0]) {
    testWidgets('request inbox is stable at ${width.toInt()}px', (
      tester,
    ) async {
      tester.view.physicalSize = Size(width, 900);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      await tester.pumpWidget(_inbox(rentals: const []));
      await tester.pumpAndSettle();
      expect(find.text('Needs attention'), findsOneWidget);
      expect(find.text('No requests need attention'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('request inbox supports 200 percent text', (tester) async {
    await tester.pumpWidget(
      MediaQuery(
        data: const MediaQueryData(textScaler: TextScaler.linear(2)),
        child: _inbox(rentals: const []),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('No requests need attention'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('request inbox shows a sanitized recoverable network state', (
    tester,
  ) async {
    await tester.pumpWidget(_inbox(error: Exception('private details')));
    await tester.pumpAndSettle();
    expect(find.text('Requests could not be loaded'), findsOneWidget);
    expect(find.text('Check your connection and try again.'), findsOneWidget);
    expect(find.textContaining('private details'), findsNothing);
    expect(find.text('Try again'), findsOneWidget);
  });
}

const _workspace = OperatorWorkspace(
  id: 'workspace',
  name: 'Evaluation Fleet',
  businessMode: WorkspaceBusinessMode.fleet,
);

Widget _inbox({List<RentalSummary>? rentals, Object? error}) => ProviderScope(
  overrides: [
    operatorWorkspaceContextProvider.overrideWith(
      (ref) async => const OperatorWorkspaceContext(
        available: [_workspace],
        selected: _workspace,
      ),
    ),
    workspaceRentalsProvider('workspace').overrideWith((ref) async {
      if (error != null) throw error;
      return rentals ?? const [];
    }),
  ],
  child: const MaterialApp(home: IncomingRequestsPage()),
);

RentalSummary _sample({
  String status = 'REQUESTED',
  String id = 'rental',
  DateTime? createdAt,
  DateTime? startDate,
}) => RentalSummary(
  id: id,
  workspaceId: 'workspace',
  listingId: 'listing',
  vehicleId: 'vehicle',
  status: status,
  startDate: startDate ?? DateTime(2030, 1, 10),
  endDate: DateTime(2030, 1, 13),
  dailyRate: 80000,
  currency: 'TZS',
  totalAmount: 240000,
  pricingEstimate: const RentalPriceEstimate(
    status: RentalEstimateStatus.estimated,
    estimateVersion: 1,
    pricingPolicyVersion: 1,
    currency: 'TZS',
    rentalDays: 3,
    finalEstimatedAmountMinor: 240000,
  ),
  title: 'Toyota Land Cruiser',
  vehicle: const RentalVehicleSummary(
    make: 'Toyota',
    model: 'Land Cruiser',
    year: 2022,
  ),
  customer: const RentalCustomerSummary(
    id: 'customer',
    displayName: 'Evaluation Customer',
    phoneNumber: '+255700000000',
  ),
  createdAt: createdAt ?? DateTime(2029, 12, 1),
  updatedAt: DateTime(2029, 12, 2),
);
