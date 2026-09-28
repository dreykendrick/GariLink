enum WorkspaceBusinessMode {
  individual,
  fleet,
  unknown;

  factory WorkspaceBusinessMode.parse(Object? value) =>
      switch (value?.toString().toUpperCase()) {
        'INDIVIDUAL' => WorkspaceBusinessMode.individual,
        'FLEET' => WorkspaceBusinessMode.fleet,
        _ => WorkspaceBusinessMode.unknown,
      };

  String get label => switch (this) {
    WorkspaceBusinessMode.individual => 'Individual owner',
    WorkspaceBusinessMode.fleet => 'Fleet operator',
    WorkspaceBusinessMode.unknown => 'Owner workspace',
  };
}

class OperatorWorkspace {
  const OperatorWorkspace({
    required this.id,
    required this.name,
    required this.businessMode,
  });

  final String id;
  final String name;
  final WorkspaceBusinessMode businessMode;

  factory OperatorWorkspace.fromJson(Map<String, dynamic> json) =>
      OperatorWorkspace(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? 'Workspace',
        businessMode: WorkspaceBusinessMode.parse(
          json['businessMode'] ?? json['business_mode'],
        ),
      );
}

class OperatorWorkspaceContext {
  const OperatorWorkspaceContext({
    required this.available,
    required this.selected,
  });

  final List<OperatorWorkspace> available;
  final OperatorWorkspace? selected;

  bool get isEmpty => available.isEmpty;
  String? get selectedId => selected?.id;
}
