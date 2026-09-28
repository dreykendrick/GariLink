import 'dart:async';
import 'package:geolocator/geolocator.dart';
import '../domain/models/gari_location.dart';

sealed class DeviceLocationResult {
  const DeviceLocationResult();
}

class DeviceLocationSuccess extends DeviceLocationResult {
  const DeviceLocationSuccess(this.location);
  final GariLocation location;
}

class DeviceLocationUnavailable extends DeviceLocationResult {
  const DeviceLocationUnavailable(this.message);
  final String message;
}

class DeviceLocationService {
  const DeviceLocationService();
  Future<DeviceLocationResult> currentLocation() async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      return const DeviceLocationUnavailable(
        'Turn on location services or choose your area manually.',
      );
    }
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied) {
      return const DeviceLocationUnavailable(
        'Location permission was denied. You can choose your area manually.',
      );
    }
    if (permission == LocationPermission.deniedForever) {
      return const DeviceLocationUnavailable(
        'Location permission is disabled in Settings. You can choose your area manually.',
      );
    }
    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 12),
        ),
      );
      return DeviceLocationSuccess(
        GariLocation(
          latitude: position.latitude,
          longitude: position.longitude,
          accuracyMeters: position.accuracy,
          source: LocationSource.device,
          capturedAt: position.timestamp,
        ),
      );
    } on TimeoutException {
      return const DeviceLocationUnavailable(
        'Location took too long. You can choose your area manually.',
      );
    } catch (_) {
      return const DeviceLocationUnavailable(
        'Your location is unavailable. You can choose your area manually.',
      );
    }
  }
}
