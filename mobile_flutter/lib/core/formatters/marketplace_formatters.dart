import 'package:intl/intl.dart';

final _wholeMoney = NumberFormat.decimalPattern('en_US');
final _wholeNumber = NumberFormat.decimalPattern('en_US');

String formatMarketplacePrice(Object? value, {String currency = 'TZS'}) {
  final amount = value is num ? value : num.tryParse(value?.toString() ?? '');
  if (amount == null) return currency;
  return '$currency ${_wholeMoney.format(amount.round())}';
}

String? formatMileage(Object? value) {
  final mileage = value is num ? value : num.tryParse(value?.toString() ?? '');
  if (mileage == null || mileage < 0) return null;
  return '${_wholeNumber.format(mileage.round())} km';
}

String humanizeVehicleValue(Object? value) {
  final text = value?.toString().trim() ?? '';
  if (text.isEmpty) return '';
  return text
      .split('_')
      .where((part) => part.isNotEmpty)
      .map(
        (part) => '${part[0].toUpperCase()}${part.substring(1).toLowerCase()}',
      )
      .join(' ');
}
