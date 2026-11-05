# External Termux failure/lifecycle investigation

This is a separate native security/test task after the dependency compatibility
investigation. It retains the existing Strict gateway and does not manufacture
Termux absence, permission denial, output or successful recovery in the app.

## Missing package and permission prerequisites

`TermuxPreflight.requireForReview` is shared by the real requestProbe path. It
checks package availability first and permission second. Missing package,
permission denial and query exceptions cannot reach native command review.
Permission must be checked again for every request; passing the preflight never
creates a grant. Actual dispatch still requires the existing Android-owned exact
confirmation and StrictGate validation. PackageManager NameNotFoundException is
mapped to missing Termux; other query failures fail closed.

Six JVM native tests cover absent package/no permission query, denied permission,
ordered checks, package-query failure, permission-query failure and rechecking a
revoked permission. These are injected unit-test inputs, not simulated states in
the device UI or a claim that the owner uninstalled Termux. Real installed-package
absence on a separate phone/profile is not verified on device. Do not uninstall
the owner's working Termux to obtain this coverage.

getState now includes real Android `externalPrerequisites`: package state,
RUN_COMMAND permission state and provider configuration `not_observed`. This
observation neither runs a command nor labels Termux Ready. A metadata query
failure remains Unknown without discarding the local execution result.

## Android 11 source contract and restart test

Reviewed official Android 11 `android-11.0.0_r1` ActivityManagerService and
PendingIntentRecord, plus Termux v0.118.3 ResultSender. Source hashes are in the
[review record](external-failure-source-evidence.json).

The reviewed AMS broadcast path adds FLAG_EXCLUDE_STOPPED_PACKAGES. The reviewed
forceStopPackageLocked removal of pending intents is conditional on a null
package or uninstalling; do not import newer Android force-stop assumptions into
Android 11. PendingIntentRecord sends using the stored creator context. Termux's
sender adds the result bundle to a new intent without an include-stopped flag,
and handles PendingIntent.CanceledException without a retry. This limited source
review is not an exhaustive audit or an observation of MIUI's implementation.

Therefore an ordinary killed caller and an explicitly stopped package are not
interchangeable cases. Reopen the caller before the result is sent for the
planned test. We do not add INCLUDE_STOPPED_PACKAGES to override the user's stop
choice. A missing result remains Unknown/busy; no reboot-based reconciliation of
external work or guessed remote termination is added.

The fixed `termux_recovery` catalog action prints a start message, sleeps 45
seconds and prints a finish message; its observation deadline is 60 seconds.
It requests no root/network/command file writes and uses the same external
provider/environment caveats as the earlier probes. Native EN/AR confirmation
shows the exact shell/argument/directory/effects and requires fresh authorization.
No generic command input or delayed background dispatch is introduced.

## Cloud validation

Expo compatibility, lint, typecheck, eight JavaScript tests, 38 native tests
(including six preflight cases), both Android JS bundles, debug/phone native
builds, Android lint, signatures and bundled JS/native-byte checks passed locally.
The build inherits the dependency task and the already requested PR #5 export
controls so the owner can return full evidence. No new phone result is claimed.

## Required owner checks after native review

Keep app/Termux data and the allow-external-apps setting. Save existing evidence.
Do not start with another execution pending. The build includes the previously
requested copy/save export feature so the full JSON can be returned.

1. **Permission refusal:** in Android App info for ORYN, deny/revoke **Run commands
   in Termux** (MIUI wording may differ). Reopen ORYN; native metadata should say
   runCommandPermission=denied. Tap **External Termux: stdout, stderr and exit 7**.
   If Android asks, choose Deny. Copy JSON. The request should only report
   android_permission_requested_no_command_dispatched, permission should remain
   denied, and no new execution ID should appear. If the permission is not shown
   in settings, report that screen rather than guessing another permission.
2. Restore that Android permission deliberately. Tap **External Termux: 45-second
   caller restart test**, then approve the exact native prompt. Force-stop only
   ORYN via its App info, immediately reopen ORYN (aim within 20 seconds), and
   keep it open until after the 45-second result. Copy JSON. The same execution
   should move from recovered Unknown/busy to a genuine matching provider result
   with both recovery messages, exit 0 and busy=false. The existing
   expectedProbeMatched flag matches echo probes only, not this recovery script. A fast callback might omit
   an intermediate poll; retain whatever was actually captured.

Do not leave ORYN force-stopped through callback time, force-stop Termux, clear
data, uninstall, or press Cancel for this test. External cancellation remains
unsupported. If the result stays Unknown after 90 seconds, share that JSON and
stop; do not retry or infer success. This is a real failure outcome requiring
investigation, not a reset opportunity.

The native task needs human review under AGENTS.md. Passing JVM tests, reading
Android sources and adding the test button do not complete the remaining phone
checks. Milestone 0 remains open until the results and per-capability decisions
are reconciled. No live test has yet verified these new cases on the phone.
