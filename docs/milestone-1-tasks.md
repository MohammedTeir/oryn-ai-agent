# ORYN — Milestone 1 ordered execution tasks

**Created:** 2026-11-08  
**Baseline:** `main` at merge [PR #24](https://github.com/MohammedTeir/oryn-ai-agent/pull/24) (`68231c8`)  
**Related evidence:** [Milestone 1 audit](milestone-1-audit.md)  
**Requirements:** [Master specification v1.10](../ORYN_Master_Project_Specification.md) and [PLAN.md](../PLAN.md)

This is a **proposed implementation sequence**, not a reduction or change of any approved v1 requirement. The audit documents existing partial foundations; **every task below is open** until its own evidence and acceptance criteria are met. P0 = blocking/critical-path; P1 = subsequent work. Use small, reviewable PRs (ideally one scoped task per PR), record current source and APK provenance, and never mark a feature complete from mocked UI or cloud builds alone. IDs do not encode PR numbers.

## Milestone 1 invariants

- **Exactly two** primary tabs: AI Agent and Terminal & Tools. Settings is secondary. Terminal/Tools/History is an **in-page** segmented control.
- Light Mode; approved canonical ORYN assets; typed semantic `AppIcon`; no fabricated success, connection, version, command output or timing.
- English and Arabic, correct RTL, isolated LTR command/path/log blocks, accessible 48 dp controls and scalable text.
- One active execution task at a time; all states, queue counts, output and terminal readiness derive from real data.
- The Kotlin **native authorization gateway** is mandatory for every executable path, including manual, AI, quick/saved/history, tooling, retry and fallback commands. Production execution remains unavailable until reviewed native enforcement is complete. The existing fixed-probe prototype does **not** provide unrestricted authority.
- Keystore-backed credentials only; do not save API keys in SQLite, exports, diagnostics, prompts, output, or tools.
- No accounts, telemetry, cloud backend or unverified embedded Termux parity. Retain feasibility harness independently until a production replacement passes its gates.
- No modification to native gateway, grant ledger or policy as part of ordinary UI tasks. Native security changes require their own tests and human review; reconcile the master-spec Phase 1 / PLAN Milestone 2 boundary before enabling real dispatch.

## Phase A — Verify evidence and unblock design

### M1-01 — Android verification of PR #24
**Priority:** P0 | **Depends on:** merged PR #24 | **Current status:** OPEN (automated tests passed; device test unverified)

**Device acceptance procedure and pending results:** [M1-01 Android language verification](feasibility/milestone-1-language-device-verification.md). The procedure is prepared; phone evidence is still outstanding.

- Test switching between System, English and Arabic in the installed navigation preview, leaving/reentering preview, and closing/reopening the app.
- Inspect loading/saving/error presentations, strings, RTL direction and approval-example language behavior. Capture screenshots on the actual device; note font size and OS version.
- Record the installed APK SHA-256/source commit/build origin if verifiable, and distinguish app reopening, new JS session and *verified Android process termination*.
- Verify the test does not execute a command or expose credentials.

**Acceptance:** Written evidence for each tested state, actual screenshots or device observations, identified gaps, source/APK provenance (or explicit Unknown). No assumed pass for font scaling, accessibility or process death. Device failures become follow-up bug tasks.

### M1-02 — AI Agent design/RTL approval gate
**Priority:** P0 | **Depends on:** M1-01 findings (can research in parallel) | **Status:** OPEN

- Obtain approval for an Arabic+Latin font family with a verified distributable license; document actual font choice and mirroring rules.
- Review Arabic mockups for onboarding, **AI Agent first**, approval card, and subsequently Terminal & Tools and Settings. Do not redesign secondary screens ahead of their approvals.
- Resolve approved header symbol + tagline-free wordmark, 360 dp header layout and ORYN tab-symbol legibility at 24 dp. Preserve canonical logo geometry and approved PNG master lineage.

**Acceptance:** Explicit design approvals, font/license record and documented responsive/RTL rules; uncertain details remain Unknown. Do not regenerate or modify the canonical brand artwork.

### M1-03 — Documentation and milestone-boundary reconciliation
**Priority:** P1 | **Depends on:** audit | **Status:** OPEN

- Fix outdated README spec-version text and PLAN “Planning only” wording without implying v1 completion.
- Make the canonical root specification and mirrored copy/link semantics explicit; preserve approved v1.10 requirements.
- Resolve tracking language for master-spec §16 Phase 1 native authorization vs PLAN Milestone 2 delivery, with security as an unconditional prerequisite to real execution.
- Record remaining decisions: specific prohibited-operation entries, production application ID/namespace, testable Session containment and device support matrix.

**Acceptance:** No contradictory milestone promises or broken references; no new security defaults or denied operations silently treated as user-approved.

## Phase B — Production shell and AI Agent UI (AI Agent before secondary redesigns)

### M1-04 — Production application shell and routing
**Priority:** P0 | **Depends on:** M1-02 foundation | **Status:** OPEN

- Separate production root/navigation from `PreviewRoot.tsx` and the debug test harness without losing feasibility evidence/testing.
- Implement exactly two bottom tabs and Settings as a secondary destination; preserve navigation/back behavior and Terminal/Tools/History segment model.
- Establish safe startup/loading, unavailable and error boundaries; never treat a fixture as operational state.

**Acceptance:** Production entry bundles/builds; navigation and state tests pass; no third primary tab; no test-only execution entry in production.

### M1-05 — Shared UI components, i18n, accessibility and icons
**Priority:** P0 | **Depends on:** M1-02, M1-04 | **Status:** OPEN

- Token-driven components, typed semantic `AppIcon`, Light Mode only, icons from verified installed exports.
- Complete bilingual strings, RTL mirroring rules, LTR command output blocks, text scaling, screen-reader roles/announcements, contrast and minimum 48 dp targets.
- Validate responsive 360 dp header with 200% font scale; use overflow rather than hiding essential actions.

**Acceptance:** Component tests; Arabic/English and accessibility review; device screenshots at challenging widths/scales; no generic House/Wi-Fi connection/fingerprint-root icons.

### M1-06 — Real AI Agent UI and local conversations
**Priority:** P0 | **Depends on:** M1-04, M1-05, M1-14 for durable record writes | **Status:** OPEN

- AI Agent empty state, natural-language composer, user messages, history access and a structured conversation representation.
- Distinguish no Gemini configuration, offline, unavailable, loading and error; never pretend to have an LLM response or verified terminal result.
- Persist user-authored messages via transactional local repositories, if available; otherwise preserve the non-functional UX gate without claiming persistence.

**Acceptance:** UI derives from actual local records, navigates correctly, survives defined supported lifecycle checks and has no fake operational success path.

### M1-07 — Truthful runtime/status presentation
**Priority:** P1 | **Depends on:** M1-04, M1-05 | **Status:** OPEN

- Integrate the existing native prereq probe into the production connection chip.
- Distinguish detected installation, Android permission and genuinely verified working execution; handle Checking, Missing, Permission Required, Disconnected, Stale and Unknown honestly.
- On foreground/restart/backend change invalidate stale observations and require a verified capability handshake before displaying Connected/Ready.

**Acceptance:** Tests for missing/denied/malformed/stale/granted-but-unverified states; no inferred Connected from package detection or permission alone.

### M1-08 — Persisted task/plan/queue state presentation
**Priority:** P1 | **Depends on:** M1-14, M1-06 | **Status:** OPEN

- Define typed task, plan-step and queue transitions and show waiting-task count/list.
- Bind Queued, Awaiting Approval, Running, Failed, Cancelled, Completed, Paused and Unknown to persisted/observed events.
- Restrict concurrency to one active execution task; show uncertainty instead of starting follow-up work after lost callbacks.

**Acceptance:** Transition and recovery tests; no simulated progress/timestamps; no execution initiated by rendering, polling or recovery. Do not imply cancel/reorder if not implemented.

### M1-09 — Approval review component without authorization bypass
**Priority:** P0 safety | **Depends on:** M1-05 and reviewed native contract; UI may be built without execution callbacks | **Status:** OPEN

- Replace the debug-only fixture with a typed review component for **real** action proposals when those become available.
- Summary displays exact expandable command, risk as text and decision-relevant effects (root/network/deletion/out-of-workspace writes); Details contains immutable execution context.
- Pin Approve/Reject; Strict preselected in UI; Batch/Session options expose exact approved scope and remain unavailable unless natively enforceable.
- Root/high-risk requires separate exact-action confirmation; unresolved prohibited-operation entries remain a blocker.

**Acceptance:** Complete UI disclosure/scroll/RTL tests; no proposal displayed as authorized and no executable button wired before the native security review. A UI approval is **never** a native grant.

## Phase C — Onboarding, credentials, persistence and lifecycle

### M1-10 — First-launch wizard
**Priority:** P0 | **Depends on:** M1-04/05, M1-11/12/13 | **Status:** OPEN

- Welcome → Gemini BYOK setup/validation → runtime capability discovery → actionable Android permission explanation/consent → main app.
- Persist non-secret setup progress; allow safe resume, correction and user-controlled skip only where allowed by approved requirements.
- No mandatory account or cloud service.

**Acceptance:** First-run, interruption/reopen, invalid key, unavailable Termux, permission denial and offline journeys tested on Android with honest state.

### M1-11 — Secure key storage integration/device validation
**Priority:** P0 security | **Depends on:** existing PR #19 wrapper, security review | **Status:** OPEN

- Add consent-based save, replace and confirmed delete to onboarding/Settings using the existing `credentialVault` boundary.
- Verify actual SecureStore/Keystore behavior on device, invalidation and restore handling, backup exclusions and no plaintext fallback.
- Test the full logging, error, local database and export surfaces for secret leakage; do not put the key in prompts or tool commands.

**Acceptance:** Human security review, negative tests and bounded device evidence. A library import alone does not prove device confidentiality.

### M1-12 — Real Gemini API-key validation
**Priority:** P0 | **Depends on:** M1-11, network/error handling | **Status:** OPEN

- Validate the provided key against a documented, supported provider endpoint without logging its value.
- Distinguish invalid credentials, unavailable connection, permission/network failures, provider errors and quota problems.
- Avoid hardcoded models or mock success. Dynamic model listing, planning, budgets and full streaming remain later integration tasks.

**Acceptance:** Redacted success/failure evidence using a user-supplied key (never committed), offline/error tests and no exposure through diagnostics.

### M1-13 — Runtime and permissions onboarding
**Priority:** P1 | **Depends on:** M1-07 | **Status:** OPEN

- Surface external Termux setup, permission explanation and real capability state; show why a backend is unavailable.
- Expose only feasibility-verified embedded functionality and explicit alternatives; do not claim a Termux-compatible embedded shell or package manager.
- An Android permission request must not implicitly dispatch a shell command.

**Acceptance:** Tests for no Termux, denied permissions, provider errors and installed-but-unconfigured environments; real-device evidence where feasible.

### M1-14 — Production SQLite repositories and transactional transitions
**Priority:** P0 | **Depends on:** schema v1 from PR #18 | **Status:** OPEN

- Define typed, validated/parameterized CRUD for conversations, messages, task/plan records, proposals, executions and event history; apply bounded retention.
- Check foreign-key enforcement per connection, handle transactional state transitions, migration upgrades and corrupt/newer schemas safely.
- Keep credential storage **out** of SQLite; `approval_audit` is informational and cannot issue/restore native grants.

**Acceptance:** Unit/integration tests for rollback, migration, restart, deletion, corruption, stale events and transactional consistency; device test on actual app records (not just debug marker).

### M1-15 — Settings and safe local data controls
**Priority:** P1 | **Depends on:** M1-02, M1-11, M1-14, M1-07 | **Status:** OPEN

- After individual design approval, implement secondary Settings including language, credential management, runtime information, storage/retention and timeout/output limits.
- Add confirmed reset, deletion and export/import with size/schema checks, preview and rollback on invalid input.
- Exclude credentials, native grants and sensitive raw command output from untrusted exports and future sync.

**Acceptance:** Redaction/confirmation/cancel/invalid-import tests; Settings cannot disable native approval enforcement.

### M1-16 — Offline, background and restart reconciliation
**Priority:** P1 | **Depends on:** M1-07, M1-08, M1-14 | **Status:** OPEN

- Keep local UI/history available offline; pause Gemini-dependent features and display truthful offline states.
- On restart, reconcile pending native execution IDs, do not restore execution authority and preserve Unknown/busy if completion is uncertain.
- Respect Android background constraints: do not silently start the next queued command.

**Acceptance:** Device and state-machine tests covering backgrounding, disconnect, process restart where verified, late/lost callbacks and ambiguous termination.

## Phase D — Secondary UI and exit gate

### M1-17 — Terminal & Tools read-only production presentation
**Priority:** P1 | **Depends on:** M1-02 separate screen approval, M1-04/05, M1-07, M1-14 | **Status:** OPEN

- Implement Terminal / Tools / History segments within the second tab, including observed output/state and read-only history.
- Tool status and versions must be backend-specific, observed, timestamped and never derived from mockups; no executable quick/history/tools action bypasses native authorization.
- Full interactive terminal, install/update/remove and agent tool execution remain separate native authorization/integration work.

**Acceptance:** Two-tab invariance, accurate disconnected/stale status, RTL/accessibility tests, zero unauthorized execution paths.

### M1-18 — Milestone 1 device/UI acceptance matrix
**Priority:** P0 exit gate | **Depends on:** M1-01–M1-17 applicable deliverables | **Status:** OPEN

- Run master-spec UI Acceptance Tests v1.10: 360 dp/200% header, complete approval summary and pinned actions, mode scope disclosures, exactly two tabs, RTL/font, 24 dp ORYN tab symbol, connection icon conventions and approved light splash.
- Validate bilingual first run, actual navigation, offline/error/unknown UI, source/APK provenance, accessibility, real task-state binding and phone screenshots.
- Explicitly record unresolved device, ABI, root and embedded-runtime capabilities as Unknown/unsupported rather than Passed.

**Acceptance:** Signed test/build evidence, real-device results and a pass/fail/unknown matrix; do not infer a test from successful bundling.

### M1-19 — Evidence-based Milestone 1 closure
**Priority:** P0 exit gate | **Depends on:** M1-18 and security-boundary review | **Status:** OPEN

- Re-run pinned lint, typecheck, automated tests, dependency checks, Android bundles and APK build/signature verification.
- Review security constraints, actual app state and launch/onboarding/RTL acceptance, source hashes, device matrix and outstanding issues.
- Update PLAN checklist **only for individually proven requirements**; preserve native production authorization, broader Gemini agent, tool management, root and runtime work as open unless proven complete.
- Do not declare Milestone 1 complete if a master-spec Phase 1 mandatory gate is still missing; reconcile scheduling and record exceptions explicitly.

**Acceptance:** Reviewed exit report with artifact links, test matrix, remaining blockers and clear milestone decision (complete / blocked). A partially completed product is not marked release-ready.

## Proposed PR workflow

1. **Documentation PR:** publish this audit and task register; no application changes and no milestone checkbox closed.
2. **Next implementation/evidence PR:** M1-01, Android verification of PR #24 (device tests may be collected outside GitHub, then committed with provenance and privacy review).
3. Continue M1-02 design approval, M1-04 production entry shell, M1-05 shared components, M1-14 production storage, M1-06 AI Agent UI; perform other tasks in dependency order.
4. One task per reviewable PR whenever feasible; never mix ordinary UI changes with Kotlin authorization changes. Keep tests, evidence and explicit Unknowns in each PR.

**Tracking note:** This document records intent and acceptance tests. Completion must be reconciled to [PLAN.md](../PLAN.md) and the master specification; checking a task box in a future PR without implementation/device evidence is not sufficient.
