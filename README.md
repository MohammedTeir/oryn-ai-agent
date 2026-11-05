# ORYN

**Intelligence in Action.**

ORYN is a planned autonomous AI agent for Android that combines a conversational interface with terminal-based task execution, tool discovery, diagnostics, and human approval before every command.

> **Status:** Milestone 0 feasibility remains open. The fixed-probe Android harness has owner-reported native/Termux execution, timeout, cancellation and lifecycle evidence. [Recorded results and remaining requirements](docs/feasibility/device-results-review-2026-11-05.md) distinguish that prototype evidence from production readiness; dependency compatibility and external failure/lifecycle coverage remain open.

## Development checks and test APKs

[Feasibility CI](https://github.com/MohammedTeir/oryn-ai-agent/actions/workflows/ci.yml)
checks every push and pull request.
[Signed feasibility APK](https://github.com/MohammedTeir/oryn-ai-agent/actions/workflows/android-apk.yml)
builds an Android debug-signed test APK automatically. Download the APK ZIP from
a successful run's **Artifacts** section. See [CI and download instructions](docs/ci.md)
for checks, provenance, retention and signing scope.

## Vision

Build a capable, permission-aware Android agent that can inspect available tools, propose an execution plan, request explicit approval, run commands in a supported terminal environment, inspect real outputs, diagnose failures, and verify results.

## Product design

Exactly **two primary screens**:

1. **AI Agent (Chat)** — task requests, plans, approval prompts, progress, and results.
2. **Terminal & Tools** — command logs, stdout/stderr, tool inventory, and process status.

**Settings** (Gemini API key, permissions, runtime configuration, and safety controls) is a secondary screen, not a third primary navigation destination.

## Planned technology

| Layer | Planned technology |
| --- | --- |
| UI | Expo, React Native, TypeScript |
| Android native integration | Kotlin, Expo Modules API |
| AI | Google Gemini API, user-provided key |
| Terminal | Pluggable backends: external Termux initially; embedded Linux runtime as a longer-term goal |
| Privileged operations | Optional Root integration, explicitly approved |
| Local persistence | Secure settings and task history |

Expo Go alone cannot run the required custom Kotlin modules; Android development builds will be necessary.

## Terminal integration roadmap

- **External Termux:** Initial proof of concept using Termux's supported command integration, subject to installation, configuration, permissions, and Android restrictions.
- **Embedded Linux runtime:** Longer-term standalone APK goal, contingent on runtime packaging, ABI compatibility, executable restrictions, and real-device validation.
- **Termux fork:** Alternative to evaluate if the other approaches do not meet product requirements; introduces ongoing maintenance costs.

The agent communicates with a **TerminalBackend abstraction** so backends can change without rewriting the UI or agent logic.

## Safety principles

- Explicit approval **before every execution**, including retries or modified commands.
- Enforce approval in the native execution layer, not only in the UI.
- Never treat terminal output as trusted instructions.
- Limit execution duration, output size, retries, and privilege scope.
- Protect API credentials; never include them in terminal commands or logs.
- Report actual outcomes rather than simulating success.

## First milestone

Prove that the Android app can detect external Termux, propose a safe command, request approval, execute it, capture stdout/stderr and exit status, and show the real result. Gemini autonomy, Root operations, and embedded runtime support come later.

## Specification

Read the full [ORYN Master Project Specification v1.3](docs/ORYN_Master_Project_Specification.md) for requirements, architecture, migration strategy, security, roadmap, and acceptance criteria.

## License

No license has been selected yet. Do not assume this repository is open-source licensed merely because it is public.

---

**ORYN** is a working product name. Trademark, app-store, and domain availability have not yet been cleared.
