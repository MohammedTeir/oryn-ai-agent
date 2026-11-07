# Milestone 1: phone storage schema observations

The owner supplied a [first report](device-storage-schema-2026-11-07.json) and a [second report](device-storage-schema-reopen-2026-11-07.json) in chat on 2026-11-07, after being asked to close and reopen the app between checks. Both record `storage.schemaCheck` returning `tables_present`, schema version 1, and foreign keys enabled for the checked connection. The second report has a fresh evidence history. These are user-supplied device observations; the cloud executor did not run the checks, and the reports alone do not establish precisely how the app was closed or whether its process was killed.

The reports do not verify persistence of user records, migration recovery after interruption or process death, database content integrity, encryption, or foreign-key behavior on other connections. Both `observation` fields are null, so neither report independently identifies the device, Android version, or installed application ID. The exact installed APK, its hash, download source, and source commit are **Unknown**; they cannot be inferred from the reports or release dates. An earlier separate report identified the owner's device as a Redmi Note 8 Pro running Android 11.

A `native.getState` entry in each report shows Termux detected and its Android `RUN_COMMAND` permission denied at that observation. Provider configuration is not observed. This is separate from the SQLite check and does not indicate whether an external command was dispatched or could succeed.

The schema can be checked again with the current harness. The separate test below covers a non-sensitive marker in an isolated debug database; a process-death test must distinguish verified termination from merely leaving the app.

## Isolated persistence probe

On 2026-11-07 the owner supplied a [write report](device-persistence-write-2026-11-07.json) and [read report](device-persistence-read-2026-11-07.json) after being instructed to close and reopen the app. The write reports `test_record_written`; the later read reports `test_record_found` with the same marker and writer-session token. Its reader-session token differs and `javascriptSessionChanged` is true. This supports successful readback of that random test marker from the isolated debug database in a different JavaScript session.

This is not proof that Android killed the process: a JavaScript reload can also change the session token. It does not test production application records, process-death recovery, database integrity, backup/restore, Keystore or migration interruption. Both reports have `observation: null`, and installed APK hash, source and device identity remain **Unknown** in these exports. Termux permission was separately reported denied; the database probe does not request or execute a Termux command.
