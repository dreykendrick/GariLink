import '../errors/app_exception.dart';

String normalizeTanzanianPhone(String input) {
  var value = input.trim().replaceAll(RegExp(r'[\s()\-]'), '');
  if (RegExp(r'^0[67]\d{8}$').hasMatch(value)) {
    value = '+255${value.substring(1)}';
  } else if (RegExp(r'^255[67]\d{8}$').hasMatch(value)) {
    value = '+$value';
  }
  if (!RegExp(r'^\+255[67]\d{8}$').hasMatch(value)) {
    throw const ValidationException(
      'Enter a Tanzanian mobile number such as 0712 345 678.',
    );
  }
  return value;
}

String? validateTanzanianPhone(String? input) {
  if (input == null || input.trim().isEmpty) return 'Phone number is required';
  try {
    normalizeTanzanianPhone(input);
    return null;
  } on ValidationException catch (error) {
    return error.message;
  }
}
