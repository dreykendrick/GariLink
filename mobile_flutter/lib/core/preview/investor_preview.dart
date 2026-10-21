import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../errors/app_exception.dart';

const investorPreview = bool.fromEnvironment('INVESTOR_PREVIEW');

/// Device-local presentation state only. No sockets, production sessions,
/// geocoding, identity collection or payment provider is used here.
class InvestorPreviewStore {
  static final instance = InvestorPreviewStore();
  InvestorPreviewStore();
  static const workspace = '91000000-0000-4000-8000-000000000001';
  static const renter = '91000000-0000-4000-8000-000000000002';
  static const owner = '91000000-0000-4000-8000-000000000003';
  static const key = 'garilink.investor.preview.v1';
  SharedPreferences? _prefs;
  String role = 'renter';
  final List<Map<String, dynamic>> rentals = [];
  final Set<String> saved = {};

  Future<void> _load() async {
    if (_prefs != null) return;
    final preferences = await SharedPreferences.getInstance();
    if (_prefs != null) return;
    _prefs = preferences;
    final raw = preferences.getString(key);
    if (raw != null) {
      try {
        final data = jsonDecode(raw) as Map<String, dynamic>;
        role = data['role'] == 'owner' ? 'owner' : 'renter';
        rentals.addAll(
          (data['rentals'] as List).map(
            (v) => Map<String, dynamic>.from(v as Map),
          ),
        );
        saved.addAll((data['saved'] as List).cast<String>());
      } catch (_) {
        rentals.clear();
        saved.clear();
        role = 'renter';
      }
    }
  }

  Future<void> _persist() async {
    await _prefs!.setString(
      key,
      jsonEncode({'role': role, 'rentals': rentals, 'saved': saved.toList()}),
    );
  }

  Future<void> reset() async {
    await _load();
    rentals.clear();
    saved.clear();
    role = 'renter';
    await _persist();
  }

  Map<String, dynamic> get user => {
    'id': role == 'owner' ? owner : renter,
    'email': '$role@investor.example.invalid',
    'phoneNumber': '',
    'isEmailVerified': true,
    'isPhoneVerified': false,
    'roles': role == 'owner' ? ['CUSTOMER', 'PRIVATE_OWNER'] : ['CUSTOMER'],
    'capabilities': role == 'owner'
        ? [
            {'id': 'preview-list', 'type': 'LIST_VEHICLES', 'status': 'ACTIVE'},
            {
              'id': 'preview-manage',
              'type': 'MANAGE_LISTINGS',
              'status': 'ACTIVE',
            },
            {
              'id': 'preview-rental',
              'type': 'MANAGE_RENTAL_LISTINGS',
              'status': 'ACTIVE',
            },
          ]
        : [],
    'profile': {
      'id': 'preview-profile',
      'userId': role == 'owner' ? owner : renter,
      'displayName': role == 'owner' ? 'Demo Owner' : 'Demo Renter',
      'firstName': 'Demo',
      'lastName': role == 'owner' ? 'Owner' : 'Renter',
      'country': 'Tanzania',
    },
  };

  List<Map<String, dynamic>> get listings => List.generate(3, (i) {
    final model = ['Corolla', 'Prado', 'Hilux'][i];
    final photo = ['category_cars', 'category_suvs', 'category_pickups'][i];
    final id = '92000000-0000-4000-8000-00000000000${i + 1}';
    final rate = [80000, 180000, 140000][i];
    final category = ['SEDAN', 'SUV', 'PICKUP'][i];
    final image = 'asset://assets/images/home/$photo.jpg';
    return <String, dynamic>{
      'id': id,
      'vehicleId': id,
      'workspaceId': workspace,
      'title': 'Demo Toyota $model',
      'type': 'FOR_HIRE',
      'status': 'PUBLISHED',
      'currency': 'TZS',
      'county': 'Dar es Salaam',
      'askingPrice': null,
      'rentalConfig': {'dailyRate': rate},
      'price': rate,
      'description':
          'Investor demonstration vehicle. Photography is approved presentation artwork, not real available inventory. All requests are simulated locally.',
      'vehicleCategory': category,
      'operationalAvailability': 'AVAILABLE',
      'eligibility': {'discoverable': true, 'requestable': true},
      'rentalPricing': {
        'configured': true,
        'policyVersion': 1,
        'currency': 'TZS',
        'baseChargeMinor': 0,
        'minimumChargeMinor': rate,
        'durationRateMinorPerDay': rate,
        'distanceRateMinorPerKilometer': 0,
      },
      'capabilities': {
        'schemaVersion': 1,
        'passengerCapacity': i == 1 ? 7 : 5,
        'payloadCapacityKg': i == 2 ? 1000 : 200,
        'supportsWithDriver': true,
        'supportsSelfDrive': true,
        'supportsLongDistance': true,
        'coveredCargo': false,
      },
      'vehicle': {
        'id': id,
        'make': 'Toyota',
        'model': model,
        'year': 2022,
        'mileage': 24000,
        'fuelType': 'PETROL',
        'transmission': 'AUTOMATIC',
        'condition': 'USED',
        'isVerified': false,
        'features': ['Air conditioning'],
        'images': [
          {
            'media': {'id': id, 'publicUrl': image},
          },
        ],
      },
    };
  });

  Map<String, dynamic> _listing(Object? id) => listings.firstWhere(
    (v) => v['id'] == id,
    orElse: () => throw const NotFoundException('Demo vehicle not found.'),
  );

  Future<dynamic> request(
    String method,
    String path,
    dynamic body,
    Map<String, dynamic>? query,
  ) async {
    await _load();
    final data = body is Map
        ? Map<String, dynamic>.from(body)
        : <String, dynamic>{};
    if (path == '/auth/login' || path == '/auth/refresh') {
      if (path == '/auth/login')
        role = data['identifier'].toString().startsWith('owner@')
            ? 'owner'
            : 'renter';
      await _persist();
      return {
        'accessToken': 'LOCAL-PREVIEW-NOT-A-REAL-TOKEN',
        'refreshToken': 'LOCAL-PREVIEW-NOT-A-REAL-REFRESH',
        'user': user,
        'session': {'id': 'local-presentation-only'},
      };
    }
    if (path == '/auth/logout') return null;
    if (method == 'GET' && path == '/me') return user;
    if (method == 'GET' && path == '/workspaces')
      return role == 'owner'
          ? [
              {
                'id': workspace,
                'name': 'Demo GariLink Garage',
                'businessMode': 'INDIVIDUAL',
              },
            ]
          : [];
    if (method == 'GET' && path == '/listings/mine')
      return {'data': role == 'owner' ? listings : []};
    if (method == 'GET' && path == '/listings/saved')
      return {'data': listings.where((v) => saved.contains(v['id'])).toList()};
    if (path.endsWith('/save') && (method == 'POST' || method == 'DELETE')) {
      final id = path.split('/')[2];
      _listing(id);
      method == 'POST' ? saved.add(id) : saved.remove(id);
      await _persist();
      return {'saved': saved.contains(id)};
    }
    if (method == 'GET' && path == '/listings') {
      final q = query ?? {};
      final text = (q['q'] ?? '').toString().toLowerCase();
      return {
        'data': listings
            .where(
              (v) =>
                  v['title'].toString().toLowerCase().contains(text) &&
                  (q['priceMin'] == null ||
                      (v['price'] as int) >= (q['priceMin'] as num)) &&
                  (q['priceMax'] == null ||
                      (v['price'] as int) <= (q['priceMax'] as num)),
            )
            .toList(),
      };
    }
    if (method == 'GET' && path.startsWith('/listings/'))
      return _listing(path.split('/')[2]);
    if (method == 'GET' && path == '/v2/vehicles/discoverable') return listings;
    // Real suitability/routing is intentionally not simulated as a guarantee.
    if (path == '/v2/vehicles/match' || path == '/v2/vehicles/nearby') {
      throw const ValidationException(
        'Preview: use Explore without location matching. Live suitability and nearby ranking are not simulated.',
      );
    }
    if (path == '/v2/rentals/estimate' && method == 'POST') {
      throw const ValidationException(
        'Live route-based estimates are unavailable in local preview. Demo requests use the displayed daily rate only.',
      );
    }
    if (path == '/rentals' && method == 'POST') {
      if (role != 'renter')
        throw const ForbiddenException(
          'Use the Demo renter profile to request.',
        );
      final listing = _listing(data['listingId']);
      final start = DateTime.parse(data['startDate'] as String);
      final end = DateTime.parse(data['endDate'] as String);
      if (!end.isAfter(start))
        throw const ValidationException('Return must be after pickup.');
      final prior = rentals.where((v) => v['requestId'] == data['requestId']);
      if (prior.isNotEmpty) return jsonDecode(jsonEncode(prior.first));
      final now = DateTime.now().toIso8601String();
      final record = <String, dynamic>{
        ...data,
        'id':
            '93000000-0000-4000-8000-${(rentals.length + 1).toString().padLeft(12, '0')}',
        'workspaceId': workspace,
        'vehicleId': listing['vehicleId'],
        'status': 'REQUESTED',
        'dailyRate': listing['price'],
        'currency': 'TZS',
        'totalAmount': (listing['price'] as int) * end.difference(start).inDays,
        'listing': {
          ...listing,
          'vehicle': {...listing['vehicle'] as Map, 'imageUrl': null},
        },
        'customer': {
          'id': renter,
          'displayName': 'Demo Renter',
          'phoneNumber': '',
        },
        'createdAt': now,
        'updatedAt': now,
      };
      rentals.add(record);
      await _persist();
      return jsonDecode(jsonEncode(record));
    }
    if (method == 'GET' && path == '/rentals')
      return role == 'renter' ? jsonDecode(jsonEncode(rentals)) : [];
    if (path.startsWith('/owner/workspaces/$workspace/rentals')) {
      if (role != 'owner')
        throw const ForbiddenException('Use the Demo owner profile.');
      if (method == 'GET') return jsonDecode(jsonEncode(rentals));
      final parts = path.split('/');
      final id = parts.length > 5 ? parts[5] : '';
      final item = rentals.firstWhere(
        (v) => v['id'] == id,
        orElse: () => throw const NotFoundException('Demo request not found.'),
      );
      final action = parts.last;
      const allowed = {
        'approve': 'REQUESTED',
        'reject': 'REQUESTED',
        'ready': 'APPROVED',
        'start': 'READY_FOR_PICKUP',
        'complete': 'ACTIVE',
      };
      const next = {
        'approve': 'APPROVED',
        'reject': 'REJECTED',
        'ready': 'READY_FOR_PICKUP',
        'start': 'ACTIVE',
        'complete': 'COMPLETED',
      };
      if (method != 'PATCH' || allowed[action] != item['status'])
        throw const ValidationException(
          'This demo action is not available for the current status.',
        );
      item['status'] = next[action];
      item['updatedAt'] = DateTime.now().toIso8601String();
      if (action == 'reject') item['rejectionReason'] = data['reason'];
      await _persist();
      return jsonDecode(jsonEncode(item));
    }
    throw const ValidationException(
      'This action is not included in the local investor preview. No network request was sent.',
    );
  }
}
