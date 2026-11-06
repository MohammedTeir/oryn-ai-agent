# Automatic checks and signed test APKs

Two independent GitHub Actions workflows run on every commit push and pull request.
Branch-deletion events skip the jobs because there is no new source to build:

- **Feasibility CI** (`.github/workflows/ci.yml`) installs the frozen lockfile,
  checks Expo dependency compatibility, runs ESLint, TypeScript and the test suite,
  and bundles Android JavaScript.
- **Signed feasibility APK** (`.github/workflows/android-apk.yml`) checks the
  source, builds and lints the development and bundled phone variants, verifies
  APK signatures, and uploads the signed phone APK with its SHA-256, signer
  information, actual source commit and workflow run provenance.

Both also support manual runs once the workflow is on the repository's default
branch. Newer updates cancel older in-progress runs on the same branch/PR.
Pull requests use read-only Gradle caches. Build jobs have read-only repository
permissions; a separate release job has write permission only on successful pushes
to `main`. Checkout credentials are not retained in the workspace.
Actions are pinned to verified commit SHAs. No signing secrets are required.
SDK installation retries up to three times with short backoff for interrupted
downloads. It uses the same official SDK manager and integrity checks each time;
persistent failures still fail the build. A branch with an open PR can show four
checks because the two workflows run for both the push and the PR event.

## Download on your phone

1. Open the repository’s **Releases** page. A successful push to `main` creates a
   test-only prerelease named `feasibility-test-…` with the APK, checksums, build
   information and signing certificate details. Download the APK directly there.
2. For a pull request or branch build, open the **Actions** tab and select **Signed feasibility APK**.
3. Open a successful run for the desired commit.
4. Under **Artifacts**, download `oryn-feasibility-phone-…` while signed in to
   GitHub. The artifact ZIP contains `oryn-feasibility-phone.apk`, `SHA256SUMS`,
   `build-info.json`, source commit, signature output and APK metadata.
5. Extract the ZIP and install the APK. For the current observation probe, tap
   **Observe Android through Kotlin** and record the real output.

Successful APK artifacts are retained for **14 days**. Build/lint diagnostics are
retained for **7 days**, including failed runs where reports exist. Each later
push generates a fresh run and artifact. Only successful `main` push builds
create a GitHub prerelease; pull requests and manual runs do not publish releases.
The APK is not committed to Git. Release tags include the run ID and attempt, and
prereleases do not become the repository’s latest stable release.

## Signing scope and validation limits

This is the authorized provisional debug-only app
`io.github.mohammedteir.oryn.feasibility`. The bundled phone APK uses a release
build variant with the pinned Expo template's **Android debug signer**, not a
production signing identity. The variant includes JavaScript so it can be
tested without Metro; minification is disabled for this probe. TLS, Gradle
distribution checksum, npm integrity and APK signature verification stay enabled.
No private keystore or password is stored in the repository or artifacts. Debug
signers may differ between builds. Android can reject an update with a different
signer; export any evidence before uninstalling an existing test app.

Production APK signing requires a separately approved app identity and secure
signing-key configuration. These workflows do not claim production release
readiness, native authorization enforcement, Termux execution, device testing,
RTL acceptance or completion of Milestone 0.

## Reproduce and maintain

The workflows use Node 24.22.1, Temurin JDK 21.0.13+9, Android command-line tools
23.0, platforms/android-37.0, build-tools 37.0.0 and 36.0.0, NDK 27.1.12297006,
and CMake 3.22.1. The existing scripts pin Expo's native template and verify
Gradle 9.4.1's published checksum. GitHub-hosted runner SDK/JDK paths are supplied
by setup actions rather than cloud-workspace paths.

Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`,
`npm run bundle:android`, then `bash scripts/build-cloud.sh` and
`bash scripts/build-phone.sh` from `spikes/android-feasibility` with the documented
toolchain. CI bounds Gradle to two workers and a 3 GiB heap through
`ORYN_GRADLE_MAX_WORKERS` and `ORYN_GRADLE_JVM_ARGS`; local defaults are preserved.

Review dependency/toolchain changes together with both workflow results. Keep
the historical Milestone 0 evidence tied to its original source/APK hashes;
each CI run records its own current provenance instead of rewriting old evidence.
