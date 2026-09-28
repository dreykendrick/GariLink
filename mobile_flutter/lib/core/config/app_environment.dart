class AppEnvironment {
  AppEnvironment._();

  static const bool isRelease = bool.fromEnvironment('dart.vm.product');
  static const String name = String.fromEnvironment(
    'APP_ENV',
    defaultValue: isRelease ? 'production' : 'development',
  );
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue:
        'https://yvcdkmsfuakjflmuatgz.supabase.co/functions/v1/garilink-api',
  );

  static String validatedApiBaseUrl() {
    validateApiBaseUrl(apiBaseUrl, release: isRelease);
    return apiBaseUrl;
  }

  static void validateApiBaseUrl(String value, {required bool release}) {
    final uri = Uri.tryParse(value);
    final localHost =
        uri?.host == 'localhost' ||
        uri?.host == '127.0.0.1' ||
        uri?.host == '10.0.2.2';
    if (release && (uri?.scheme != 'https' || localHost)) {
      throw StateError(
        'Production API_BASE_URL must be a non-local HTTPS endpoint.',
      );
    }
  }
}
