# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is
A static, single-page review web app to help a Grade 4 student prepare for recurring English tests. No build system, no dependencies, no tests. Open in a browser via a local static server.

## Run
```
python3 -m http.server
```
Then open http://localhost:8000. A static server is required because the app loads JSON via `fetch()`, which browsers block on `file://`.

Deploy: GitHub Pages auto-builds on push to `main` (`.github/workflows/deploy.yml`); no build step.

## Architecture

**Single-page vanilla JS app.** `index.html` is a shell; `app.js` renders everything into `#app` by replacing `innerHTML`. There is no framework, no router library, no bundler. The app first loads `data/exams.json`, lets the user pick a test, then loads the selected test's files from `data/exams/<exam-id>/`. The five top-level "topics" are functions registered in the `routes` object near the bottom of `app.js`:

- `vocabularyTopic` — 5 quiz modes built from the selected exam's `vocabulary.json`. Word entries support optional `synonyms`, `antonyms`, and `examples[]` (extra example sentences). The Synonyms/Antonyms modes auto-appear only for words that have those fields; Fill-in-the-Blank rotates through `example` + `examples[]`.
- `spellingTopic` — dictation (TTS) for word lists, drag-to-bin sort game for phonics groups (`spelling.json`, list entries with `sortGame: true` go to `sortGame()`, others to `dictation()`)
- `grammarTopic` — modal-verb MCQ (`grammar.json`)
- `readingTopic` — anchor-chart viewer + per-passage quizzes from `reading.json`. Reading quizzes are **special**: they render passage + all questions on one scrollable page with a single submit (`readPassage`), unlike other topics which use the one-question-at-a-time `runQuiz` engine.
- `listeningTopic` — TTS-played dialogues with a "Replay" button on every question (`listening.json`). Uses two different voices for the two speakers when available (`pickTwoVoices`).

**Generic quiz engine: `runQuiz(topicId, title, items, getQ)`** in `app.js`. Most topics call it. Each item is mapped to `{prompt, choices, answer, extra?}` via `getQ`. It handles shuffling, immediate feedback, missed-list, and writes a per-topic best score to `localStorage` under key `cs-english-exam-progress`, namespaced as `<exam-id>:<topic-id>`. The reading topic intentionally bypasses it.

**TTS layer.** `loadVoices()` ranks installed `speechSynthesis` voices (Premium > Enhanced > known good US names > en-US > local) and stores the user's pick under `cs-english-exam-voice`. `speak()` is the only entry point for audio. `voicePicker()` + `bindVoicePicker()` inject a voice dropdown into any screen that needs it (currently dictation and listening). Voice quality depends on what the OS has installed — see "Voice quality" below.

**Data files** in `data/exams/<exam-id>/*.json` are the runtime source of truth and are loaded by `loadAll()`. `data/exams.json` controls the test picker and marks tests as available or coming soon. The files in `content/*.md` are human-readable transcriptions of the source material in `raw/` and are **not** loaded by the app — they exist as documentation and as the canonical source the JSON was built from. Keep them in sync if you change one.

**`raw/`** holds the original photos of the printed study materials. Treat as read-only inputs. Image-to-markdown transcriptions live in `content/` and `STUDY_GUIDE.md`.

## Adding content
- New test: add an entry in `data/exams.json`, create `data/exams/<exam-id>/`, and add the five topic JSON files.
- New vocab/spelling/grammar/listening items: edit the matching `data/exams/<exam-id>/*.json` file. The schemas are obvious from the existing entries.
- New reading passage: add an object to `data/exams/<exam-id>/reading.json` `passages[]`. Each question has a `skill` field that must match a key in the top-level `skills` map; the tag renders automatically.
- New phonics sort game: add a list to `data/exams/<exam-id>/spelling.json` with `sortGame: true` and a `groups` map of `groupName → [words]`. `sortGame()` picks it up automatically.

## Voice quality
The TTS uses the browser's `speechSynthesis`, which uses OS voices. macOS default voices sound poor. To upgrade: System Settings → Accessibility → Spoken Content → System Voice → Manage Voices → English → download Premium voices (Ava, Zoe, Evan, etc.), then fully restart the browser. The voice picker auto-ranks Premium voices first.

## Conventions
- Don't introduce a build step, framework, or package manager. The "double-click and go" simplicity is a feature.
- All UI is rendered by replacing `app.innerHTML` and re-binding handlers. Avoid sprinkling DOM mutations elsewhere.
- Inline `onclick="..."` handlers reference functions on `window` (e.g. `window.__currentPassage`, `window.__replayDialogue`) when a closure can't be captured another way. This is intentional given the no-framework constraint.
- Progress, selected test, and voice preference are the only persisted state, all in `localStorage`.
- **Cloze gotcha:** Fill-in-the-Blank blanks the word with regex `\b<word>\w*`, so every `example`/`examples[]` sentence MUST contain the word as a stem prefix. `-ing` forms of silent-e verbs (thrive→thriving, erode→eroding) DON'T match and silently break the blank — use base/`-s`/`-ed` forms instead.
- A reading question's `skill` only needs to exist in the top-level `skills` map; it need not appear in the passage's own `skills[]` tag list.
- After editing data JSON, validate: JSON parses, every `skill` exists in `skills`, each MCQ `answer` index is in range, `type:"short"` questions have a `sampleAnswer`, and cloze sentences match the word regex. Run `node --check app.js` after JS edits.
