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
  ./gradlew --no-daemon --build-cache --max-workers="${ORYN_GRADLE_MAX_WORKERS:-4}" \
    -Dorg.gradle.jvmargs="${ORYN_GRADLE_JVM_ARGS:--Xmx4g -XX:MaxMetaspaceSize=1g}" \
    -Pandroid.enableMinifyInReleaseBuilds=false \
    -PreactNativeArchitectures=arm64-v8a \
    :app:assembleRelease :app:lintRelease
)
apk=android/app/build/outputs/apk/release/app-release.apk
"$ANDROID_HOME/build-tools/37.0.0/apksigner" verify --verbose --print-certs "$apk" > artifacts/phone-apk-signature.txt
node scripts/integrity.cjs "$apk" > artifacts/phone-apk.sha256
cp "$apk" artifacts/oryn-feasibility-phone.apk
"$ANDROID_HOME/build-tools/37.0.0/aapt" dump badging "$apk" > artifacts/phone-apk-badging.txt
python3 scripts/verify-secure-store-backup.py "$ANDROID_HOME/build-tools/37.0.0/aapt" "$apk"
python3 - <<'PY'
import hashlib, pathlib, zipfile
apk = pathlib.Path('artifacts/oryn-feasibility-phone.apk')
with zipfile.ZipFile(apk) as archive:
    assert 'assets/index.android.bundle' in archive.namelist(), 'Offline JS bundle missing'
    packaged = archive.read('lib/arm64-v8a/liboryn_feasibility_probe.so')
    built = pathlib.Path('modules/oryn-observer/android/src/main/jniLibs/arm64-v8a/liboryn_feasibility_probe.so').read_bytes()
    assert hashlib.sha256(packaged).digest() == hashlib.sha256(built).digest(), 'Native probe changed during packaging'
print('Verified signed APK contains its JS bundle. Installation/bridge remain untested.')
PY
