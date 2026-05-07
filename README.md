# cs-english-exam

A small, static web app to help a Grade 4 student prepare for English tests. It now supports multiple test sets, starting with the 2026 April HMH **Into Reading, Module 6 (Weeks 1–3)** midterm. No build step, no dependencies — just open it in a browser.

## Topics

| | Topic | What it does |
|---|---|---|
| 📖 | **Vocabulary** | 24 Module 6 words across 3 modes: word→definition, definition→word, and fill-in-the-blank |
| 🔤 | **Phonics & Spelling** | TTS dictation for the 3 weekly spelling lists, plus drag-to-bin sort games for /k/·/ng/·/kw/, final /j/·/s/, and prefixes re-/un-/dis- |
| ✏️ | **Grammar** | 20 multiple-choice items on modal verbs (My Next Grammar, Lesson 14) |
| 📚 | **Reading** | Anchor charts + per-passage single-page scrollable quizzes |
| 👂 | **Listening** | TTS-played dialogues with two voices, replay button on every question, and an MCQ quiz |

Per-topic best scores are saved in `localStorage` by test id, so practice from different tests does not overwrite itself.

## Run

```bash
python3 -m http.server
```

Then open <http://localhost:8000>. A static server is required because the app loads JSON via `fetch()`, which browsers block on `file://`.

## Voice quality (macOS)

The app uses the browser's built-in `speechSynthesis`, which uses your OS voices. macOS default voices sound robotic. To upgrade for free:

1. **System Settings → Accessibility → Spoken Content → System Voice → Manage Voices…**
2. Under **English**, download any voice marked **(Premium)** — good picks: Ava, Zoe, Evan, Tom.
3. Fully quit and reopen your browser, then reload the app.

The voice picker on the dictation and listening screens auto-ranks Premium voices first.

## Project layout

```
raw/        # original photos, grouped by source month
content/    # markdown transcriptions of raw/ + reading anchor charts
data/
  exams.json              # test picker metadata
  exams/<exam-id>/*.json  # runtime JSON consumed by the app
index.html  # shell
app.js      # everything (router, quiz engine, TTS layer)
styles.css
STUDY_GUIDE.md
CLAUDE.md   # notes for working in this repo with Claude Code
```

`raw/` is read-only source material. `content/*.md` are human-readable transcriptions. `data/exams/<exam-id>/*.json` is the runtime source of truth — edit those to add or change practice items. See [`CLAUDE.md`](CLAUDE.md) for architecture notes.

## Adding content

- **New test**: add an entry to `data/exams.json`, then create `data/exams/<exam-id>/vocabulary.json`, `spelling.json`, `grammar.json`, `reading.json`, and `listening.json`.
- **Vocab / spelling / grammar / listening**: edit the matching file under `data/exams/<exam-id>/`. Schemas are obvious from existing entries.
- **Reading passage**: add an object to `data/exams/<exam-id>/reading.json` `passages[]`. Each question has a `skill` field that must match a key in the top-level `skills` map.
- **Phonics sort game**: add a list to `data/exams/<exam-id>/spelling.json` with `sortGame: true` and a `groups` map of `groupName → [words]`.
