#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/cloud-env.sh
# Run build-cloud.sh first to generate and validate the Android project.
# Expo's generated release variant uses the debug signer here. This is never a
# production release, despite using a release variant to embed JS for offline use.
test -d android
mkdir -p artifacts
(
  cd android
  ./gradlew --no-daemon --max-workers=4 \
    -Dorg.gradle.jvmargs="-Xmx4g -XX:MaxMetaspaceSize=1g" \
    -Pandroid.enableMinifyInReleaseBuilds=false \
    -PreactNativeArchitectures=arm64-v8a \
    :app:assembleRelease :app:lintRelease
)
apk=android/app/build/outputs/apk/release/app-release.apk
"$ANDROID_HOME/build-tools/37.0.0/apksigner" verify --verbose --print-certs "$apk" > artifacts/phone-apk-signature.txt
node scripts/integrity.cjs "$apk" > artifacts/phone-apk.sha256
cp "$apk" artifacts/oryn-feasibility-phone.apk
"$ANDROID_HOME/build-tools/37.0.0/aapt" dump badging "$apk" > artifacts/phone-apk-badging.txt
python3 - <<'PY'
import pathlib, zipfile
apk = pathlib.Path('artifacts/oryn-feasibility-phone.apk')
with zipfile.ZipFile(apk) as archive:
    assert 'assets/index.android.bundle' in archive.namelist(), 'Offline JS bundle missing'
print('Verified signed APK contains its JS bundle. Installation/bridge remain untested.')
PY
