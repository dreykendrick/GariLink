import 'package:flutter/material.dart';
import '../../../location/domain/models/gari_location.dart';

class RentalLocationForm extends StatefulWidget {
  const RentalLocationForm({super.key, this.onChanged});

  final VoidCallback? onChanged;
  @override
  State<RentalLocationForm> createState() => RentalLocationFormState();
}

class RentalLocationFormState extends State<RentalLocationForm> {
  final _form = GlobalKey<FormState>();
  final locality = TextEditingController();
  final city = TextEditingController(text: 'Dar es Salaam');
  final destinationLocality = TextEditingController();
  final destinationCity = TextEditingController(text: 'Dar es Salaam');
  GariLocation? get pickup => locality.text.trim().isEmpty
      ? null
      : GariLocation(
          locality: locality.text.trim(),
          city: city.text.trim(),
          source: LocationSource.manual,
        );
  GariLocation? get destination => destinationLocality.text.trim().isEmpty
      ? null
      : GariLocation(
          locality: destinationLocality.text.trim(),
          city: destinationCity.text.trim(),
          source: LocationSource.manual,
        );
  bool validate() => _form.currentState?.validate() ?? false;
  @override
  void dispose() {
    locality.dispose();
    city.dispose();
    destinationLocality.dispose();
    destinationCity.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Form(
    key: _form,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Pickup location', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        TextFormField(
          controller: locality,
          onChanged: (_) => widget.onChanged?.call(),
          decoration: const InputDecoration(
            labelText: 'Where should we meet?',
            hintText: 'e.g. Sinza',
            prefixIcon: Icon(Icons.location_on_outlined),
          ),
          validator: (value) =>
              value?.trim().isEmpty ?? true ? 'Enter a pickup locality' : null,
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: city,
          onChanged: (_) => widget.onChanged?.call(),
          decoration: const InputDecoration(labelText: 'City'),
        ),
        const SizedBox(height: 12),
        Text(
          'Destination (optional)',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: destinationLocality,
          onChanged: (_) => widget.onChanged?.call(),
          decoration: const InputDecoration(
            labelText: 'Where are you going?',
            prefixIcon: Icon(Icons.flag_outlined),
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: destinationCity,
          onChanged: (_) => widget.onChanged?.call(),
          decoration: const InputDecoration(labelText: 'Destination city'),
        ),
        const SizedBox(height: 8),
        const Text(
          'You can enter a locality manually; device location is optional.',
        ),
      ],
    ),
  );
}
