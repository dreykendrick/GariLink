import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:garilink_mobile/core/preview/investor_preview.dart';
import 'package:garilink_mobile/core/errors/app_exception.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => SharedPreferences.setMockInitialValues({}));

  test(
    'local profiles share the same persisted request and owner response',
    () async {
      final local = InvestorPreviewStore();
      await local.request('POST', '/auth/login', {
        'identifier': 'renter@investor.example.invalid',
      }, null);
      final listing = local.listings.first;
      final created =
          await local.request('POST', '/rentals', {
                'listingId': listing['id'],
                'requestId': 'demo-one',
                'startDate': '2026-11-01T00:00:00',
                'endDate': '2026-11-03T00:00:00',
              }, null)
              as Map;
      expect(created['status'], 'REQUESTED');
      await local.request('POST', '/auth/login', {
        'identifier': 'owner@investor.example.invalid',
      }, null);
      final inbox =
          await local.request(
                'GET',
                '/owner/workspaces/${InvestorPreviewStore.workspace}/rentals',
                null,
                null,
              )
              as List;
      expect(inbox.single['id'], created['id']);
      await local.request(
        'PATCH',
        '/owner/workspaces/${InvestorPreviewStore.workspace}/rentals/${created['id']}/approve',
        null,
        null,
      );
      final restored = InvestorPreviewStore();
      await restored.request('POST', '/auth/login', {
        'identifier': 'renter@investor.example.invalid',
      }, null);
      final trips =
          await restored.request('GET', '/rentals', null, null) as List;
      expect(trips.single['status'], 'APPROVED');
      expect(trips.single['totalAmount'], 160000);
      await restored.reset();
      expect(await restored.request('GET', '/rentals', null, null), isEmpty);
    },
  );

  test(
    'unsupported KYC, upload and live routing actions fail closed',
    () async {
      final local = InvestorPreviewStore();
      for (final path in [
        '/verification/identity/cases',
        '/media/upload-url',
        '/v2/vehicles/match',
      ]) {
        await expectLater(
          local.request('POST', path, {}, null),
          throwsA(isA<ValidationException>()),
        );
      }
    },
  );

  test(
    'sample photos are approved local assets and search remains coherent',
    () async {
      final local = InvestorPreviewStore();
      expect(
        local.listings.every(
          (v) => v['vehicle']['images'][0]['media']['publicUrl']
              .toString()
              .startsWith('asset://assets/images/home/'),
        ),
        isTrue,
      );
      final filtered =
          await local.request('GET', '/listings', null, {'q': 'Prado'}) as Map;
      expect((filtered['data'] as List).length, 1);
    },
  );
}
