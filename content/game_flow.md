# Quest flow and badge rules

Reviewed 2026-09-20. Runtime implementation: `app.js`.

## Navigation

- Home → Quest Map / Today's Missions → topic → activity → results.
- Home → Boss Review → topic → Review missed → results. Back follows that same parent chain.
- Home, Tests, and Progress use the shared navigation. Leaving an activity cancels delayed question changes and speech.
- Quest Map shows available topics. Daily missions require actual practice questions, so chart-only reading cannot become a mission.

## Daily missions

The first three available practice categories are selected in this order: reading, spelling, grammar, listening, vocabulary. Grade 5 Quiz 1 therefore offers reading, spelling, and grammar. Completing a round counts regardless of score; reading and listening must be full activities, not missed-question-only reviews. Reading requires every question to be answered before submission (short answers are self-reviewed).

Missions reset on the device's local calendar date. Stars and badges persist per exam. Replays can earn stars and complete a later day's mission, but do not count as different passages/dialogues. Empty rounds earn nothing.

## Badge conditions

| Badge | Unlock condition |
| --- | --- |
| First Quest | Complete any nonempty practice round. |
| Daily Hero | Complete all of the current day's available missions. |
| Reading Detective | Complete three different full reading passages. |
| Grammar Wizard | Score at least 90% in a grammar round. |
| Spelling Champ | Score 100% in a spelling or phonics round. |
| Listening Star | Complete two different full listening dialogues. |
| Boss Defeated | Have saved mistakes, then answer every remaining saved mistake correctly. |

Missed-question reviews can earn stars and accuracy badges. They do not contribute to the distinct reading/listening counters. Boss unlock is reconciled on Home/Progress even if the learner leaves immediately after correcting the final question, before the result timer finishes. An earned badge is not removed by later mistakes.

Existing awarded badges are preserved. Older saves only recorded round counts, not activity identities; unawarded distinct-activity progress is recorded from this update onward.

## Verification

`node --test tests/navigation.test.cjs` covers rendered navigation handlers, Boss return paths, distinct activities, empty and unanswered submissions, badge thresholds, local-day rollover, persistence, and exam isolation. Browser walkthrough: daily reading → blocked incomplete submission → full submission → First Quest and mission credit → Boss Review → correct saved mistakes → Boss Defeated → Back to Reading → Back to Boss Review.
