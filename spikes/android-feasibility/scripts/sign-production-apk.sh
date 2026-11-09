#!/usr/bin/env bash
set -euo pipefail
command -v grep >/dev/null || { echo 'Required tool grep is unavailable' >&2; exit 1; }
set +x
cd "$(dirname "$0")/.."
: "${ORYN_RELEASE_KEYSTORE_FILE:?Missing keystore file}"
: "${ORYN_RELEASE_KEY_ALIAS:?Missing key alias}"
: "${ORYN_RELEASE_STORE_PASSWORD:?Missing keystore password}"
: "${ORYN_RELEASE_KEY_PASSWORD:?Missing key password}"
: "${ORYN_RELEASE_CERT_SHA256:?Missing certificate fingerprint}"
[[ "$ORYN_RELEASE_KEYSTORE_FILE" = /* && -f "$ORYN_RELEASE_KEYSTORE_FILE" ]]
[[ "$ORYN_RELEASE_CERT_SHA256" =~ ^[a-f0-9]{64}$ ]]
ANDROID_HOME="${ANDROID_HOME:-/workspace/toolchains/android-sdk}"
build_tools="$ANDROID_HOME/build-tools/37.0.0"
unsigned=artifacts/oryn-production-unsigned.apk
test -f "$unsigned"
work=$(mktemp -d "${TMPDIR:-/tmp}/oryn-release-sign.XXXXXXXX")
trap 'rm -rf "$work"' EXIT
aligned="$work/aligned-unsigned.apk"
signed="$work/oryn-production.apk"
"$build_tools/zipalign" -f -p 4 "$unsigned" "$aligned"
"$build_tools/apksigner" sign --ks "$ORYN_RELEASE_KEYSTORE_FILE" \
  --ks-key-alias "$ORYN_RELEASE_KEY_ALIAS" --ks-pass env:ORYN_RELEASE_STORE_PASSWORD \
  --key-pass env:ORYN_RELEASE_KEY_PASSWORD --out "$signed" "$aligned"
"$build_tools/apksigner" verify --verbose --print-certs "$signed" > artifacts/production-apk-signature.txt
actual=$(sed -nE 's/.*certificate SHA-256 digest: ([a-f0-9]{64})/\1/p' artifacts/production-apk-signature.txt | sort -u)
[[ "$actual" == "$ORYN_RELEASE_CERT_SHA256" ]]
if grep -q 'certificate DN: CN=Android Debug' artifacts/production-apk-signature.txt; then
  echo 'Debug certificate is not allowed for production signing' >&2; exit 1
fi
"$build_tools/aapt" dump badging "$signed" > artifacts/production-apk-badging.txt
grep -q "^package: name='io[.]github[.]mohammedteir[.]oryn'" artifacts/production-apk-badging.txt
"$build_tools/aapt" dump permissions "$signed" > artifacts/production-apk-permissions.txt
if grep -q 'com\.termux\.permission\.RUN_COMMAND' artifacts/production-apk-permissions.txt; then
  echo 'Unexpected Termux execution permission in shell APK' >&2; exit 1
fi
python3 scripts/verify-shell-apk.py "$signed"
python3 scripts/verify-secure-store-backup.py "$build_tools/aapt" "$signed"
cp "$signed" artifacts/oryn-production.apk
node scripts/integrity.cjs artifacts/oryn-production.apk > artifacts/production-apk.sha256
printf 'Release-signed shell APK verified; milestone and device acceptance remain open.\n'
