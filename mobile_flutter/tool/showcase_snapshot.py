"""Seal/verify the exact reviewed investor source; never touches a Git worktree."""
import argparse
import hashlib
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / 'EMERGENCY_SOURCE_MANIFEST.json'
SOURCE = ROOT / 'mobile_flutter'
DIRECTORIES = ('lib', 'test', 'assets', 'android', 'tool')
FILES = ('pubspec.yaml', 'pubspec.lock', 'analysis_options.yaml', '.metadata')
EXCLUDED = {'.git', '.gradle', '.kotlin', '.dart_tool', '__pycache__', 'build'}


def sources():
    paths = []
    for directory in DIRECTORIES:
        for path in (SOURCE / directory).rglob('*'):
            relative = path.relative_to(SOURCE)
            if not path.is_file() or any(p in EXCLUDED for p in relative.parts):
                continue
            if path.is_symlink():
                raise ValueError('Symlink source forbidden')
            if path.name in ('local.properties', 'key.properties') or path.suffix.lower() in ('.jks', '.keystore', '.apk', '.aab', '.pyc'):
                continue
            paths.append(path)
    paths.extend(SOURCE / name for name in FILES)
    paths.append(ROOT / '.github/workflows/emergency-investor-apk.yml')
    return sorted(paths, key=lambda p: p.relative_to(ROOT).as_posix())


def inventory():
    return {p.relative_to(ROOT).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in sources()}


def seal():
    if MANIFEST.exists():
        raise ValueError('Manifest exists; review changes before preparing a new candidate')
    data = {
        'source_base_commit': '65f312cf62fb7a366b2c056e2d05c5ea07761e1e',
        'source_description': 'Dirty renter-owner snapshot plus isolated, explicitly simulated investor preview; no hosted changes',
        'files': inventory(),
    }
    MANIFEST.write_text(json.dumps(data, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    print(hashlib.sha256(MANIFEST.read_bytes()).hexdigest())


def verify(expected):
    digest = hashlib.sha256(MANIFEST.read_bytes()).hexdigest()
    if digest != expected:
        raise ValueError('Reviewed manifest SHA-256 mismatch')
    data = json.loads(MANIFEST.read_text(encoding='utf-8'))
    if data['files'] != inventory():
        raise ValueError('Source content/file inventory differs from reviewed snapshot')
    print(f'Exact snapshot verified: {len(data["files"])} files; manifest SHA-256 {digest}')


def package(expected):
    verify(expected)
    target = ROOT / 'GariLink-emergency-source-2026-10-21.zip'
    with zipfile.ZipFile(target, 'x', compression=zipfile.ZIP_DEFLATED) as bundle:
        for path in sources() + [MANIFEST]:
            bundle.write(path, path.relative_to(ROOT).as_posix())
    print(f'{target.name}: {target.stat().st_size} bytes; SHA-256 {hashlib.sha256(target.read_bytes()).hexdigest()}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('operation', choices=('seal', 'verify', 'package'))
    parser.add_argument('--expected-sha256')
    args = parser.parse_args()
    if args.operation == 'seal':
        seal()
    elif not args.expected_sha256:
        parser.error('--expected-sha256 is required')
    elif args.operation == 'verify':
        verify(args.expected_sha256)
    else:
        package(args.expected_sha256)
