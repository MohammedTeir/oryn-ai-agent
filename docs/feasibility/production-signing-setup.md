# Production app identity and signing setup

The owner selected `io.github.mohammedteir.oryn` on 2026-11-09 for the production Android app. This is distinct from the provisional `io.github.mohammedteir.oryn.feasibility` debug app; Android treats them as separate apps and does not automatically transfer their data. The owner requested a new release signing key. Repository naming ownership was confirmed by the owner; trademark and broader naming clearance remain separate open issues.

The `Production-signed shell build` workflow runs on updates to `main` or manual dispatch, and skips its build until all signing secrets exist. It never runs release signing on pull requests. It builds the current incomplete shell, verifies the signing certificate against the configured fingerprint, and uploads an Actions artifact. It does not publish a GitHub release or claim that Milestone 1/v1 is complete. The workflow sets Android versionCode from its GitHub run number; preserve a monotonically increasing version code across future workflow changes. The unsigned build strips generated debug signing and runs before the release keystore is decoded. A separate signing step refuses missing signing inputs, verifies the final app ID and signer, excludes known feasibility execution modules and probe, and checks SecureStore backup rules. Existing debug-signed feasibility builds and releases remain separate.

## Owner setup on the phone (after this change is merged)

This session cannot manage repository secrets: GitHub returned HTTP 403 for the Actions secrets API. Do not paste a keystore, password, GitHub token, or Base64 key into chat or commit them to the repository. The owner can create the new key in Termux and send it directly to GitHub Actions secrets with `gh`; GitHub CLI encrypts secret values before upload.

1. In Termux, install the tools (the `openjdk-21` and `gh` arm64 Termux packages were checked on 2026-11-09):

   ```sh
   pkg update
   pkg install openjdk-21 gh curl less
   gh auth login --hostname github.com --git-protocol https --web
   gh auth status
   ```

   Sign in as `MohammedTeir` and authorize access to manage Actions secrets for this repository. The setup script checks the account and refuses to overwrite an existing ORYN release secret or local signing directory.

2. After this PR is merged, download and inspect the script before running it:

   ```sh
   curl -fsSL https://raw.githubusercontent.com/MohammedTeir/oryn-ai-agent/main/spikes/android-feasibility/scripts/setup-release-key-termux.sh -o oryn-key-setup.sh
   less oryn-key-setup.sh
   bash oryn-key-setup.sh
   ```

   Choose a strong password and keep it in a password manager. The script creates `$HOME/.oryn-release-signing/oryn-release.p12` on the phone and uploads five secrets: `ORYN_RELEASE_KEYSTORE_B64`, `ORYN_RELEASE_KEY_ALIAS`, `ORYN_RELEASE_STORE_PASSWORD`, `ORYN_RELEASE_KEY_PASSWORD`, and `ORYN_RELEASE_CERT_SHA256`. It prints only the public certificate fingerprint, not the key or password.

3. Keep a separate encrypted backup of the `.p12` file and the password. Uninstalling Termux or clearing its data removes Termux private files. GitHub does not allow secret values to be retrieved later. Losing the key or password prevents signing compatible updates. Do not rotate the key or overwrite existing secrets without a deliberate migration plan. If you need to move the password-protected keystore into a secure vault from your phone, you can temporarily copy it to Downloads:

   ```sh
   termux-setup-storage
   test ! -e "$HOME/storage/downloads/oryn-release-backup.p12" && cp "$HOME/.oryn-release-signing/oryn-release.p12" "$HOME/storage/downloads/oryn-release-backup.p12"
   ```

   Downloads is shared storage: move the file into your encrypted vault, verify the backup, and remove the temporary Downloads copy. Keep the password separately. Do not send either one in chat.
4. After secrets are configured, the workflow runs on updates to `main`. To run it immediately, open **Actions → Production-signed shell build → Run workflow** on `main`. The resulting `oryn-production-shell-…` artifact is an incomplete test of the shell under the production identity, not an approved public release. Do not install or distribute it as a finished product.

If upload stops partway, do not rerun the key-generation script or generate a second key. Keep the local keystore and password, inspect which `ORYN_RELEASE_*` secret names were set, and complete missing uploads using the same key. Ask for help without sharing secret values. The script intentionally refuses existing secrets and an existing key directory to prevent an accidental key rotation.

## Verification status

Automated cloud tests use an ephemeral test-only signing key, not the owner's release key. A production key has not been created or configured by this environment; a successful real-key workflow run and the owner's independent backup are still required. The release workflow does not replace physical-device, security, accessibility or milestone acceptance.
