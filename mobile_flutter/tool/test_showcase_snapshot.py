"""Local source-integrity tests, not Flutter compilation or CI execution."""
import contextlib
import io
import hashlib
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import showcase_snapshot as snapshot


class SnapshotTests(unittest.TestCase):
    def setUp(self):
        # Keep disposable fixtures inside the authorized snapshot root, not a
        # Windows TEMP directory whose ACLs differ in this managed session.
        self.temp = tempfile.TemporaryDirectory(prefix='.showcase-test-', dir=snapshot.ROOT)
        self.assertEqual(Path(self.temp.name).resolve().parent, snapshot.ROOT.resolve())
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = self.root / 'mobile_flutter'
        for name in snapshot.DIRECTORIES:
            (self.source / name).mkdir(parents=True)
        for name in snapshot.FILES:
            (self.source / name).write_text('fixture', encoding='utf-8')
        workflow = self.root / '.github/workflows/emergency-investor-apk.yml'
        workflow.parent.mkdir(parents=True)
        workflow.write_text('fixture', encoding='utf-8')
        self.manifest = self.root / 'EMERGENCY_SOURCE_MANIFEST.json'
        for name, value in [('ROOT', self.root), ('SOURCE', self.source), ('MANIFEST', self.manifest)]:
            p = patch.object(snapshot, name, value)
            p.start()
            self.addCleanup(p.stop)

    def seal(self):
        with contextlib.redirect_stdout(io.StringIO()):
            snapshot.seal()
        return hashlib.sha256(self.manifest.read_bytes()).hexdigest()

    def test_exact_inventory_verifies(self):
        digest = self.seal()
        with contextlib.redirect_stdout(io.StringIO()):
            snapshot.verify(digest)

    def test_modified_source_fails(self):
        digest = self.seal()
        (self.source / 'pubspec.yaml').write_text('changed', encoding='utf-8')
        with self.assertRaises(ValueError):
            snapshot.verify(digest)

    def test_added_source_fails(self):
        digest = self.seal()
        (self.source / 'lib/new.dart').write_text('changed', encoding='utf-8')
        with self.assertRaises(ValueError):
            snapshot.verify(digest)

    def test_caches_and_signing_files_are_excluded(self):
        (self.source / 'android/key.properties').write_text('not-a-real-key', encoding='utf-8')
        (self.source / 'android/demo.jks').write_bytes(b'fixture')
        (self.source / 'android/local.properties').write_text('machine-path', encoding='utf-8')
        self.assertFalse(any(p.name in ('key.properties', 'demo.jks', 'local.properties') for p in snapshot.sources()))

    def test_manifest_digest_and_overwrite_protection(self):
        self.seal()
        with self.assertRaises(ValueError):
            snapshot.verify('0' * 64)
        with self.assertRaises(ValueError):
            snapshot.seal()


if __name__ == '__main__':
    unittest.main()
