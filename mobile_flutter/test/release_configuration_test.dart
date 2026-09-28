import 'package:flutter_test/flutter_test.dart';
import 'package:garilink_mobile/core/config/app_environment.dart';

void main() {
  test('production accepts the hosted HTTPS API', () {
    expect(
      () => AppEnvironment.validateApiBaseUrl(
        'https://project.supabase.co/functions/v1/garilink-api',
        release: true,
      ),
      returnsNormally,
    );
  });

  for (final unsafe in [
    'http://localhost:3000',
    'http://127.0.0.1:54321',
    'http://10.0.2.2:3000',
    'http://example.com/api',
  ]) {
    test('production rejects unsafe API endpoint $unsafe', () {
      expect(
        () => AppEnvironment.validateApiBaseUrl(unsafe, release: true),
        throwsStateError,
      );
    });
  }
}
