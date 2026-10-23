# Grade 5 Fall Midterm — Missions and Badges

Runtime config: `data/exams/2026-11-midterm/game.json`, enabled by `"game": true` on the exam in `data/exams.json`. Tests without a `game.json` keep the default 7 badges and the first-3-topics missions. The rules are evaluated by `evaluateBadgeRule()` in `app.js`. Scores count only full rounds; review-missed rounds never count.

## Daily missions (4)

| Mission | Counts when |
|---|---|
| Read one passage and answer every question | Any full reading passage |
| Type a dictation list or finish a phonics game | A typed dictation list (`:type`), a sort game, or a phonics quiz. Listen-and-choose does not count, because the test is dictation |
| Score 70% or more on a Lessons 6-8 grammar set | Textbook L6-8 sets, generated L6-8 sets, or Tense Mix, at 70%+ |
| Bonus (alternates daily) | Vocabulary on one day, listening on the next |

## Badges (10)

| Badge | Rule |
|---|---|
| Sky Launch | First full practice round |
| Garden Key | All of today's missions |
| Spring in Bloom | All missions finished on 3 different days |
| Word Collector | 90%+ in 3 different vocabulary modes |
| Sound Sorter | 100% on a phonics sort game or phonics quiz |
| Dictation Ace | 100% on a typed dictation list |
| Time Traveler | 90%+ on a Lesson 6, a Lesson 7, and a Lesson 8 set |
| Story Navigator | Every reading passage completed (19 as of 2026-10-23) |
| Watchful Listener | Every listening dialogue completed |
| Storm Tamer | Boss Review cleared: every saved missed question answered correctly |

## Art

The ten active badges are 512 × 512 WebP illustrations in `assets/badges/2026-11-midterm/`, generated with the built-in `image_gen` tool to match the original badges' painterly storybook finish. Each has the same gold star-and-laurel circular rim and mascot pair: a cream tabby cat with a teal scarf and an orange fox with a navy neckerchief. The pair participates in each Module 2 scene: airship launch, garden key, three spring flowers, collecting books, sorting sounds, checked dictation, time travel, map navigation, attentive listening, and calming a storm.

The complete prompt set, reference assets, and export settings are saved in `content/2026-11-midterm/badge-art/prompts.json`. The original `first_quest.jpg` and `listening_star.jpg` established the style; the new `sky_launch.webp` served as the shared collection reference for the other nine. Exports use WebP quality 86. Locked badges are still grayed by CSS; badge IDs, rules, and saved progress are unchanged.

The SVG files and `build_badges.py` are retained as legacy vector sources only. That script regenerates the older SVG artwork, not the current AI illustrations.

Tests: `tests/navigation.test.cjs`, in the "Grade 5 Fall Midterm" section.
