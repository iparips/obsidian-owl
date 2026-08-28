# Desktop MVP: Implementation Order

Numbered steps; each is small enough to review alone. Steps marked with the same letter can proceed in parallel once step 1 lands.

1. Scaffold: package.json, tsconfig, vite config, manifest, bun build script, empty main.ts that loads.
2. Contracts: providers/types.ts, engine/outcome.ts, settings/settings.ts exactly as [2-data-model.md](2-data-model.md).
3. (A) MistralProvider with fetch-mocked tests.
4. (A) Tool schemas and system prompt builder.
5. (A) EditApplier with tests; pure string plus editor-mock work.
6. (A) Recorder with tests.
7. EditEngine tool loop with tests, using 3-5.
8. EditSession and session binding in main.ts.
9. SessionPanel and SessionView, wiring capture, engine and provider.
10. SettingsPanel and settings tab.
11. styles.css and manual exit test against a dev vault.

## Parallelisation

- Steps 3-6 are independent of each other; they share only step 2's contracts.
- Steps 9 and 10 are independent of each other once 7 and 8 exist.
- The exit test (step 11) is the only step needing a real API key.
