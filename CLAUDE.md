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

- `vocabularyTopic` — 6 quiz modes built from the selected exam's `vocabulary.json`. Word entries support optional `synonyms`, `antonyms`, `examples[]` (extra example sentences), and `forms[]` (override for inflected forms). The Synonyms/Antonyms modes auto-appear only for words that have those fields; Fill-in-the-Blank rotates through `example` + `examples[]`. Word Forms ("change the word") blanks a sentence and offers inflections of the same word; `wordForms()` generates them for `pos` v/n and the mode only includes words that appear in two or more forms across their sentences, so give verbs/nouns at least one `-s`/`-ed`/plural sentence. Distractors in the definition/word/blank modes share the target's part of speech (first token of `pos`), so keep `pos` values consistent (`n`, `v`, `adj`, `adv`, or `v / n`).
- `spellingTopic` — dictation (TTS) for word lists, drag-to-bin sort game for phonics groups, and plain MCQ sets (`spelling.json`: list entries with `sortGame: true` go to `sortGame()`, `quiz: true` with `items[{q, choices, answer}]` go to `phonicsQuiz()`, others to `spellingListMenu()` / `dictation()`)
- `grammarTopic` — modal-verb MCQ (`grammar.json`)
- `readingTopic` — anchor-chart viewer + per-passage quizzes from `reading.json`. Reading quizzes are **special**: they render passage + all questions on one scrollable page with a single submit (`readPassage`), unlike other topics which use the one-question-at-a-time `runQuiz` engine.
- `listeningTopic` — TTS-played dialogues with a "Replay" button on every question (`listening.json`). Uses two different voices for the two speakers when available (`pickTwoVoices`).

**Generic quiz engine: `runQuiz(topicId, title, items, getQ)`** in `app.js`. Most topics call it. Each item is mapped to `{prompt, choices, answer, extra?}` via `getQ`. It handles shuffling, immediate feedback, missed-list, and writes a per-topic best score to `localStorage` under key `cs-english-exam-progress`, namespaced as `<exam-id>:<topic-id>`. The reading topic intentionally bypasses it.

**TTS layer.** `loadVoices()` ranks installed `speechSynthesis` voices (Premium > Enhanced > known good US names > en-US > local) and stores the user's pick under `cs-english-exam-voice`. `speak()` is the only entry point for audio. `voicePicker()` + `bindVoicePicker()` inject a voice dropdown into any screen that needs it (currently dictation and listening). Voice quality depends on what the OS has installed — see "Voice quality" below.

**Entry flow.** `loadAll()` reads `data/exams.json`, then decides between the test picker and the saved test's home: it shows the picker when nothing is saved, or when `currentExamId` points at a test this device has never seen (tracked in `localStorage` key `cs-english-exam-seen-exams`). `renderHome()` falls through to `renderExamPicker()` whenever `currentExam` is null, so callers always call `renderHome()` after `loadAll()`. The picker sorts by each test's `date` (newest first) and pins a "Latest"/"New" pill on `currentExamId`. The header exam bar and the footer "Tests" button both open the picker from any screen; `syncHeader()` keeps the header in step with the current screen.

**Cache busting.** GitHub Pages serves everything with a 10-minute cache. `index.html` defines `window.APP_VERSION`, and `fetchJSON()` appends it to every data request. **Bump `APP_VERSION` (and the matching `?v=` on `app.js` and `styles.css`) in `index.html` whenever you change `app.js`, `styles.css`, or any `data/**/*.json`**, or users will see stale content after deploy.

**Data files** in `data/exams/<exam-id>/*.json` are the runtime source of truth and are loaded by `loadAll()`. `data/exams.json` controls the test picker: each entry has `id`, `title`, `subtitle`, `grade`, `date` (test date, used for sort order), `module`, `weeks`, `status`, and `available`. Top-level `currentExamId` is the test to feature and open first; set it whenever you add a new test. Top-level `defaultExamId` is legacy and must stay `2026-04-midterm`: it only maps pre-namespace progress keys to that exam. The files in `content/*.md` are human-readable transcriptions of the source material in `raw/` and are **not** loaded by the app — they exist as documentation and as the canonical source the JSON was built from. Keep them in sync if you change one.

**`raw/`** holds the original photos of the printed study materials. Treat as read-only inputs. Image-to-markdown transcriptions live in `content/` and `STUDY_GUIDE.md`.

## Adding content
- New test: add an entry in `data/exams.json` (with `date`, `grade`, `module`, `weeks`), point `currentExamId` at it, create `data/exams/<exam-id>/`, and add the five topic JSON files. Topics with no items yet can ship as empty arrays; the app shows an "no practice items yet" screen and hides them from daily missions. Bump `APP_VERSION` in `index.html`.
- New vocab/spelling/grammar/listening items: edit the matching `data/exams/<exam-id>/*.json` file. The schemas are obvious from the existing entries.
- New reading passage: add an object to `data/exams/<exam-id>/reading.json` `passages[]`. Each question has a `skill` field that must match a key in the top-level `skills` map; the tag renders automatically.
- New phonics sort game: add a list to `data/exams/<exam-id>/spelling.json` with `sortGame: true` and a `groups` map of `groupName → [words]`. `sortGame()` picks it up automatically.
- New phonics MCQ set (e.g. "which word has the short e sound?"): add a list with `quiz: true`, optional `intro`, and `items[{q, choices, answer}]`; `q` may contain simple HTML. Keep `q` text unique within the list because it doubles as the missed-item id.

## Voice quality
The TTS uses the browser's `speechSynthesis`, which uses OS voices. macOS default voices sound poor. To upgrade: System Settings → Accessibility → Spoken Content → System Voice → Manage Voices → English → download Premium voices (Ava, Zoe, Evan, etc.), then fully restart the browser. The voice picker auto-ranks Premium voices first.

## Conventions
- Don't introduce a build step, framework, or package manager. The "double-click and go" simplicity is a feature.
- All UI is rendered by replacing `app.innerHTML` and re-binding handlers. Avoid sprinkling DOM mutations elsewhere.
- Inline `onclick="..."` handlers reference functions on `window` (e.g. `window.__currentPassage`, `window.__replayDialogue`) when a closure can't be captured another way. This is intentional given the no-framework constraint.
- Progress, missed items, game state, selected test, seen tests, and voice preference are the only persisted state, all in `localStorage`.
- **Cloze gotcha:** Fill-in-the-Blank blanks the word with regex `\b<word>\w*`, so every `example`/`examples[]` sentence MUST contain the word as a stem prefix. `-ing` forms of silent-e verbs (thrive→thriving, erode→eroding) DON'T match and silently break the blank — use base/`-s`/`-ed` forms instead.
- A reading question's `skill` only needs to exist in the top-level `skills` map; it need not appear in the passage's own `skills[]` tag list.
- After editing data JSON, validate: JSON parses, every `skill` exists in `skills`, each MCQ `answer` index is in range, `type:"short"` questions have a `sampleAnswer`, and cloze sentences match the word regex. Run `node --check app.js` after JS edits, and bump `APP_VERSION` in `index.html` after any JS, CSS, or data change.
