#!/usr/bin/env python3
"""Verify the candidate font files and required license in a packaged Android APK."""
import hashlib
import sys
import zipfile

expected = {
    'assets/fonts/IBMPlexSansArabic-Regular.ttf': '6f611412270a132bbac838da9259d4c68569b4175f3b3b8fa3fa36a30b56dab9',
    'assets/fonts/IBMPlexSansArabic-SemiBold.ttf': '597bd5502e5997be4414e4c9c88834b30ff3784250c84f20bce2b20e53ebd467',
    'assets/fonts/IBMPlexSansArabic-Bold.ttf': '691e0c891a38637ae6bbdb69700f8042cb0724a137bee615068ffdb92244f61f',
    'assets/licenses/IBM-Plex-OFL.txt': '7e6b2818edbd8f6a01ae80641cc8f16a51080d08fb4e532be3a0b6f74adb07da',
}
with zipfile.ZipFile(sys.argv[1]) as apk:
    for name, digest in expected.items():
        try:
            content = apk.read(name)
        except KeyError:
            raise SystemExit(f'Font or license missing: {name}') from None
        if hashlib.sha256(content).hexdigest() != digest:
            raise SystemExit(f'Font or license checksum mismatch: {name}')
print('Verified candidate fonts and OFL license in APK.')
