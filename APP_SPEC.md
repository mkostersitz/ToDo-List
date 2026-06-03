# EthervoxAI Habit Tracker — APP_SPEC.md

> **Machine-readable project specification for Claude Code autonomous build.**
> This file is the single source of truth. All scaffolding, feature implementation,
> architecture decisions, and acceptance criteria derive from this document.
> Read this file at the start of every session before taking any action.

---

## 1. Project identity

| Field | Value |
|-------|-------|
| App name | EthervoxAI Habits |
| Bundle ID (iOS) | ai.ethervox.habittracker |
| Package (Android) | ai.ethervox.habittracker |
| Version | 1.0.0 |
| Framework | React Native with Expo SDK 52 (new architecture enabled) |
| Language | TypeScript strict mode — no `any`, no JavaScript files |
| Package manager | Bun |
| Test runner | Bun test + React Native Testing Library |
| E2E framework | Maestro |
| State management | Zustand (global) + TanStack Query (async/cache) |
| Local database | expo-sqlite (SQLite, encrypted) |
| On-device AI | ONNX Runtime React Native — no cloud inference, ever |
| Navigation | React Navigation v7 (native stack) |
| Target platforms | iOS 16+ and Android 10+ |
| Host machine | macOS 14+ Apple Silicon |

---

## 2. Core product principles

These are non-negotiable constraints. Claude Code must enforce them throughout the build.

1. **Privacy-first, always offline.** No user data leaves the device. No analytics. No crash reporting that transmits PII. No cloud AI calls. All ML inference runs on-device via ONNX Runtime.
2. **Voice-first UX.** Every primary action must be completable via a single spoken utterance. Tap interactions are secondary. The app must be fully usable hands-free.
3. **Offline-first architecture.** The app must function with zero network connectivity. Network is used only for: optional zero-knowledge partner sync (Pro) and EAS build/update delivery.
4. **One breath, one check-in.** A habit check-in must require no more than one utterance and one confirmation. Any flow requiring more than two user turns is a UX failure.
5. **Multilingual by default.** All voice interactions support English, German, and Spanish without a mode switch. Language is detected per utterance.

---

## 3. Feature list

This section maps directly to `feature_list.json`. Claude Code processes features in ID order unless dependencies require otherwise.

### Feature 1 — Voice check-in parser
**Directory:** `src/features/voice/`
**Description:** On-device NLU pipeline that converts spoken utterances to structured habit log entries. Runs fully offline via ONNX Runtime.

**Sub-components:**
- ASR wrapper: `src/features/voice/asr.ts` — wraps Whisper Tiny ONNX model, returns transcript string
- Language detector: `src/features/voice/langDetect.ts` — classifies language per utterance (EN/DE/ES), returns ISO code
- Intent classifier: `src/features/voice/intentClassifier.ts` — maps transcript to one of 8 intent types
- Entity extractor: `src/features/voice/entityExtractor.ts` — extracts habit name, metric, unit, duration, skip reason
- Confidence gate: `src/features/voice/confidenceGate.ts` — routes high/mid/low confidence intents to act/confirm/clarify

**Intent taxonomy (all 8 must be handled):**

| Intent | Example utterances |
|--------|--------------------|
| `log-complete` | "done with run", "finished meditation", "hit my water goal" |
| `log-detail` | "ran 5k in 28 minutes", "slept 7.5 hours", "drank 6 glasses" |
| `skip-with-reason` | "skipping gym, knee hurts", "rest day today", "too tired for reading" |
| `habit-create` | "add habit: journal every night", "new habit: drink 8 glasses daily" |
| `habit-edit` | "change gym to 4 times a week", "rename run to morning jog" |
| `habit-delete` | "remove the flossing habit", "delete cold plunge" |
| `status-query` | "how am I doing?", "what's my meditation streak?", "what's left today?" |
| `compound` | "skipped gym but did yoga instead", "didn't run but walked 40 minutes" |

**Confidence gate thresholds:**
- ≥ 0.85 → act immediately, speak confirmation, show 60s undo
- 0.60–0.84 → act + confirm: "Logged X — say undo if wrong"
- < 0.60 → clarify: surface max 2 options, never ask open-ended questions

**ONNX models required:**
- `assets/models/asr-whisper-tiny.onnx`
- `assets/models/lang-detect.onnx`
- `assets/models/intent-classifier.onnx`
- `assets/models/entity-extractor.onnx`

**Test requirements:**
- 50+ utterance fixtures covering all 8 intent types
- Multilingual fixtures: ≥10 German, ≥10 Spanish
- Ambiguous cases: ≥5 fixtures testing the clarification flow
- Compound intents: ≥5 fixtures
- Coverage: ≥ 90%

---

### Feature 2 — Habit store (CRUD + SQLite)
**Directory:** `src/features/habits/`
**Description:** Local encrypted SQLite store for all habit definitions and log entries. Zustand store provides reactive UI state. No network dependency.

**Data models:**

```typescript
interface Habit {
  id: string;                    // UUID
  name: string;                  // "Morning run"
  frequency: 'daily' | 'weekly' | number; // times per week
  targetMetric?: { value: number; unit: string }; // e.g. { value: 5, unit: 'km' }
  reminderTime?: string;         // "07:00" — local time
  createdAt: string;             // ISO 8601
  archivedAt?: string;           // soft delete
}

interface HabitLog {
  id: string;                    // UUID
  habitId: string;               // FK → Habit.id
  date: string;                  // YYYY-MM-DD
  status: 'done' | 'skip' | 'partial';
  actualMetric?: { value: number; unit: string };
  skipReason?: string;           // free text, stored locally only
  loggedAt: string;              // ISO 8601 timestamp
  source: 'voice' | 'tap';
}

interface Streak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
}
```

**SQLite schema:**
- Table: `habits` — stores Habit records
- Table: `habit_logs` — stores HabitLog records, indexed on (habitId, date)
- Table: `streaks` — materialized streak counts, updated on every log write
- All tables: encrypted via SQLCipher (expo-sqlite with encryption)

**Zustand store:** `src/features/habits/habitStore.ts`
- Actions: `addHabit`, `editHabit`, `archiveHabit`, `logHabit`, `undoLog`
- Selectors: `getTodayHabits`, `getStreak`, `getHabitHistory`
- Undo stack: 60-second window, last action only

**Test requirements:**
- All CRUD operations
- Streak calculation correctness (including skip handling, cascade skips)
- Undo stack behavior
- SQLite persistence across app restart (integration test)
- Coverage: ≥ 95%

---

### Feature 3 — Streak engine
**Directory:** `src/features/streaks/`
**Description:** Calculates, maintains, and surfaces streak state for all habits. Detects milestones and triggers spoken congratulations.

**Business rules:**
- A streak increments when `status: 'done'` is logged for a habit on its scheduled day
- One skip does not break a streak (grace skip) — two consecutive skips do
- Streak milestones: 3, 7, 14, 21, 30, 60, 90, 180, 365 days
- On milestone: trigger `expo-speech` to speak a congratulation message
- Weekly summary includes: current streak, longest streak, streak at risk flag

**Streak-at-risk detection:**
- If a habit is past its reminder time and not yet logged today: flag as "at risk"
- Surface in status query responses and weekly debrief

**Test requirements:**
- Streak increment / break / grace skip scenarios
- All 9 milestone triggers
- At-risk flag timing logic
- Coverage: ≥ 90%

---

### Feature 4 — Pattern coaching engine
**Directory:** `src/features/coaching/`
**Description:** On-device ML model that detects behavioral patterns from habit log history and generates coaching insights. All data stays on-device. Coaching output is used by the weekly debrief generator.

**Pattern types detected (all 6 required):**

| Pattern | Description |
|---------|-------------|
| `day-of-week` | Skips cluster on specific weekdays |
| `sleep-performance` | Sleep log correlates with next-day completion (requires sleep habit or wearable data) |
| `streak-fragility` | Statistical likelihood of breaking streak at days 3, 7, 14 |
| `skip-cascade` | One skip makes a second skip 3× more likely within 48 hours |
| `time-of-day-drift` | Completion time shifting later week over week |
| `habit-stacking` | Two habits co-occur ≥ 80% of the time |

**Trust timeline — coaching output gated by weeks of data:**
- Week 1: no coaching output — silent observation only
- Week 2: one neutral observation in debrief, no suggestions
- Week 3: one pattern surfaced with confirmation question ("Does this match how your week feels?")
- Week 4+: one suggestion per debrief, framed as an option not a prescription
- Month 2+: proactive mid-week nudges (max 1/day), stacking suggestions, monthly summaries

**ONNX model required:** `assets/models/pattern-coach.onnx`

**Pattern coach rules:**
- Never surface more than one pattern per debrief
- Never explain why a user behaved a certain way — observe only
- Suggestions end with a question or a binary choice — never a directive
- Repeat the same observation max once — rotate if dismissed

**Test requirements:**
- All 6 pattern types detected with synthetic log data
- Trust timeline gate logic (week 1 produces no output)
- Dismissed patterns not re-surfaced
- Coverage: ≥ 85%

---

### Feature 5 — Weekly debrief generator
**Directory:** `src/features/debrief/`
**Description:** Generates a spoken + text weekly summary in a structured 5-part script. Four modes driven by week completion rate. Triggered every Sunday or on demand.

**Debrief trigger:**
- Automatic: Sunday at a configurable time (default 18:00 local)
- On demand: "how was my week?" or status-query intent on Sunday

**5-part script structure (all parts required in order):**

| Part | Purpose | Rules |
|------|---------|-------|
| Opening | Sets emotional tone | One sentence. No numbers. Leads with meaning not metrics. |
| Data | Week in facts | Specific, neutral, brief. Max 2 sentences. |
| Pattern | One coaching insight | Only if confirmed over ≥ 3 weeks. Omit if insufficient data. |
| Suggestion | One optional next step | Phrased as a question. One binary choice max. |
| Close | Forward-facing | References next week. One small concrete thing to watch. |

**Four week modes (completion rate determines mode):**

| Mode | Trigger | Tone |
|------|---------|------|
| `strong` | ≥ 85% completion | Warm, energizing, specific celebration |
| `solid` | 50–84% completion | Steady, factual, acknowledges both wins and slips |
| `rough` | 25–49% completion | Gentle, spacious — surfaces the one thing that held |
| `slip` | < 25% or streak broken | Honest acknowledgment, reframes slip as data, one restart path |

**Voice output rules:**
- Total spoken length: ≤ 45 seconds
- User's name used: maximum once, in the opening only
- Language: matches user's last recorded utterance language
- Never use: "failed", "missed", "only", "just" as qualifiers

**Test requirements:**
- All 4 modes generate valid 5-part scripts
- Spoken length ≤ 45 seconds (character count proxy: ≤ 600 chars)
- Pattern part omitted when data < 3 weeks
- Language detection applied to output
- Coverage: ≥ 80%

---

### Feature 6 — Ambient reminders
**Directory:** `src/features/reminders/`
**Description:** Spoken push notifications that adapt to completion state and time of day. Not simple scheduled alerts — contextually aware nudges.

**Reminder types:**

| Type | Trigger | Behavior |
|------|---------|----------|
| `scheduled` | User-set time per habit | Spoken: "Time for [habit]. Ready?" |
| `at-risk` | Habit past reminder time, unlogged | Spoken: "[Habit] still open for today." |
| `streak-guard` | Streak ≥ 7 days + habit unlogged by 8pm | Spoken: "Your [N]-day streak is on the line." |
| `skip-cascade` | Pattern engine detects cascade risk | Spoken: "Yesterday was a skip — want to make today count?" |
| `milestone-approach` | 1 day before a streak milestone | Spoken: "One more [habit] and you hit [N] days." |

**Rules:**
- Max 1 reminder per habit per day
- Max 3 total reminders per day across all habits
- Quiet hours: user-configurable (default 22:00–07:00)
- Reminders dismissed by completing the habit or explicit "dismiss"
- Uses `expo-notifications` for scheduling, `expo-speech` for spoken output

**Test requirements:**
- All 5 reminder types trigger under correct conditions
- Max 3/day cap enforced
- Quiet hours respected
- Coverage: ≥ 80%

---

### Feature 7 — Habit management UI
**Directory:** `src/screens/habits/` + `src/features/habits/components/`
**Description:** Full CRUD UI for habit list. Both voice-driven (via Feature 1) and tap-driven. Streak visualization. Today view.

**Screens required:**

| Screen | Route | Description |
|--------|-------|-------------|
| Today | `/today` | All habits for today with completion dots, streak badges, mic button |
| Habit list | `/habits` | All active habits, sortable, swipe to archive |
| Habit detail | `/habits/:id` | History chart, streak graph, edit form |
| Add habit | `/habits/new` | Voice-first: mic open by default. Tap form as fallback. |
| Weekly debrief | `/debrief` | Full debrief UI with spoken + text output |
| Settings | `/settings` | Reminder times, quiet hours, language preference, data export |

**Today screen requirements:**
- Habit row: name, streak count, completion dot for each of last 7 days
- Tap dot = log complete for that day (with confirmation)
- FAB (floating action button) = open microphone for voice check-in
- Status bar: "X of Y habits done today" — updates in real time
- Streak milestones surface as animated badge overlay

**Accessibility:**
- All interactive elements have `accessibilityLabel`
- Voice check-in FAB has `accessibilityHint: "Double tap to start voice check-in"`
- Minimum touch target: 44×44pt (Apple HIG)
- Supports Dynamic Type (iOS) and font scaling (Android)

**Test requirements:**
- All 6 screens render without errors
- Tap-to-log flow works end-to-end
- Voice FAB triggers ASR session
- Streak badge renders at correct milestones
- Coverage: ≥ 80%

---

### Feature 8 — Shared habits module (Pro tier)
**Directory:** `src/features/shared/`
**Description:** Zero-knowledge encrypted partner accountability. Both users track locally. Only a minimal status token (not raw data) syncs. Opt-in, reversible.

**Architecture:**
- User generates a share code (6-digit, expires 24h)
- Partner enters code to link
- On completion of a shared habit: device computes `HMAC-SHA256(habitId + date + status, localKey)` and sends the token only — no raw log data
- Partner device receives token, verifies locally, updates their "partner status" indicator
- Server stores: user IDs, habit IDs (not names), date, HMAC token only — no plaintext habit data

**UI:**
- Settings → Shared Habits → Generate code / Enter partner code
- Shared habits show a partner avatar indicator on the Today screen
- "Your partner logged their run" — spoken notification (if permitted)

**Tier gate:** Feature 8 is gated behind the Pro tier (`$6.99/mo`) and Lifetime tier (`$129 one-time`). Display an upgrade prompt for Free/Ads-removed users.

**Test requirements:**
- HMAC token generation is deterministic and verifiable
- No raw habit data in the sync payload
- Tier gate shows upgrade prompt for non-Pro users
- Coverage: ≥ 80%

---

## 4. Monetization tiers

Claude Code must implement tier gating for features marked as Pro or Lifetime.

| Tier | Price | Features |
|------|-------|---------|
| Free | Ad-supported | Voice check-in, streaks, up to 5 habits, privacy vault baseline |
| Ads removed | ~$1.99/mo | Everything in Free, no ads, unlimited habits, basic weekly summary |
| Pro | ~$6.99/mo | Pattern coaching, ambient reminders, wearable integration, full debrief, shared habits |
| Lifetime | ~$129 one-time | All Pro features forever, priority model updates, founding user badge |

**Implementation:** Use `src/features/entitlements/` with a `useEntitlement(tier)` hook. Mock entitlements in development via `EXPO_PUBLIC_APP_ENV=development` flag (all tiers unlocked).

---

## 5. Directory structure

Claude Code must create this exact structure during scaffold. No business logic in `screens/`. No direct database access outside `features/`.

```
ethervox-habits/
├── APP_SPEC.md                    ← this file
├── CLAUDE.md                      ← Claude Code session config
├── ARCHITECTURE.md                ← auto-generated, updated per PR
├── feature_list.json              ← autonomous build task tracker
├── claude-progress.txt            ← session progress log
├── app.json                       ← Expo config
├── eas.json                       ← EAS build config
├── bunfig.toml                    ← Bun test config
├── tsconfig.json                  ← TypeScript strict config
├── .env.template                  ← committed — key names only
├── .env.local                     ← gitignored — real values
├── .gitignore
├── .claudeignore
├── .claude/
│   ├── mcp.json                   ← MCP server config
│   ├── hooks.json                 ← PreToolUse / PostToolUse hooks
│   ├── agents/                    ← subagent definitions
│   │   ├── feature-agent.md
│   │   ├── test-agent.md
│   │   └── review-agent.md
│   └── commands/                  ← custom slash commands
│       ├── feature.md
│       ├── verify.md
│       └── progress.md
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── autofix.yml
├── .maestro/                      ← E2E test flows
│   ├── voice-checkin.yaml
│   ├── skip-with-reason.yaml
│   ├── add-habit.yaml
│   ├── weekly-debrief.yaml
│   ├── streak-milestone.yaml
│   ├── offline-mode.yaml
│   ├── multilingual.yaml
│   └── ambiguous-habit.yaml
├── assets/
│   ├── fonts/
│   ├── images/
│   └── models/                    ← ONNX model files (Git LFS)
│       ├── asr-whisper-tiny.onnx
│       ├── lang-detect.onnx
│       ├── intent-classifier.onnx
│       ├── entity-extractor.onnx
│       └── pattern-coach.onnx
├── scripts/
│   ├── orchestrate.ts             ← autonomous build orchestrator
│   └── model-pipeline.py          ← ONNX model export script
├── src/
│   ├── features/
│   │   ├── voice/                 ← Feature 1: voice check-in parser
│   │   │   ├── asr.ts
│   │   │   ├── langDetect.ts
│   │   │   ├── intentClassifier.ts
│   │   │   ├── entityExtractor.ts
│   │   │   ├── confidenceGate.ts
│   │   │   ├── voiceStore.ts
│   │   │   └── __tests__/
│   │   ├── habits/                ← Feature 2: habit store
│   │   │   ├── habitStore.ts
│   │   │   ├── habitDb.ts
│   │   │   ├── types.ts
│   │   │   ├── components/
│   │   │   └── __tests__/
│   │   ├── streaks/               ← Feature 3: streak engine
│   │   │   ├── streakEngine.ts
│   │   │   ├── milestones.ts
│   │   │   └── __tests__/
│   │   ├── coaching/              ← Feature 4: pattern coaching
│   │   │   ├── patternEngine.ts
│   │   │   ├── coachingStore.ts
│   │   │   ├── trustTimeline.ts
│   │   │   └── __tests__/
│   │   ├── debrief/               ← Feature 5: weekly debrief
│   │   │   ├── debriefGenerator.ts
│   │   │   ├── scriptTemplates.ts
│   │   │   ├── debriefStore.ts
│   │   │   └── __tests__/
│   │   ├── reminders/             ← Feature 6: ambient reminders
│   │   │   ├── reminderEngine.ts
│   │   │   ├── reminderStore.ts
│   │   │   └── __tests__/
│   │   ├── shared/                ← Feature 8: shared habits
│   │   │   ├── shareEngine.ts
│   │   │   ├── hmacToken.ts
│   │   │   ├── shareStore.ts
│   │   │   └── __tests__/
│   │   └── entitlements/          ← Tier gating
│   │       ├── entitlementStore.ts
│   │       ├── useEntitlement.ts
│   │       └── __tests__/
│   ├── screens/                   ← Feature 7: UI (layout only)
│   │   ├── TodayScreen.tsx
│   │   ├── HabitListScreen.tsx
│   │   ├── HabitDetailScreen.tsx
│   │   ├── AddHabitScreen.tsx
│   │   ├── DebriefScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── navigation/
│   │   └── RootNavigator.tsx
│   ├── models/                    ← ONNX inference wrappers
│   │   ├── onnxSession.ts
│   │   └── __tests__/
│   └── shared/                    ← Pure TS utilities only
│       ├── utils/
│       ├── constants.ts
│       └── types.ts
├── dev-data/                      ← gitignored SQLite dev database
└── jest-setup.ts
```

---

## 6. Architecture constraints

These rules are absolute. Claude Code must enforce them on every file it creates or modifies.

| Constraint | Rule |
|------------|------|
| No cloud AI | All ML inference via ONNX Runtime React Native. No Anthropic API calls in app code. |
| No data egress | No analytics SDK, no crash reporter that transmits PII, no remote logging. |
| Layer isolation | `screens/` imports only from `features/` and `shared/`. Never from `models/` or `services/` directly. |
| DB access | Only `features/*/habitDb.ts` files may access SQLite directly. |
| No `any` | TypeScript strict mode. `any` is a build failure. |
| New architecture | `newArchEnabled: true` in `app.json`. Required for ONNX JSI bridge. |
| Test colocation | Test files in `__tests__/` subdirectory next to source. Never in a top-level `tests/` folder. |
| Git discipline | Feature branches only. No direct commits to `main`. One branch per `feature_list.json` entry. |

---

## 7. ONNX model specifications

| Model file | Source model | Task | Max size | Max latency |
|------------|-------------|------|----------|-------------|
| `asr-whisper-tiny.onnx` | openai/whisper-tiny | Speech → text | 50 MB | 800ms |
| `lang-detect.onnx` | fasttext-langdetect | Language ID | 2 MB | 20ms |
| `intent-classifier.onnx` | fine-tuned distilbert | Intent → label | 15 MB | 80ms |
| `entity-extractor.onnx` | fine-tuned distilbert | NER: habit/metric/reason | 15 MB | 80ms |
| `pattern-coach.onnx` | custom LSTM | Pattern detection | 20 MB | 100ms |

**Total model budget:** ≤ 102 MB (fits within Expo OTA update limit for initial install)

---

## 8. Claude Code session protocol

Every Claude Code session must follow this protocol exactly:

### Session start (mandatory)
1. Read `APP_SPEC.md` (this file)
2. Read `CLAUDE.md`
3. Read `ARCHITECTURE.md` (if it exists; generate it if not)
4. Read `claude-progress.txt` (last 50 lines)
5. Read `feature_list.json` — identify the next `status: "pending"` feature
6. Announce: "Session ready. Next feature: [name]. Proceeding."

### Per-feature loop
1. `git checkout -b feature/<feature-name>`
2. Write failing tests first (TDD — RED phase)
3. Implement to pass tests (GREEN phase)
4. Refactor if needed (REFACTOR phase)
5. Run: `bunx tsc --noEmit && bunx expo lint && bun test --coverage`
6. Fix all errors autonomously (max 5 retry cycles before escalating)
7. `git add -A && git commit -m "feat(<scope>): <description>"`
8. `git push origin feature/<name>`
9. `gh pr create --title "feat: <name>" --body "<acceptance criteria status>"`
10. Update `feature_list.json`: `status: "complete"`
11. `git checkout main && git pull`
12. Append to `claude-progress.txt`: timestamp + feature name + status

### Session end (mandatory)
1. Write summary to `claude-progress.txt`
2. If context > 80%: run `/compact` before ending
3. List remaining `status: "pending"` features

### Escalation conditions (stop and notify human)
- TypeScript errors not resolved after 5 retry cycles
- Test coverage below threshold after 3 attempts
- Git conflict that cannot be resolved automatically
- Any operation that would modify `main` branch directly
- Any operation requiring credentials not in environment

---

## 9. Acceptance criteria — project complete

The build is complete when all of the following are true:

- [ ] All 8 features have `status: "complete"` in `feature_list.json`
- [ ] `bunx tsc --noEmit` exits 0 on `main` branch
- [ ] `bun test --coverage` shows ≥ 80% coverage on all feature modules (≥ 90% on voice parser and habit store)
- [ ] All 8 Maestro E2E flows pass on iOS Simulator (iPhone 16, iOS 18)
- [ ] All 8 Maestro E2E flows pass on Android Emulator (Pixel 8, API 34, ARM64)
- [ ] `bunx expo-doctor` shows no errors
- [ ] `eas build --platform ios --profile production` completes successfully
- [ ] `eas build --platform android --profile production` completes successfully
- [ ] `ARCHITECTURE.md` is current (updated within last 2 commits)
- [ ] Zero direct commits to `main` (all changes via merged PRs)
- [ ] No `any` types in TypeScript (`bunx tsc --strict --noEmit`)
- [ ] `madge --circular src/` reports zero circular dependencies
- [ ] App runs fully offline: disable all network interfaces, all features functional
- [ ] Privacy audit: `grep -r "fetch\|axios\|http" src/` returns no results outside `src/features/shared/shareEngine.ts`

