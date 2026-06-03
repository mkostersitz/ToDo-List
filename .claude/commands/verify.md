Run full verification suite:
1. bunx tsc --noEmit
2. bunx expo lint
3. bun test --coverage
4. bunx madge --circular src/
Report all failures. Do not proceed until all pass.
