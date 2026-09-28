import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:garilink_mobile/features/owner/domain/operator_workspace.dart';
import 'package:garilink_mobile/features/owner/presentation/pages/owner_dashboard_page.dart';
import 'package:garilink_mobile/features/owner/presentation/providers/operator_workspace_provider.dart';
import 'package:garilink_mobile/features/trips/presentation/providers/trips_provider.dart';

const individual = OperatorWorkspace(
  id: 'workspace-a',
  name: 'Amani Owner',
  businessMode: WorkspaceBusinessMode.individual,
);
const fleet = OperatorWorkspace(
  id: 'workspace-b',
  name: 'Safari Fleet',
  businessMode: WorkspaceBusinessMode.fleet,
);

void main() {
  test('business modes parse known and future values safely', () {
    expect(
      OperatorWorkspace.fromJson({
        'id': 'a',
        'name': 'A',
        'businessMode': 'INDIVIDUAL',
      }).businessMode,
      WorkspaceBusinessMode.individual,
    );
    expect(
      OperatorWorkspace.fromJson({
        'id': 'b',
        'name': 'B',
        'businessMode': 'FLEET',
      }).businessMode,
      WorkspaceBusinessMode.fleet,
    );
    expect(
      OperatorWorkspace.fromJson({
        'id': 'c',
        'name': 'C',
        'businessMode': 'COOPERATIVE',
      }).businessMode,
      WorkspaceBusinessMode.unknown,
    );
  });

  test('zero workspaces has no selected workspace', () async {
    final container = ProviderContainer(
      overrides: [myWorkspacesProvider.overrideWith((ref) async => [])],
    );
    addTearDown(container.dispose);
    final value = await container.read(operatorWorkspaceContextProvider.future);
    expect(value.available, isEmpty);
    expect(value.selected, isNull);
  });

  test(
    'one workspace auto-selects and multiple switch deterministically',
    () async {
      final container = ProviderContainer(
        overrides: [
          myWorkspacesProvider.overrideWith((ref) async => [individual, fleet]),
        ],
      );
      addTearDown(container.dispose);
      expect(
        (await container.read(
          operatorWorkspaceContextProvider.future,
        )).selected,
        individual,
      );
      container.read(selectedOperatorWorkspaceIdProvider.notifier).state =
          fleet.id;
      expect(
        (await container.read(
          operatorWorkspaceContextProvider.future,
        )).selected,
        fleet,
      );
      container.read(selectedOperatorWorkspaceIdProvider.notifier).state =
          'no-longer-authorized';
      expect(
        (await container.read(
          operatorWorkspaceContextProvider.future,
        )).selected,
        individual,
      );
    },
  );

  for (final width in [320.0, 390.0, 600.0]) {
    testWidgets('Owner Home remains usable at ${width.toInt()}px', (
      tester,
    ) async {
      tester.view.physicalSize = Size(width, 900);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            operatorWorkspaceContextProvider.overrideWith(
              (ref) async => const OperatorWorkspaceContext(
                available: [individual],
                selected: individual,
              ),
            ),
            workspaceListingsProvider(
              individual.id,
            ).overrideWith((ref) async => []),
            workspaceRentalsProvider(
              individual.id,
            ).overrideWith((ref) async => []),
          ],
          child: const MaterialApp(home: OwnerDashboardPage()),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Add your first vehicle'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('Owner Home supports 200 percent text', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          operatorWorkspaceContextProvider.overrideWith(
            (ref) async => const OperatorWorkspaceContext(
              available: [fleet],
              selected: fleet,
            ),
          ),
          workspaceListingsProvider(fleet.id).overrideWith((ref) async => []),
          workspaceRentalsProvider(fleet.id).overrideWith((ref) async => []),
        ],
        child: MaterialApp(
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(
              context,
            ).copyWith(textScaler: const TextScaler.linear(2)),
            child: child!,
          ),
          home: const OwnerDashboardPage(),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Fleet operator'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
