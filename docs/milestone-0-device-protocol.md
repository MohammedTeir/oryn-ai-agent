> Milestone 0 observations are reconciled in the [final exit record](feasibility/milestone-0-closure.md). This protocol is retained for reproduction; no additional phone test is requested for the completed feasibility scope.

> New fixed-probe controls: use the [device harness runbook](feasibility/device-test-runbook.md). The historical observation-only instructions below do not test execution.

# Milestone 0 device evidence protocol

Status: the owner reported a successful probe installation/launch and supplied [native observation JSON](feasibility/device-observation-2026-11-03.json) from Redmi Note 8 Pro. It reports Android 11/API 30, supported ABIs arm64-v8a/armeabi-v7a/armeabi, and Termux 0.118.3 detected. The earlier Android 10 report is superseded. MIUI 12.5.10 remains an earlier owner report; security patch, runtime permissions and exact installed APK hash/variant remain Unknown. Authorization and runtime execution checks below are still pending.

## Phone-only preparation

Record Android and MIUI versions from Settings → About phone (labels may differ). Do not infer installed OS or ABI from the phone model. Avoid collecting serial numbers, account identifiers, API keys or unrelated personal data. ABI must eventually come from an actual platform observation in the debug harness; a model specification is not evidence of the installed process architecture.

Only distribute a debug APK after cloud build, signature and hash verification. Record APK hash, signer digest, debug application ID and source/evidence identity. Installation requires the owner's deliberate Android consent. Do not assume USB adb, a second device, wireless debugging support, or a reachable phone from the cloud. Verified test APKs are available through the [GitHub Actions download workflow](ci.md). Offline launch was not explicitly reported by the owner; keep that separate from the successful bridge observation. This protocol does not authorize a production release.

## Observation-only harness gate

Install and open the verified APK, record installed Android/MIUI and observed ABI/API level. Invoke the Kotlin Expo Module through the JS bridge and capture its actual structured return, including failure cases. An app screen, JS bundle or successful native build alone does not prove bridge invocation. Observation-only means no shell execution, package installation, root probe or hidden command dispatch.

## Separate native security and runtime gate

An observation-only harness cannot satisfy this gate. Review and implement the native authorization spike separately before attempting commands. Test missing/invalid/replayed/revoked/expired grants, action/backend/argument mutation, direct JS/backend calls, background dispatch, and process restart. Denial must produce no backend execution. Strict exact-action authorization is required for each benign command; no JS-created token or prior task approval may authorize it.

For each feasible backend record exact reviewed action, native grant, backend/device/ABI, start/end observations, actual stdout, stderr and exit status. Test missing external Termux, permission refusal, result delivery, timeout/cancellation and interrupted lifecycle; unknown results stay Unknown. Record installed Termux version/source rather than assuming one. Root and high-risk actions are excluded from this benign protocol.

For embedded feasibility first document executable placement, linker and Android restrictions, package provenance/checksums/licenses, app identity, updates/rollback and ABI compatibility. Test one benign tool installation only if supported and separately authorized, then verify invocation. Record unsupported and failed capabilities per device/runtime. Never generalize external Termux success to embedded parity.

## Exit evidence

Link raw redacted observations to source and APK hashes. Keep cloud build/signature checks separate from device installation, bridge, authorization, runtime and RTL/accessibility outcomes. PLAN.md section 3 and the root specification govern completion; this protocol supplies no completed tests or go decision.

## Published follow-up: owner-supplied device information

The owner subsequently reported **MIUI 12.5.10, Android 10, arm64-v8a**.
These are user-reported values, not observations from the APK. Termux version
and installation source remain Unknown; the owner does not remember them.
No repeat request for the same remembered information is required.

The new observation-only harness is at `spikes/android-feasibility/`. Once a
signature-verified, JS-bundled phone APK exists, install it deliberately on the
phone, open **ORYN Feasibility (debug)** and tap **Observe Android through Kotlin**
(or its Arabic translation). Record the returned JSON and whether the app opens
without Metro. It contains OS/API, model, supported ABIs, app ID, timestamp and
Termux package detection; it contains no API key or command output. Detection
must never be relabeled Connected/Ready. If the error label appears, record it
as a failed bridge observation; do not infer successful execution.

A successful observation will close only the physical Kotlin bridge probe.
Native authorization, external command results, cancellation/process-death and
embedded package capabilities still need their separate gated prototypes/tests.
