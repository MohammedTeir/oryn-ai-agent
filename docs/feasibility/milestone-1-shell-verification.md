# M1-04 — Application shell verification

**Status:** Cloud implementation and local checks complete; GitHub checks for the current change, physical-device acceptance and production identity/signing remain open. This record is not a milestone closure.

## Scope and evidence

- The standalone entry is `spikes/android-feasibility/production/index.ts`; the feasibility harness retains its separate `index.ts`. The test APK can also open a clearly labeled shell preview without replacing the feasibility tests.
- The shell has AI Agent and Terminal & Tools as its only primary tabs. Settings is secondary; Terminal, Tools and History are segments. The navigation reducer and its tests cover selection, back behavior and Settings restoration.
- The shell has loading, unavailable, unknown and error presentations. The root and content recovery boundaries show bounded bilingual/localized text and a user-triggered retry. Exceptions are not placed in the fallback text. This does not establish behavior for every possible native crash or process death.
- `scripts/build-shell-test.sh` creates a separate Android test project, builds the standalone entry and verifies the signed APK. `scripts/verify-shell-apk.py` checks the bundled entry and absence of the known feasibility module classes and probe. The build checks that Termux RUN_COMMAND permission is absent. These checks do not establish a complete security audit or authorize execution.
- The shell test APK uses the owner-authorized provisional `io.github.mohammedteir.oryn.feasibility` debug-only ID and Android debug signing. Its CI artifact is separate from the published feasibility prerelease. It is not a production identity, signer or release. Because the ID is shared, installation may replace the feasibility app or fail on signature mismatch; no installation or data migration is claimed.

On 2026-11-09, local lint, typecheck, 71 tests, both Android JS bundles and the isolated Android build/lint passed. The debug-signed shell APK passed v2 signature and package-boundary checks; its SHA-256 was `252dc746e52f1959a0c15926c530aa8818184f1c4be4299928d0643ae1534804`. This is cloud build evidence, not a device result.

## Acceptance and remaining evidence

| Item | Status |
| --- | --- |
| Separate shell entry, two primary tabs, secondary Settings and terminal segments | Implemented; automated source, routing and bundle checks exist |
| Standalone Android APK and known feasibility-module exclusion | Debug test build and package checks; see PR #41 and current PR validation |
| Loading, unavailable and error fallback | Implemented; automated fallback test and bundles; native/UI behavior not device-verified |
| Production application ID and signing | Unknown; do not promote the provisional debug identity to production |
| AI Agent design and Arabic font approval | M1-02 remains open; existing temporary presentation is not final design approval |
| Phone navigation, startup, error display, 360 dp/200% text, RTL and accessibility | Open; collect during the milestone-end device acceptance pass requested by the owner |

The native feasibility gateway remains a fixed-probe prototype. This shell exposes no executable command entry; production execution remains blocked on the specified native authorization implementation and validation.
