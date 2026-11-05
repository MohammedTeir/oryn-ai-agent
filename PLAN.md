# ORYN — Implementation Plan

**Status:** Planning only — no app implementation verified by this document  
**Last requirements reconciliation:** 2026-11-01 (eight interview batches)  
**Specification:** [ORYN Master Project Specification v1.10](ORYN_Master_Project_Specification.md)  
**Approved assets:** [ORYN Brand Assets](assets/ORYN_Brand_Assets/)  
**Release objective:** Signed Android 10+ APK on GitHub Releases; complete verified v1 capabilities, with honest embedded/external runtime compatibility reporting.

> **Important:** This plan is a delivery checklist, not a statement that any task is implemented. The [specification](ORYN_Master_Project_Specification.md) and the user's eight-batch interview decisions define scope. Do not infer implementation from screenshots, asset QA, documentation, or untested backend assumptions.

## 1. Confirmed v1 product scope

- [ ] **First-launch wizard:** welcome → Gemini BYOK setup/validation → detection of embedded/external runtime → permissions explanation/consent → main UI.
- [ ] **Exactly two primary navigation destinations:** AI Agent (Chat) and Terminal & Tools; Settings is a secondary page, sheet or modal.
- [ ] **Approved design:** Light Mode, canonical ORYN logos/launcher/notification icons; UI icon family `lucide-react-native`, shared `AppIcon` mapping and accessible status indicators.
- [ ] **Bilingual v1:** Arabic and English translations and RTL layouts, with correct LTR presentation for code, paths, commands and identifiers.
- [ ] **Gemini:** user-provided API key, secure storage, dynamically discovered available models with user selection, reliable error handling, context limits, visible confirmed usage or clearly labeled estimates, user-set budget and enforceable stop behavior.
- [ ] **Autonomous planning, not autonomous authorization:** produce a complete ordered task plan, propose execution steps, collect real results, independently verify, diagnose failures, propose repairs and enforce bounded retries.
- [ ] **Execution queue:** only one active execution task; additional requested tasks wait.
- [ ] **Terminal backends:** verified external Termux integration and a feasibility-gated **Termux-compatible embedded runtime**. Include only proven embedded capabilities, visibly offer external fallback on unsupported operations, and disclose device/runtime differences.
- [ ] **Automatic backend recommendation** from real capability probes, visible before dispatch; user may override; switching/retrying with a different backend requires authorization for the new context.
- [ ] **Tools Manager:** per-backend discovery, tool path/version checks, package install/update/remove, diagnostics, trusted source/provenance, logs and independent post-action verification.
- [ ] **Workspaces:** user-selected file/folder access, authorized reading/editing, scripts, Git commands and test/build workflows; request separate permission for broader access where supported.
- [ ] **Root optional:** root manager capability check, explicit separate per-root-command approval and risk warning, fully functional non-root flow.
- [ ] **Local-first persistence:** conversation, plan, actions, results, grants/approvals, runtime/tool snapshots, redacted audit trail and settings; deletion, export, retention and confirmations; secrets protected and omitted from exports.
- [ ] **Offline:** retain UI/local history and supported local terminal functions; pause Gemini-dependent planning with truthful offline state.
- [ ] **No mandatory accounts in v1:** future optional login/sync extension points only; future sync limited to conversations, plans and non-sensitive settings, excluding raw command/output logs by default.
- [ ] **Release:** real Android 10+ device testing, security, integration, accessibility/RTL, signed APK, support/capability matrix and known limitations.

**Explicit exclusions from v1:** cloud login/sync implementation, iOS/web clients, Google Play release, hosted shared AI backend, offline local LLM, unrestricted remote shell, guaranteed support for every Linux package and indefinite background execution.

## 2. Native authorization policy — mandatory release gate

Approval is not an optional UI feature. **All shell execution must be authorized by the user through the Kotlin-native policy gateway; no LLM/JavaScript direct-execution bypass.**

| Mode | Review and authority | Hard constraints |
|---|---|---|
| Strict | One exact user-reviewed command/action | Immutable backend, arguments/script, working directory, environment, privilege and effects; one-use dispatch authorization |
| Batch | User reviews **all exact commands in a fixed set** and approves the entire set | No commands may be added; no context mutation; each dispatch verified against fixed grant; no replay |
| Session | User chooses temporary authorized tools, directories, operations, backend and allowed privileges | Default **15 minutes**, at most **20 commands**, limited reads/writes, immediate revoke, native checks on each action |

- [ ] Implement one authorization contract across manual commands, quick actions, saved commands, tool scans, installs, fixes, retries, Agent proposals, Settings checks and runtime fallback.
- [ ] Default to **Strict** until the user changes it (working assumption; confirm before shipping).
- [ ] Implement immutable action/grant records, canonical descriptors, bounded grants, per-dispatch proof, replay protection, tamper resistance, expiration, revocation, deny logs and transactionally recorded audit events.
- [ ] Enforce Batch as an *enumerated set of exact actions*, never a blanket approval for a changing plan; new commands require separate authorization.
- [ ] Enforce Session's approved operations, backend, directories, tools, wall-clock duration and command count at native execution time.
- [ ] **Root and high-risk/destructive actions require separate exact-action approval even within Batch and Session.** Never silently elevate, broaden privileges or persist automatic root authorization.
- [ ] Establish a concrete high-risk classification and **user-approved prohibited-operations list** before implementing unrestricted command dispatch. **The list's entries are still OPEN — do not invent or silently finalize them.**
- [ ] Threat-model shell expansion, symlinks, relative paths, redirections, interpreters, scripts, child processes, subprocesses and indirect filesystem writes. A command cannot enter Session auto-execution unless its declared scope can be reliably enforced.
- [ ] If a safe Session boundary cannot be proven, require Strict review or deny the action. Do not claim an Android sandbox or shell text filter provides stronger isolation than tests demonstrate.
- [ ] Stop new command dispatch while app is backgrounded. Existing running command may complete only when Android/runtime permits; on foreground resume reconcile current and uncertain states.
- [ ] Test denial, revoke, expiry, 21st command, changed arguments, changed backend, dangerous/root action, batch mutation, replay, process death, and no-command-after-background.

**Authorization exit gate:** All invocation paths either obtain a valid, mode-appropriate native grant or execute nothing. Root/high-risk always require extra confirmation; prohibited actions never run.

## 3. Milestone 0 — Repository and platform feasibility (first engineering step)

**Goal:** Find Android/Termux blockers before committing to production architecture. **This milestone is not the v1 product.**

- [x] Inventory actual tracked source files, existing configs and assets; do not infer functionality from README or QA self-reports. Evidence: [published-snapshot inventory and new harness lineage](docs/milestone-0-inventory.md).
- [x] Record exact compatible Expo SDK, React Native, Kotlin, Gradle, Android SDK, `lucide-react-native`, Gemini SDK and Termux versions **after reviewing current upstream documentation**. Record Android minimum, target SDK, ABI/architecture and device test matrix. [Pinned build/import compatibility](docs/feasibility/dependency-compatibility.md) now typechecks and Android-bundles the real Lucide/SVG and public Gemini web exports, and builds native SVG. Live Gemini API/key storage and device rendering are later feature checks, not claimed here.
- [x] Check app ID ownership/namespace before choosing it. Owner confirmed MohammedTeir account ownership and authorized `io.github.mohammedteir.oryn.feasibility` for this debug-only spike; production/release namespace clearance remains open.
- [x] Prove minimal Expo custom development build and callable Kotlin Expo Module on a physical Android device. Expo Go cannot satisfy the custom native integration. Native builds are recorded in cloud/CI evidence; the owner reported a working probe on Redmi Note 8 Pro and supplied [native observation JSON](docs/feasibility/device-observation-2026-11-03.json). Exact installed APK hash/variant is unconfirmed; execution and authorization are not covered by this check.
- [ ] External Termux spike: supported integration contract, installed/ready/permission states, real command results, cancellation/timeout, background/process-death behavior and missing Termux handling. Owner command and late-background results are saved. [External failure investigation](docs/feasibility/external-failure-investigation.md) adds six injected JVM prerequisite tests, version-pinned callback source review and a fixed restart probe; permission-refusal and external caller-restart phone results are still pending. Missing-provider handling is unit/source coverage, not a phone-uninstall claim. Remote cancellation is unsupported, not claimed verified.
- [x] Embedded runtime spike **in parallel in scope**: investigate Termux-compatible packaging, linker/binaries, filesystem layout, package manager, executable restrictions, ABIs, app identity/permissions, update/rollback, licenses and redistribution. [Research and device measurement](docs/feasibility/device-results-review-2026-11-05.md) support only the APK-owned binary path; embedded Termux shell/package-manager adoption is **no-go on current evidence**, not verified parity.
- [x] Prototype one benign, explicitly approved command through each feasible backend, collecting genuine stdout, stderr, exit code and timestamps. Owner reports preserve native_echo and termux_echo output/exit 7 plus timestamps in [device results](docs/feasibility/device-results-2026-11-05.json). The APK-native backend is a C probe, not an embedded Termux shell.
- [x] Test installation of one compatible benign tool in the embedded environment *if supported*, with verified post-install invocation; record what fails. **Conditional item closed as not applicable:** this prototype has no supported embedded package manager/install API. No installation was attempted or claimed successful; reopen when a supported package strategy exists. See [decisions](docs/feasibility/device-results-review-2026-11-05.md).
- [x] Draft backend capability matrix: unsupported / unknown / requires setup / verified working by Android/device/ABI/runtime/tool. Evidence: [updated capability matrix](docs/feasibility/milestone-0-status.md); owner execution/lifecycle evidence is recorded per capability, with untested coverage still Unknown.
- [x] Prove a native approval gate cannot be bypassed by calling the backend directly from React Native or an invalid token. **Fixed-catalog prototype scope:** [export/dispatch source review](docs/feasibility/device-results-review-2026-11-05.md), native denial/mutation/replay tests and owner missing/forged-grant/background-review denial observations. No JS grant issuer/arbitrary backend start is exported. This does not certify future general-purpose commands or a full Android IPC security audit.
- [x] Record a go/no-go decision and fallback for each runtime capability; incomplete embedded Termux parity is not grounds for false claims. [Decisions](docs/feasibility/device-results-review-2026-11-05.md): narrow Go for tested fixed external/local probes, no-go for adopting an embedded Termux shell/package manager now; remote termination unsupported and untested coverage explicit.

**Exit gate:** Real-device test evidence for Kotlin bridge, native grant enforcement, external integration and an honest embedded-runtime feasibility decision. No app code is claimed production-ready at this stage.

**Status: OPEN.** Dependency build/import selection is recorded; remaining external failure/lifecycle coverage above is not waived.

Current follow-up: [capability decisions and exact stack record](docs/feasibility/milestone-0-status.md), [fixed-probe phone runbook](docs/feasibility/device-test-runbook.md). The [2026-11-05 owner evidence reconciliation](docs/feasibility/device-results-review-2026-11-05.md) distinguishes completed phone experiments, conditional N/A and remaining acceptance gaps. No production-ready claim is made.

## 4. Milestone 1 — UI, onboarding and local foundation

- [ ] Build the native-enabled Expo/React Native/TypeScript app structure and exactly two primary routes with secondary Settings, without adding a third tab.
- [ ] Implement approved Light Mode design tokens, UI components, English/Arabic/RTL strings, text scaling, contrast, accessibility labels and offline/error/unknown states.
- [ ] Use the approved PNG master-derived brand icons and correct Expo/Android adaptive foreground/background/monochrome/notification resources; validate launcher safe zones and mask variants on devices.
- [ ] Install and pin compatible `lucide-react-native` and `react-native-svg`; implement shared typed `AppIcon` semantic mapping. AI Agent tab uses the ORYN mark rather than generic House. Root icon must not imply fingerprint biometrics.
- [ ] Approval card: summary-first with a Details disclosure, pinned Approve/Reject, Strict preselected, Batch/Session under More approval options; decision-relevant effects (root, network, deletion, writes outside workspace) always in the summary.
- [ ] AI Agent header at 360 dp: symbol + wordmark, one connection chip, History and Settings (48 dp targets), overflow for extras, no tagline; show queued-task count.
- [ ] Terminal & Tools: in-page segmented control (Terminal | Tools | History) without adding a third primary tab.
- [ ] Connection icons Plug/Unplug (or Link/Unlink), not Wi-Fi; test the AI Agent tab symbol at 24 dp on devices (request an owner-approved tab-size variant if needed).
- [ ] Arabic/RTL design gate: Arabic mockups, one recorded Arabic+Latin font with verified license, mirroring rules (arrows/back mirror; logo, Play/Stop/Retry do not), LTR command blocks.
- [ ] Splash: light surface with the standard color logo; the reversed logo is not used in the in-app UI.
- [ ] Setup Wizard: welcome, API-key validation and secure persistence, runtime detection and actionable permission prompts.
- [ ] Local transactional persistence schema and migrations for conversations, tasks, plans, proposals, grants, executions, events, tool inventory, runtime capability snapshots and settings.
- [ ] Encrypt credentials using Android Keystore-backed storage, redact/limit raw output, implement user-controlled retention and safe deletion/export. Imports require schema validation, preview and confirmation; never import/export the API key.
- [ ] Implement task queue state and truthful UI states bound to native backend observations, not asset/mockup fixtures.
- [ ] Provide no-account local operation; isolate future sync interfaces without shipping a cloud backend.

**Exit gate:** Device screenshots match approved designs, navigation and onboarding work, accessible RTL flows are tested (Arabic mockups approved, font recorded), the tab symbol is verified at 24 dp, the UI Acceptance Tests (v1.10) in the specification pass, and no mock connection or command result is presented as real.

## 5. Milestone 2 — Secure terminal and dual-runtime integration

- [ ] Define a backend-neutral `TerminalBackend` interface for probe, execution, cancellation, event stream, normalized stdout/stderr, exit status and capability reporting.
- [ ] Integrate Strict/Batch/Session grant validation **inside native dispatch** for both runtimes. Abort on tamper/revocation, and audit every authorization and execution.
- [ ] Implement external Termux adapter with validated permissions/handshake and supported result delivery. Surface unavailable/permission denied/partial results honestly.
- [ ] Integrate the **tested embedded runtime capability subset**; document unsupported tools/ABIs/packages and offer explicit external fallback for applicable actions.
- [ ] Present actual chosen backend for each command and reauthorize when effective execution context changes.
- [ ] Handle stdout/stderr, output sizes, progress, exit codes, cancellation semantics, unknown status, process restarts and disconnections.
- [ ] Prove only one active execution task; queue others and reject duplicate starts.
- [ ] Apply Android background rule: already-running command may finish when possible; do not schedule another command until foreground.
- [ ] Implement optional root-manager adapter, real root capability check, extra command-specific confirmation and graceful non-root mode; native root checks that execute shell commands also pass the grant gate.

**Exit gate:** Device-tested backend functionality and secure authorization across both runtime classes (or clearly documented embedded limits/fallback), with independent checks proving denied/out-of-scope commands never run.

## 6. Milestone 3 — Gemini agent, planning and budgets

- [ ] Gemini BYOK onboarding, secure key removal, model discovery from accessible provider data and user-selectable model.
- [ ] Strict typed and schema-validated request/response contracts, prompt-injection defenses and provider error handling.
- [ ] Complete task plan with ordered steps/dependencies and visible assumptions, estimated effects and review status.
- [ ] Propose commands as structured actions through the native grant gateway, not direct tool execution.
- [ ] Observe genuine output and exit status, verify task outcomes independently where appropriate, and propose failure diagnosis/repair.
- [ ] Configurable retry/step/token/time/output limits; new or changed repair commands require authorization according to mode, high-risk/root needs separate review.
- [ ] Usage tracking: provider-confirmed token data where available; label projections as estimates; respect configurable user budget and stop new API requests when the enforceable threshold is reached.
- [ ] Queue other tasks while an execution task is active; surface queued/planning/running/failed/paused/completed states honestly.
- [ ] Offline flow keeps local Terminal and histories available but pauses Gemini-dependent planning.

**Exit gate:** End-to-end user task → full plan → authorize → execute → observe → verify/diagnose is demonstrated with real backend outputs and controllable budget errors.

## 7. Milestone 4 — Tools Manager, workspaces and reliability

- [ ] Verified per-backend tool inventory and runtime capabilities: installed/working, version/path, unknown, unsupported, permission required and stale status.
- [ ] Trusted compatible package-source discovery and user-reviewed install, upgrade, uninstall and repair workflows.
- [ ] Track package provenance, diagnostic/error history, license/verification metadata and independently verify tool lifecycle actions.
- [ ] User-selected file/folder permissions, safe read/edit workflows, project inspection, Git integration, scripts, build and test commands; all executable mutations require grants.
- [ ] Validate import/backup semantics, log deletion, reset confirmation, privacy-safe export and local database upgrades.
- [ ] Handle process death, network loss, Android Doze/battery restrictions, low storage, partial installations, interrupted installs, reconnects and unknown/stale execution status.
- [ ] Test Android 10+ / ABI compatibility matrix and feature-specific unsupported cases; do not label all environments as equally compatible.

**Exit gate:** Full tool management and development workflows verified on supported devices, truthful failure/recovery, permission isolation, and no uncontrolled shell execution.

## 8. Milestone 5 — Security, accessibility and full acceptance

- [ ] Threat-model and test model/file/output prompt injection, shell command injection, symlink/path escape, child-process bypass, root escalation, grant replay, memory/secret exposure and malicious package sources.
- [ ] Draft and obtain product approval for **exact prohibited operations**, high-risk classification, safe root confirmation, and Session permitted operations; implement and test the policy, fail closed on unknown dangerous actions.
- [ ] Verify Strict exact grants, Batch immutable fixed list, Session 15 minutes/20 commands/capability scope, immediate revocation and expiry, separate root/high-risk approval.
- [ ] Verify backgrounding blocks *new* commands; interruption/reconnect never reports false success; denial and out-of-scope actions execute nothing.
- [ ] Android storage permission coverage, secret-safe encrypted key persistence, redacted logs/exports, deletion and privacy checks.
- [ ] Arabic/English/RTL acceptance, Android accessibility, readable status, offline and slow-network UX.
- [ ] Automated unit, integration, native-module, security/negative tests and on-device end-to-end scenarios.

**Exit gate:** No known approval bypass, demonstrable sandbox limitations handled conservatively, correct privacy and UI quality, and repeatable device evidence for required cases.

## 9. Milestone 6 — Packaging and release

- [ ] Configure CI for formatting, lint, typecheck, tests, Android native builds and artifact provenance.
- [ ] Build a **signed installable v1 APK**, validate installation, permissions, adaptive icons, notifications, first-launch setup, crashes, app lifecycle and performance on real devices.
- [ ] Publish a support matrix listing Android version, ABI, device/root mode, Termux external version, verified embedded features, unavailable features and recommended fallback.
- [ ] Validate dependency license compliance, upstream package distribution restrictions, brand/trademark/store naming and third-party legal obligations before public distribution.
- [ ] Prepare GitHub Release assets, release notes, reproducible installation instructions, known limitations and real acceptance evidence.
- [ ] No claim of a fully self-contained embedded Termux runtime unless independently tested; no untested feature marked working.

**Final v1 gate:** The user can install the APK, complete setup, use the bilingual approved UI, perform agent-led approved tasks with Gemini, install/manage supported tools, run authorized workspace/Git/test commands, inspect verified results and logs, use Strict/Batch/Session, operate non-root or separately approved root flows, and access tested embedded capabilities and clearly explained external fallback.

## 10. Implementation order and checkpoints

1. **First:** Feasibility spikes for Kotlin, external Termux and embedded runtime, plus security gateway contract.
2. **Then:** Two-screen UI, bilingual onboarding and local data foundation.
3. **Then:** Native execution and three grant modes across both runtimes.
4. **Then:** Gemini orchestration, budgets, diagnosis and verified results.
5. **Then:** Full Tools Manager, workspaces, Git, optional root and resilience.
6. **Finally:** Security/RTL/device acceptance and signed APK release.

The embedded runtime is **within v1 scope**, but **its individual features are conditional on feasibility evidence**. The user explicitly accepted partial embedded functionality with an honest external fallback. Do not silently move the whole embedded objective out of v1 or promise all packages work.

## 11. Assumptions and unresolved decisions (must not hallucinate)

| Category | Status / action |
|---|---|
| Default Strict approval mode | **ASSUMPTION** until explicitly confirmed |
| App package identifier | Unknown; check naming and ownership |
| Android minimum 10 | **CONFIRMED**; full ABI/device matrix unknown |
| Exact Expo/React Native/Kotlin/SDK versions | Unknown; verify currently supported combinations before pinning |
| Embedded Termux compatibility | **High-risk feasibility UNKNOWN**; prototype and publish capability matrix |
| External Termux API version/permissions | Unknown until current docs and real-device test |
| Prohibited-operation list | **OPEN PRODUCT DECISION**; draft for user approval, do not invent as approved |
| Session containment technology | **High-risk UNKNOWN**; require enforceable scope or strict fallback |
| Storage database/library | Proposed only; choose after scope/compatibility review |
| Gemini cost/quota availability | Provider-dependent; do not assert billing accuracy |
| Android file access beyond selected folders | Platform-dependent; permission check required |
| Root manager, hardware compatibility | Device-dependent; cannot presume access |
| Optional future sync provider | Deferred beyond v1; **do not implement now** |
| Release and performance thresholds | Device-test matrix/targets need explicit acceptance criteria before shipping |

## 12. Requirement grounding & anti-hallucination protocol

Before implementing **any** task, the assigned agent/developer MUST:

1. Read the **v1.9 master specification**, this plan, approved designs and **actual source code/config/tests**; treat README and screenshots as secondary context.
2. Produce a short **Scope & Stack Inventory**: target product, v1 in/out features, user journeys, Android/Expo/Kotlin/Termux/Gemini boundaries, security grants and exact confirmed dependencies. Link each requirement to a spec section or code path.
3. Classify claims as **CONFIRMED** (user/spec), **VERIFIED** (inspected code + repeatable tests), **PROPOSED** (not approved) or **UNKNOWN** (research needed). Never blur these states.
4. Never invent SDK versions, Gemini model availability, terminal capabilities, APIs, Android permissions, root status, installation success, CI passing, package support, user-visible runtime data, storage constraints or acceptance evidence.
5. Check current official upstream docs whenever versions, Android restrictions, Termux APIs or Gemini capabilities matter. Pin exact chosen versions in implementation records; avoid copying unverified historical snippets.
6. Flag contradictions between old docs and the eight-batch interview. The **master specification v1.9** and explicit user decisions are source of truth; ask for a decision rather than silently changing tech stack or scope.
7. Before scope change, show reason, trade-offs, security/privacy impact, files involved and acceptance criteria, and obtain explicit approval.
8. Give test evidence for every completed checkbox: exact code path/commit, tests run and output, target device/Android/ABI, verified runtime behavior, blockers and known limits.
9. Do not mark an item done solely because design assets or a QA-report claim exist. No manual or automatic code execution is authorized by the existence of this plan.

**Pre-implementation gate:** Unknown requirements, runtime claims or policy rules stay Unknown until researched or explicitly approved. Fail closed for unresolved execution/security policy.

## 13. Immediate next engineering task (after separate implementation approval)

Start Milestone 0: verify source and tooling baseline, inspect current upstream technical documentation, establish a real-device matrix, and prototype native authorization with Termux external and embedded feasibility. **Do not begin implementing until the user explicitly initiates implementation.**
