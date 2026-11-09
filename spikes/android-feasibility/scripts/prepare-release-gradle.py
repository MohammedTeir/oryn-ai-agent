#!/usr/bin/env python3
"""Remove generated release debug signing, failing closed on unexpected templates."""
import pathlib
import re
import sys

path = pathlib.Path(sys.argv[1])
text = path.read_text()
if text.count('    buildTypes {') != 1:
    raise SystemExit('Unexpected Android buildTypes layout')
start = text.index('    buildTypes {')
head, tail = text[:start], text[start:]
blocks = list(re.finditer(r'(?ms)^        release \{\n(?P<body>.*?)^        \}', tail))
if len(blocks) != 1:
    raise SystemExit('Unexpected Android release block')
block = blocks[0]
body = block.group('body')
pattern = r'(?m)^[ \t]*signingConfig signingConfigs\.debug[ \t]*$'
if len(re.findall(pattern, body)) != 1 or len(re.findall(r'(?m)^[ \t]*signingConfig\b', body)) != 1:
    raise SystemExit('Unexpected release signing configuration')
body = re.sub(pattern, '            // Release is unsigned here; apksigner uses the provided release key.', body, count=1)
result = head + tail[:block.start('body')] + body + tail[block.end('body'):]
path.write_text(result)
