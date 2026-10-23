import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:garilink_mobile/core/navigation/booking_continuation.dart';
import 'package:garilink_mobile/core/navigation/app_router.dart';
import 'package:garilink_mobile/core/services/storage_service.dart';
import 'package:garilink_mobile/features/authentication/presentation/providers/auth_provider.dart';
import 'package:garilink_mobile/features/explore/presentation/providers/explore_provider.dart';
import 'package:garilink_mobile/features/vehicle/presentation/pages/vehicle_details_page.dart';
import 'email_auth_test.dart' as fixtures;
import 'package:garilink_mobile/core/errors/app_exception.dart';
import 'package:garilink_mobile/features/authentication/data/repositories/auth_repository.dart';

class FlowRepository extends fixtures.EmailRepository {
  bool fail = false;
  @override
  Future<AuthResponse> login(String identifier, String password) async {
    if (fail) throw const UnauthorizedException('Sign in failed.');
    return fixtures.emailSession;
  }
}

const id = '11111111-1111-4111-8111-111111111111';
Uri booking() => Uri(path: '/booking', queryParameters: {'listingId': id});

void main() {
  test(
    'continuation is single-use and stores only a validated listing identity',
    () {
      final state = BookingContinuation();
      expect(state.capture(booking()), isTrue);
      expect(state.consume(), id);
      expect(state.consume(), isNull);
    },
  );
  for (final destination in [
    'https://evil.example/booking?listingId=$id',
    '//evil.example/booking?listingId=$id',
    '/owner-dashboard?listingId=$id',
    '/booking',
    '/booking?listingId=bad',
    '/booking?listingId=$id&listingId=$id',
  ]) {
    test('rejects unsafe destination $destination', () {
      final state = BookingContinuation()..capture(booking());
      expect(state.capture(Uri.parse(destination)), isFalse);
      expect(state.consume(), isNull);
    });
  }
  test('repeated redirects do not extend lifetime', () {
    var now = DateTime.utc(2030);
    final state = BookingContinuation(clock: () => now);
    state.capture(booking());
    now = now.add(const Duration(minutes: 11));
    state.capture(booking());
    expect(state.consume(), isNull);
  });
  test('cancel and app restart retain no continuation', () {
    final state = BookingContinuation()..capture(booking());
    state.clear();
    expect(state.consume(), isNull);
    expect(BookingContinuation().consume(), isNull);
  });

  for (final availability in [
    'AVAILABLE',
    'BUSY',
    'DELETED',
    'NORMAL',
    'CANCELLED',
    'FAILED',
  ]) {
    testWidgets('post-login refetches $availability without opening booking', (
      tester,
    ) async {
      SharedPreferences.setMockInitialValues({});
      FlutterSecureStorage.setMockInitialValues({});
      late StorageService storage;
      late AuthNotifier auth;
      final repository = FlowRepository();
      await tester.runAsync(() async {
        storage = StorageService(
          const FlutterSecureStorage(),
          await SharedPreferences.getInstance(),
        );
        auth = AuthNotifier(repository, storage);
        await auth.hydrate();
      });
      var loads = 0;
      var fresh = false;
      final container = ProviderContainer(
        overrides: [
          authStateProvider.overrideWith((ref) => auth),
          storageServiceProvider.overrideWithValue(storage),
          savedListingsProvider.overrideWith((ref) async => []),
          listingDetailsProvider(id).overrideWith((ref) async {
            loads++;
            if (fresh && availability == 'DELETED') {
              throw Exception('private technical detail');
            }
            return <String, dynamic>{
              'id': id,
              'type': 'FOR_HIRE',
              'make': 'Toyota',
              'model': 'Prado',
              'operationalAvailability': !fresh || availability == 'FAILED'
                  ? 'AVAILABLE'
                  : availability,
              'eligibility': {
                'requestable':
                    !fresh ||
                    availability == 'AVAILABLE' ||
                    availability == 'FAILED',
              },
              'rentalPricing': {
                'configured': true,
                'currency': 'TZS',
                'durationRateMinorPerDay': fresh ? 90000 : 10000,
              },
              'images': <String>[],
            };
          }),
        ],
      );
      final router = container.read(routerProvider);
      // Keep an old public response cached while login is in progress.
      container.listen(listingDetailsProvider(id), (_, _) {});
      router.go(availability == 'NORMAL' ? '/login' : booking().toString());
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp.router(routerConfig: router),
        ),
      );
      await tester.pump(const Duration(milliseconds: 400));
      expect(router.routeInformationProvider.value.uri.path, '/login');
      fresh = true;
      if (availability == 'CANCELLED') router.go('/home');
      if (availability == 'FAILED') {
        repository.fail = true;
        await tester.runAsync(() async {
          try {
            await auth.login('team@example.com', 'bad');
          } on UnauthorizedException catch (error) {
            expect(error.message, 'Sign in failed.');
          }
        });
        await tester.pump();
        expect(router.routeInformationProvider.value.uri.path, '/login');
        repository.fail = false;
      }
      await tester.runAsync(
        () => auth.login('team@example.com', 'StrongPass123'),
      );
      await tester.pump(const Duration(milliseconds: 400));
      await tester.pump();
      if (availability == 'NORMAL' || availability == 'CANCELLED') {
        expect(router.routeInformationProvider.value.uri.path, '/home');
        expect(container.read(bookingContinuationProvider).consume(), isNull);
        await tester.pumpWidget(const SizedBox());
        container.dispose();
        return;
      }
      expect(
        router.routeInformationProvider.value.uri.path,
        '/vehicle-details',
      );
      expect(
        router.routeInformationProvider.value.uri.queryParameters['listingId'],
        id,
      );
      expect(loads, greaterThanOrEqualTo(2));
      if (availability == 'DELETED') {
        expect(find.text('Vehicle unavailable'), findsOneWidget);
        expect(find.textContaining('private technical'), findsNothing);
      } else {
        expect(
          find.textContaining('Your request has not been submitted'),
          findsOneWidget,
        );
        expect(find.byTooltip('Back to Explore'), findsOneWidget);
        if (availability == 'BUSY') {
          expect(find.text('Not requestable'), findsOneWidget);
        } else {
          expect(find.textContaining('TZS 90,000/day'), findsWidgets);
        }
      }
      expect(container.read(bookingContinuationProvider).consume(), isNull);
      await tester.pumpWidget(const SizedBox());
      container.dispose();
    });
  }
}
