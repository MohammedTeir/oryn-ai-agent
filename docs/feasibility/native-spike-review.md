# Native security spike — review branch

This is the draft recovered from the published workspace after its disconnection.
The last UI/TypeScript bridge wiring edit did not survive and has not been
reapplied. The observation screen remains observation-only. A separate
`OrynExecutionSpike` native API is registered for review and later device testing.
No Milestone 0 execution or authorization checkbox is marked complete here.

## Native authorization boundary

Only compiled-in benign probe IDs are accepted. An Android-owned light-mode
confirmation shows the exact executable/argument, backend, directory,
environment policy, binary identity, timeout and effects in each review. Approve
issues an in-memory, one-use Strict grant; the grant is never returned to JS.
The gateway binds every immutable descriptor field, uses a monotonic expiry,
checks foreground state at dispatch, rejects replay/mutation/revocation, and
blocks another execution while an operation is active or uncertain.

Cancellation of the current native test process needs its own native approval
bound to that execution ID. External Termux cancellation is unsupported; the
code does not stop Termux's service or claim process-tree termination. Missing or
malformed results retain an uncertain, blocking state. Restored pending work is
not reported as running or complete without new observations. Unconsumed grants
are revoked on background/activity destruction and do not survive process death.

The native APIs have no arbitrary-command, grant-issuance, root, Batch or Session
entry point exposed to JS. The negative probe uses a side-effect-free sink so a
failed denial check cannot itself run a backend. This is research code, not a
proof of production sandbox containment or an approved general-purpose policy.

## Runtime scope

External Termux uses the reviewed v0.118.3 RUN_COMMAND service, permission and
PendingIntent result contract. Results are correlated with a one-shot explicit,
non-exported receiver and per-execution nonce. The inherited Termux environment
and executable digest are not independently verified. Provider errors, late
callbacks and missing exit/output fields remain explicit. No API-key storage or
Gemini request is involved; local output is bounded and credential-like text is
redacted. Probe status/output is saved in app-private preferences.

The other backend is an ORYN-owned C executable that prints fixed output or
waits eight seconds. It has no shell, children, networking or file writes. It is
compiled for arm64/API 29 with NDK 27.1.12297006, packaged in the signed APK and
checked against its generated SHA-256 before execution. Writable or missing
installed binaries are rejected. This does not implement embedded Termux,
dynamic package installation, updates/rollback or broad tool compatibility.

## Verification and remaining work

The native unit suite covers denial without side effects, descriptor mutations,
replay, expiry, foreground changes, revocation, restart, pending-operation
recovery, concurrent use, control binding, token collisions and output redaction.
Cloud verification on 2026-11-04 passed ESLint, TypeScript checking, all four
JavaScript tests, and 21 native unit tests (16 gateway and five output tests;
zero failures, errors or skipped tests). Both debug and phone release-variant
builds and Android lint passed. Both APK signatures verified, and the phone APK
contains the JS bundle and the exact compiled native probe bytes. The phone
variant still uses the debug signer; this is not production signing.
GitHub diagnostics include JUnit XML and HTML reports in addition to lint logs.

The native module, IPC callbacks, binary execution, cancellation and timeout
behavior are **not verified on device**. UI wiring, state/IPC instrumentation and
fresh physical-device evidence are still required. Existing observation JSON is
evidence for the earlier metadata bridge only. Human review is required by
`AGENTS.md`: “Native security changes need their own task, tests and human review.”
This branch must not be treated as a completed milestone or merged approval gate.
