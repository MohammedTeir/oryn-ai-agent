> Follow-up: [dependency build/import compatibility](dependency-compatibility.md) now records tested exact selections. The external failure/lifecycle requirement below remains open. The original owner reports are unchanged.

# Owner device results and Milestone 0 reconciliation — 2026-11-05

**Milestone 0 remains open.** The owner supplied the device results below in chat.
This task preserves and reviews those observations; no cloud runner operated the
phone. Completed experiments do not establish production readiness or universal
runtime compatibility.

## Preserved evidence and provenance

- [Selected result entries](device-results-2026-11-05.json): device observation,
  native echo/cancellation/automatic timeout, Android permission-request state,
  Termux configuration rejection and successful commands, background review
  revocation, force-stop recovery, and reboot reconciliation. This is explicitly
  an excerpt collection; repeated/intermediate entries were not all copied.
- [Complete final background report](device-background-report-2026-11-05.json):
  normalized transcription of all four entries in the owner's final report,
  exported at `1793889782778`. Nulls, strings and provider-reported values are
  retained. Serialization/key order need not match the message's original bytes.
- [Preservation hashes](device-results-index-2026-11-05.json): checksums of these
  repository files, not cryptographic attestations from the phone or message.

Device: Redmi Note 8 Pro, observed Android 11/API 30, supported ABIs arm64-v8a,
armeabi-v7a and armeabi. The delivered APK build target is arm64-v8a only. MIUI
12.5.10 is an earlier owner report. Termux 0.118.3 is observed; installation source
is Unknown. The exact installed APK hash/source identity is not attested by these
reports. Do not silently bind them to a particular CI artifact SHA-256. The
legacy observer's `executionCapability: not_implemented` is a metadata-protocol
field; separate experimental execution records carry the actual probe results.

## Results

| Experiment | Evidence | Finding and limit |
| --- | --- | --- |
| JS/Kotlin observation | Observation at `1793888892227` | Device/API/ABI/package/Termux metadata returned; no general command readiness inferred |
| Missing/forged grants | Paired `native.negativeProbe` entries at `1793888892505` | Both rejected; sink not entered. The sink is intentionally side-effect-free, not a real backend invocation |
| Native echo | `7fa49a7b-9b94-4e65-8fc1-61fe89f1dc9d` | Actual fixed stdout/stderr, exit 7, complete output, expected match; 106 ms observed by native supervisor |
| Approved manual cancellation | `6955d180-4181-4ccf-b153-08a4600e1859` | Cancellation request recorded, exit 143, termination confirmed, gate released. Although probe ID is native_timeout, automatic timeout was false; do not count this as its timeout proof |
| Automatic local timeout | `e3683491-91ee-4d01-b921-06739d3a15e9` | Automatic termination requested, exit 143 observed after 2103 ms, gate released. Output unavailable/IOException, correctly separate from confirmed exit |
| Android Termux permission setup | Request state at `1793888901290` | Permission requested without command dispatch. Permission-refusal behavior was not independently demonstrated |
| Termux provider rejection | `2b2d88c5-bf7d-4f38-959a-800a769ae3b4` | Provider error 2, no exit, gate released. Owner's accompanying notification said allow-external-apps was required; subsequent results followed reported configuration correction |
| External echo | `73b0f675-b3ba-4297-8c6d-53cb1638151d` | Provider returned exact stdout/stderr, exit 7, error -1, expected match. 244 ms is dispatch-to-callback observation, not independently measured process duration |
| External delay | `9e05786f-6f4e-4e59-8b19-9e0e8ffa2dc7` | Started/finished messages, exit 0, callback after 8093 ms. expectedProbeMatched=false because current code matches echo only; no automatic success inference from that flag |
| Background unapproved review | Request at `1793889427228` | review_revoked_on_background; same previous completed timeout record and no new execution ID in that export |
| Force-stop of local probe | `f6292030-4348-4633-92fc-ce2965b8ad70` | Owner followed the force-stop procedure; cold report retained running-before-recovery as Unknown, busy=true and no fabricated exit |
| Phone restart reconciliation | Same `f6292030-4348-4633-92fc-ce2965b8ad70` | Boot count 295→296, interrupted_by_device_restart, unknown command outcome/null exit, fresh approval required, busy=false; lastRecovery retained |
| External background completion, late callback | `015acdb4-cb50-4d09-a39c-1f4bcd3bc95c` | Owner reports Home/return procedure. Genuine matching callback with started/finished messages and exit 0 arrived after 17332 ms, beyond 12000 ms deadline; resultAfterTimeout=true, gate released |

The background export's `processTerminationVerified: false` must be retained. It
is not local proof of remote process termination; the provider's exit result is
separate evidence. Do not interpret the deadline as a remote kill. The report
contains no sampled intermediate timeout entry, so it does not independently
prove precisely when the UI changed to Unknown while backgrounded. It does show
a late matching result reconciled with the correct execution ID. Android
scheduling/callback delay is observed; its specific cause is Unknown.

Reboot recovery proves the new `f629...` incident only. The original `211a...`
legacy incident's final disposition is not in these reports; baseline migration
of that exact old record is not retroactively marked verified. A separate newer
report began with not_started/lastRecovery=null, whose cause is Unknown.

## Native entry-point review (bounded prototype)

Reviewed repository base `79892191377459575fbbf22c96707704c9433ab9`, incorporating
merged native PRs #2 and #4. ObserverModule exports metadata only. ExecutionModule
exports getState, requestProbe, requestCancel and negativeProbe. Real starts and
cancellation call StrictGate.dispatch inside Android-owned native confirmation;
grant issuance is called only from that confirmation path and is not an Expo export.
No arbitrary executable/argument or backend-start method is registered for JS.
ProbeRuntime and StrictGate are internal implementation classes. The export
feature in PR #5 adds clipboard/document-picker operations, not command dispatch
or grant authority, and did not change the gateway.

The 32-test native suite includes exact descriptor mutation, missing/forged grant,
replay, expiry, background dispatch, revocation, concurrency and recovery tests.
Combined with the owner's denial and background-revocation observations, this
supports the Milestone 0 **fixed-catalog** native-gate prototype item. It is not a
formal proof against arbitrary native-code compromise, a full Android IPC audit,
or approval of future general-purpose/root/Batch/Session execution. New command
entry points require the same gateway and fresh review/tests.

## Capability decisions and conditional requirements

- **Go, narrowly:** fixed Strict-approved external Termux commands on this device
  after permission/property setup, including matching normal and late callbacks.
  Keep the observed background delay visible in support expectations.
- **Go, narrowly:** the ORYN-owned APK-packaged arm64 C probe, with demonstrated
  output/exit, local cancellation/timeout and conservative restart recovery.
- **Unsupported:** external cancellation/guaranteed remote termination. A local
  timeout is an observation deadline, not a stop command. No silent backend
  switching or unapproved retry is allowed.
- **No-go for adoption now:** an embedded Termux-compatible shell/package manager.
  The [source review](runtime-review.md), [stack/capability record](milestone-0-status.md)
  and successful packaged-binary experiment establish a narrow feasible binary
  path but not compatible packages, filesystem prefix, updater or redistribution
  readiness. libtermux-android remains an experimental, unadopted candidate.
- **Conditional tool-install test: not applicable to this prototype.** There is no
  supported embedded package manager or package installation API. No tool was
  installed or invoked through such a manager; this is not a passed install test.
  Reopen that condition if a supported runtime/package strategy is introduced.
- External fallback is allowed only for the external capabilities actually tested;
  it does not convert the APK into standalone embedded Termux or prove broad tool
  compatibility. Root, other ABIs/devices and wider OS coverage remain Unknown.

## Requirements still open

1. **Exact compatible icon/Gemini stack selection.** Expo/RN/Kotlin/Gradle/SDK and
   observed Termux pins are recorded. lucide-react-native and @google/genai were
   reviewed as candidate metadata, but not installed/app-validated or selected as
   compatible. A real compatibility investigation/decision is still required;
   don't mark that requirement complete based only on npm peer ranges.
2. **External Termux coverage.** Normal and background/late callbacks are proven
   on this device. External app-process death/force-stop, missing Termux and
   explicit permission refusal remain untested. Local C-process recovery is not
   a substitute. The single-phone setup does not justify uninstalling Termux or
   clearing data; design isolated coverage and safe remote reconciliation before
   another potentially blocking external test.

No more repeated phone smoke tests are needed for the results already captured.
The next work is dependency compatibility and the remaining external failure/
recovery investigation. PLAN.md retains these open requirements. Do not declare
Milestone 0 complete or waive its exit criteria based on this reconciliation.
