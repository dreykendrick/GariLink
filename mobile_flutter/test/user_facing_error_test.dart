import 'package:flutter_test/flutter_test.dart';
import 'package:garilink_mobile/core/errors/app_exception.dart';

void main() {
  test('known product errors retain their useful message', () {
    expect(
      userFacingError(const NetworkException('Check your connection.')),
      'Check your connection.',
    );
  });

  test('unexpected failures never expose technical details', () {
    expect(
      userFacingError(Exception('database.internal: secret detail')),
      'Something went wrong. Please try again.',
    );
  });
}
