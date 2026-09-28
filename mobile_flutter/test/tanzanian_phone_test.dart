import 'package:flutter_test/flutter_test.dart';
import 'package:garilink_mobile/core/errors/app_exception.dart';
import 'package:garilink_mobile/core/validation/tanzanian_phone.dart';

void main() {
  test('normalizes supported Tanzanian mobile formats', () {
    expect(normalizeTanzanianPhone('0712 345 678'), '+255712345678');
    expect(normalizeTanzanianPhone('255-712-345-678'), '+255712345678');
    expect(normalizeTanzanianPhone('+255 (712) 345 678'), '+255712345678');
  });

  test('rejects foreign, malformed, and non-mobile numbers', () {
    for (final value in ['+254712345678', '1234', '+255221234567']) {
      expect(
        () => normalizeTanzanianPhone(value),
        throwsA(isA<ValidationException>()),
      );
    }
  });
}
