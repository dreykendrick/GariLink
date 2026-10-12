"""PostgreSQL AST audit. Requires pglast==7.10; no database/network access."""
import json
from pathlib import Path
from pglast.parser import parse_sql_json

ROOT = Path(__file__).resolve().parents[1]

def strings(nodes):
    return [node['String']['sval'] for node in nodes]

def typename(node):
    return '.'.join(strings(node.get('names', []))) + '[]' * len(node.get('arrayBounds', []))

def semantic(node):
    if isinstance(node, dict):
        return {k: semantic(v) for k, v in node.items() if k not in ('location', 'stmt_location', 'stmt_len')}
    if isinstance(node, list):
        return [semantic(v) for v in node]
    return node

def audit():
    events, registry, errors, references = [], {}, [], []
    files = sorted((ROOT / 'migrations').glob('*.sql'))
    for file in files:
        tree = json.loads(parse_sql_json(file.read_text(encoding='utf-8')))
        for raw in tree['stmts']:
            statement = raw['stmt']
            if 'CreateFunctionStmt' in statement:
                stmt = statement['CreateFunctionStmt']
                name = '.'.join(strings(stmt['funcname']))
                params = []
                for wrapped in stmt.get('parameters', []):
                    p = wrapped['FunctionParameter']
                    params.append({'name': p.get('name'), 'type': typename(p['argType']),
                                   'mode': 'FUNC_PARAM_IN' if p.get('mode') == 'FUNC_PARAM_DEFAULT' else p.get('mode', 'FUNC_PARAM_IN'), 'default': semantic(p.get('defexpr'))})
                inputs = [p for p in params if p['mode'] not in ('FUNC_PARAM_OUT', 'FUNC_PARAM_TABLE')]
                identity = name + '(' + ','.join(p['type'] for p in inputs) + ')'
                event = {'migration': file.name, 'identity': identity, 'name': name,
                         'replace': stmt.get('replace', False), 'parameters': params,
                         'return': {'type': typename(stmt.get('returnType', {})),
                                    'setof': stmt.get('returnType', {}).get('setof', False)}}
                previous = registry.get(identity)
                if previous:
                    if not event['replace']:
                        errors.append({'identity': identity, 'migration': file.name, 'reason': 'duplicate CREATE'})
                    if previous['parameters'] != params or previous['return'] != event['return']:
                        errors.append({'identity': identity, 'migration': file.name,
                                       'reason': 'replacement signature/default/return changed',
                                       'before': previous['parameters'], 'after': params})
                registry[identity] = event
                events.append(event)
            elif 'DropStmt' in statement and statement['DropStmt'].get('removeType') == 'OBJECT_FUNCTION':
                references.append({'migration': file.name, 'kind': 'DROP FUNCTION', 'ast': statement})
                errors.append({'migration': file.name, 'reason': 'DROP FUNCTION requires explicit review'})
            elif 'AlterFunctionStmt' in statement:
                references.append({'migration': file.name, 'kind': 'ALTER FUNCTION', 'ast': statement})
            elif any(k in statement for k in ('GrantStmt', 'CreateTrigStmt', 'CreatePolicyStmt', 'AlterPolicyStmt')):
                references.append({'migration': file.name, 'kind': next(iter(statement)), 'ast': statement})
    consumer_roots = [ROOT / 'functions', ROOT / 'tests', ROOT / 'migrations', ROOT.parent / 'mobile_flutter/lib', ROOT.parent / 'backend/src']
    consumer_lines = []
    for directory in consumer_roots:
        for path in directory.rglob('*'):
            if path.is_file() and path.suffix in ('.sql', '.ts', '.dart', '.mjs'):
                consumer_lines.extend((f'{path.relative_to(ROOT.parent).as_posix()}:{number}', line)
                                      for number, line in enumerate(path.read_text(encoding='utf-8').splitlines(), 1))
    for event in registry.values():
        short = event['name'].split('.')[-1]
        event['consumers'] = [path for path, line in consumer_lines if short in line]
    return {'migration_count': len(files), 'events': events, 'final': registry,
            'dependencies': references, 'errors': errors}

if __name__ == '__main__':
    print(json.dumps(audit(), separators=(',', ':')))
