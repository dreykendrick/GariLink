import 'package:flutter/foundation.dart';

/// Release-safe boundary for a future crash reporting provider.
/// Never pass tokens, passwords, OTPs, request bodies, or phone numbers here.
abstract interface class ErrorReporter {
  void record(Object error, StackTrace stack, {required bool fatal});
}

class SafeErrorReporter implements ErrorReporter {
  const SafeErrorReporter();

  @override
  void record(Object error, StackTrace stack, {required bool fatal}) {
    // Production intentionally emits no user/provider data until a reviewed
    // crash-reporting sink is configured. Debug output supports development.
    if (kDebugMode) {
      debugPrint('${fatal ? 'FATAL' : 'ERROR'} ${error.runtimeType}');
      debugPrintStack(stackTrace: stack);
    }
  }
}
