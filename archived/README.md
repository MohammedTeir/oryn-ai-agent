# ORYN — Approved Design Archive

This directory is reserved for **approved** ORYN UI and branding designs. Drafts and rejected concepts must not be added here.

## Approved screens

| Design | Version | Status | Notes |
| --- | --- | --- | --- |
| AI Agent — Awaiting Approval | v1.0 | Approved | Light-only UI; official ORYN logo #2; command 1 awaiting explicit approval; command 2 queued/collapsed; no fabricated execution results |
| Terminal & Tools — Command Review | v1.0 | Approved | Light-only UI; Termux shell, command review, per-command explicit approval, quick and saved commands routed through Review & Run |

**Approved asset filenames:** `oryn-ai-agent-v1.0-approved.png` and `oryn-terminal-tools-v1.0-approved.png`.

The approved PNGs are retained as separate exported design assets and **have not yet been committed to this repository**. Add them under this directory when binary upload is available; do not substitute different mockups.

## Archive conventions

- Store each approved design as `oryn-<screen>-v<major>.<minor>-approved.png`.
- Never overwrite a previous approved revision; add a new version.
- Include the design status and important behavior in this index.
- Mockup text and runtime values are illustrative only. Production UI must bind connection status, approvals, timing, outputs and results to real backend state as required by `docs/ORYN_Master_Project_Specification.md`.

## Tools tab — approved v1.0

- **Approved visual asset:** `oryn-tools-tab-v1.0-approved.png` (exported in ORYN Approved Screens v1.1 ZIP; binary not yet committed to GitHub).
- Light-mode Tools tab with inventory, search/filter, installation review, command-check review, dynamic compatibility status, and diagnostics.
- All displayed tool statuses and Termux connection details are illustrative; implementation must use live backend state and per-action approval per the master specification v1.6.

## Settings — approved v1.0

- **Approved visual asset:** `oryn-settings-v1.0-approved.png` (included in ORYN Approved Screens v1.2 ZIP; PNG binary not yet committed to GitHub).
- Light-mode Settings page: AI Configuration, Terminal & Runtime, Root & Permissions, Security & Approvals, Data & Storage, and About ORYN.
- Mandatory behavior: root shell checks use Review Check; all shell actions require independent approval; Gemini key is excluded from logs and exports; runtime status must be verified; destructive actions and imports require confirmation. See master specification v1.8.

## UI States & Execution Flow — approved v1.3

- **Approved image:** `oryn-ui-states-execution-flow-v1.3-approved.png` (available in the downloadable ORYN Approved Designs v1.3 ZIP; PNG binary has not been committed to this GitHub repository).
- Covers Termux connection states, root verification, per-command review and approval, execution lifecycle, confirmation dialogs, import preview, and fresh approval on retry.
- Visual examples only; real runtime status and permission diagnostics must come from the device. Refer to `docs/ORYN_Master_Project_Specification.md` v1.8 for mandatory enforcement.

## Design System & Components — approved v1.2

- **Approved visual asset:** `oryn-design-system-components-v1.2-approved.png` (included in downloadable ORYN Approved Designs v1.4 ZIP; binary not yet committed to GitHub).
- Light-mode design tokens (Android dp/sp), typography, colors, icons, reusable buttons and inputs, runtime status indicators, approval review variants with and without root, execution states, two-tab navigation, reset confirmation, and import preview.
- Runtime data must be live and verified; all shell executions, including retries and root checks, require fresh explicit approval. Mockup values and command examples are not executable defaults.
