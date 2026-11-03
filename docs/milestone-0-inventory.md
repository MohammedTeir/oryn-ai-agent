# Milestone 0 inventory — published snapshot inspection

Inspected 2026-11-03. Base HEAD: `6a2dad752c0ca0f37efbf34b923e8308c484e294`.

## Scope and stack inventory

Confirmed requirements: root specification v1.10 sections 0, 5, 7, 12 and 16; PLAN.md section 3; AGENTS.md. Android 10+, Expo/React Native/TypeScript, Kotlin Expo Modules, external Termux plus feasibility-gated embedded capabilities. Native grants govern every executable backend action. No production UI implementation, Gemini integration, cloud backend, or root execution is included in this inspection.

Verified: clean checkout before this task, containing documentation, design JSON and brand assets. No application dependency manifest, lockfile, Android project, CI test/build workflow or feasibility harness exists in this checkout. All five requested feasibility paths were absent and this was reported before these replacement documents were created. No original contents have been recovered.

Available tools: Node 24.22.1, npm 11.9.0, Java runtime OpenJDK 21.0.12.1. `javac`, `gradle`, `adb`, and `sdkmanager` were not found on PATH. ANDROID_HOME, ANDROID_SDK_ROOT, JAVA_HOME and GRADLE_USER_HOME were unset. This does not rule out tools in other paths. No build-cloud.sh or gradlew was found under /workspace or /tmp.

Exact compatible Expo, React Native, Kotlin, Gradle, Android SDK, icon, Gemini SDK and Termux versions: **Unknown**. Do not infer pins from the previous chat or install latest dependencies to impersonate the missing frozen harness.

User-confirmed: provisional debug-only application ID `io.github.mohammedteir.oryn.feasibility`, MohammedTeir account ownership, Redmi Note 8 Pro, phone-only access. Installed Android/MIUI and ABI: **Unknown**. Release namespace clearance is not established by this debug authorization.

## Follow-up after publication — new harness lineage

The four new inspection records survived publication; the original harness did
not. A new observation-only harness was therefore created rather than claiming
restoration. It is a custom Expo native probe, not production app scaffolding.
See its README/package-lock.json and `docs/feasibility/runtime-review.md`.

Expo 58.0.22, React Native 0.88.1 and React 19.3.0 were selected from current Expo
documentation and the installed Expo compatibility map. Development-client,
modules-core and build-properties packages use Expo-selected exact pins.
Native toolchain installed outside the checkout: checksum-verified Temurin JDK
21.0.13+9, Android command-line tools, Android API 37.0, build-tools 37.0.0, NDK
27.1.12297006 and platform tools 37.0.1. Gradle also installed build-tools 36.0.0
for the generated Expo project. Gradle 9.4.1 uses the upstream distribution
SHA-256. Actual build results and dependency metadata are recorded separately.
The system default Java is not assumed sufficient: source cloud-env.sh before
Gradle to activate the JDK/SDK and refresh current session CA/proxy trust.

No Gemini SDK, icon library or Termux runtime is installed by this probe. Their
final selected versions remain Unknown. Device matrix: Redmi Note 8 Pro,
Android 10 / MIUI 12.5.10 / arm64-v8a are user reported; APK observations are
still required. Provisional application ID authorization is unchanged.

## Additional stack review

Current package candidates were reviewed without installing unused app libraries:
`lucide-react-native@1.67.0` declares React 19 / SVG 15 compatibility. Its registry
SHA-512 and required semantic icon names were checked in published declarations.
Expo's map recommends `react-native-svg@15.16.0`. Rendering is not verified.
`@google/genai@2.32.0` requires Node >=20 and documents Node/browser use; React
Native support remains Unknown. Neither is selected for the observation app.
Do not call these candidates device-compatible or mark the full stack item done.
The native prebuild template is pinned to `expo-template-bare-minimum@58.0.31`;
its published SHA-512 is retained in the evidence. Standard debug and phone
variants use identical observer source; only the bundled phone artifact is
intended for the current phone-only check.
