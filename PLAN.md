# ORYN — Implementation Plan

**Status:** Planning / implementation not yet verified  
**Last reviewed:** 2026-11-01  
**Source of truth:** [Master Project Specification v1.8](docs/ORYN_Master_Project_Specification.md)  
**Brand assets:** [ORYN Brand Assets](assets/ORYN_Brand_Assets/)  
**Scope:** Android-first Expo/React Native + TypeScript + Kotlin native modules + Gemini + pluggable terminal backends.

> This is an actionable delivery plan, not evidence that the application has been implemented. Update checkboxes only after inspecting code, tests, and real-device results. The master specification wins if a discrepancy is found.

## Guiding invariants

- [ ] Exactly **two primary destinations**: AI Agent and Terminal & Tools; Settings is a secondary screen.
- [ ] Light Mode only, aligned with the approved UI designs and design tokens.
- [ ] **Every command** (diagnostics, scans, installs, quick commands, retries, root checks) goes through Review → explicit Approve → Execute. Enforce the gate in native execution code, not just UI.
- [ ] No automatic root elevation. Privileged actions require explicit, separately disclosed approval.
- [ ] Runtime, permission, connection, root, tool, and execution statuses reflect real observations; never hardcode optimistic states.
- [ ] Gemini API key is stored using Android-backed secure storage/Keystore, never logged, exported, or embedded in shell commands.
- [ ] Treat model outputs, tool output, terminal stdout/stderr, and external files as untrusted data.
- [ ] Keep a backend-independent terminal execution contract. External Termux is a feasibility target, **not** an assumed guaranteed capability.
- [ ] Do not treat visual approval of brand assets as proof of runtime or launcher correctness.

## Phase 0 — Repository baseline and feasibility spike (highest priority)

- [ ] Inventory the repository and verify current implementation against source files (not README claims).
- [ ] Initialize the Expo TypeScript project and Android development build tooling; document Node, Expo SDK, Gradle, Kotlin, Android SDK versions.
- [ ] Define application ID only after ownership/namespace checks.
- [ ] Create a minimal Kotlin Expo module and verify it is callable from React Native on a physical Android device.
- [ ] Research and test external Termux integration using supported APIs/intents, required Termux configuration, package visibility, permissions, Android version constraints, and result delivery.
- [ ] Detect Termux installation and distinguish checking / connected / not installed / permission required / disconnected / unsupported / unknown.
- [ ] Implement a minimal native-side approval token/gate and demonstrate that a diagnostic command cannot run without a fresh explicit approval.
- [ ] Execute one harmless, approved command on a real device; capture real stdout, stderr, exit code, duration, and failure cases.
- [ ] Document reproducible feasibility results, supported device/Android/Termux versions, limitations, and a go/no-go decision for the external backend.

**Exit gate:** A physical-device demo proves approved command execution and result capture; if integration is blocked, record evidence and evaluate alternatives before committing to a UI-only mock.

## Phase 1 — App foundation and approved UI

- [ ] Implement navigation with two bottom tabs (AI Agent; Terminal & Tools) and a Settings subpage.
- [ ] Apply approved Light Mode design tokens, responsive layouts, Android dp/sp sizing, dynamic text scaling, accessibility labels and contrast.
- [ ] Use `lucide-react-native` as the **primary UI icon library**; verify exports against a pinned version. Install with `npx expo install lucide-react-native react-native-svg` when compatible.
- [ ] Centralize icon names, stroke widths, sizes, semantic colors, and accessibility in a reusable `AppIcon` component; avoid ad-hoc icon imports throughout screens.
- [ ] Map UI semantics to Lucide (terminal, settings, scan, shield-check, wrench, wifi/wifi-off, key-round or shield-check for root, circle-check, circle-x, triangle-alert, play, square, refresh-cw, download, upload, copy, info, circle-help, ellipsis, x). Do **not** use fingerprint to imply root permission.
- [ ] Use the canonical ORYN symbol PNG for branding, assistant avatar and selected AI Agent tab; do not replace it with a generic house icon. Preserve the ORYN wordmark/tagline as approved.
- [ ] Use original PNG-based brand assets for launcher, Play Store, and brand surfaces; retain traced SVGs only where vector scaling is genuinely needed, with documented fidelity limits.
- [ ] Integrate Expo icon, adaptive foreground/background, themed monochrome, and notification assets from `assets/ORYN_Brand_Assets/05_Android_App_Icons/`.
- [ ] Implement AI Agent chat shell, Terminal & Tools terminal/tools segmented views, Settings, status components, command review variants, and confirmation dialogs.
- [ ] Implement empty/loading/error/unknown/disconnected states using real state contracts; do not fake connection, installed tools, or command output.
- [ ] Require confirmation for destructive resets and history clearing; import must show a changes preview, never import an API key.
- [ ] Verify launcher masks, safe zones, themed icon, notification icon, and small-size legibility on real Android launchers.

**Exit gate:** UI matches approved designs; accessibility checks pass; status views can render real runtime observations; icons are visually validated on-device.

## Phase 2 — Agent, Gemini, and tool inventory

- [ ] Implement Gemini API key onboarding, secure storage, revocation, and error handling; exclude secrets from telemetry, exports and diagnostics.
- [ ] Discover selectable Gemini models dynamically from actual provider availability; do not hardcode a purported current model list.
- [ ] Define strict typed contracts for plans, proposed commands, approval requests, execution results, tool inventory, and agent state transitions.
- [ ] Build plan → review → approval → execute → observe → verify lifecycle; no model-produced command can bypass review.
- [ ] Inspect actual installed tools with verified name, version, path, backend and availability; clearly distinguish unknown, unsupported, and missing.
- [ ] Support tool-install proposals only through reviewed commands; detect environment compatibility before proposing installation.
- [ ] Handle timeouts, cancellation, stdout/stderr limits, process lifecycle, retry budgets and failures; **Review & Retry** must generate a fresh approval request.
- [ ] Persist redacted task history and audit events without credentials or unnecessary sensitive output.

**Exit gate:** A real end-to-end Gemini-assisted task produces a reviewable command, executes only after approval, and reports verified results/failures.

## Phase 3 — Security and reliability hardening

- [ ] Threat-model model prompt injection, terminal output injection, shell quoting, command substitution, path traversal, secret exposure, and approval replay.
- [ ] Bind each approval to the exact immutable command, arguments, backend, working directory, privilege scope, and expiration; reject modified/replayed approvals.
- [ ] Validate and display root-required operations separately; never silently retry with `su`.
- [ ] Test backgrounding, app termination, reconnection, partial results, duplicate execution, and cancellation.
- [ ] Add unit, integration, native and on-device negative tests; verify denied approval always means zero execution.
- [ ] Add structured, privacy-conscious diagnostic logs and clear recovery messaging.

**Exit gate:** Security tests pass, execution cannot bypass approval, and failure/recovery paths are demonstrated.

## Phase 4 — Embedded runtime research (conditional)

- [ ] Assess Android executable restrictions, ABIs, packaging size, process isolation, filesystem access, and long-term maintenance.
- [ ] Prototype the embedded backend behind the same `TerminalBackend` contract; compare feasibility against external Termux and fork alternatives.
- [ ] Proceed only after documenting a feasible, testable approach; do not promise a self-contained APK prematurely.

## Phase 5 — Release engineering

- [ ] Configure CI for lint, typecheck, tests, Android development builds and reproducible release builds.
- [ ] Verify app signing, package name, permissions disclosure, data handling, offline/error behavior and key protection.
- [ ] Produce and install a real signed test APK; validate on representative Android versions and launcher configurations.
- [ ] Verify brand/trademark/store-name availability and licensing of dependencies/assets before public distribution.
- [ ] Publish release notes, known limitations, install instructions and an acceptance-test report.

## Suggested implementation sequence

1. **Feasibility first:** Expo/Kotlin bridge → Termux detection → native approval gate → approved command → real output.
2. **UI foundation:** navigation → design tokens/icons → screens → runtime-bound status and dialogs.
3. **Intelligence:** Gemini model discovery → typed plans → approvals → execution observations.
4. **Hardening:** root policy → threat tests → lifecycle reliability.
5. **Packaging:** Android icon validation → signed APK → release readiness.

## Required evidence per milestone

For each completed item record: code path/commit, device and Android version where relevant, test command or scenario, actual result, and any known limitation. Keep screenshots and design references distinct from executable proof.

## Immediate next task

**Start Phase 0:** scaffold the Expo project and Kotlin bridge, then prove external Termux detection and one explicitly approved harmless command on a real Android device. Do not begin autonomous command execution until the native approval enforcement is proven.

## Requirements grounding and anti-hallucination protocol (mandatory)

Before implementing **any** feature, the agent/developer must:

1. Read `docs/ORYN_Master_Project_Specification.md`, this plan, the approved design assets and relevant existing source files. Inspect code rather than relying solely on README or historical summaries.
2. Produce a brief **scope and stack inventory**: confirmed product goals, in-scope features, explicit non-goals, two-screen navigation, Android/Termux/Gemini/Expo/Kotlin architecture, and dependencies. Cite the exact specification heading or code path for each requirement.
3. Classify each proposed behavior as **Confirmed (specified)**, **Verified (implemented and tested)**, **Proposed (needs approval)**, or **Unknown (requires investigation)**. Never present a proposed or unknown capability as existing.
4. Do not invent screens, permissions, root behavior, Termux capabilities, Gemini model availability, APIs, dependencies, supported Android versions, UI states, command results, or acceptance criteria. Ask for a decision when the specification is silent or contradictory.
5. Separate design mockups, assets, planned architecture, actual code, and device-tested behavior. Passing image QA does not prove an APK or backend works.
6. Before changing scope, write a short change proposal with rationale, trade-offs, security impact, affected files, and acceptance criteria; wait for approval.
7. For each task, report **evidence** (files changed, test/build commands and actual results), unresolved assumptions, blockers, and next action. Never claim tests or device validation were run unless they were.
8. Keep implementation and documentation aligned; do not silently rewrite the master specification to justify implementation choices.

**Pre-implementation gate:** If scope, feature behavior, tech choice, or runtime feasibility cannot be grounded in the specification or inspected code, mark it **Unknown** and investigate or ask before implementation.
