#!/usr/bin/env bash
set -euo pipefail

# Called only after the trusted main-branch build job uploads its artifact.
artifact_dir=${1:?artifact directory required}
: "${GITHUB_SHA:?}" "${GITHUB_RUN_ID:?}" "${GITHUB_RUN_ATTEMPT:?}" "${GITHUB_REPOSITORY:?}" "${GITHUB_SERVER_URL:?}"
[[ "$GITHUB_SHA" =~ ^[0-9a-f]{40}$ ]]
[[ "$GITHUB_RUN_ID" =~ ^[0-9]+$ && "$GITHUB_RUN_ATTEMPT" =~ ^[0-9]+$ ]]

python3 - "$artifact_dir" <<'PY'
import hashlib, json, os, pathlib, re, sys
root = pathlib.Path(sys.argv[1])
apk = root / 'oryn-feasibility-phone.apk'
info = json.loads((root / 'build-info.json').read_text())
commit = (root / 'source-commit.txt').read_text().strip()
digest = hashlib.sha256(apk.read_bytes()).hexdigest()
checksum = (root / 'SHA256SUMS').read_text().strip()
if commit != os.environ['GITHUB_SHA'] or info.get('source_commit') != commit:
    raise SystemExit('Source commit does not match this workflow run')
if info.get('apk_sha256') != digest or checksum != f'{digest}  {apk.name}':
    raise SystemExit('APK checksum or provenance does not match')
if info.get('signing') != 'Android debug signer; test-only feasibility app':
    raise SystemExit('Unexpected signing description')
signer = info.get('signer_sha256')
if not isinstance(signer, str) or not re.fullmatch(r'[0-9a-f]{64}', signer):
    raise SystemExit('Missing signer fingerprint')
signature = (root / 'phone-apk-signature.txt').read_text()
if not signature.startswith('Verifies\n') or f'certificate SHA-256 digest: {signer}' not in signature:
    raise SystemExit('Signature verification output does not match provenance')
notes = f'''## Test-only feasibility APK

This is an Android debug-signed test build, not a production ORYN release. It contains the feasibility harness and Milestone 1 preview. Device behavior is not verified by CI.

- Source commit: `{commit}`
- APK SHA-256: `{digest}`
- Signer certificate SHA-256: `{signer}`
- Build: {os.environ['GITHUB_SERVER_URL']}/{os.environ['GITHUB_REPOSITORY']}/actions/runs/{os.environ['GITHUB_RUN_ID']}

Debug signing keys may differ between builds. Android may refuse an update signed with a different key; export any feasibility evidence before uninstalling an existing app.
'''
(root / 'release-notes.md').write_text(notes)
PY

tag="feasibility-test-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"
gh release create "$tag" \
  "$artifact_dir/oryn-feasibility-phone.apk" \
  "$artifact_dir/SHA256SUMS" \
  "$artifact_dir/build-info.json" \
  "$artifact_dir/phone-apk-signature.txt" \
  --target "$GITHUB_SHA" --title "ORYN feasibility test ${GITHUB_RUN_ID}.${GITHUB_RUN_ATTEMPT}" \
  --notes-file "$artifact_dir/release-notes.md" --draft --prerelease --latest=false
gh release edit "$tag" --draft=false --latest=false
