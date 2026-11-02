# ORYN component specs (structure and behavior)

Visual details (exact sizes, spacing, shadows) come from the approved design images and Figma frames. This file defines structure, states and rules so they can be implemented consistently. Values use tokens from `tokens.json`.

## Header (AI Agent)
- Start: ORYN symbol + wordmark (PNG from `assets/ORYN_Brand_Assets/`). No tagline.
- End: connection chip, History, Settings. Targets >= 48 dp. At about 360 dp it must not wrap; extras go to an overflow menu.
- Connection chip states (text + icon, never color alone): Checking, Connected (only after a real capability check), Disconnected, Permission Required, Unavailable, Unknown.

## Bottom navigation
- Two tabs only: AI Agent (ORYN symbol; monochrome when inactive) and Terminal & Tools (`Terminal`).
- Test the symbol at 24 dp on device. If the sparkle is lost, request an owner-approved tab-size variant; do not substitute another glyph.

## Chat
- Messages: user, assistant (symbol avatar), structured action proposal, execution status, verified result.
- Show only states relevant to the current task. Never show approval, running and success together.
- Queue: compact count of waiting tasks with `Queued` state.

## Approval card
1. Summary: exact command (expandable, never silently truncated), risk badge with text, one-line effects.
2. Decision-relevant items always visible in the summary: root, network, deletion, writes outside the workspace.
3. Details disclosure: executable/arguments, working directory, runtime, privilege, env var names, filesystem/network effects, timeout.
4. Approve / Reject pinned at the bottom. Strict preselected; Batch and Session under "More approval options", with scope shown before selection (Session default 15 min / 20 commands).
5. Plan preview is not authorization. Root/high-risk needs a separate exact confirmation.
6. Never show approval controls for an action already executed.

## Execution states
Queued, Awaiting Approval, Running, Paused, Completed, Failed, Cancelled, Unknown. Elapsed time and progress come from real events; estimates are labeled; no fabricated percentages. A Stop control is always visible while running; cancellation shows actual termination or uncertainty.

## Terminal & Tools
- In-page segmented control: Terminal | Tools | History (not primary navigation).
- Terminal: streaming output, stdout/stderr filters, status, elapsed time, exit code, cancel.
- Tools: inventory (Detected vs Verified Working), versions, paths, runtime compatibility (Supported / Requires Setup / Unsupported / Unknown with reason), timestamps for cached data.
- History: read-only logs and execution history.

## Status indicators
Always icon + text label. Colors from tokens: success, warning, error, info, disabled. Unknown/Checking use neutral styling.

## Icons
`AppIcon` with semantic names (see the spec's Lucide mapping). Connection = Plug/Unplug (or Link/Unlink). Root = KeyRound or ShieldCheck + label. No fingerprint, no Wi-Fi for Termux.

## RTL
Mirror layout and directional arrows; do not mirror the logo or Play/Stop/Retry. Commands, paths and logs are LTR blocks. Verify Arabic text expansion in buttons, chips and the approval card.
