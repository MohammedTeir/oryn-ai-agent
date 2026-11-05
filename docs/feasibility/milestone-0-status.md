# Milestone 0 evidence status — 2026-11-05

**Open: external failure/lifecycle investigation remains.** The owner has now supplied physical
execution and lifecycle evidence. See the [complete reconciliation](device-results-review-2026-11-05.md),
[selected result entries](device-results-2026-11-05.json), and [final background
report](device-background-report-2026-11-05.json). These are owner-reported phone
observations, separate from cloud build/signature tests. Exact installed APK hash
and Termux installation source remain Unknown.

Upstream metadata/source hashes remain in
[the 2026-11-04 follow-up](device-harness-upstream-evidence.json). Historical source
and build records retain their original dates/pins; the new results do not change
what was unverified in those older records.

## Stack and device record

| Component | Exact selection / observed scope |
| --- | --- |
| Expo / modules-core | 58.0.23 / 58.0.30, pinned and compatibility check passed |
| React / React Native | 19.3.0 / 0.88.1, installed Expo compatibility metadata |
| Kotlin / Gradle | Build plugin 2.2.10 / wrapper 9.4.1; wrapper SHA-256 pinned; Kotlin catalog's 2.2.0 is not the observed plugin |
| Android | min API 29; compile 37; target 36; NDK 27.1.12297006; arm64-v8a APK only |
| Java / Node | Temurin 21.0.13+9 / Node 24.22.1 |
| Termux | 0.118.3 observed by owner on Redmi Note 8 Pro; installation source Unknown; fixed commands observed working |
| Device | Owner's native observation: Android 11/API 30, arm64-v8a/armeabi-v7a/armeabi supported; MIUI 12.5.10 earlier owner report only |
| lucide-react-native / SVG | 1.68.0 / 15.16.0 pinned; real exports typechecked and Android-bundled; SVG native module built; no device rendering claim |
| Gemini SDK | @google/genai 2.32.0 pinned; public web entry typechecked and Android-bundled. Live API behavior/secure key integration not tested or claimed |

The [dependency build/import investigation](dependency-compatibility.md) records
reviewed exact pins, a frozen installation, actual Android Metro resolution and
native SVG integration. That closes version selection for the feasibility build;
SDK HTTP/streaming and device rendering remain later feature validation. No API
key, SDK client or network request was used by this probe.

## Capability matrix and decisions

| Capability on the owner's Redmi Note 8 Pro | Decision / status | Evidence and limits |
| --- | --- | --- |
| Custom native build and metadata bridge | Verified by owner for debug feasibility | Android 11/API 30 and Termux 0.118.3 observed; delivered APK builds only arm64-v8a |
| Strict fixed-catalog native gateway | Prototype gate evidence recorded | Source entry-point review, 32 native unit tests, owner missing/forged-grant denial and background review revocation; not a general-purpose security proof |
| Local native echo | Verified by owner | Exact stdout/stderr, exit 7; expectedProbeMatched=true |
| Local manual cancellation | Verified by owner | Approved request retained, observed exit 143, termination verified; no remote/process-tree claim |
| Local automatic timeout | Verified by owner | Termination requested after about 2.1 seconds; exit preserved despite unavailable output/IOException; busy released |
| Local force-stop / restart | Verified by owner for new incident | Unknown/busy after force-stop; boot 295→296 reconciled same execution as interrupted with null exit/Unknown outcome; no restored grant |
| Legacy 211a... migration | Unknown | New successful recovery involved f629...; original record's disposition was not supplied |
| External Termux fixed echo/delay | Verified by owner after setup | Correct provider output and exits 7/0. Property rejection and permission-request-without-dispatch also recorded |
| External background completion | Verified with latency limitation | Matching successful callback arrived after 17332 ms against 12000 ms deadline; resultAfterTimeout=true; no proof of precise background UI transition time |
| External timeout / cancellation | Deadline only / remote cancellation unsupported | Do not infer process kill. Provider exit is separate from local processTerminationVerified=false |
| External force-stop / missing provider / permission refusal | Investigation extended; phone cases pending | [Source review and JVM preflight tests](external-failure-investigation.md) cover failure contracts. Missing-provider physical absence is not claimed; permission denial/caller restart still need owner observations |
| APK-owned binary packaging | Narrow Go | Device execution plus NDK/ELF/linker/hash/build checks; signed APK updates only; not an embedded Termux shell |
| Embedded Termux shell/package manager | No-go for adoption on current evidence | Experimental candidate and prefix/linker/writable-exec/provenance/maintenance issues documented; no compatibility claim |
| Embedded package tool installation | Not applicable to current prototype | No supported package manager or install API; no installation test attempted or claimed passed |
| Root, other ABIs/devices, broader tools | Unknown / not exercised | Wider device ABI list is not broader APK coverage; no root, Batch or Session API in this spike |

The packaged C probe executes from Android's installed native-library directory,
with min API 29, target 36, bionic linker /system/bin/linker64 and exact binary
hash checks. No target lowering or writable-app-home execution bypass was used.
The ORYN-owned C source is not copied Termux code. Its signed-APK update identity
is not an authenticated runtime package updater or independent rollback design.
The [runtime source review](runtime-review.md) records licenses, prefix rebuilds,
bootstrap trust and maintenance issues. A library license alone does not settle
all package redistribution requirements.

## Remaining acceptance work

- **External failure/lifecycle coverage:** [native preflight/source investigation](external-failure-investigation.md) is implemented. Permission-refusal and caller-restart phone results remain pending; missing-provider handling is isolated JVM/source coverage. Do not uninstall the owner's working Termux or
  clear runtime data to obtain a passing result.

The [reconciliation](device-results-review-2026-11-05.md) closes the supported
prototype/research items and records conditional embedded installation as not
applicable, not successful. Milestone 0 is not complete. There is no claim of
standalone Termux parity, production safety, or cloud-operated device testing.
