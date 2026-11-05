# Dependency build compatibility — Milestone 0

Selected exact probe pins: `lucide-react-native 1.68.0` (ISC), Expo-selected
`react-native-svg 15.16.0` (MIT), and `@google/genai 2.32.0` (Apache-2.0). They
were installed using Expo's installer and frozen with npm integrity entries.
[Observed metadata/source hashes](dependency-compatibility-2026-11-05.json) retain
the review scope and dates. This is a library build/import decision, not a
claim that production Gemini or rendering already works on the phone.

The installed Expo 58.0.23 compatibility table selects SVG 15.16.0. Lucide's
published peer ranges include React 19 and that SVG version. The real Plug,
Unplug, Link, Unlink, KeyRound and ShieldCheck exports typecheck. These imports
are in an explicitly build-only fixture, not raw icon imports in an app screen.
Production screens must still use a typed AppIcon semantic map.

Google's package exports a public `@google/genai/web` entry, which this fixture
uses explicitly. The Node-specific entry is not selected or polyfilled into
Android. The installed version's README describes Node >=20 and browser usage;
the moving upstream README already discusses newer Node requirements, so it is
not substituted for the pinned tarball's contract. The official documentation
does not certify React Native end-to-end API behavior. Metro successfully
resolved and bundled the real web entry under Android platform resolution with
Expo/React Native. There is no dummy API key, SDK client construction, API
request, model name or mock success in the app path.

Reproduce from `spikes/android-feasibility`:

```bash
npm ci --no-audit --no-fund
npx --no-install expo install --check
npm run lint
npm run typecheck
npm test
npm run bundle:compatibility
npm run bundle:android
bash scripts/build-cloud.sh
bash scripts/build-phone.sh
```

The compatibility command loads the project's actual Metro configuration and
bundles `compatibility/dependency-entry.ts` to ignored artifacts. It does not
replace the app entry or execute the SDK. CI runs this check on both source and
APK workflows, and verifies frozen declarations after bundling. Native builds
also validate autolinked react-native-svg against RN 0.88.1 and the pinned Android
toolchain. No target lowering, compiler bypass or disabled integrity check is
used to obtain compatibility.

The stack record is now more than registry metadata: the selected package exports
are typechecked and Android-bundled, and SVG is compiled into the native APK.
Phone SVG rendering, Gemini HTTP/streaming, model discovery, Android network
errors, Keystore-backed API-key storage and production AppIcon integration are
later feature validation. They are not falsely reported as tested here. The
fixed native execution gateway and its grants are unchanged by this task.
