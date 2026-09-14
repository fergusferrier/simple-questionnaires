#!/usr/bin/env python3
"""Restore and verify the local PDF archive from the tracked catalogue."""
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1] / 'translations'
sources = json.loads((root / 'catalog.json').read_text())['sources']
for source in sources:
    target = root / source['file']
    expected = source['sha256']
    if target.exists():
        if hashlib.sha256(target.read_bytes()).hexdigest() != expected:
            raise SystemExit(f'Checksum mismatch: {target}. Inspect it before replacing it.')
        continue
    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=target.parent) as temporary:
        download = Path(temporary) / 'download.pdf'
        subprocess.run(['curl', '--fail', '--location', '--silent', '--show-error',
                        '--retry', '2', '--connect-timeout', '20', '--max-time', '120',
                        '--output', str(download), source['url']], check=True)
        data = download.read_bytes()
        if not data.startswith(b'%PDF-') or hashlib.sha256(data).hexdigest() != expected:
            raise SystemExit(f'Source changed: {source["url"]}. Review before updating the catalogue.')
        download.replace(target)
    print(f'Downloaded {target.name}')
print(f'Verified {len(sources)} source PDFs.')
