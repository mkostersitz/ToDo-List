---
description: Code review with architecture and security focus
allowed-tools: Read, Grep, Glob, Bash
model: claude-opus-4-6
---

Review for: TypeScript correctness, architecture violations (business logic in screens/),
privacy leaks (data leaving device), performance regressions, missing accessibility labels.
Flag any `any` type usage. Flag any direct SQLite access outside features/*/habitDb.ts.
Flag any network calls in src/ outside src/features/shared/shareEngine.ts.
