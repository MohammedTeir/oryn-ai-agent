# Local persistence foundation

`conversations.ts` provides a limited user-conversation repository with parameterized queries, bounded input/list sizes, cursor-based continuation and transactional creation/appending. Each connection must have foreign keys enabled. Deletion removes the conversation and its messages in one transaction; a reference from a task prevents deletion and rolls back the message removal. Future user-facing deletion must obtain confirmation. Message pages contain user-authored messages only; a cursor is not a snapshot, so concurrent inserts with an earlier timestamp and conversations reordered by updates can be missed until a fresh listing. `appConversations.ts` connects the repository to the existing Expo SQLite opener; it does not write on import and is not yet connected to a screen. Assistant message support, snapshot pagination, retention, task/plan/execution records, and physical-device acceptance remain open. A reported storage failure after commit (for example, a connection-close failure) may leave the write outcome uncertain; callers must reconcile existing records instead of blindly claiming success. Native authorization and credential storage remain separate.

The initial database schema and migration are a foundation, not yet wired into production application startup or screens. The debug feasibility harness can explicitly initialize the database and check table names; it does not write application records. Expo SQLite 58.0.15 and Expo Asset 58.0.20 (required for SQLite’s public imports to bundle) are pinned; SQLite was selected as the SDK-compatible SQLite boundary: it supports native, exclusive transactions and avoids adding a second ORM while the data model is still being defined. The project specification also lists Kotlin Room as a possible approach; selecting SQLite here does not decide the design of the native authorization ledger.

`migrateLocalDatabase` uses a fixed SQL schema, checks `user_version`, rejects unknown newer versions, and applies the schema and version in one exclusive transaction. `openLocalDatabase` checks that foreign keys are enabled on the returned connection. SQLite foreign-key enforcement is per connection; code using any additional connection, including exclusive-transaction connections, must explicitly establish and verify enforcement before writing. Future data access requires parameterized queries, transactional state transitions, validation, redaction, output bounds, retention, export and deletion controls. This schema is not a complete persistence implementation.

Never store API keys or other secrets here. Credentials need a separately reviewed Android Keystore-backed boundary. `approval_audit` is a display/history record only: it cannot issue, validate, restore or substitute a native grant, and no JS database value can authorize a command. The native gateway remains the authority. No production grant persistence has been implemented by this schema.

Cloud tests use Node's SQLite implementation to exercise creation, idempotence, reopen, interruption rollback and refusal of newer schema versions. The Expo SQLite module, Android persistence, concurrency, recovery after device process death, foreign-key behavior across connections and data-security properties remain unverified on device.

## Phone schema check

In the debug feasibility app, tap **Check local database tables**. It initializes the app database if needed, then checks the schema version, expected table names, and the foreign-key setting on that connection. Tap **Copy evidence JSON** and share the result; the entry source is `storage.schemaCheck`. After closing and reopening the app, repeat the check and share the new result separately. This shows whether the schema can be opened again, but it does not verify persisted user records, process-death recovery, encrypted credentials, or data integrity. The exported check contains no database rows, file paths or native exception text.

## Phone test-record persistence check

This explicit debug-only test uses a dedicated database, separate from `oryn-local.db`, credentials and the native authorization ledger. Each write appends a randomly generated, non-sensitive marker; it does not modify prior test records or application data. The exported evidence contains the random marker and random JavaScript-session tokens, but no database rows beyond that test marker, paths, credentials or exception messages.

After installing the test APK once:

1. Tap **1. Write a test record**. When the app says the test record was written, tap **Copy evidence JSON** and share that first report.
2. Close the app and open it again; do not uninstall it or clear its data.
3. Tap **2. Check the test record**, then tap **Copy evidence JSON** and share the second report separately.

The second report must contain the same marker and writer-session token as the first. `javascriptSessionChanged: true` means the JavaScript runtime used a new session token; it is not proof that Android killed a process. If it remains false, the app was resumed in the same JavaScript session, so the report does not establish a new-session check. This tests the isolated debug database and does not establish durability of application records, recovery from a verified process death, database corruption handling, backup/restore, or Android Keystore behavior.

## Preview language preference

The AI Agent navigation preview reads and writes one non-secret `language_preference` setting: device language, English, or Arabic. The SQLite upsert is parameterized and atomic, accepts only those three values, and serializes saves and later loads. A failed read or write is shown as unconfirmed; no secret or arbitrary setting can be written through this API. The preference controls the navigation preview and its approval example; the surrounding debug feasibility harness continues to use the device language. This is not a production Settings redesign, and Arabic/RTL appearance and preference persistence remain to be checked on a device.
