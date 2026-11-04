# Milestone 0 phone test runbook

This runbook applies to the **device harness** branch, not the earlier observation
APK. It does not record completed tests. Required device: the owner's Redmi Note
8 Pro, observed Android 11/API 30 and arm64-v8a support. MIUI 12.5.10 is an earlier
owner report. Termux 0.118.3 was detected; installation source is still Unknown.
Use only the signed phone artifact from the matching successful GitHub Actions
run. Save its source commit, SHA256SUMS, signer digest and APK metadata alongside
results. Do not assume an older installed APK is this build.

If the app is already stuck on `unknown_recovered_pending` for a local native
probe, stop normal tests and follow the [native recovery review/runbook](native-recovery-review.md).
An app restart alone is not evidence that the old process ended.

## Install and capture

Download the signed phone artifact ZIP from the branch's successful **Signed
feasibility APK** run, extract it on the phone, and install
`oryn-feasibility-phone.apk` with Android's deliberate installation consent.
This uses the provisional debug-only ID and debug signer. Do not uninstall an
existing app or erase data to work around a signature mismatch; report the error.
Open the app without Metro. Record whether it also opens with networking off.
Restore networking if needed for your usual phone use; none of these probes
requests network access.

Tap **Observe Android through Kotlin**, then **Share captured evidence JSON**.
Send the JSON with its matching Actions run/source identity. The current observer's
legacy `executionCapability: not_implemented` describes the observation protocol;
separate `OrynExecutionSpike` records describe the experimental execution API.
The UI makes no runtime-ready claim based on package detection.

The share sheet is user-initiated and does not send anything automatically. Reports
contain device metadata and bounded, native-redacted fixed-probe output. Review
before sharing. Capture timestamps are UI observations, not process start times.
The last 40 entries are kept in UI memory. Share after each test and before
restarting. Only the latest native state/pending operation is persisted.

## Tests in order

1. Tap **Test missing and forged grants**. Both records must show `rejected: true`,
   `dispatchSinkEntered: false`, and `backendExecutionAttempted: false`. This is a
   direct JS call into a native denial sink; it cannot start a backend even if the
   denial test fails. A failing result stops the test session.
2. Tap **Packaged native probe: stdout, stderr and exit 7**, then **Reject** in the
   native dialog. Expect `rejected_no_dispatch` and no new execution ID. Repeat,
   approve the exact displayed action, and wait for native `state: exited`, stdout
   `ORYN native stdout\n`, stderr `ORYN native stderr\n`, exit code 7 and
   `expectedProbeMatched: true`. Exit 7 is deliberate, not an app failure.
3. Run **Packaged native probe: two-second timeout** with exact native approval.
   Record the actual elapsed time and exit code; do not expect a fixed kill code.
   `timeoutTerminationRequested` and `processTerminationVerified` must be true.
4. Start the **eight-second cancellation test**, approve, then promptly tap
   **Review cancellation of current native probe** and approve its separate native
   dialog. Record actual exit/result and `cancellationRequested`. If it already
   exited, record that race honestly and repeat only with a fresh approval.
5. Prepare your **existing Termux**: open it and confirm its normal prompt appears.
   Record its installation source if known; Unknown is allowed. Termux's documented
   `allow-external-apps=true` property must be enabled in its own
   `~/.termux/termux.properties` for this integration. Editing that property grants
   other Android-permission-authorized apps command access too; restore your
   preferred setting after testing. Do not replace the file wholesale, uninstall
   Termux, mix installation/signing sources, or delete its data. If you need help
   enabling the property, report the setup screen/error before changing it.
6. Tap **External Termux: stdout, stderr and exit 7**. The first tap may only request
   Android's **Run commands in Termux** permission. Refuse it once and capture the
   refusal/request state; no command should dispatch. Grant it deliberately through
   Android/app permissions and tap again. Review the exact native dialog, approve,
   and capture stdout `ORYN termux stdout\n`, stderr `ORYN termux stderr\n`, exit 7
   and `expectedProbeMatched: true`. `provider_rejected`, missing output, timeout,
   or missing callback are **not** success. Share their exact observed JSON.
7. Test background rejection: open a new approval dialog and press Home **without
   approving**. Return and capture revocation/dismissal with no new execution.
   Then approve the external eight-second lifecycle probe, press Home while it is
   awaiting a result, wait, and return. Capture the actual result or Unknown. The
   harness never starts a follow-up command on return. External cancellation is
   explicitly unsupported and must not be reported as verified.
8. **Process death last:** first share all earlier evidence. Approve the external
   eight-second probe and use Android's app settings to force-stop ORYN while it
   awaits the callback. Reopen and capture the persisted state. A recovered pending
   operation must remain uncertain/block new starts until a genuine matching result
   is observed. Delivery after force-stop may be prevented by Android. Do not clear
   app data, reinstall, or bypass the busy gate to claim recovery success.

Stop on unexpected execution, a denial failure, or uncertain blocking state.
Share that evidence; do not repeatedly retry or guess an outcome. Missing-Termux
handling should be tested on a separate suitable device/profile with no Termux,
not by asking the owner to uninstall their working environment. That coverage
remains Unknown on this one-phone setup.

## Coverage limits and completion

Native unit tests cover descriptor mutations, replay, expiry, revocation,
concurrency and restart semantics. The device denial button alone does not prove
all those properties across Android IPC/lifecycle; instrumentation/security
review remains separate. Timings and results must be observed, not copied from
this runbook's expected outputs.

The packaged C probe establishes only a narrow APK-binary experiment if it runs.
It is not an embedded shell, package manager or Termux-compatible environment.
No tool installation is supported in this harness, so that conditional test is
not attempted; the unsupported scope must remain in the capability decision.
After phone evidence arrives, reconcile every result with PLAN.md section 3,
update the capability matrix and decide remaining go/no-go outcomes. Do not mark
Milestone 0 complete merely because this runbook or a green APK build exists.
