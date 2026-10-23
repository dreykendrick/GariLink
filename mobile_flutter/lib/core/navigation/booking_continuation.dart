import 'package:flutter_riverpod/flutter_riverpod.dart';

final bookingContinuationProvider = Provider((ref) => BookingContinuation());

/// Only a public listing identity is retained. No price, dates, location,
/// notes, credentials, eligibility result or account evidence survives login.
class BookingContinuation {
  BookingContinuation({DateTime Function()? clock})
    : _clock = clock ?? DateTime.now;
  final DateTime Function() _clock;
  String? _listingId;
  DateTime? _started;
  static final _id = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
  );

  bool capture(Uri destination) {
    final ids = destination.queryParametersAll['listingId'];
    if (destination.hasScheme ||
        destination.hasAuthority ||
        destination.path != '/booking' ||
        ids == null ||
        ids.length != 1 ||
        !_id.hasMatch(ids.single)) {
      clear();
      return false;
    }
    if (_listingId != ids.single || _started == null) _started = _clock();
    _listingId = ids.single;
    return true;
  }

  String? consume() {
    final id = _listingId;
    final started = _started;
    clear();
    if (id == null || started == null) return null;
    final age = _clock().difference(started);
    if (age.isNegative || age > const Duration(minutes: 10)) return null;
    return id;
  }

  void clear() {
    _listingId = null;
    _started = null;
  }
}
