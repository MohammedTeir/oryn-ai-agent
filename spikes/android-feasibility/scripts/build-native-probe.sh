#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/cloud-env.sh
ndk_bin="$ANDROID_HOME/ndk/27.1.12297006/toolchains/llvm/prebuilt/linux-x86_64/bin"
module=modules/oryn-observer/android/src/main
output="$module/jniLibs/arm64-v8a/liboryn_feasibility_probe.so"
mkdir -p "$(dirname "$output")"
"$ndk_bin/aarch64-linux-android29-clang" -std=c11 -Wall -Wextra -Werror \
  -O2 -fPIE -pie -Wl,-z,relro,-z,now -Wl,--build-id=none \
  "$module/cpp/oryn_probe.c" -o "$output"
"$ndk_bin/llvm-readelf" --file-header --program-headers "$output" > /tmp/oryn-native-probe-elf.txt
grep -Fq 'AArch64' /tmp/oryn-native-probe-elf.txt
grep -Fq '/system/bin/linker64' /tmp/oryn-native-probe-elf.txt
digest=$(node scripts/integrity.cjs "$output")
cat > "$module/java/io/github/mohammedteir/oryn/feasibility/GeneratedProbeDigest.kt" <<EOF
package io.github.mohammedteir.oryn.feasibility
// Generated from the NDK-compiled, APK-packaged executable; never hand-edit.
internal object GeneratedProbeDigest { const val SHA256 = "$digest" }
EOF
printf 'Built arm64 native probe; SHA-256 %s\n' "$digest"
