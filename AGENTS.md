# AGENTS.md — ORYN (oryn-ai-agent)

ORYN is a local-first Android AI agent (Expo / React Native + TypeScript + Kotlin native modules, Gemini via user-provided key). Android 10+. Arabic + English, RTL.

## Source of truth
1. `ORYN_Master_Project_Specification.md` (v1.10) — requirements. If anything here conflicts with it, the specification wins.
2. `PLAN.md` — milestones and checklists. Work on one milestone item per task.
3. `docs/design/` — tokens, component specs, frame exports. Figma frames (when a link is given) override exported PNGs.
If something is not specified, write **Unknown** in your summary. Do not invent versions, package names, APIs, model names, paths or device behavior. Verify library exports against the installed package before using them.

## Security rules (never violate)
- No executable action may run without a valid native authorization (Strict / Batch / Session) enforced in the Kotlin gateway. The AI, the JS UI and earlier approvals cannot create authorization.
- Every command entry point (typed, quick, saved, history, AI, retry) goes through the same native gateway.
- Root and high-risk actions always need a separate exact-action confirmation. Unclassified risky actions fail closed.
- The Gemini API key lives only in Android Keystore-backed storage. Never log it, export it, include it in prompts, crash reports or diagnostics. Redact secrets in errors.
- UI tasks must not modify the native gateway, grant ledger or policy code. Native security changes need their own task, tests and human review.
- Do not add telemetry, accounts, analytics or cloud backends.

## Truthful UI (never violate)
- Production UI shows only real state: backend/native observations. No hardcoded versions, paths, durations, counts, outputs or "Connected / Ready / Completed" labels.
- Mock data is allowed only in clearly labeled fixtures, previews and tests. Production must never fall back to simulated success.
- When uncertain (restart, disconnect, stale data) show `Unknown` / `Reconnecting` until reconciled.

## UI rules
- Light Mode only. No dark theme or toggle.
- Exactly two primary tabs: `AI Agent` and `Terminal & Tools`. Settings opens from the header (modal/sheet/page), never a third tab. Terminal & Tools uses an in-page segmented control: Terminal | Tools | History.
- Header: ORYN symbol + wordmark, one connection chip, History and Settings actions (touch targets >= 48 dp). No tagline in the header; no wrapping at 360 dp.
- Approval card: summary first (exact command, risk badge with text, one-line effects), Details disclosure, Approve/Reject pinned. Strict is the default; Batch/Session under "More approval options". Anything decision-relevant (root, network, deletion, writes outside workspace) must appear in the summary.
- One active task at a time; show waiting tasks as a compact `Queued` count/list.
- Icons: use `lucide-react-native` through a typed `AppIcon` component with a semantic-name map. No raw icon imports in screens. Verify every name against the installed package. Connection = `Plug`/`Unplug` (or `Link`/`Unlink`), never Wi-Fi icons. Root = `KeyRound` or `ShieldCheck` with a text label, never a fingerprint.
- Brand artwork: use files in `assets/ORYN_Brand_Assets/` only. Do NOT redraw, trace, recolor, stretch or regenerate the logo. Prefer the master-derived PNGs over the traced SVGs. The AI Agent tab uses the ORYN symbol, not a house icon. The reversed (white wordmark) logo is not used in the in-app UI. Never edit `00_Original_Approved_Designs/`.
- Colors, spacing, radius, elevation, type scale come from `docs/design/tokens.json`. No hardcoded hex values or magic numbers in screens. Sizes in dp, text in sp with system font scaling supported. Min text 12 sp.
- Never convey status by color or icon shape alone; always add a text label. Provide accessibility labels and status announcements.

## i18n / RTL
- All user-visible strings go through the i18n layer with Arabic and English entries. No hardcoded strings.
- Use start/end (not left/right). Mirror layout and directional arrows/back chevrons; do not mirror the logo or Play/Stop/Retry glyphs.
- Commands, paths, logs and code render as isolated LTR blocks.
- Arabic font family: **Unknown** (not chosen yet). Do not pick one without approval.

## Engineering workflow
- Small, reviewable PRs. One milestone item per task. Describe what you did and what you did not verify.
- Do not add a dependency without stating name, pinned version, and why. Use `npx expo install` for Expo-managed packages. Record versions after reading current upstream docs; do not guess compatibility.
- Run lint, typecheck and tests before finishing. Add tests for logic you add.
- Cloud sandbox limits: there is no emulator or physical device. Never claim device, launcher, accessibility or RTL testing was done. Say "not verified on device".
- Never commit secrets, keystores or `.env` files.

## Definition of done (per task)
1. Matches the relevant spec section and the Figma frame / `docs/design` spec.
2. No mock values reachable in production code paths.
3. Light Mode tokens, AppIcon, i18n (AR+EN) and RTL respected.
4. Lint, typecheck, tests pass; limitations listed in the PR description.
