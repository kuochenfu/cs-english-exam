# Grade 5 Fall Midterm build: retro

Build period: 2026-10-22 to 2026-10-23 (homework and reading round on 2026-10-23). Test date: 2026-11-05.

## What shipped

| Commit | What |
| --- | --- |
| `09253e1` | New test `2026-11-midterm`, built from the study-guide notice and covering all five topics |
| `f534368` | My Next Grammar Lessons 6-8 textbook sets (21 / 28 / 24 items); quick-guide cards matched to the textbook rule boxes |
| `d4285a6` | 7 focus anchor charts rebuilt from web research, each with a poster, 5 worked examples and a quick check |
| `f368358` | impeccable audit fixes: contrast tokens, Next button after wrong answers, Andika font, WebP images (44 MB to 6.6 MB), `DESIGN.md` |
| `f89a6e3` | `game.json`: 4 daily missions and 10 Module 2 badges, all rules covered by tests |
| `7da1d7d` | Illustrated art: 26 vocabulary pictures, 10 illustrated anchor posters, 10 painted badges |
| `1ed67d2`, `ec70c34` | Module 2 homework (HW1-HW3): Mr. Long's definitions, 4 `hw_*` passages, `m2-homework` grammar, `m2_hw_spelling_sentences`; `project` corrected to *shine an image or light outward* and redrawn |
| `77a42ac`, `24a1d36` | 10 new unseen test-style passages (`mt_*`) and their illustrations |
| `84e0b76` | Illustrations for the 9 original and homework passages: all 19 passages now have art |
| `8545174` | Fixes from a full two-reviewer content review (examples, synonyms, ambiguous questions, facts in the bee and butterfly passages) |
| `2469686`, `1ac8e8b` | Golden Lantern and Rooftop Garden replaced by Queen Bess (biography) and The Silent Greenhouse (sci-fi), with new art; Story Navigator now needs 15 passages |

Tests grew from 32 to 38, and every deploy passed them.

## What went well

- **Data-driven missions and badges.** `game.json` and `evaluateBadgeRule()` let a test define its own game without touching the defaults. The art swap in `7da1d7d` was a data-only change: it replaced image paths, and the badge IDs, rules and saved progress stayed as they were.
- **One commit per request.** Each user request shipped as its own pushed commit, so it is easy to review or revert.
- **The audit paid off.** The audit was a report first, and the fixes came in the recommended order. Its rules now live in `DESIGN.md` and the CLAUDE.md conventions (tokens, 4.5:1 contrast, no auto-advance after a wrong answer, WebP only).
- **Validation before each commit.** Each commit was checked first: the JSON parses, every image path points to a real file, and the test suite passes.

## What did not go well

- **No image generator in the Claude session.** The first posters were HTML screenshots and the first badges were SVG medallions. Their style did not match the painted originals, and the illustrated art had to be produced separately, with `image_gen`, a day later. The SVG and HTML sources remain only as legacy files.
- **Poster text overflowed.** The HTML posters needed a script that drops worked examples that don't fit. Text-heavy posters made from fixed templates are fragile.
- **Two tests broke on behavior changes.** Adding the Next button after wrong answers broke a dictation test that depended on shuffled order. The fix made that test deterministic and added a separate wrong-answer test.
- **Cross-realm test gotchas.** The vm harness made `deepEqual` fail on arrays from the other realm, and the test hit a `const` reassignment. Both cost a run each.
- **Push rejected once.** The remote had moved, and the rebase conflicted on `APP_VERSION` in `index.html`. Pull with rebase before every push.
- **A slow Pages deploy.** The `f89a6e3` deploy waited in the queue for about 9 minutes and then succeeded. "Waiting" is not a failure.

## Lessons

1. **Check `git status` before committing.** Another agent may have changed the working tree, so read the diff and validate it before committing.
2. **Make the art first.** Use the image generator for badges and posters, and keep the full text in the app's guides rather than on the image.
3. **Write tests for timing behavior.** A test that depends on auto-advance or shuffle must fix the order and assert on the Next button.
4. **Ask what the test actually uses.** The reading test uses unseen passages, not the Into Reading texts. Knowing that earlier would have pointed the work at new passages from the start.
5. **Check new passages against the old ones.** Two new passages repeated the plots of older ones (an airship storm, a hidden garden) and had to be replaced. Compare plots and genres before writing.
6. **Keep the teacher's wording.** Teacher definitions and homework sentences go in verbatim. Weak teacher answer keys (Whimsical Q1, Elias Q8) stay as written, because the test follows the teacher.
7. **Docs drift.** `AGENTS.md` and parts of `README.md` still describe the April Grade 4 midterm. Update them when architecture or conventions change.

## Still open

These are tracked in `study_plan.md`:

- The four Into Reading texts (low priority: not tested directly)
- KISI pp. 26/30/34/37/42/47
- Grammar Review Quizzes 5-7
- The writing prompt
- The vocabulary/reading test date
- Where the two Pachamanca photos belong

The app still has no oral or writing practice.
