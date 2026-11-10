#!/usr/bin/env bash
set -euo pipefail
command -v grep >/dev/null || { echo 'Required tool grep is unavailable' >&2; exit 1; }
cd "$(dirname "$0")/.."
source scripts/cloud-env.sh
source_root=$(pwd)
repo_root=$(cd ../.. && pwd)
work=$(mktemp -d "${TMPDIR:-/tmp}/oryn-release-build.XXXXXXXX")
trap 'rm -rf "$work"' EXIT
stage="$work/repo"
mkdir -p "$stage/spikes/android-feasibility" "$stage/docs" "$stage/assets"
cp -a "$repo_root/docs/design" "$stage/docs/"
cp -a "$repo_root/assets/ORYN_Brand_Assets" "$stage/assets/"
tar -C "$source_root" -cf - app.json package.json package-lock.json metro.config.js tsconfig.json language.ts \
  production milestone1/AppLanguage.tsx milestone1/AppIcon.tsx milestone1/navigation.ts milestone1/strings.ts \
  storage/database.ts storage/migrations.ts storage/conversations.ts storage/appConversations.ts storage/pendingMessage.ts storage/languagePreference.ts \
  plugins/withCompatibleSplash.cjs plugins/withFontLicense.cjs scripts/verify-font-apk.py scripts/verify-shell-apk.py scripts/verify-secure-store-backup.py scripts/integrity.cjs scripts/prepare-release-gradle.py \
  | tar -C "$stage/spikes/android-feasibility" -xf -
cd "$stage/spikes/android-feasibility"
ln -s "$source_root/node_modules" node_modules
mkdir -p modules
python3 - <<'PY'
import json
import os
from pathlib import Path
p = Path('package.json'); package = json.loads(p.read_text())
package['main'] = 'production/index.ts'
package['dependencies'].pop('expo-dev-client', None)
p.write_text(json.dumps(package, indent=2) + '\n')
p = Path('app.json'); config = json.loads(p.read_text())
config['expo']['name'] = 'ORYN'
config['expo']['slug'] = 'oryn'
# Owner-approved production identity, separate from the debug-only feasibility app.
config['expo']['android']['package'] = 'io.github.mohammedteir.oryn'
version_code = int(os.environ.get('ORYN_ANDROID_VERSION_CODE', '1'))
if not 1 <= version_code <= 2100000000:
    raise SystemExit('Invalid Android version code')
config['expo']['android']['versionCode'] = version_code
config['expo'].pop('autolinking', None)
for plugin in config['expo']['plugins']:
    if isinstance(plugin, list) and plugin[0] == 'expo-build-properties':
        plugin[1]['android'].pop('packagingOptions', None)
p.write_text(json.dumps(config, indent=2) + '\n')
PY
npx --no-install expo prebuild --platform android --no-install --no-clean --template expo-template-bare-minimum@58.0.31
python3 scripts/prepare-release-gradle.py android/app/build.gradle
checksum=$(curl -fsSL https://services.gradle.org/distributions/gradle-9.4.1-bin.zip.sha256)
[[ "$checksum" =~ ^[a-f0-9]{64}$ ]]
wrapper=android/gradle/wrapper/gradle-wrapper.properties
if ! grep -q '^distributionSha256Sum=' "$wrapper"; then
  printf '\ndistributionSha256Sum=%s\n' "$checksum" >> "$wrapper"
else
  grep -q "^distributionSha256Sum=$checksum$" "$wrapper"
fi
(
  cd android
  ./gradlew --no-daemon --build-cache --max-workers="${ORYN_GRADLE_MAX_WORKERS:-2}" \
    -Dorg.gradle.jvmargs="${ORYN_GRADLE_JVM_ARGS:--Xmx2g -XX:MaxMetaspaceSize=512m}" \
    -Pandroid.enableMinifyInReleaseBuilds=false -PreactNativeArchitectures=arm64-v8a \
    :app:assembleRelease :app:lintRelease
)
unsigned=android/app/build/outputs/apk/release/app-release-unsigned.apk
test -f "$unsigned"
"$ANDROID_HOME/build-tools/37.0.0/aapt" dump badging "$unsigned" > "$work/unsigned-badging.txt"
grep -q "^package: name='io[.]github[.]mohammedteir[.]oryn'" "$work/unsigned-badging.txt"
python3 scripts/verify-shell-apk.py "$unsigned"
python3 scripts/verify-font-apk.py "$unsigned"
mkdir -p "$source_root/artifacts"
cp "$unsigned" "$source_root/artifacts/oryn-production-unsigned.apk"
printf 'Unsigned production-identity shell built; signing and acceptance remain open.\n'
