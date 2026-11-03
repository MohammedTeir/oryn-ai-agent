# Current follow-up — new native feasibility harness

The original uncommitted harness was not recovered. A new harness was created
under `spikes/android-feasibility/` with separate evidence. No previous test
result was inherited. The historical inspection below is retained for context;
its missing-toolchain/network blockers have been superseded by this follow-up.

## Cloud checks actually completed

| Check | Current result | Evidence |
| --- | --- | --- |
| Clean frozen dependency installation | Passed, npm ci in separate empty directory | [log](feasibility/cloud-evidence/frozen-install.log) |
| Expo package compatibility | Passed | [log](feasibility/cloud-evidence/expo-compatibility.log) |
| ESLint / TypeScript | Passed | Commands: npm run lint; npm run typecheck |
| Integrity unit tests | 4 passed, 0 failed | [log](feasibility/cloud-evidence/integrity-tests.log) |
| Android JS bundle | Passed, Hermes bundle exported | [log](feasibility/cloud-evidence/android-js-bundle.log) |
| Custom debug APK and Android lint | Passed; lint 0 errors, 54 warnings | [build](feasibility/cloud-evidence/native-build-full.log), [lint](feasibility/cloud-evidence/lint-results-debug.txt) |
| Bundled phone APK and release lint | Passed; lint 0 errors, 49 warnings | [build](feasibility/cloud-evidence/phone-build-full.log), [lint](feasibility/cloud-evidence/lint-results-release.txt) |
| Native unit test target | NO-SOURCE; zero native tests executed | Not evidence of authorization correctness |
| Pinned incremental rebuild | Passed; 8 tasks executed, 597 up-to-date; generated project files unchanged | [log](feasibility/cloud-evidence/native-build-incremental.log) |
| Both APK signatures | Verified, matching Android debug signer, v2 scheme | [phone signature](feasibility/cloud-evidence/phone-apk-signature.txt) |
| Phone APK contents | Embedded JS and ObserverModule dex class present; arm64-v8a; API min 29 / target 36; authorized app ID; blocked storage/overlay permissions absent | [metadata](feasibility/cloud-evidence/phone-apk-badging.txt) |

The delivered phone artifact is `spikes/android-feasibility/artifacts/oryn-feasibility-phone.apk`
(37,036,838 bytes), SHA-256 `1632915e380f9e9077076b161e1e46e66115dc2823294c55556a60f76d2c726b`. It uses the release variant with a debug
signer and included JS to support phone-only installation without Metro.
Minification was deliberately disabled for this debug-only probe; production
R8 optimization was not validated. Signature, TLS, checksum and lint checks
were not disabled. Icons reference approved repository PNGs without changing
the master artwork. Remaining lint warnings are recorded rather than suppressed.

An initial manifest namespace conflict was diagnosed and fixed by assigning the
observer library its own namespace. The application ID remains
`io.github.mohammedteir.oryn.feasibility`. A preliminary phone build was
intentionally interrupted to finalize icon/permission configuration; it is not
counted as a passed or failed functional test. See upstream-evidence.json for
chronology and pinned toolchain metadata.

## Current capability matrix and remaining exit gates

Target device: Redmi Note 8 Pro / MIUI 12.5.10 / Android 10 / arm64-v8a,
**user reported**, not yet observed by APK. Termux version/source: **Unknown**.

| Capability on that device | Status | Reason / next evidence |
| --- | --- | --- |
| APK installation and offline launch | Unknown | Owner must install and open the verified phone APK |
| JavaScript to Kotlin observation | Unknown | Tap Observe Android through Kotlin; capture actual JSON |
| Termux package detection/version | Unknown | Probe uses PackageManager, not shell commands |
| Native authorization enforcement | Unknown / not implemented | Separate native security prototype, negative tests and human review required |
| External Termux command/results | Unknown / not implemented | Native grant gate and version/permission/configuration evidence required first |
| Timeout/cancellation/background/process death | Unknown | No executable backend in this observation-only probe |
| Embedded shell/package manager/tool install | Unknown / not packaged | Packaging/linker/ABI/provenance/device tests required; no parity claim |
| Root | Unknown / not probed | No root API or command in this harness |

The observer exports only a metadata function. It cannot mint grants, dispatch
Termux intents or start processes. Its absence of execution APIs is not a proof
that a native authorization gateway has been implemented.

[Runtime review and conditional go/no-go decisions](feasibility/runtime-review.md)
and [device protocol](milestone-0-device-protocol.md) remain the next evidence
requirements. Milestone 0 is **not complete**. Inventory, provisional namespace
confirmation and the draft capability matrix are marked complete in PLAN.md. No platform draft,
publication, GitHub push or release was performed.

---

## Historical published-snapshot inspection

# Milestone 0 feasibility — current evidence

Date: 2026-11-03. This is a new inspection record, not restoration of the missing previous report.

| Capability | Current evidence | Decision |
| --- | --- | --- |
| Repository read | git ls-remote origin HEAD returned 6a2dad752c0ca0f37efbf34b923e8308c484e294 | Verified cloud read access |
| Original feasibility files and harness | All five requested paths absent | Restore original uncommitted files before reproducing prior build |
| Frozen install, lint, typecheck, six checksum-plugin tests, Android JS bundle | User reports previous passes; no harness, lockfile or logs available here | Not rerun or independently verified |
| Native APK and Android lint | Not run here: build script and Android toolchain absent | Blocked; no successful APK evidence |
| React Native Maven host | TLS-verifying curl HEAD to https://repo.reactnative.dev/ returned proxy CONNECT 403; curl exit 56 | Current destination access denied; exact artifact redirect not reproduced |
| APK signature | No APK available | Unverified |
| Kotlin bridge | No APK/device invocation | Unknown |
| Native authorization gate | No recovered source or device tests | Unknown; never bypass to obtain command evidence |
| External Termux | No device or runtime evidence | Unknown |
| Embedded shell/package manager/tool installation | No device, packaging, provenance or license evidence | Unknown; no parity claim |

The policy is restricted and enforced. No custom domains, runtime variables, secrets or outbound identities were reported. No credentials were requested. Git read works through existing platform authentication. Network checks needed command sandbox escalation; the allowed Git request then succeeded. The Maven host request reached the proxy and was denied.

## Resume prerequisites

Recover the original `docs/milestone-0-*` documents, `docs/feasibility/upstream-evidence.json` and complete `spikes/android-feasibility/`, including its lockfile and scripts, from the previous working environment or a preserved archive. Preserve these new records when reconciling recovered files. The previous exact sources cannot be reconstructed from a summary. A new harness would need a fresh upstream compatibility review and separate evidence lineage.

If the recovered dependency graph still redirects to repo.reactnative.dev, add that exact host to environment settings while preserving existing network presets/rules, then retest the actual artifact request. A host-root denial establishes policy blocking, not availability or integrity of any particular artifact. No configuration or publication was changed in this task.

After restoration inspect all scripts, dependency pins, verification settings and resource requirements. Install with the frozen lockfile; run the existing lint/typecheck/tests and Android bundling. Retry `bash scripts/build-cloud.sh` from `spikes/android-feasibility`, preserving its exit status and logs. Do not disable TLS, checksums or signatures. Verify any resulting APK with the installed Android SDK's `apksigner verify --verbose --print-certs`, record APK SHA-256, signer certificate digest, application ID, SDK/ABI metadata, source revision, uncommitted source diff and build commands. A valid debug signature is build evidence, not device installation or release readiness.

Milestone 0 remains incomplete. Device exit gates in PLAN.md section 3 remain open. No milestone checkboxes were changed.
