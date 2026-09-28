import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/api_client.dart';

class OwnerLocationEditor extends ConsumerStatefulWidget {
  const OwnerLocationEditor({super.key, required this.vehicleId});
  final String vehicleId;
  @override
  ConsumerState<OwnerLocationEditor> createState() =>
      _OwnerLocationEditorState();
}

class _OwnerLocationEditorState extends ConsumerState<OwnerLocationEditor> {
  final _form = GlobalKey<FormState>();
  final _fields = {
    for (final key in ['locality', 'city', 'region', 'latitude', 'longitude'])
      key: TextEditingController(),
  };
  bool _busy = true;
  String? _error;
  String? _confirmation;
  Map<String, dynamic> _stored = {};
  String get _path => '/v2/vehicles/${widget.vehicleId}/location';
  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final response = await ref
          .read(apiClientProvider)
          .get<Map<String, dynamic>>(_path);
      if (!mounted) return;
      _stored = Map<String, dynamic>.from(
        response['operationalLocation'] as Map? ?? {},
      );
      for (final entry in _fields.entries) {
        entry.value.text = _stored[entry.key]?.toString() ?? '';
      }
      setState(() {
        _busy = false;
        _error = null;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = 'Unable to load the operating area. Please retry.';
        });
      }
    }
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
      _confirmation = null;
    });
    final location = <String, dynamic>{
      ..._stored,
      'schemaVersion': 1,
      'source': 'OWNER_CONFIGURED',
    };
    for (final entry in _fields.entries) {
      location.remove(entry.key);
      final value = entry.value.text.trim();
      if (value.isNotEmpty) {
        location[entry.key] = ['latitude', 'longitude'].contains(entry.key)
            ? double.parse(value)
            : value;
      }
    }
    try {
      await ref
          .read(apiClientProvider)
          .patch<Map<String, dynamic>>(_path, data: location);
      await _load();
      if (mounted && _error == null) {
        setState(() {
          _confirmation = 'Operating area saved and reloaded.';
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error =
              'Location was not confirmed saved. Your entries are retained; please retry.';
        });
      }
    }
  }

  @override
  void dispose() {
    for (final c in _fields.values) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Form(
    key: _form,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Operating area', style: Theme.of(context).textTheme.titleLarge),
        const Text(
          'Your operating area may be shown publicly. Exact vehicle location remains private.',
        ),
        for (final name in ['locality', 'city', 'region'])
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: TextFormField(
              controller: _fields[name],
              enabled: !_busy,
              maxLength: 100,
              decoration: InputDecoration(
                labelText: {
                  'locality': 'Public locality',
                  'city': 'City',
                  'region': 'Region',
                }[name],
              ),
            ),
          ),
        ExpansionTile(
          title: const Text('Private vehicle position'),
          children: [
            for (final name in ['latitude', 'longitude'])
              TextFormField(
                controller: _fields[name],
                enabled: !_busy,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                  signed: true,
                ),
                decoration: InputDecoration(
                  labelText: name == 'latitude' ? 'Latitude' : 'Longitude',
                ),
                validator: (value) {
                  final text = value!.trim();
                  final other =
                      _fields[name == 'latitude' ? 'longitude' : 'latitude']!
                          .text
                          .trim();
                  if (text.isEmpty) {
                    return other.isEmpty ? null : 'Provide both coordinates';
                  }
                  final number = double.tryParse(text);
                  final limit = name == 'latitude' ? 90 : 180;
                  return number == null ||
                          !number.isFinite ||
                          number.abs() > limit
                      ? 'Enter a valid coordinate'
                      : null;
                },
              ),
          ],
        ),
        if (_error != null) Text(_error!),
        if (_confirmation != null) Text(_confirmation!),
        Wrap(
          spacing: 12,
          children: [
            FilledButton(
              onPressed: _busy ? null : _save,
              child: Text(_busy ? 'Please wait…' : 'Save operating area'),
            ),
            TextButton(
              onPressed: _busy ? null : _load,
              child: const Text('Reload'),
            ),
          ],
        ),
      ],
    ),
  );
}
