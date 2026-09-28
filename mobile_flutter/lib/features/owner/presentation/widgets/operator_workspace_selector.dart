import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/operator_workspace_provider.dart';

class OperatorWorkspaceSelector extends ConsumerWidget {
  const OperatorWorkspaceSelector({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final workspaceContext = ref.watch(operatorWorkspaceContextProvider);
    return workspaceContext.maybeWhen(
      data: (value) {
        if (value.selected == null || value.available.length < 2) {
          return const SizedBox.shrink();
        }
        return Semantics(
          label: 'Selected owner workspace',
          child: DropdownButtonFormField<String>(
            key: ValueKey(value.selectedId),
            initialValue: value.selectedId,
            isExpanded: true,
            decoration: const InputDecoration(
              labelText: 'Workspace',
              prefixIcon: Icon(Icons.business_outlined),
            ),
            items: value.available
                .map(
                  (workspace) => DropdownMenuItem(
                    value: workspace.id,
                    child: Text(
                      workspace.name,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                )
                .toList(),
            onChanged: (id) {
              if (id != null) selectOperatorWorkspace(ref, id);
            },
          ),
        );
      },
      orElse: () => const SizedBox.shrink(),
    );
  }
}
