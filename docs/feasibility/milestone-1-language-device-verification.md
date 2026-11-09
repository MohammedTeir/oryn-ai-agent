# M1-01 — Android language preference device verification

**Status: OPEN — device observations pending.**  
**Prepared:** 2026-11-08  
**Requirements:** [M1-01 in the ordered backlog](../milestone-1-tasks.md#m1-01--android-verification-of-pr-24), [Milestone 1 audit](../milestone-1-audit.md), [specification v1.10](../../ORYN_Master_Project_Specification.md).  
**Feature under test:** merged [PR #24](https://github.com/MohammedTeir/oryn-ai-agent/pull/24), SQLite-backed System / English / Arabic selection in the explicitly labeled Milestone 1 **navigation preview**.

> This document is a procedure and an empty evidence register, **not a claim that device tests were performed**. Do not mark M1-01 or any PLAN Milestone 1 checkbox complete until real observations have been recorded and reviewed.

## Available test build and provenance

A signed **test-only** APK artifact was verified present (and not expired at review time) in successful [Signed feasibility APK run #79](https://github.com/MohammedTeir/oryn-ai-agent/actions/runs/42357078180) associated with PR #24.

- Workflow run: `42357078180`, conclusion `success`.
- Artifact name: `oryn-feasibility-phone-79-4c91b850688ca9682c23b5549e22dc8e330f68dc` (GitHub artifact ID `13567453382`).
- GitHub reports artifact expiration **2026-11-21 08:55 UTC**, subject to actual artifact availability when downloaded.
- PR branch head: `c7889aea59da96168c53ac9e289e0bafb3f61288`. Artifact name refers to a separate workflow checkout SHA; **do not assume the installed APK's exact source identity from the PR title or branch head**.
- The artifact ZIP should contain `oryn-feasibility-phone.apk`, `SHA256SUMS`, `build-info.json`, `source-commit.txt`, and signature/package metadata. Copy the **actual** source commit and APK SHA-256 from those files; independently verify SHA-256 on-device if possible. Report `Unknown` where unverifiable.
- A successful `main` test prerelease for a later commit may also be used, but **record its exact release tag, source SHA, APK hash and signer**. Never mix evidence for different versions.

This is the *debug-signed* `io.github.mohammedteir.oryn.feasibility` app, not production signed. Debug signers can differ across builds: if Android rejects an update, **do not uninstall the prior app or clear its data solely to pass this test**; capture the install error. Old language preference may be lost on an uninstall.

## Before testing

1. Ensure there is **no active, uncertain or pending native command/probe** in the feasibility harness. These language tests require **no shell command or Termux authorization**.
2. On the Android phone, download the artifact ZIP from the successful run's **Artifacts** panel, extract it, and record `build-info.json`, `source-commit.txt`, and `SHA256SUMS`. Install the APK only if safe to update the current test app; preserve existing application data.
3. Note the phone model, Android version, system-language order, display/font size, installed APK provenance, date/time of observations, and whether the app was **foreground-resumed**, **recreated with a new JavaScript session**, or **force-stopped via Android settings**. Do not equate these events.
4. Launch the feasibility application. Tap **Open Milestone 1 navigation preview** (the surrounding button may appear in the phone's current system language). Confirm the preview displays its unimplemented-feature notice. This is not a production Settings screen.
5. Avoid exposing credentials or personal notifications in screenshots. Inspect evidence before sharing. No approval or command execution is necessary for these tests.

## Manual acceptance matrix

Fill every **Observed** field after actual device interaction. `Not tested` is acceptable; never convert an expected result to a measured result.

| ID | Procedure | Expected behavior | Observed | Status |
| --- | --- | --- | --- | --- |
| L01 | Open the preview for the first time, before manually selecting a language; note the phone's system language | Device language is selected when no stored choice exists; matching UI strings appear | Pending | Not tested |
| L02 | Select **English** | English preview labels and selection indicator; save state resolves without an unconfirmed error | Pending | Not tested |
| L03 | Leave the preview using **Return to feasibility tests**, then reopen it | English remains selected and displayed (without reselecting it) | Pending | Not tested |
| L04 | Select **العربية** | Arabic preview labels appear with RTL layout; ORYN symbol does not mirror | Pending | Not tested |
| L05 | With Arabic selected, open **Approval card example** and expand **Details** and **More approval options** | Example remains clearly labeled non-executable, Arabic details appear and the command text `echo ORYN` remains LTR; disabled approval controls stay disabled | Pending | Not tested |
| L06 | Close the preview, reopen and inspect the selected language | Arabic remains selected | Pending | Not tested |
| L07 | Close the application normally and reopen; check preference again | Saved language remains Arabic; record whether this was only activity resume or a new JS session | Pending | Not tested |
| L08 | With **no active native probe**, deliberately force-stop **ORYN Feasibility** using Android **Settings → Apps** and reopen | Saved language still Arabic after a verified Android force-stop/relaunch (if this procedure was actually performed) | Pending | Not tested |
| L09 | Change to **Device language/System**; exit/reopen | The system-language preference is persisted; effective English/Arabic follows the phone's ordered supported locales | Pending | Not tested |
| L10 | With Arabic selected, check header, tab labels, Settings navigation and back arrow | RTL layout; directional back arrow mirrors but logo does not; no overlap/truncation | Pending | Not tested |
| L11 | Optional accessibility spot check using enlarged Android font setting and TalkBack | Labels remain readable, controls remain reachable and screen-reader names make sense; record actual font/display settings | Pending | Not tested |
| L12 | Check that language changes do not trigger a native approval dialog, command, API-key exposure or executable action | No executable action is dispatched; no credential is displayed or exported | Pending | Not tested |

**Test boundaries:** Error-state handling (read/write/close failure) is covered by PR #24's automated tests, but cannot be claimed physically validated without an actual reproducible failure case. Device language changed while the preview is already open, 360 dp/200% typography, installed APK integrity, Android process termination, and wider OEM/Android coverage are **Unknown** unless independently observed.

## Evidence packet to provide for review

Please supply the observed result for each manual case (Pass / Fail / Not tested), and at least the following material if feasible:

- **Build provenance:** artifact/release URL or run ID, actual `source-commit.txt` value, `build-info.json` APK SHA-256 and signer; record `Unknown` if missing.
- **Device and language:** Android version, device model, current system language, approximate font scale, and whether a force-stop was performed.
- **Screenshots:** English selected; Arabic selected; Arabic approval example with expanded Details; language selection after reopening; optional font-scaling or error screenshot.
- **Observed transitions:** whether selection survived switching preview, closing/reopening, a new JS session and independently verified force-stop.
- **Failures:** exact safe-to-share UI text and steps; do not provide live credentials, private paths, unredacted logs or personal data.

### Reviewer-only result summary (do not complete from expectations)

- **Code/CI baseline:** PR #24 automated test/build reports already verified; they do **not** establish device acceptance.
- **Device:** Pending.
- **Installed APK/source hash:** Unknown.
- **L01–L12 results:** Pending.
- **Language persistence after app reopen:** Unknown.
- **Language persistence after verified force-stop:** Unknown.
- **RTL/legibility accessibility:** Unknown.
- **Unexpected command/approval/secret exposure:** Not tested on device.
- **M1-01 closure decision:** **OPEN / awaiting device evidence**.

## Completion / PR handling

1. Record the owner's actual observations with timestamps/provenance and note any cases not tested.
2. If a functional bug appears, open a separate source-fix PR and repeat the affected device checks after merging it.
3. Review all evidence and mark M1-01 complete in the task register **only when its acceptance criterion is demonstrated**; do not treat a passing CI workflow or this runbook as closure.
4. Continue with **M1-02** (AI Agent visual/RTL design gate) only after the M1-01 findings are reconciled, or do parallel non-dependent research without claiming M1-01 complete.
