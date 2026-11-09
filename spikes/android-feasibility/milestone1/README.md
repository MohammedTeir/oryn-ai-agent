# Milestone 1 navigation scaffold

An independent, non-executing application shell entry now exists at `../production/index.ts`. Run `node scripts/bundle-production.cjs` from the spike directory to bundle it. It does not import the feasibility app, preview approval example or native probe module. The normal feasibility APK still starts the harness; this separate entry is not yet a production APK. The shell loads the shared locally stored language preference and offers language selection in Settings; unavailable screens and the connection state remain truthful placeholders. Branding approval, production startup/integration, full accessibility and device testing remain open.

The shell's AI Agent view reads the most recently updated local conversation and displays up to its first 100 saved user messages. A full page is explicitly flagged as potentially incomplete. Empty, loading and failure states are distinct; no message composer, Gemini response or execution action is available yet. The production shell has not been installed or tested on a device.

This separate entry provides the two primary destinations, secondary Settings, and the Terminal / Tools / History segments. Screens contain unavailable placeholders; they do not execute commands or report simulated connection state. The existing feasibility entry and native gateway are unchanged.

`node scripts/bundle-milestone1.cjs` checks that Metro can bundle this entry. The feasibility APK opens the test harness and includes an explicitly labeled navigation preview, with a return button. The harness remains mounted while the preview is open so its captured in-memory evidence is retained. This does not establish device behavior; phone verification is outstanding.

The header uses the approved symbol and the product name as system text. An approved standalone wordmark without the tagline is not present in the supplied PNG assets, so the specified branded wordmark remains unresolved. Exact icon sizing and the Arabic font are also unknown. Verify the layout, scaling, RTL, accessibility, and tab symbol on a device before considering this scaffold finished.

The AI Agent navigation preview includes an explicitly labeled approval-card example with disabled decision controls. It contains illustrative data only, has no execution or authorization callback, and is not a production proposal component. Real proposal binding, complete Batch/Session scope review, native-gateway integration, separate high-risk confirmation, and device accessibility/RTL testing remain outstanding.
