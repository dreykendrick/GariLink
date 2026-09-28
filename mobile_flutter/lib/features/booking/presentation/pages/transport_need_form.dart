import 'package:flutter/material.dart';
import '../../../../core/theme/theme.dart';
import '../../../trips/domain/models/transport_need.dart';

enum TransportNeedFormVariant { standard, home }

class TransportNeedForm extends StatefulWidget {
  const TransportNeedForm({
    super.key,
    this.initialNeed,
    this.variant = TransportNeedFormVariant.standard,
  });
  final TransportNeed? initialNeed;
  final TransportNeedFormVariant variant;
  @override
  State<TransportNeedForm> createState() => TransportNeedFormState();
}

class TransportNeedFormState extends State<TransportNeedForm> {
  final _form = GlobalKey<FormState>();
  TransportPurpose? _purpose;
  final _passengers = TextEditingController();
  final _weight = TextEditingController();
  final _volume = TextEditingController();
  DriverPreference _driver = DriverPreference.any;
  bool _return = false;
  bool _covered = false;
  bool _longDistance = false;

  void _selectPurpose(TransportPurpose purpose) {
    if (_purpose == purpose) return;
    setState(() {
      _purpose = purpose;
      if (purpose.needsCargo) {
        _passengers.clear();
      } else {
        _weight.clear();
        _volume.clear();
        _covered = false;
      }
    });
  }

  @override
  void initState() {
    super.initState();
    final need = widget.initialNeed;
    _purpose = need?.purpose;
    _passengers.text = need?.passengerCount?.toString() ?? '';
    _weight.text = need?.cargo?.estimatedWeightKg?.toString() ?? '';
    _volume.text = need?.cargo?.estimatedVolumeM3?.toString() ?? '';
    _driver = need?.driverPreference ?? DriverPreference.any;
    _return = need?.returnTrip ?? false;
    _covered = need?.cargo?.requiresCoveredBody ?? false;
    _longDistance = need?.longDistance ?? false;
  }

  bool validate() => _form.currentState!.validate();
  TransportNeed? get need => _purpose == null
      ? null
      : TransportNeed(
          purpose: _purpose!,
          passengerCount: _purpose!.needsCargo
              ? null
              : int.tryParse(_passengers.text),
          cargo: _purpose!.needsCargo
              ? CargoRequirement(
                  estimatedWeightKg: num.tryParse(_weight.text),
                  estimatedVolumeM3: num.tryParse(_volume.text),
                  requiresCoveredBody: _covered,
                  cargoType: widget.initialNeed?.cargo?.cargoType,
                  fragile: widget.initialNeed?.cargo?.fragile ?? false,
                )
              : null,
          driverPreference: _driver,
          longDistance:
              _purpose == TransportPurpose.longDistance || _longDistance,
          returnTrip: _return,
          notes: widget.initialNeed?.notes,
        );
  @override
  void dispose() {
    _passengers.dispose();
    _weight.dispose();
    _volume.dispose();
    super.dispose();
  }

  Widget number(
    String label,
    TextEditingController controller, {
    bool passenger = false,
  }) => TextFormField(
    controller: controller,
    keyboardType: const TextInputType.numberWithOptions(decimal: true),
    decoration: InputDecoration(labelText: label),
    validator: (text) {
      if (text == null || text.isEmpty) return null;
      final value = num.tryParse(text);
      if (value == null ||
          !value.isFinite ||
          value < (passenger ? 1 : 0) ||
          (passenger && (value > 100 || value != value.round()))) {
        return 'Enter a valid ${passenger ? 'passenger count (1–100)' : 'non-negative amount'}';
      }
      return null;
    },
  );

  Future<void> _selectHomePurpose(_HomePurpose option) async {
    if (option.purposes.length == 1) {
      _selectPurpose(option.purposes.single);
      return;
    }
    final selected = await showModalBottomSheet<TransportPurpose>(
      context: context,
      useSafeArea: true,
      showDragHandle: true,
      builder: (context) => Padding(
        padding: const EdgeInsets.fromLTRB(
          GariLinkSpacing.xl,
          0,
          GariLinkSpacing.xl,
          GariLinkSpacing.xxl,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(option.title, style: GariLinkTypography.titleLarge),
            const SizedBox(height: GariLinkSpacing.xs),
            Text(
              'Choose the option that best describes this trip.',
              style: GariLinkTypography.bodyMedium,
            ),
            const SizedBox(height: GariLinkSpacing.md),
            ...option.purposes.map(
              (purpose) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Icon(option.icon, color: option.accent),
                title: Text(purpose.label),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () => Navigator.pop(context, purpose),
              ),
            ),
          ],
        ),
      ),
    );
    if (selected != null && mounted) _selectPurpose(selected);
  }

  Widget _homePurposeCards() => LayoutBuilder(
    builder: (context, constraints) {
      final scale = MediaQuery.textScalerOf(context).scale(1);
      final oneColumn = constraints.maxWidth < 300 || scale >= 1.5;
      final cardWidth = oneColumn
          ? constraints.maxWidth
          : (constraints.maxWidth - GariLinkSpacing.sm) / 2;
      return Wrap(
        spacing: GariLinkSpacing.sm,
        runSpacing: GariLinkSpacing.sm,
        children: _homePurposes.map((option) {
          final selected = option.purposes.contains(_purpose);
          final width = option.fullWidth ? constraints.maxWidth : cardWidth;
          final minimumHeight = option.fullWidth || oneColumn ? 80.0 : 104.0;
          return ConstrainedBox(
            constraints: BoxConstraints(
              minWidth: width,
              maxWidth: width,
              minHeight: minimumHeight,
            ),
            child: Semantics(
              button: true,
              selected: selected,
              label: '${option.title}. ${option.description}',
              child: AnimatedContainer(
                key: Key('home-purpose-surface-${option.title}'),
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeOutCubic,
                decoration: BoxDecoration(
                  color: selected
                      ? option.tint
                      : GariLinkColors.surface.withValues(alpha: 0.84),
                  borderRadius: BorderRadius.circular(GariLinkRadius.card),
                  border: Border.all(
                    color: selected
                        ? option.accent
                        : option.accent.withValues(alpha: 0.14),
                    width: selected ? 2 : 1,
                  ),
                  boxShadow: selected
                      ? [
                          BoxShadow(
                            color: option.accent.withValues(alpha: 0.13),
                            offset: const Offset(0, 5),
                            blurRadius: 14,
                          ),
                        ]
                      : const [GariLinkShadows.card],
                ),
                child: InkWell(
                  key: Key('home-purpose-${option.title}'),
                  borderRadius: BorderRadius.circular(GariLinkRadius.card),
                  onTap: () => _selectHomePurpose(option),
                  child: Padding(
                    padding: const EdgeInsets.all(GariLinkSpacing.sm),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: option.accent.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            option.icon,
                            color: option.accent,
                            size: 23,
                          ),
                        ),
                        const SizedBox(width: GariLinkSpacing.sm),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      option.displayTitle,
                                      softWrap: false,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: GariLinkTypography.cardTitle
                                          .copyWith(fontSize: 15, height: 1.15),
                                    ),
                                  ),
                                  if (selected)
                                    Icon(
                                      Icons.check_circle_rounded,
                                      color: option.accent,
                                      size: 20,
                                    ),
                                ],
                              ),
                              const SizedBox(height: GariLinkSpacing.xs),
                              Text(
                                option.description,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: GariLinkTypography.bodySmall.copyWith(
                                  fontSize: 12,
                                  height: 1.25,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      );
    },
  );

  @override
  Widget build(BuildContext context) => Form(
    key: _form,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'What do you need transport for?',
          style: GariLinkTypography.titleLarge,
        ),
        const SizedBox(height: 4),
        Text(
          'Choose one so we can find vehicles that genuinely fit.',
          style: GariLinkTypography.bodyMedium,
        ),
        const SizedBox(height: GariLinkSpacing.md),
        if (widget.variant == TransportNeedFormVariant.home)
          _homePurposeCards()
        else
          ..._purposeGroups.entries.map(
            (group) => Padding(
              padding: const EdgeInsets.only(bottom: GariLinkSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(group.key, style: GariLinkTypography.labelSmall),
                  const SizedBox(height: GariLinkSpacing.sm),
                  Wrap(
                    spacing: GariLinkSpacing.sm,
                    runSpacing: GariLinkSpacing.sm,
                    children: group.value.map((purpose) {
                      final selected = purpose == _purpose;
                      return Semantics(
                        selected: selected,
                        button: true,
                        label: purpose.label,
                        child: ChoiceChip(
                          selected: selected,
                          label: Text(purpose.label),
                          onSelected: (_) => _selectPurpose(purpose),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ),
        if (_purpose != null) ...[
          Text('Your requirements', style: GariLinkTypography.titleMedium),
          const SizedBox(height: GariLinkSpacing.sm),
          if (_purpose!.needsCargo) ...[
            number('Approx. cargo weight (kg)', _weight),
            number('Approx. cargo volume (m³)', _volume),
          ] else
            number('Passengers (optional)', _passengers, passenger: true),
          DropdownButtonFormField<DriverPreference>(
            initialValue: _driver,
            decoration: const InputDecoration(labelText: 'Driver preference'),
            items: DriverPreference.values
                .map(
                  (p) => DropdownMenuItem(
                    value: p,
                    child: Text(
                      const ['Any', 'With driver', 'Self-drive'][p.index],
                    ),
                  ),
                )
                .toList(),
            onChanged: (p) => setState(() => _driver = p!),
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Return trip'),
            value: _return,
            onChanged: (v) => setState(() => _return = v),
          ),
          if (_purpose!.needsCargo)
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Covered cargo space required'),
              value: _covered,
              onChanged: (value) => setState(() => _covered = value),
            ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Long-distance trip'),
            value: _purpose == TransportPurpose.longDistance || _longDistance,
            onChanged: _purpose == TransportPurpose.longDistance
                ? null
                : (value) => setState(() => _longDistance = value),
          ),
        ],
      ],
    ),
  );
}

const _purposeGroups = <String, List<TransportPurpose>>{
  'PERSONAL & PASSENGER': [
    TransportPurpose.personalTrip,
    TransportPurpose.cityTravel,
    TransportPurpose.familyOrGroup,
    TransportPurpose.airportTransfer,
  ],
  'DELIVERY & GOODS': [
    TransportPurpose.parcelDelivery,
    TransportPurpose.smallCargo,
    TransportPurpose.movingGoods,
  ],
  'BUSINESS & LONG DISTANCE': [
    TransportPurpose.businessTransport,
    TransportPurpose.regionalCargo,
    TransportPurpose.heavyCargo,
    TransportPurpose.longDistance,
  ],
};

class _HomePurpose {
  const _HomePurpose({
    required this.title,
    required this.displayTitle,
    required this.description,
    required this.icon,
    required this.accent,
    required this.tint,
    required this.purposes,
    this.fullWidth = false,
  });

  final String title;
  final String displayTitle;
  final String description;
  final IconData icon;
  final Color accent;
  final Color tint;
  final List<TransportPurpose> purposes;
  final bool fullWidth;
}

const _homePurposes = <_HomePurpose>[
  _HomePurpose(
    title: 'Personal trip',
    displayTitle: 'Personal trip',
    description: 'City and nearby travel',
    icon: Icons.directions_car_outlined,
    accent: Color(0xFF2563EB),
    tint: Color(0xFFEFF6FF),
    purposes: [TransportPurpose.personalTrip],
  ),
  _HomePurpose(
    title: 'Family or group travel',
    displayTitle: 'Family or\ngroup travel',
    description: 'Travel together',
    icon: Icons.groups_2_outlined,
    accent: Color(0xFF7C3AED),
    tint: Color(0xFFF5F3FF),
    purposes: [TransportPurpose.familyOrGroup],
  ),
  _HomePurpose(
    title: 'Airport transfer',
    displayTitle: 'Airport\ntransfer',
    description: 'Airport pickups & drop-offs',
    icon: Icons.flight_takeoff_rounded,
    accent: Color(0xFF0891B2),
    tint: Color(0xFFECFEFF),
    purposes: [TransportPurpose.airportTransfer],
  ),
  _HomePurpose(
    title: 'Deliver goods',
    displayTitle: 'Deliver\ngoods',
    description: 'Parcels & small cargo',
    icon: Icons.inventory_2_outlined,
    accent: Color(0xFFD97706),
    tint: Color(0xFFFFFBEB),
    purposes: [TransportPurpose.parcelDelivery, TransportPurpose.smallCargo],
  ),
  _HomePurpose(
    title: 'Moving goods',
    displayTitle: 'Moving\ngoods',
    description: 'Vans for bigger items',
    icon: Icons.local_shipping_outlined,
    accent: Color(0xFF059669),
    tint: Color(0xFFECFDF5),
    purposes: [TransportPurpose.movingGoods],
  ),
  _HomePurpose(
    title: 'Business transport',
    displayTitle: 'Business\ntransport',
    description: 'Staff & business travel',
    icon: Icons.business_center_outlined,
    accent: Color(0xFF475569),
    tint: Color(0xFFF8FAFC),
    purposes: [TransportPurpose.businessTransport],
  ),
  _HomePurpose(
    title: 'Heavy cargo & long distance',
    displayTitle: 'Heavy cargo & long distance',
    description: 'Trucks for bigger jobs',
    icon: Icons.fire_truck_outlined,
    accent: Color(0xFFB45309),
    tint: Color(0xFFFFF7ED),
    purposes: [
      TransportPurpose.regionalCargo,
      TransportPurpose.heavyCargo,
      TransportPurpose.longDistance,
    ],
    fullWidth: true,
  ),
];
