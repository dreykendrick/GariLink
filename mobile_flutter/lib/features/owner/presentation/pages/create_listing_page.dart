import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/errors/app_exception.dart';
import '../../data/owner_draft_repository.dart';
import '../../../explore/presentation/providers/explore_provider.dart';
import '../../../vehicle/domain/models/vehicle_v2.dart';
import '../../../vehicle/domain/models/rental_pricing.dart';
import 'vehicle_media_page.dart';
import 'owner_location_editor.dart';

class CreateListingPage extends ConsumerStatefulWidget {
  const CreateListingPage({super.key, this.initialListing});
  final Map<String, dynamic>? initialListing;

  @override
  ConsumerState<CreateListingPage> createState() => _CreateListingPageState();
}

class _CreateListingPageState extends ConsumerState<CreateListingPage> {
  final _form = GlobalKey<FormState>();
  final _controllers = <String, TextEditingController>{
    for (final key in [
      'workspace',
      'make',
      'model',
      'year',
      'mileage',
      'price',
      'county',
      'description',
      'passengerCapacity',
      'payloadKg',
      'cargoLengthM',
      'cargoWidthM',
      'cargoHeightM',
      'baseChargeMinor',
      'minimumChargeMinor',
      'distanceRateMinorPerKilometer',
    ])
      key: TextEditingController(),
  };
  final _workspaceRequest = DraftRetryRequest();
  final _draftRequest = DraftRetryRequest();
  List<Map<String, dynamic>>? _workspaces;
  String? _workspaceId;
  String? _error;
  bool _loading = true;
  bool _saving = false;
  String _type = 'FOR_HIRE';
  String _vehicleType = 'CAR';
  String _fuel = 'PETROL';
  String _transmission = 'AUTOMATIC';
  String _condition = 'LOCAL_USED';
  VehicleCategory? _category;
  VehicleAvailability _availability = VehicleAvailability.unavailable;
  String _cargoBody = 'COVERED';
  bool _withDriver = false;
  bool _selfDrive = false;
  bool _longDistance = false;
  bool get _editing => widget.initialListing != null;

  @override
  void initState() {
    super.initState();
    final item = widget.initialListing;
    if (item != null) {
      _workspaceId = item['workspaceId']?.toString();
      _type = item['type']?.toString() ?? _type;
      _vehicleType = item['vehicle']?['type']?.toString() ?? _vehicleType;
      _fuel = item['fuelType']?.toString() ?? _fuel;
      _transmission = item['transmission']?.toString() ?? _transmission;
      _condition = item['condition']?.toString() ?? _condition;
      final vehicle = item['vehicle'] as Map? ?? const {};
      _category = VehicleCategory.parse(
        item['vehicleCategory'] ?? vehicle['vehicleCategory'],
      );
      _availability =
          VehicleAvailability.parse(
            item['operationalAvailability'] ??
                vehicle['operationalAvailability'],
          ) ??
          _availability;
      final capabilities = item['capabilities'] ?? vehicle['capabilities'];
      if (capabilities is Map) {
        final caps = VehicleCapabilities.fromJson(
          Map<String, dynamic>.from(capabilities),
        );
        _controllers['passengerCapacity']!.text =
            caps.passengerCapacity?.toString() ?? '';
        _controllers['payloadKg']!.text = caps.payloadKg?.toString() ?? '';
        _controllers['cargoLengthM']!.text =
            caps.cargoLengthM?.toString() ?? '';
        _controllers['cargoWidthM']!.text = caps.cargoWidthM?.toString() ?? '';
        _controllers['cargoHeightM']!.text =
            caps.cargoHeightM?.toString() ?? '';
        _cargoBody = caps.cargoBody ?? _cargoBody;
        _withDriver = caps.withDriver ?? _withDriver;
        _selfDrive = caps.selfDrive ?? _selfDrive;
        _longDistance = caps.longDistance ?? _longDistance;
      }
      final pricing = RentalPricingPolicy.fromJson(
        item['rentalPricing'] ?? vehicle['rentalPricing'],
      );
      if (pricing.configured) {
        _controllers['baseChargeMinor']!.text =
            pricing.baseChargeMinor?.toString() ?? '';
        _controllers['minimumChargeMinor']!.text =
            pricing.minimumChargeMinor?.toString() ?? '';
        _controllers['distanceRateMinorPerKilometer']!.text =
            pricing.distanceRateMinorPerKilometer?.toString() ?? '';
      }
      final values = <String, dynamic>{
        'make': item['make'],
        'model': item['model'],
        'year': item['year'],
        'mileage': item['mileage'],
        'price': item['price'],
        'county': item['county'],
        'description': item['description'],
      };
      for (final entry in values.entries) {
        _controllers[entry.key]!.text = entry.value?.toString() ?? '';
      }
    }
    _load();
  }

  @override
  void dispose() {
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final items = await ref.read(ownerDraftRepositoryProvider).workspaces();
      if (!mounted) return;
      setState(() {
        _workspaces = items;
        _workspaceId ??= items.isEmpty ? null : items.first['id'] as String;
      });
    } catch (error) {
      if (mounted) setState(() => _error = userFacingError(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _value(String key) => _controllers[key]!.text.trim();

  bool get _truck =>
      _category == VehicleCategory.smallTruck ||
      _category == VehicleCategory.mediumTruck ||
      _category == VehicleCategory.heavyTruck;
  bool get _cargoVehicle => _truck || _category == VehicleCategory.pickup;

  VehicleCapabilities? _capabilities() {
    if (_category == null) return null;
    final passenger = int.tryParse(_value('passengerCapacity'));
    final payload = double.tryParse(_value('payloadKg'));
    final length = double.tryParse(_value('cargoLengthM'));
    final width = double.tryParse(_value('cargoWidthM'));
    final height = double.tryParse(_value('cargoHeightM'));
    return VehicleCapabilities(
      schemaVersion: 1,
      passengerCapacity: _truck ? null : passenger,
      payloadKg: _cargoVehicle ? payload : null,
      transmission: _transmission,
      fuelType: _fuel,
      cargoBody: _cargoVehicle ? _cargoBody : null,
      cargoLengthM: _truck ? length : null,
      cargoWidthM: _truck ? width : null,
      cargoHeightM: _truck ? height : null,
      withDriver: _withDriver,
      selfDrive: _selfDrive,
      longDistance: _longDistance,
    );
  }

  Future<void> _save() async {
    if (_saving || !_form.currentState!.validate()) return;
    if (_category == null) {
      setState(() => _error = 'Choose a vehicle category before saving.');
      return;
    }
    FocusScope.of(context).unfocus();
    final confirmed = await _confirmReview();
    if (!confirmed || !mounted) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    final repo = ref.read(ownerDraftRepositoryProvider);
    try {
      if (_workspaceId == null) {
        final workspace = await repo.createWorkspace(
          _workspaceRequest.prepare({
            'name': _value('workspace'),
            'type': 'PERSONAL',
          }),
        );
        if (!mounted) return;
        _workspaceId = workspace['id'] as String;
        _workspaces = [workspace];
      }
      final details = <String, dynamic>{
        'workspaceId': _workspaceId,
        'type': 'FOR_HIRE',
        'title': '${_value('year')} ${_value('make')} ${_value('model')}',
        'description': _value('description'),
        'county': _value('county'),
        'price': num.parse(_value('price')),
        'vehicle': {
          'make': _value('make'),
          'model': _value('model'),
          'year': int.parse(_value('year')),
          'mileage': int.parse(_value('mileage')),
          'type': _vehicleType,
          'fuelType': _fuel,
          'transmission': _transmission,
          'condition': _condition,
        },
      };
      final capabilities = _capabilities()!;
      final draft = _editing
          ? await repo.updateListing(
              widget.initialListing!['id'].toString(),
              Map<String, dynamic>.from(details)..remove('workspaceId'),
            )
          : await repo.createV2VehicleDraft(
              _draftRequest.prepare({
                ...details,
                'vehicleCategory': _category!.wireValue,
                'operationalAvailability': _availability.wireValue,
                'capabilities': capabilities.toJson(),
              }),
            );
      if (_editing) {
        final vehicleId =
            draft['vehicleId']?.toString() ??
            (widget.initialListing!['vehicleId']?.toString() ?? '');
        if (vehicleId.isNotEmpty) {
          await repo.updateV2Vehicle(vehicleId, {
            'vehicleCategory': _category!.wireValue,
            'operationalAvailability': _availability.wireValue,
            'capabilities': capabilities.toJson(),
          });
        }
      }
      final vehicle = draft['vehicle'] as Map?;
      final vehicleId =
          draft['vehicleId']?.toString() ??
          vehicle?['id']?.toString() ??
          widget.initialListing?['vehicleId']?.toString() ??
          widget.initialListing?['vehicle']?['id']?.toString() ??
          '';
      if (vehicleId.isNotEmpty) {
        int? optionalAmount(String key) {
          final value = _value(key);
          return value.isEmpty ? null : int.parse(value);
        }

        await repo.updateVehicleRentalPricing(
          vehicleId,
          RentalPricingPolicy(
            configured: true,
            policyVersion: 1,
            currency: 'TZS',
            baseChargeMinor: optionalAmount('baseChargeMinor'),
            minimumChargeMinor: optionalAmount('minimumChargeMinor'),
            durationRateMinorPerDay: int.parse(_value('price')),
            distanceRateMinorPerKilometer: optionalAmount(
              'distanceRateMinorPerKilometer',
            ),
          ).toUpdateJson(),
        );
      }
      if (!mounted) return;
      if (!_editing && vehicleId.isNotEmpty) {
        await Navigator.of(context).push<void>(
          MaterialPageRoute(
            builder: (_) => VehicleMediaPage(vehicleId: vehicleId),
          ),
        );
      }
      if (!mounted) return;
      ref.invalidate(myListingsProvider);
      Navigator.of(context).pop(true);
    } catch (error) {
      if (mounted) {
        setState(
          () => _error =
              '$error\nYour details are still here. Retry unchanged details safely. If you leave or edit them after a timeout, check My listings first.',
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<bool> _confirmReview() async {
    return await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: Text(_editing ? 'Review your changes' : 'Review your draft'),
            content: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${_value('year')} ${_value('make')} ${_value('model')}',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${_type == 'FOR_HIRE' ? 'For hire' : 'For sale'} • ${_value('county')}',
                  ),
                  Text(
                    'TZS ${_value('price')}${_type == 'FOR_HIRE' ? ' / day' : ''}',
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${_value('mileage')} km • ${_fuel.toLowerCase()} • ${_transmission.replaceAll('_', ' ').toLowerCase()}',
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _editing
                        ? 'Save these changes?'
                        : 'This remains private until you add a photo and publish it.',
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Keep editing'),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(context, true),
                child: Text(_editing ? 'Save changes' : 'Save draft'),
              ),
            ],
          ),
        ) ??
        false;
  }

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: !_saving,
    child: Scaffold(
      appBar: AppBar(title: Text(_editing ? 'Edit listing' : 'Add a vehicle')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _workspaces == null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.cloud_off_outlined, size: 40),
                    const SizedBox(height: 16),
                    Text(_error ?? 'Workspaces could not be loaded.'),
                    TextButton(
                      onPressed: _load,
                      child: const Text('Try again'),
                    ),
                  ],
                ),
              ),
            )
          : Form(
              key: _form,
              child: AbsorbPointer(
                absorbing: _saving,
                child: ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    Text(
                      _editing
                          ? 'Configure vehicle for rental'
                          : '1. Vehicle identity',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Create a rental vehicle draft, then add photos and publish when it is ready. Payments are arranged outside GariLink.',
                    ),
                    const SizedBox(height: 24),
                    if (!_editing)
                      Text(
                        '2. Rental configuration',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    if (!_editing) const SizedBox(height: 16),
                    if (_workspaceId == null)
                      _text(
                        'workspace',
                        'Your personal workspace name',
                        max: 100,
                      )
                    else
                      DropdownButtonFormField<String>(
                        initialValue: _workspaceId,
                        isExpanded: true,
                        decoration: const InputDecoration(
                          labelText: 'Workspace',
                        ),
                        items: _workspaces!
                            .map(
                              (w) => DropdownMenuItem(
                                value: w['id'] as String,
                                child: Text(
                                  w['name'] as String,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            )
                            .toList(),
                        onChanged: _saving || _editing
                            ? null
                            : (v) => setState(() => _workspaceId = v),
                      ),
                    const SizedBox(height: 16),
                    const Padding(
                      padding: EdgeInsets.only(bottom: 16),
                      child: Text('Rental publication • For hire'),
                    ),
                    _select('Vehicle type', _vehicleType, const {
                      'CAR': 'Car',
                      'TRUCK': 'Truck',
                      'BUS': 'Bus',
                      'MOTORCYCLE': 'Motorcycle',
                      'TRAILER': 'Trailer',
                      'OTHER': 'Other',
                    }, (v) => _vehicleType = v),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: DropdownButtonFormField<VehicleCategory>(
                        initialValue: _category,
                        isExpanded: true,
                        decoration: const InputDecoration(
                          labelText: 'Vehicle category',
                        ),
                        items: VehicleCategory.values
                            .map(
                              (category) => DropdownMenuItem(
                                value: category,
                                child: Text(category.label),
                              ),
                            )
                            .toList(),
                        onChanged: _saving
                            ? null
                            : (value) => setState(() => _category = value),
                        validator: (value) =>
                            value == null ? 'Choose a vehicle category.' : null,
                      ),
                    ),
                    _text('make', 'Make', max: 60),
                    _text('model', 'Model', max: 60),
                    _text(
                      'year',
                      'Year',
                      max: 4,
                      number: true,
                      validate: (s) {
                        final year = int.tryParse(s);
                        return year == null ||
                                year < 1900 ||
                                year > DateTime.now().year + 1
                            ? 'Enter a valid model year.'
                            : null;
                      },
                    ),
                    _text('mileage', 'Mileage (km)', max: 7, number: true),
                    _select('Condition', _condition, const {
                      'NEW': 'New',
                      'FOREIGN_USED': 'Foreign used',
                      'LOCAL_USED': 'Local used',
                      'SALVAGE': 'Salvage',
                    }, (v) => _condition = v),
                    _select('Fuel', _fuel, const {
                      'PETROL': 'Petrol',
                      'DIESEL': 'Diesel',
                      'ELECTRIC': 'Electric',
                      'HYBRID': 'Hybrid',
                      'LPG': 'LPG',
                      'CNG': 'CNG',
                      'OTHER': 'Other',
                    }, (v) => _fuel = v),
                    _select('Transmission', _transmission, const {
                      'AUTOMATIC': 'Automatic',
                      'MANUAL': 'Manual',
                      'CVT': 'CVT',
                      'SEMI_AUTO': 'Semi-automatic',
                      'OTHER': 'Other',
                    }, (v) => _transmission = v),
                    if (_category != null) ...[
                      Text(
                        'Capabilities',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _truck
                            ? 'Configure the cargo capacity for this truck.'
                            : _cargoVehicle
                            ? 'Configure passenger and cargo capacity for this pickup.'
                            : 'Configure passenger capacity for this vehicle.',
                      ),
                      const SizedBox(height: 12),
                      if (!_truck)
                        _text(
                          'passengerCapacity',
                          'Passenger capacity',
                          max: 3,
                          number: true,
                          validate: _positiveNumber,
                        ),
                      if (_cargoVehicle) ...[
                        _text(
                          'payloadKg',
                          'Payload (kg)',
                          max: 8,
                          decimal: true,
                          validate: _nonNegativeNumber,
                        ),
                        _select('Cargo body', _cargoBody, const {
                          'COVERED': 'Covered',
                          'OPEN': 'Open',
                          'BOX': 'Box',
                        }, (v) => _cargoBody = v),
                      ],
                      if (_truck) ...[
                        _text(
                          'cargoLengthM',
                          'Cargo length (m)',
                          max: 6,
                          decimal: true,
                          required: false,
                          validate: _nonNegativeNumber,
                        ),
                        _text(
                          'cargoWidthM',
                          'Cargo width (m)',
                          max: 6,
                          decimal: true,
                          required: false,
                          validate: _nonNegativeNumber,
                        ),
                        _text(
                          'cargoHeightM',
                          'Cargo height (m)',
                          max: 6,
                          decimal: true,
                          required: false,
                          validate: _nonNegativeNumber,
                        ),
                      ],
                      SwitchListTile.adaptive(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Driver available'),
                        subtitle: const Text(
                          'Renter can request this vehicle with a driver.',
                        ),
                        value: _withDriver,
                        onChanged: _saving
                            ? null
                            : (value) => setState(() => _withDriver = value),
                      ),
                      SwitchListTile.adaptive(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Self-drive available'),
                        subtitle: const Text(
                          'Renter can operate this vehicle themselves.',
                        ),
                        value: _selfDrive,
                        onChanged: _saving
                            ? null
                            : (value) => setState(() => _selfDrive = value),
                      ),
                      SwitchListTile.adaptive(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Long-distance capable'),
                        subtitle: const Text(
                          'Configured for longer intercity trips.',
                        ),
                        value: _longDistance,
                        onChanged: _saving
                            ? null
                            : (value) => setState(() => _longDistance = value),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: DropdownButtonFormField<VehicleAvailability>(
                          initialValue: _availability,
                          decoration: const InputDecoration(
                            labelText: 'Availability',
                          ),
                          items: VehicleAvailability.values
                              .map(
                                (availability) => DropdownMenuItem(
                                  value: availability,
                                  child: Text(_availabilityLabel(availability)),
                                ),
                              )
                              .toList(),
                          onChanged: _saving
                              ? null
                              : (value) =>
                                    setState(() => _availability = value!),
                        ),
                      ),
                    ],
                    _text('county', 'City or region', max: 100),
                    if (_editing &&
                        (widget.initialListing!['vehicleId'] ??
                                widget.initialListing!['vehicle']?['id']) !=
                            null)
                      OwnerLocationEditor(
                        vehicleId:
                            (widget.initialListing!['vehicleId'] ??
                                    widget.initialListing!['vehicle']?['id'])
                                .toString(),
                      ),
                    _text(
                      'price',
                      'Daily rate (TZS)',
                      max: 10,
                      number: true,
                      validate: (s) {
                        final amount = int.tryParse(s);
                        return amount == null ||
                                amount <= 0 ||
                                amount >= 10000000000
                            ? 'Enter a price greater than zero and below 10 billion.'
                            : null;
                      },
                    ),
                    const Padding(
                      padding: EdgeInsets.only(bottom: 12),
                      child: Text(
                        'Rental pricing policy\nThe daily rate and optional components are used by GariLink for estimates. Renters still arrange actual payment with you outside GariLink. Route distance will be supplied by a later phase; nearby-search distance is never used for pricing.',
                      ),
                    ),
                    _text(
                      'baseChargeMinor',
                      'Base charge in TZS (optional)',
                      max: 12,
                      number: true,
                      required: false,
                      validate: _optionalWholeAmount,
                    ),
                    _text(
                      'minimumChargeMinor',
                      'Minimum estimated charge in TZS (optional)',
                      max: 12,
                      number: true,
                      required: false,
                      validate: (value) {
                        final error = _optionalWholeAmount(value);
                        if (error != null || value.isEmpty) return error;
                        final minimum = int.parse(value);
                        final base =
                            int.tryParse(_value('baseChargeMinor')) ?? 0;
                        return minimum < base
                            ? 'Minimum charge cannot be below the base charge.'
                            : null;
                      },
                    ),
                    _text(
                      'distanceRateMinorPerKilometer',
                      'Rate per route kilometre in TZS (optional)',
                      max: 12,
                      number: true,
                      required: false,
                      validate: _optionalWholeAmount,
                    ),
                    _text(
                      'description',
                      'Description (optional)',
                      max: 5000,
                      required: false,
                      lines: 4,
                    ),
                    if (_error != null)
                      Semantics(
                        liveRegion: true,
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: Text(
                            _error!,
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.error,
                            ),
                          ),
                        ),
                      ),
                    FilledButton.icon(
                      onPressed: _saving ? null : _save,
                      icon: _saving
                          ? const SizedBox.square(
                              dimension: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.save_outlined),
                      label: Text(
                        _saving
                            ? 'Saving…'
                            : _editing
                            ? 'Review changes'
                            : 'Save private draft',
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
    ),
  );

  Widget _select(
    String label,
    String value,
    Map<String, String> choices,
    ValueChanged<String> update,
  ) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: DropdownButtonFormField<String>(
      initialValue: value,
      isExpanded: true,
      decoration: InputDecoration(labelText: label),
      items: choices.entries
          .map(
            (entry) =>
                DropdownMenuItem(value: entry.key, child: Text(entry.value)),
          )
          .toList(),
      onChanged: _saving
          ? null
          : (v) {
              if (v != null) setState(() => update(v));
            },
    ),
  );

  Widget _text(
    String key,
    String label, {
    required int max,
    bool number = false,
    bool decimal = false,
    bool required = true,
    int lines = 1,
    String? Function(String)? validate,
  }) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: TextFormField(
      key: ValueKey('draft-$key'),
      controller: _controllers[key],
      enabled: !_saving,
      maxLength: max,
      maxLines: lines,
      decoration: InputDecoration(
        labelText: label,
        alignLabelWithHint: lines > 1,
      ),
      keyboardType: number || decimal
          ? TextInputType.numberWithOptions(decimal: decimal)
          : lines > 1
          ? TextInputType.multiline
          : TextInputType.text,
      textInputAction: lines > 1
          ? TextInputAction.newline
          : TextInputAction.next,
      inputFormatters: number
          ? [FilteringTextInputFormatter.digitsOnly]
          : decimal
          ? [FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}'))]
          : null,
      validator: (value) {
        final text = value?.trim() ?? '';
        if (required && text.isEmpty) return 'Enter $label.';
        return validate?.call(text);
      },
    ),
  );

  String? _positiveNumber(String value) {
    final parsed = num.tryParse(value);
    return parsed == null || parsed <= 0
        ? 'Enter a value greater than zero.'
        : null;
  }

  String? _nonNegativeNumber(String value) {
    if (value.isEmpty) return null;
    final parsed = num.tryParse(value);
    return parsed == null || parsed < 0
        ? 'Enter zero or a positive value.'
        : null;
  }

  String? _optionalWholeAmount(String value) {
    if (value.isEmpty) return null;
    final amount = int.tryParse(value);
    return amount == null || amount < 0 || amount > 999999999999
        ? 'Enter a whole TZS amount from 0 to 999,999,999,999.'
        : null;
  }

  String _availabilityLabel(VehicleAvailability availability) =>
      switch (availability) {
        VehicleAvailability.available => 'Available — can receive requests',
        VehicleAvailability.busy => 'Busy — not receiving new requests',
        VehicleAvailability.unavailable => 'Unavailable — temporarily paused',
        VehicleAvailability.maintenance => 'Maintenance — out of service',
      };
}
