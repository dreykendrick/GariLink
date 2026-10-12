"""Prevent top-level fixture DML from leaking into application test roles.

DO-block expected-denial checks remain runtime SQL evidence, not static passes.
"""
import json
from pathlib import Path
from pglast.parser import parse_sql_json

root = Path(__file__).resolve().parent
role = 'administrator'
errors, mutations = [], []
for name in ['identity', 'workspace', 'marketplace', 'rental', 'pricing', 'media', 'email-auth']:
    tree = json.loads(parse_sql_json((root / f'{name}-assertions.sql').read_text()))
    for raw in tree['stmts']:
        stmt = raw['stmt']
        if 'VariableSetStmt' in stmt:
            setting = stmt['VariableSetStmt']
            if setting.get('name') == 'role':
                role = ('administrator' if setting['kind'] == 'VAR_RESET' else
                        setting['args'][0]['A_Const']['sval']['sval'])
        for kind in ('UpdateStmt', 'InsertStmt', 'DeleteStmt'):
            if kind in stmt:
                relation = stmt[kind]['relation']
                schema, table = relation.get('schemaname'), relation['relname']
                mutations.append({'suite': name, 'table': f'{schema}.{table}', 'role': role})
                expected = 'authenticated' if schema == 'storage' else 'administrator'
                if role != expected:
                    errors.append({'suite': name, 'table': table, 'expected': expected, 'actual': role})
print(json.dumps({'errors': errors, 'mutations': mutations}))
