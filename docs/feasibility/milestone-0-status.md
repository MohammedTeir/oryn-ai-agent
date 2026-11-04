# Milestone 0 evidence status — 2026-11-04

Milestone 0 remains **open**. This is the current follow-up to the historical
observation-only build and [runtime review](runtime-review.md). The native
Strict-only security spike was merged in PR #2; merge is not device execution
evidence. The device-harness task adds TypeScript controls/reporting without
changing the native gateway, grant ledger or policy.

Upstream metadata and source hashes are recorded in
[the follow-up evidence JSON](device-harness-upstream-evidence.json). The embedded
candidate's current README still warns against production use; only that warning
was revalidated at its new main commit, not the complete changed implementation.

## Stack and device record

| Component | Exact selection / observed scope |
| --- | --- |
| Expo / modules-core | 58.0.23 / 58.0.30, pinned and compatibility check passed |
| React / React Native | 19.3.0 / 0.88.1, installed Expo compatibility metadata |
| Kotlin / Gradle | Build plugin 2.2.10 / wrapper 9.4.1; wrapper SHA-256 pinned; Kotlin catalog's 2.2.0 is not the observed plugin |
| Android | min API 29; compile 37; target 36; NDK 27.1.12297006; arm64-v8a APK only |
| Java / Node | Temurin 21.0.13+9 / Node 24.22.1 |
| Termux | 0.118.3 observed by owner on Redmi Note 8 Pro; installation source and command readiness Unknown |
| Device | Owner's native observation: Android 11/API 30, arm64-v8a/armeabi-v7a/armeabi supported; MIUI 12.5.10 earlier owner report only |
| lucide-react-native | 1.68.0 current registry candidate, ISC; peer metadata accepts React 19 and react-native-svg 12–15. Not installed or app/device-validated; no production compatibility claim |
| Gemini SDK | @google/genai 2.32.0 current registry candidate, Apache-2.0; Node >=20 and browser guidance. React Native compatibility Unknown, not selected/installed; no API key or request used |

The dependency checklist remains open because candidate metadata does not prove
app/device compatibility for icons or Gemini. No new production dependency was
added merely to close a checkbox. Historical records retain their original pins.

## Capability decisions

| Capability | Current decision | Evidence still needed / fallback |
| --- | --- | --- |
| Build and metadata bridge | Go for debug feasibility | Signed APK/CI checks; earlier owner bridge output. Match fresh device evidence to the new artifact identity |
| Native Strict fixed-probe gate | Go for restricted device testing; no general-purpose production approval | 21 native unit tests. Physical denial, Android lifecycle/IPC and security review evidence remain required |
| External Termux | Conditional go for fixed native-approved probes | Device permission/setup, actual callback/stdout/stderr/exit, interruption and missing-provider behavior. Until then execution readiness Unknown |
| External timeout | Observation deadline only | Missing callback stays Unknown and blocks new work; do not label remote process killed |
| External cancellation | Unsupported in this spike | No stop-service or guessed process-tree kill. Offer only explicit unsupported state; future contract needs separate proof |
| APK-owned C binary | Conditional go for arm64/API 29+ probe | NDK compile, ELF/linker and packaged hash checks passed. Device execution/timeout/cancel unverified. Not a shell or Termux runtime |
| Embedded Termux-compatible shell | No-go for adoption with current evidence; research remains open | libtermux candidate warns experimental/non-production. Android writable-executable restrictions, prefix/linking, provenance and device proof unresolved. Explicit external fallback only after that backend passes |
| Embedded package manager / tool install | Unsupported by the current prototype; no install attempted | No authenticated package/ABI/prefix/update/rollback design. Conditional benign installation test deferred until a supported design exists |
| Wider ABIs / Android versions | Unknown | One arm64 APK and one owner-observed device do not establish coverage |
| Root / Batch / Session | Not implemented or exercised by this spike | Outside fixed non-root Strict probe scope; no inferred grants |

For embedded packaging, `useLegacyPackaging` extracts an NDK-built PIE binary
with `/system/bin/linker64` into Android's installed native-library directory.
The APK packaging check retains exact compiled bytes, and native code rejects a
missing, writable or hash-mismatched installed file. This deliberately avoids
claiming downloaded executables in writable app home are supported. No target
SDK reduction or Android execution restriction bypass is used.

The ORYN-owned C source needs no copied Termux binary or bootstrap license grant.
Its identity updates with the signed APK and generated hash. That is not a
runtime package updater: no independent tool install, upgrade or rollback is
implemented. Adopting libtermux's Apache-2.0 library would still require a license
inventory for every bootstrap/package; integrating external Termux intents is
separate from redistributing GPLv3 Termux application code. A fork also needs
prefix rebuilds, signing/release ownership, security updates and package upkeep.
These maintenance obligations are not settled by a successful smoke test.

## Owner device follow-up: timeout incident

The owner supplied screenshots showing rejected missing/forged-grant calls, and
an unresolved local `native_timeout` execution after recovery. This is partial
native denial evidence, not a completed authorization proof or timeout success.
See [the transcribed incident](device-timeout-incident-2026-11-04.json) and the
[isolated native recovery fix/review](native-recovery-review.md). The exact
installed APK hash and cause of process restart remain Unknown. Further starts
are correctly blocked while the saved local outcome is uncertain.

## Remaining exit evidence

Cloud validation of the device-harness task passed Expo compatibility, ESLint,
TypeScript, seven JavaScript tests, Android JS bundling, both APK builds and
Android lint. The unchanged native unit suite has 21 passing tests; its Gradle
target was up-to-date in this UI-only build. Both APK signatures verified and
the phone APK retained its JS bundle and exact compiled native probe bytes.
These checks do not invoke the bridge or runtime on Android.

Follow [the phone runbook](device-test-runbook.md), capture matching source/APK
identity and genuine results, then reconcile PLAN.md section 3. In particular:

- Native denial/review and real external command results on the owner's device.
- Native binary execution, timeout/cancellation and lifecycle/process-death results.
- Honest per-capability embedded go/no-go based on the measured device outcome;
  no embedded package installation claim where unsupported.
- Record coverage gaps such as missing Termux and direct Android IPC tests rather
  than treating unit tests or UI button disabling as proof of backend isolation.
- Resolve remaining dependency selections/compatibility before completing that
  checklist; record Termux installation source as Unknown until observed.

No execution/authorization/embedded checklist was checked by this document.
Cloud build checks, source review, owner observation and new device results must
stay distinct. Native pending states must not be cleared to manufacture success.
