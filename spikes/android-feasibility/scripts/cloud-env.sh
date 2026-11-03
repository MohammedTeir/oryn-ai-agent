#!/usr/bin/env bash
# Source this before Gradle. Dependencies are retained; proxy/CA trust is refreshed.
export JAVA_HOME="${JAVA_HOME:-/workspace/toolchains/jdk-21.0.13+9}"
export ANDROID_HOME="${ANDROID_HOME:-/workspace/toolchains/android-sdk}"
export ANDROID_USER_HOME="${ANDROID_USER_HOME:-/workspace/toolchains/android-user}"
export GRADLE_USER_HOME="${GRADLE_USER_HOME:-/workspace/toolchains/gradle}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
export EXPO_NO_TELEMETRY=1
python3 - <<'PY'
import os
import pathlib
import shutil
import subprocess
from urllib.parse import urlparse

jdk = pathlib.Path(os.environ['JAVA_HOME'])
base = pathlib.Path(os.environ['GRADLE_USER_HOME'])
base.mkdir(parents=True, exist_ok=True)
trust = base / 'session-cacerts'
shutil.copyfile(jdk / 'lib/security/cacerts', trust)
for n, cert in enumerate(sorted(pathlib.Path('/usr/local/share/ca-certificates').glob('*.crt'))):
    subprocess.run([str(jdk / 'bin/keytool'), '-importcert', '-noprompt',
                    '-trustcacerts', '-keystore', str(trust), '-storepass', 'changeit',
                    '-alias', f'oryn-session-{n}', '-file', str(cert)], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
settings = {'systemProp.javax.net.ssl.trustStore': str(trust)}
proxy = os.environ.get('HTTPS_PROXY')
if proxy:
    parsed = urlparse(proxy)
    if not parsed.hostname or not parsed.port or parsed.username or parsed.password:
        raise RuntimeError('Unsupported proxy configuration; preserve existing authentication')
    for scheme in ('http', 'https'):
        settings[f'systemProp.{scheme}.proxyHost'] = parsed.hostname
        settings[f'systemProp.{scheme}.proxyPort'] = str(parsed.port)
path = base / 'gradle.properties'
lines = path.read_text().splitlines() if path.exists() else []
lines = [line for line in lines if line.split('=', 1)[0] not in settings]
lines.extend(f'{key}={value}' for key, value in settings.items())
path.write_text('\n'.join(lines) + '\n')
PY
