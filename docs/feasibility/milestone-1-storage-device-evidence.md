# Milestone 1: first phone storage schema observation

The owner supplied [this evidence report](device-storage-schema-2026-11-07.json) in chat on 2026-11-07. It records `storage.schemaCheck` returning `tables_present`, schema version 1, and foreign keys enabled for the checked connection. The report is user-supplied device evidence; the cloud executor did not run the phone check.

This is one observation. It does not show a second check after the app was closed and reopened, persistence of user records, migration recovery after interruption or process death, database content integrity, encryption, or foreign-key behavior on other connections. The report's `observation` field is null, so it does not independently identify the device, Android version, or installed application ID. The exact installed APK, its hash, download source, and source commit are **Unknown**; they cannot be inferred from the report or release dates. An earlier separate report identified the owner's device as a Redmi Note 8 Pro running Android 11.

A prior `native.getState` entry in the same report shows Termux detected and its Android `RUN_COMMAND` permission denied at that observation. Provider configuration is not observed. This is separate from the SQLite check and does not indicate whether an external command was dispatched or could succeed.

Next, close and reopen the app, tap **Check local database tables** again, and copy a fresh evidence report. Keep both reports: this will show whether the schema can be opened after a restart of the app, but will not itself establish persistence of user records or recovery from process death.
