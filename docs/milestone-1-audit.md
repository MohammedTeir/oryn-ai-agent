# ORYN — Milestone 1 implementation audit (after PR #24)

**Audit date:** 2026-11-08  
**Repository:** [MohammedTeir/oryn-ai-agent](https://github.com/MohammedTeir/oryn-ai-agent)  
**Audited default-branch HEAD:** `68231c8fe0b9dc3379dbd176bd1067fb1bc227a0` (merge of [PR #24](https://github.com/MohammedTeir/oryn-ai-agent/pull/24), 2026-11-07)  
**Scope:** repository documentation, applicable source modules, tests, CI and PR #11–24 change sets, together with recorded owner-supplied phone evidence. This is a source/evidence audit, **not** a new device test or a production security audit.

## Requirements authority

1. [Master Project Specification v1.10](../ORYN_Master_Project_Specification.md) — product requirements and acceptance criteria; see especially baseline §0, UI §§3–4, delivery phases §16 and UI Acceptance Tests.
2. [PLAN.md](../PLAN.md) — milestone delivery checklist, subject to the specification.
3. [AGENTS.md](../AGENTS.md), [design component contract](design/components.md), [design tokens](design/tokens.json), and approved assets — implementation restrictions.
4. GitHub source, tests, signed-build reports, and dated device-evidence records — implementation evidence, **not** substitutes for specification requirements.

**Overall finding:** Milestone 0 is closed for its *bounded feasibility scope*. Milestone 1 is **in progress**, with partial UI, storage and security foundations. All 15 top-level Milestone 1 checklist items in PLAN.md remain unchecked; no complete Milestone 1 exit is evidenced. An Android APK built in CI is currently a **debug-signed feasibility harness with an explicitly labeled navigation preview**, not a production ORYN v1 APK.

## Last merged PR and build evidence

[PR #24 — Persist language choice in the navigation preview](https://github.com/MohammedTeir/oryn-ai-agent/pull/24) was merged on 2026-11-07.

- Adds System / English / Arabic selection to the **preview**, saving one validated, non-secret enum value in SQLite's `settings` table.
- Restores the preference when the preview remounts; applies its direction and language to the approval-card example.
- Uses parameterized/atomic updates, serializes loads and saves, and distinguishes unconfirmed persistence on failures.
- Does **not** implement the final Settings screen or complete onboarding; language persistence, RTL layout, 200% text scaling and accessibility remain unverified on a real device.
- PR #24 reports lint, typecheck, **42 tests**, Android JS and independent preview bundles, an Android signed test APK and lint passing. GitHub workflow runs for PR source commit `c7889aea` were independently checked as successful: Feasibility CI and Signed feasibility APK. CI does not perform physical-device acceptance tests.

## Verified implementation and outstanding limitations

| Area | Current implementation / evidence | Milestone 1 status |
| --- | --- | --- |
| Stack / native bridge | Custom Expo + React Native + TypeScript harness, Kotlin observer, build workflows, reproducible feasibility artifacts ([Milestone 0 closure](feasibility/milestone-0-closure.md)) | Prototype complete; production shell pending |
| Native authorization | Native **Strict** one-use gateway exists only for an intentionally fixed benign probe catalog; denial/recovery tests and bounded owner phone evidence | Not a production Strict/Batch/Session authorization implementation |
| External Termux | Fixed approved echo/delay/restart probes observed on owner's phone; cancellation/remote kill cannot be guaranteed | Bounded feasibility only |
| Embedded runtime | APK-owned native C executable tested; embedded Termux-compatible shell/package manager remains **no-go** | Unsupported, never label as standalone Termux parity |
| Navigation | [Separate Milestone 1 preview](../spikes/android-feasibility/milestone1/App.tsx): AI Agent and Terminal & Tools, secondary Settings and Terminal/Tools/History segments (PR #11–12) | Preview only; real screens and production entry pending |
| Launch assets | Approved light splash and Expo adaptive icons wired (PR #13); device mask/cropping/legibility not checked | Partial |
| Icons / branding | Typed `AppIcon` uses verified Lucide exports; ORYN image used for Agent tab. Approved standalone tagline-free wordmark not provided; actual 24 dp icon not verified | Partial |
| Languages | Device locale selection (PR #14), bilingual preview strings and SQLite language preference (PR #24) | Partial; Arabic design/font/device gate open |
| Termux status | [Prerequisite-derived status](../spikes/android-feasibility/milestone1/connection.ts) (PR #15): Checking, Unknown, Missing, Permission Required. Detection/permission never become unverified Connected | Partial; actual readiness contract open |
| Approval UI | [Non-executable example](../spikes/android-feasibility/milestone1/ApprovalExample.tsx) with Details, effects, Strict display and disabled Approve/Reject (PR #16) | Fixture only; native binding not built |
| SQLite | [Schema v1 and migrations](../spikes/android-feasibility/storage/migrations.ts) (PR #18); [storage check / isolated persistence probe](feasibility/milestone-1-storage-device-evidence.md) (PRs #20–23) | Foundation; no production CRUD, retention or task-state repository |
| Device persistence | Two owner-submitted schema observations report tables/foreign keys on checked connections; separate debug marker read in a *new JS session* | Does **not** prove Android process death, production record durability, or backup security |
| Credentials | [Keystore-backed SecureStore adapter](../spikes/android-feasibility/credentials/androidVault.ts), generic error boundary and packaged backup exclusions (PR #19) | Isolated wrapper, unconnected to onboarding; device Keystore and leak tests pending |
| Gemini | Gemini SDK's browser entry bundles in feasibility fixture; no live client/key validation/model discovery | Not implemented |
| Wizard / chat / queue | No production first-run wizard, functional chat, native-observed task queue or full persistent execution history | Not implemented |
| Releases | CI signs and publishes **test-only** feasibility builds, not production release-signed APKs | Not a Milestone 1/production exit |

## Important findings / implementation constraints

1. **Do not confuse previews with product functionality.** `spikes/android-feasibility/index.ts` starts `PreviewRoot.tsx`, which retains the debug harness and opens a separate clearly labeled Milestone 1 preview. The standalone `milestone1/index.ts` also bundles, but the preview screens are placeholders, not complete product routes.
2. **Approval safety cannot be shortcut.** No manual, AI, history, settings, tool-installation or retry command may bypass the Kotlin native grant gateway. Full fixed Batch, bounded Session, root/high-risk confirmation and the agreed-but-unfinalized prohibited-operation entries remain unresolved. Shell scope enforcement must account for symlinks, scripts, redirection, child processes and indirect effects.
3. **Design approval is blocking.** The approved work order is AI Agent first; Terminal & Tools and Settings redesigns need separate review. Arabic+Latin font and license, Arabic mockups, tagline-free wordmark, small Agent tab icon and real-device layout acceptance remain open.
4. **Truthful states only.** An installed Termux app or granted permission is **not** proof of execution readiness. Unknown, stale, interrupted or unresolved commands must never be displayed as successful. Non-executable approval fixtures must remain isolated.
5. **Documentation drift.** The top of PLAN.md still calls the project “Planning only” even though prototype code exists. Root-level [README.md](../README.md) labels its specification link “v1.3”, while the linked `docs/` copy is v1.10. The root and `docs/` specification copies differ in relative link syntax; their technical requirements appear equivalent, but the root specification is authoritative under AGENTS.md. Reconcile without changing approved scope.
6. **Phase boundary requires clarification.** Master specification §16 “Phase 1 — App Foundation” includes native Strict/Batch/Session enforcement; PLAN.md schedules production native security integration in Milestone 2. This is a scheduling inconsistency, **not** permission to omit security. Keep production execution disabled until its complete native gates pass.
7. **Device evidence is bounded.** Owner evidence on a Redmi Note 8 Pro/Android 11 shows supported fixed probes. Device reports do not attest an installed APK hash, every Android/ABI combination, true process termination, hardware-level Keystore security, or arbitrary-command safety.

## Audit outcome and next steps

- Preserve **all** original unchecked Milestone 1 requirements; this audit marks no PLAN checklist item completed.
- Use [Milestone 1 execution tasks](milestone-1-tasks.md) as the ordered, evidence-gated working backlog (**M1-01–M1-19**). Task IDs are tracking labels, not claims of completed work or predetermined GitHub PR numbers.
- First deliverable after this documentation PR: **M1-01 — Android verification of PR #24**, with exact source/APK provenance and actual results. Follow with AI Agent design approval before implementing production screens.
- This PR is **documentation only**: it does not change application code, dependencies, Kotlin policy, tests, or shipped user behavior. It does not close Milestone 1.
