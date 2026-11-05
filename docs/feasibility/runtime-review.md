> Historical upstream/source review. For subsequent phone measurements and current per-capability decisions, see the [2026-11-05 reconciliation](device-results-review-2026-11-05.md). No shell/package-manager adoption or embedded Termux parity is inferred from the packaged C probe.

# Runtime feasibility review — 2026-11-03

This is cloud source/documentation review, not device verification. Requirements:
root specification sections 7 and 12; PLAN.md section 3. No runtime dependency
was added to the observation harness.

## External Termux

The current GitHub release API reports **v0.118.3**, published 2025-05-22.
This identifies the source reviewed, not the version installed on the Redmi.
The v0.118.3 `RunCommandService.java` and `TermuxConstants.java` were read directly.

- `com.termux.RUN_COMMAND` targets Termux's run-command service.
- The contract includes executable path, argument array, workdir, background
  choice and a result PendingIntent. The run-command permission is
  `com.termux.permission.RUN_COMMAND`; Termux also checks its
  `allow-external-apps` property. Installation or package visibility alone does
  not establish initialization, permission, configuration or dispatch readiness.
- Callback payload, missing callback, truncation, lifecycle, timeout and
  cancellation need separate physical-device tests. A callback does not prove
  that a stop request killed the process tree.
- Official installation guidance warns against mixing APK/plugin sources with
  different signing keys. Do not advise uninstalling a user's existing Termux
  or deleting its data as a setup shortcut.
- The reviewed application license is GPLv3. Integrating by intent is distinct
  from copying application source; redistribution obligations need review before
  incorporating upstream code. This task copied no Termux code into the harness.

**Decision:** go for a future native-gated benign external integration spike;
runtime capability remains **Unknown** until installed version/source, permission,
result delivery and negative/lifecycle tests are recorded. No commands were sent.

## Embedded candidate: libtermux-android

Reviewed main tree `3a7e2ae63c4824fac384769c9afb8bc579458da9`, including
BootstrapInstaller, BootstrapProvider, BootstrapFetchPlugin and OsEnvironment.
The README explicitly says the project is experimental and not usable in
production. Its feature table is an upstream claim, not ORYN evidence.

The candidate has build-time native-library packaging and runtime bootstrap
installation paths. Those paths must not be conflated. Packaging binaries as
APK native libraries addresses a different question from successfully executing
downloaded packages from writable app storage.

Android's official Android 10 behavior-change documentation states that
untrusted apps targeting Android 10 cannot directly invoke execve on files in
their writable app home directory. ORYN's target SDK must not be lowered to
evade that restriction. The reviewed Termux README also says changing the app
package name requires rebuilding bootstrap and packages with the new prefix.
Copying a com.termux filesystem into ORYN is not evidence of compatibility.

The reviewed bootstrap paths download or reuse archives and extract binaries.
No expected SHA-256/signature validation was identified in those reviewed files;
this is a limited source observation, not a complete security audit. Before any
adoption, establish pinned artifact identity, trusted checksums/signatures,
safe extraction/symlinks, package repository authentication, license inventory,
update/rollback and patch ownership. The library's Apache 2.0 license does not
settle licenses of its bootstrap binaries and installed packages.

**Decision:** no-go for adopting this candidate as a production dependency based
on current evidence. Keep embedded capability **Unknown**, not universally
unsupported. A separate gated packaging/ABI/linker/installation prototype is
required, with explicit external fallback for capabilities that fail. No
embedded shell, package manager or tool installation was tested here.

## Fork / custom runtime alternative

A Termux fork requires package-prefix rebuilds, signing/update ownership,
license compliance and ongoing upstream security maintenance. A custom minimal
APK-packaged runtime would require its own bionic/linker/ABI, filesystem,
provenance and package strategy. Neither is selected or proven. A shell smoke
test would not prove a package manager or complete Termux parity.

## Device matrix

| Device | Android | MIUI | ABI | Provenance | Bridge / execution |
| --- | --- | --- | --- | --- | --- |
| Redmi Note 8 Pro | 11 / API 30 | 12.5.10 (earlier owner report only) | Probe reports arm64-v8a, armeabi-v7a, armeabi | Owner-provided native observation JSON | Bridge observed by owner; execution not implemented |

The owner's [probe output](device-observation-2026-11-03.json) detects Termux
0.118.3. Its installation source, root state, execution readiness and actual
process ABI remain unobserved. The APK build target is arm64-v8a; the wider
device ABI list does not verify additional APK architectures. No root probe is
authorized by this review. Milestone 0's authorization and runtime exit gates
remain open.
