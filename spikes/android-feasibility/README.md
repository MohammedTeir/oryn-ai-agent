# New Milestone 0 observation harness

This harness was created after the previous uncommitted harness was found missing.
It has a separate evidence lineage; previous test passes do not apply to it.

The only Kotlin API observes Android Build metadata and package visibility for
Termux. It cannot issue grants, dispatch intents, start processes, install tools,
or execute commands. Detection does not establish Termux execution readiness.
This is a labeled debug spike, not the production two-tab interface.

Expo 58.0.22 was selected after reading current Expo SDK documentation. React
19.3.0 and React Native 0.88.1 come from that installed Expo package's
bundledNativeModules.json. Expo-selected dev-client, build-properties and
modules-core provide the custom development build, Android minimum API override
and Kotlin bridge. TypeScript and ESLint validate the spike. Exact installed
versions are pinned in package.json and package-lock.json before validation.
No Gemini SDK, icon library or embedded runtime is selected by this spike.

Use `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, and
`npm run bundle:android`. Native builds use `bash scripts/build-cloud.sh`.
The Android directory is generated and ignored. Toolchains and caches live outside
the checkout. No secret or keystore should be committed.

For physical device tests, use the device protocol in docs. A compiled APK does
not establish Kotlin invocation, security gates, execution, or Termux parity.

For a phone-only test after the development build passes, run
`bash scripts/build-phone.sh`. It builds the generated **release variant with
the debug signer** to include JavaScript in the APK and avoid requiring a live
Metro connection. This is a debug-signed feasibility artifact under the provisional
app ID, not a production release. The script checks its signature and embedded
bundle; phone installation and offline launch still require device evidence.
Do not run both Gradle scripts concurrently against the same generated project.
Minification is disabled for this debug-only bridge probe; production R8
optimization and its runtime behavior are outside this check. Build and lint
still run, and signature/integrity verification remain enabled.

The cloud tools installed for this run are under `/workspace/toolchains`:
Temurin JDK 21.0.13+9, SDK command-line tools 23.0, platform API 37.0,
build-tools 37.0.0 (and dependency-requested 36.0.0), NDK 27.1.12297006 and
platform-tools 37.0.1. Gradle 9.4.1 is pinned by the generated Expo template and
verified against the official distribution SHA-256. The build reports Kotlin
plugin 2.2.10, compile SDK 37, target SDK 36 and min SDK 29. The current cloud
allocation is 4 CPU / 32 GiB; the scripts bound Gradle workers to 2 and 4.
Toolchain download/checksum provenance is in the upstream evidence JSON.
Source `scripts/cloud-env.sh` to activate retained tools and refresh session
proxy/CA trust; do not disable verification. No live processes are prerequisites.
Use the existing checkout in each isolated cloud task; do not create worktrees
unless explicitly requested.

The native template is pinned to `expo-template-bare-minimum@58.0.31`.
Expo 58 defaults to recreating native directories; the build script uses the
supported `--no-clean` prebuild option to preserve generated build caches.
Keep custom native source in `modules/`, not in the generated Android directory.
The phone artifact blocks template storage and overlay permissions; the standard
development variant may retain its development-launcher overlay permission.

GitHub automatically checks updates and builds signed test APK artifacts using
the two workflows described in [CI and artifact downloads](../../docs/ci.md).
