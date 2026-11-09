#!/usr/bin/env python3
"""Fail closed if the standalone test APK contains feasibility execution code."""
import pathlib
import sys
import zipfile

apk = pathlib.Path(sys.argv[1])
forbidden = (b'Lio/github/mohammedteir/oryn/feasibility/ExecutionModule;', b'Lio/github/mohammedteir/oryn/feasibility/ObserverModule;', b'Lio/github/mohammedteir/oryn/feasibility/EvidenceExportModule;', b'Lio/github/mohammedteir/oryn/feasibility/StrictGate;', b'Lio/github/mohammedteir/oryn/feasibility/NativeProbeObserver;')
with zipfile.ZipFile(apk) as archive:
    names = archive.namelist()
    if 'assets/index.android.bundle' not in names:
        raise SystemExit('Standalone shell JS bundle missing')
    bundle = archive.read('assets/index.android.bundle')
    if b'Saved conversations' not in bundle or b'Open Milestone 1 navigation preview' in bundle or b'Open local app shell preview' in bundle:
        raise SystemExit('Unexpected JavaScript entry in shell APK')
    if any(name.endswith('/liboryn_feasibility_probe.so') for name in names):
        raise SystemExit('Feasibility probe binary present in shell APK')
    dex = [name for name in names if name.startswith('classes') and name.endswith('.dex')]
    if not dex:
        raise SystemExit('No Android DEX files found')
    for name in dex:
        data = archive.read(name)
        if any(marker in data for marker in forbidden):
            raise SystemExit('Feasibility native module present in shell APK')
print('Standalone shell APK contains bundled JS and excludes the known feasibility modules and probe.')
