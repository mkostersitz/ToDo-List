# EthervoxAI Habit Tracker — Claude Code Configuration

## Project identity
App: EthervoxAI Habits. Privacy-first, voice-first, fully on-device.
Platform: React Native (Expo SDK 52) for iOS 16+ and Android 10+.
Language: TypeScript strict mode. Bun as package manager and test runner.

## IMPORTANT: Read at session start
1. Read APP_SPEC.md (source of truth)
2. Read ARCHITECTURE.md
3. Read claude-progress.txt (last 50 lines)
4. Read feature_list.json — find next status: "pending"
5. Announce: "Session ready. Next feature: [name]. Proceeding."

## Absolute rules (never violate)
IMPORTANT: No data leaves the device. No analytics, no cloud logging, no remote AI calls.
IMPORTANT: All ML inference uses ONNX Runtime on-device. No Anthropic API in app code.
IMPORTANT: Never commit .env.local, API keys, or model weights to Git.
IMPORTANT: Never force-push to main or develop.
IMPORTANT: bun test --coverage must pass before any PR is created.
IMPORTANT: TypeScript strict — never use `any`. Build failure if present.

## Commands
INSTALL: bun install
DEV: bunx expo start
IOS: bunx expo run:ios
ANDROID: bunx expo run:android
TYPECHECK: bunx tsc --noEmit
LINT: bunx expo lint
TEST: bun test
COVERAGE: bun test --coverage
BUILD IOS: eas build --platform ios --profile production
BUILD AND: eas build --platform android --profile production
CLEAN: rm -rf .expo node_modules/.cache && bun install

## Git rules
IMPORTANT: Never force-push to main or develop branches.
IMPORTANT: Never delete main, develop, or release/* branches.
Create a new feature branch for every item in feature_list.json.
Branch naming: feature/<kebab-case-feature-name>
Commit messages must follow Conventional Commits format.
Always run bunx tsc --noEmit && bunx expo lint before committing.
Create PR via gh pr create after each feature is complete.
Human gate required before merging any PR to main.

## Architecture rules
IMPORTANT: Never put business logic in screens/ or navigation/.
IMPORTANT: Only features/ directories may access SQLite via habitDb.ts.
IMPORTANT: shared/ contains only pure utilities — no React, no state.

## Session protocol
At session end: update claude-progress.txt with completed features and blockers.
If context > 80%: run /compact before continuing.
