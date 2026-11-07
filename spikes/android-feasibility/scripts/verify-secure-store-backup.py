#!/usr/bin/env python3
"""Fail the APK build if packaged Android backup rules can include SecureStore."""
import re
import subprocess
import sys


def dump(*args):
    return subprocess.run([sys.argv[1], 'dump', *args], check=True, text=True, capture_output=True).stdout


def resource(resources, name):
    pattern = rf'(?m)^\s+resource (0x[0-9a-f]+) [^\n]*:xml/{name}:.*\n\s+\(string8\) "([^"]+)"'
    found = re.findall(pattern, resources)
    if len(found) != 1:
        raise ValueError(f'Expected one default {name} resource')
    return found[0]


def exclusions(tree):
    stack = []
    result = set()
    for line in tree.splitlines():
        element = re.match(r'^(\s*)E: ([\w-]+) \(line=', line)
        if element:
            depth = len(element.group(1))
            while stack and stack[-1][0] >= depth:
                stack.pop()
            stack.append((depth, element.group(2), {}))
            continue
        attribute = re.match(r'^\s*A: (domain|path)="([^"]+)"', line)
        if attribute and stack:
            stack[-1][2][attribute.group(1)] = attribute.group(2)
            if stack[-1][1] == 'exclude' and stack[-1][2] == {'domain': 'sharedpref', 'path': 'SecureStore'}:
                result.add(tuple(entry[1] for entry in stack[:-1]))
    return result


def main():
    if len(sys.argv) != 3:
        raise ValueError('Expected aapt path and APK path')
    apk = sys.argv[2]
    manifest = dump('xmltree', apk, 'AndroidManifest.xml')
    resources = dump('--values', 'resources', apk)
    legacy_id, legacy_path = resource(resources, 'secure_store_backup_rules')
    modern_id, modern_path = resource(resources, 'secure_store_data_extraction_rules')
    for attr, rid in [('fullBackupContent', legacy_id), ('dataExtractionRules', modern_id)]:
        if not re.search(rf'android:{attr}\(0x[0-9a-f]+\)=@{rid}\b', manifest):
            raise ValueError(f'Manifest does not reference the expected {attr} resource')
    if ('full-backup-content',) not in exclusions(dump('xmltree', apk, legacy_path)):
        raise ValueError('Legacy backup does not exclude SecureStore')
    modern = exclusions(dump('xmltree', apk, modern_path))
    for scope in ('cloud-backup', 'device-transfer'):
        if ('data-extraction-rules', scope) not in modern:
            raise ValueError(f'{scope} does not exclude SecureStore')
    print('Verified packaged SecureStore backup exclusions for Android 10+ and device transfer.')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print(f'Backup-rule verification failed: {error}', file=sys.stderr)
        sys.exit(1)
