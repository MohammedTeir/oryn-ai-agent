#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/cloud-env.sh
test -x "$JAVA_HOME/bin/javac"
test -x "$ANDROID_HOME/build-tools/37.0.0/apksigner"
npx --no-install expo prebuild --platform android --no-install --no-clean \
  --template expo-template-bare-minimum@58.0.31
mkdir -p artifacts
# Verify the upstream Gradle distribution using its published checksum.
wrapper=android/gradle/wrapper/gradle-wrapper.properties
checksum=$(curl -fsSL https://services.gradle.org/distributions/gradle-9.4.1-bin.zip.sha256)
[[ "$checksum" =~ ^[a-f0-9]{64}$ ]]
if ! rg -q '^distributionSha256Sum=' "$wrapper"; then
  printf '\ndistributionSha256Sum=%s\n' "$checksum" >> "$wrapper"
else
  rg -q "^distributionSha256Sum=$checksum$" "$wrapper"
fi
# Only one device ABI is in the initial evidence matrix. Never infer device tests.
(
  cd android
  ./gradlew --no-daemon --build-cache --max-workers="${ORYN_GRADLE_MAX_WORKERS:-2}" \
    -Dorg.gradle.jvmargs="${ORYN_GRADLE_JVM_ARGS:--Xmx2g -XX:MaxMetaspaceSize=512m}" \
    -PreactNativeArchitectures=arm64-v8a \
    :app:assembleDebug :app:lintDebug :oryn-observer:testDebugUnitTest
)
apk=android/app/build/outputs/apk/debug/app-debug.apk
"$ANDROID_HOME/build-tools/37.0.0/apksigner" verify --verbose --print-certs "$apk" > artifacts/apk-signature.txt
node scripts/integrity.cjs "$apk" > artifacts/apk.sha256
cp "$apk" artifacts/oryn-feasibility-debug.apk
"$ANDROID_HOME/build-tools/37.0.0/aapt" dump badging "$apk" > artifacts/apk-badging.txt
printf 'Build and APK signature verification completed. Device checks are still required.\n'
