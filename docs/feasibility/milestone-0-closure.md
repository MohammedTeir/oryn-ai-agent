# Milestone 0 — feasibility exit record

**Assessment: complete for the bounded feasibility milestone on 2026-11-05.**
This is not v1/product completion, production authorization approval, complete
Termux parity, or support for untested devices. The original specification and
later milestone requirements remain unchanged. Native/dependency work is present
on main at `1084694` following merged PRs #7 and #8; no independent security audit
is asserted by their merge.

## Exit evidence

| Requirement | Evidence and outcome |
| --- | --- |
| Repository and assets inventory | [Inventory](../milestone-0-inventory.md), historical source/build lineage retained |
| Exact dependency/toolchain and device record | [Build/import selection](dependency-compatibility.md), pinned lockfile, actual Android Metro fixture/native SVG builds and [stack matrix](milestone-0-status.md); SDK API/device rendering are not claimed tested |
| Provisional debug namespace | Owner confirmed account ownership and authorized io.github.mohammedteir.oryn.feasibility; production namespace clearance remains later work |
| Physical Kotlin bridge and real approved commands | [Owner results](device-results-2026-11-05.json): Android 11/API 30, native echo and external Termux echo with real stdout/stderr, exit 7 and timestamps |
| Native Strict prototype | Source/export review, 38 native tests, owner invalid-grant denial, review reject/dismiss/background revocation; scoped to the fixed catalog, not a universal security proof |
| Local process timeout/cancellation/recovery | Actual exit 143 preserved despite closed pipes, automatic timeout about 2.1 seconds, local force-stop remains Unknown/busy, boot 295→296 reconciles the same local ID with null exit/Unknown outcome |
| External Termux setup and results | Actual property rejection then successful echo/delay; [background report](device-background-report-2026-11-05.json) shows a 17.332-second late callback against a 12-second deadline |
| Denied permission handling | [Final refusal report](device-permission-refusal-report-2026-11-05.json), reported Deny/refresh procedure and preflight/source tests: denied state, request without command dispatch, no new execution. Unchanged reads are deduplicated; no separate post-prompt callback timestamp is claimed |
| External caller restart | [Final restart report](device-external-restart-report-2026-11-05.json): same ec962... ID recovered as Unknown/busy then authentic matching callback with both recovery messages, exit 0 at 45143 ms, gate released |
| Missing provider and query failures | [Six injected JVM preflight cases and source path](external-failure-investigation.md), failing before command review. This does not claim physical Termux absence on the owner's phone |
| Embedded feasibility and package condition | Packaging/linker/ABI/prefix/executable restrictions, provenance, licensing and maintenance investigated. APK-owned C execution measured on device. Embedded Termux-compatible shell/package manager adoption remains **no-go**; conditional tool install is N/A because no package manager is supported, not a successful install |
| Decisions and fallback | Per-capability Go/no-go/Unknown matrix below and in the [current status](milestone-0-status.md); only tested external commands are an offered fallback, never implicit backend switching |

## Final phone evidence and its limits

The final [notes](device-final-evidence-notes-2026-11-05.json) distinguish complete
normalized owner reports from interpretation. [Preservation hashes](device-results-index-2026-11-05.json)
protect repository copies; they are not message signatures or installed-APK
attestation. No cloud runner controlled the phone.

Permission denial was observed before the request; the owner reported refusing
and refreshing afterward. The later export remained identical because unchanged
getState results are not appended. This supports the denial/no-dispatch flow in
combination with the reported procedure and tested native guard. It does not
invent a new post-prompt observation or prove an Android dialog event from JSON
alone. An earlier mixed attempt granted permission and ran echo; that attempt is
not counted as continued refusal.

For ec962736-3bf3-464f-84c8-b1014d989fdd, the first recovered-state capture was
40573 ms after dispatch, before the provider result. The procedure aimed for a
20-second reopen; that timing target is not asserted as observed. The report then
records exit 0, provider error -1, exactly the recovery started/finished lines,
and busy=false after a reported 45143 ms (deadline 60000 ms). This proves recovery
of a matching result for the owner-reported caller force-stop/reopen procedure.
It does not prove completion while the caller stays force-stopped, provider
process death, vendor-independent timing or Android 15+ behavior.

`processTerminationVerified: false` remains in the external result. A provider
exit report is not local independent proof of a remote kill. The echo-only
expectedProbeMatched flag is false on the recovery script; its actual output and
exit are reviewed separately. Historical lastRecovery for local f629... is not
mistaken for recovery of this new external execution.

## Accepted capability decisions and carry-forward limits

- **Narrow Go:** fixed Strict-approved external Termux commands on this Redmi
  Note 8 Pro/Android 11/observed Termux 0.118.3 after Android/property setup, normal
  and late callbacks, and caller reopened before the tested result delivery.
- **Narrow Go:** the hash-verified APK-owned arm64 C probe, with local output,
  exit, timeout, cancellation and conservative local restart reconciliation.
- **Unsupported/no guarantee:** external cancellation or process-tree termination,
  remote reboot-based recovery, automatic retry, and result recovery after a
  callback is lost while the caller remains stopped. Missing results stay Unknown
  and block further work; earlier approvals never create new authority.
- **No-go for adopting embedded Termux shell/package support now:** do not claim
  standalone parity or install arbitrary downloaded packages in writable app home.
  Reopen the conditional install test only after a supported package strategy.
- **Unknown/unverified:** broader OS/device/ABI/tool coverage, exact installed APK
  hash, Termux install source, original legacy 211a... incident disposition, actual
  device-uninstalled-provider behavior, live Gemini calls/streaming and secure-key
  integration, phone SVG rendering, root/Batch/Session and general-purpose command
  scope enforcement. These are explicit limits/later validation, not passed tests.

The tests here satisfy the prototype feasibility investigations, including
isolated failure-contract coverage; they do not replace release integration,
security, RTL/accessibility or broader physical-device validation. Production
must advertise only verified capabilities and offer explicit fallback where
applicable. The next engineering milestone is Milestone 1's UI/onboarding/local
foundation; its unchecked requirements and the full v1 acceptance gate remain.

## Verification of this record

Evidence JSON, preservation hashes, execution-ID/boot/deadline correlations,
relative document links and checklist coverage are checked separately from code
and APK verification. This closure changes documentation/evidence only. Existing
cloud build/signature checks and the owner's phone observations retain their own
provenance; no new runtime execution or API request is performed to close a box.
