#!/data/data/com.termux/files/usr/bin/bash
# Run only on the owner's device. Never run from CI or commit the keystore.
set -euo pipefail
set +x
umask 077
repo='MohammedTeir/oryn-ai-agent'
key_dir="$HOME/.oryn-release-signing"
key_file="$key_dir/oryn-release.p12"
for tool in gh keytool openssl base64 tr sed; do command -v "$tool" >/dev/null || { printf 'Missing required tool: %s\n' "$tool" >&2; exit 1; }; done
login=$(gh api user --jq .login) || { echo 'Cannot verify GitHub account. Run gh auth login first.' >&2; exit 1; }
if [[ "$login" != 'MohammedTeir' ]]; then echo 'Sign in to the MohammedTeir GitHub account before continuing.' >&2; exit 1; fi
if [[ -e "$key_dir" ]]; then
  printf 'Signing directory already exists. Stopping to avoid replacing a key: %s\n' "$key_dir" >&2
  exit 1
fi
# Do not overwrite secrets or rotate an existing signer. Also confirms secret access.
existing=$(gh secret list --repo "$repo") || { echo 'Cannot list repository secrets. Check GitHub authentication and repository admin access.' >&2; exit 1; }
if printf '%s\n' "$existing" | grep -qE '^ORYN_RELEASE_(KEYSTORE_B64|KEY_ALIAS|STORE_PASSWORD|KEY_PASSWORD|CERT_SHA256)[[:space:]]'; then
  echo 'One or more ORYN release secrets already exist. Stop and inspect them before creating or replacing a key.' >&2
  exit 1
fi
printf 'Choose a strong keystore password (at least 12 characters). Store it in a password manager.\n'
read -r -s -p 'Password: ' ORYN_SETUP_PASSWORD; printf '\n'
read -r -s -p 'Repeat password: ' oryn_password_confirm; printf '\n'
if [[ ${#ORYN_SETUP_PASSWORD} -lt 12 || "$ORYN_SETUP_PASSWORD" != "$oryn_password_confirm" ]]; then
  echo 'Passwords do not match or are too short. No key was created.' >&2; exit 1
fi
unset oryn_password_confirm
export ORYN_SETUP_PASSWORD
mkdir -m 700 "$key_dir"
keytool -genkeypair -alias oryn-release -keystore "$key_file" -storetype PKCS12 \
  -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=ORYN Release' \
  -storepass:env ORYN_SETUP_PASSWORD -keypass:env ORYN_SETUP_PASSWORD >/dev/null 2>&1
chmod 600 "$key_file"
cert=$(LC_ALL=C keytool -list -v -alias oryn-release -keystore "$key_file" -storepass:env ORYN_SETUP_PASSWORD 2>/dev/null \
  | sed -nE 's/^[[:space:]]*SHA256: ([0-9A-F:]+)$/\1/p' | tr -d ':' | tr '[:upper:]' '[:lower:]')
[[ "$cert" =~ ^[a-f0-9]{64}$ ]] || { echo 'Could not verify the certificate. The local key was retained; do not generate another.' >&2; exit 1; }
printf 'Uploading encrypted GitHub Actions secrets. Never share the keystore or password in chat.\n'
base64 < "$key_file" | tr -d '\n' | gh secret set ORYN_RELEASE_KEYSTORE_B64 --repo "$repo"
printf '%s' 'oryn-release' | gh secret set ORYN_RELEASE_KEY_ALIAS --repo "$repo"
printf '%s' "$ORYN_SETUP_PASSWORD" | gh secret set ORYN_RELEASE_STORE_PASSWORD --repo "$repo"
printf '%s' "$ORYN_SETUP_PASSWORD" | gh secret set ORYN_RELEASE_KEY_PASSWORD --repo "$repo"
printf '%s' "$cert" | gh secret set ORYN_RELEASE_CERT_SHA256 --repo "$repo"
unset ORYN_SETUP_PASSWORD
printf 'Release key created on this device and secrets configured. Public certificate SHA-256: %s\n' "$cert"
printf 'Keep an encrypted backup of %s and your password. Uninstalling Termux deletes its private files.\n' "$key_file"
