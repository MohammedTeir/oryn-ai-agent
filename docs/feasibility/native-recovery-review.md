# Native timeout and recovery fix — security review task

This task follows the owner's 2026-11-04 screenshots after the phone harness in
PR #3. It changes native result observation and persisted recovery, not the UI
or available commands. Milestone 0 remains open.

## Observed failure and diagnosis

The phone shows `unknown_recovered_pending` for `native_timeout`, execution ID
`211a8981-c887-4d7e-9a4d-424e6f3dbe0d`, `executionBusy: true`, and no final exit
code. Missing/forged-grant calls were rejected without entering the denial sink.
Cancellation reported no current native handle. This establishes missing result
and blocked recovery, not successful timeout or a particular process-death cause.
The exact installed APK hash and Android crash/exit trace are not supplied.

Source review found a reproducible result-loss path: the old worker combined
termination observation and output collection in one try block. Android 11's
`Process.destroyForcibly()` delegates to `destroy()`, and its concrete UNIXProcess
implementation closes stdout/stderr. Reading those closed streams can throw,
replacing an already available exit observation with `unknown_native_result`.
A subsequent cold initialization reports the persisted pending record as
`unknown_recovered_pending`. This explains a possible path to the screenshots;
without device logs it does not establish that it was the only cause.

Official Android 11 sources reviewed (android-11.0.0_r1):

- [Process.java](https://android.googlesource.com/platform/libcore/+/refs/tags/android-11.0.0_r1/ojluni/src/main/java/java/lang/Process.java)
  SHA-256 of decoded source: `0ac2c349a28c2a911fa3992ab2868873be7d69fa820bff8c48d7a055d35642ce`.
- [UNIXProcess.java](https://android.googlesource.com/platform/libcore/+/refs/tags/android-11.0.0_r1/ojluni/src/main/java/java/lang/UNIXProcess.java)
  SHA-256: `16d0a310d2c53caa3f3a716d6ed18a579d350e6c92e85f11e26dd1ac1cb9983b`.

## Result handling

The new observer establishes `exitValue()` independently of wait/kill/read
errors. A confirmed exit clears only the matching pending operation even when
output is unavailable. Each output stream has separate completion, truncation
and error-class fields. Unavailable output is null, not fabricated empty output.
Captured bytes are bounded and native redaction still applies. Unknown exit
never clears the execution gate or claims termination. The observer serves only
the compiled-in C probes with tiny output; it is not streaming support for an
arbitrary shell or package manager.

## Safe recovery of the existing record

New local native dispatches persist Android's observed `Settings.Global.BOOT_COUNT`.
On cold initialization only, a strictly higher boot count proves that the earlier
local probe process cannot still be running. The exact pending record is marked
`interrupted_by_device_restart`, with `commandOutcome: unknown`, `exitCode: null`,
and explicit boot-count evidence. It is not marked a successful command or a
successful timeout. The reconciled record is retained separately as `lastRecovery`
when later tests replace the latest state. No token or authorization is restored;
every new execution still needs a fresh native confirmation.

Legacy pending records, including the owner's screenshot, lack a boot count.
The updated APK must first open and record a current baseline. A later device
restart, followed by reopening the app, is required before this legacy record
can be reconciled. App relaunch, APK upgrade, elapsed wall-clock time, a guessed
PID, or a user assertion alone never clears it. Missing/invalid/regressed boot
observations stay blocked. This rule applies only to the exact fixed local
native catalog, never external Termux or unclassified actions.

## Phone verification after review

Cloud validation on 2026-11-04 passed Expo compatibility, ESLint, TypeScript,
seven JavaScript tests, and 30 native tests (16 gateway, five redaction, nine
observer/recovery; zero failures/errors/skips). Both debug and phone APK builds,
Android lint, signature checks and phone APK JS/native-byte verification passed.
The new tests cover closed pipes with confirmed exit, unknown exit, interrupted
wait, failed termination, bounded output, and same/missing/regressed boot counts,
unrelated execution IDs and remote/unclassified recovery refusal. Persisted
Android recovery and the actual MIUI behavior are **not verified on device**.

1. Save/share the existing evidence. Install the reviewed update over the existing
   debug app, preserving data. Open it once. It should still show pending, with
   `nativeBootCount` and `recoveryRequirement: device_restart_then_reopen`.
2. Save other phone work, restart the **phone**, then reopen ORYN. Capture the
   matching original execution ID, increased boot count, interrupted/Unknown
   outcome and `executionBusy: false`. If boot observations are unavailable or it
   remains busy, share the JSON; do not clear data or reinstall to bypass it.
3. Run missing/forged-grant tests. Reject one native approval and verify no new
   execution. Approve `native_echo` and capture genuine stdout/stderr/exit 7.
4. Approve `native_timeout`. Capture actual exit and termination flags. Output
   may be unavailable after termination; the explicit output error is not a lost
   exit or a successful output capture. Repeat with fresh approval for cancellation.
5. Continue the external Termux/lifecycle tests in the device runbook. These are
   not made complete by this local-native fix. External uncertainty still needs
   an authentic provider result; reboot is not used to reconcile a remote job.

Native security changes require tests and human review under AGENTS.md. Keep the
PR unmerged until reviewed. Cloud tests do not validate MIUI boot-count access,
actual process execution, restart behavior, callbacks or Android dialogs.
