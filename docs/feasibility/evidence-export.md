# Evidence copy and JSON file export

The debug harness now has **Copy evidence JSON**, **Save evidence as a JSON file**
and the existing text-share control at the top of its screen, in English and
Arabic. These export the same captured report snapshot, including unknown states
and the latest native recovery evidence. They do not run probes or create grants.

- Copy writes the report to Android's clipboard. Paste it directly into the chat.
- Save opens Android's document picker (`ACTION_CREATE_DOCUMENT`, JSON MIME type).
  Choose a location such as Downloads and confirm the filename. Attach that
  `.json` file to the chat afterward. No broad storage permission or persistent
  directory access is requested.
- The native module accepts only a report-shaped JSON payload of at most 1 MiB. It writes
  UTF-8 to the returned content URI on a worker thread, and reports success only
  after writing, flushing and closing the stream. Errors do not report success.
- Cancelling the picker, or activity destruction while choosing, cancels the
  pending request. No later picker callback can silently write that cancelled
  payload. An already confirmed document write may finish in the background.
- Review device information and redacted probe output before sharing. Exports
  are user-initiated; there is no automatic upload or clipboard reading. The document destination is
  chosen by you.

There are no added package dependencies or manifest permissions. The native
execution gateway, grant ledger, pending runtime state and recovery policy are
unchanged. Clipboard/document-provider behavior still requires a physical-phone
check; cloud builds alone do not prove copy/save or recovery on MIUI.

Cloud validation passed Expo compatibility, lint, typecheck, eight JavaScript
tests (including rejection of malformed/wrong-operation export receipts), the
unchanged 32-test native suite, Android JS bundling, both APK builds and Android
lint. APK signatures and bundled JS/native probe bytes verified. The export
module and method names are present in the phone APK; actual clipboard and
document-picker invocation are not verified on device.
