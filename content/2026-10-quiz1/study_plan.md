# Grade 5 2026 Fall Quiz 1 Plan

Source photos:
- `raw/202609/Grade5_2026_Fall_Semeter_Quiz1.JPG` (quiz notice and study guide)
- `raw/202609/Quiz1_Vocabulary_Spelling.JPG` (Module 1 Weeks 1-3 spelling & vocabulary list)
- `raw/202609/IMG_5994.JPG`, `raw/202609/IMG_5996.JPG` (full Fall 2026 spelling & vocabulary list, Weeks 1-21; only Weeks 1-3 are in Quiz 1)

App exam id: `2026-10-quiz1`

## Exam Schedule

- October 1, 2026 (Thursday): Quiz 1

## Scope From Notice

- How to study: Module 1 Weeks 1-3 — Into Reading, Anchor Charts, HW folder, KISI (Know-It, Show-It), Worksheet, NB
- Reading passages in Into Reading:
  - Government Must Fund Inventors
  - The Inventor's Secret
  - Winds of Hope
  - Wheelchair Sports
  - Captain Arsenio
- Spelling / phonics:
  - Spelling/phonics words from Module 1 Weeks 1-3
  - Students write the spelling words they hear in sentences (dictation)
  - Phonics pattern questions from the Know-It, Show-It workbook:
    - pages 4 & 7: Short vowels
    - pages 11 & 14: Long a and e
    - pages 19 & 24: Long i and o
- Vocabulary:
  - All vocabulary words from Module 1 Weeks 1-3 on the vocabulary list
- Reading comprehension skills:
  - Author's Purpose
  - Text Structure
  - Figurative Language
  - Central Idea
  - Point of View
- Grammar (My Next Grammar):
  - Lesson 4: Present and Past: Be
  - Lesson 5: Present Simple
- Listening:
  - Multiple choice questions based on a dialogue played in class

## Status (updated 2026-09-19)

| Topic | Status | Notes |
| --- | --- | --- |
| Vocabulary | Done (raised 2026-09-19) | 30 words, teacher definitions, homework cloze sentences, 6 modes: definition, word, cloze, synonyms, antonyms, Word Forms (change the word); distractors share the part of speech |
| Spelling / Phonics | Done | 3 dictation lists, 5 sort games, 2 homework-format MCQ sets (find the short vowel word; which letters make the long vowel) |
| Grammar | Done (raised to Grade 5 high standard 2026-09-19) | Quick guide (7 cards incl. Tricky Subjects) + 18 mixed items + 5 sets: HW be verbs 8, HW present simple 6, Lesson 4 be 26, Lesson 5 present simple 28, Challenge negatives/questions/tags 18 |
| Reading | Done (raised 2026-09-19) | 5 text anchor charts, 5 homework passages with added text-evidence / vocabulary-in-context / compare questions, POV practice, and 3 longer generated passages (opinion text, informational text on wheelchair sports, third-person-limited story) |
| Listening | Done (raised 2026-09-19) | 5 generated dialogues of 11-13 lines with 7-8 questions each: details (numbers, days, times), reasons, feelings, meaning of a spoken phrase, and what happens next |

Homework transcription: `content/2026-10-quiz1/homework.md`.

## Generated Now

- Added `Grade 5 2026 Fall Quiz 1` to the app's test picker.
- Vocabulary: 24 of 30 definitions now use the teacher's wording from HW1 sheets; 18 homework cloze sentences added to `examples[]`; elite tagged adj / n and photograph v / n as accepted by the teacher.
- Spelling: dictation lists with sentences, phonics sort games, and two MCQ sets copying the homework formats (`quiz: true` lists, rendered by `phonicsQuiz()` in `app.js`).
- Grammar: be verbs (present/past, negatives, questions, there is/are) and present simple (verb + s/es/ies, do/does, negatives, short answers), including the exact homework sentences.
- Reading: the five homework passages transcribed with their original questions plus added questions so every skill in the notice appears (Author's Purpose questions were added to Bell, Perseverance, and Captain Morgan because no homework covers that skill). Point of View practice packages the six homework excerpts plus two new ones. Anchor charts are text-only.
- Listening: four generated dialogues using Module 1 vocabulary.

## Grammar Difficulty Benchmark (2026-09-19)

The notice's "My Next Grammar Lesson 4-5" is Book 2 of the e-future series (grades 4-6): Lesson 4 Present and Past: Be, Lesson 5 Present Simple. Grade 5 subject-verb agreement tests found online go beyond plain "She ____ sick" items, so the practice sets were rewritten to include:

- hidden subjects: one of / each of / everyone / nobody / neither of, subject + prepositional phrase, subject + who-clause, along with, either…or
- singular -s nouns (mathematics, news, the United States) and plural-only nouns (scissors, trousers), collective nouns (family, team)
- there is / are agreeing with the nearest noun, compound there-subjects
- past vs present in one sentence, tag questions, negative questions, short answers
- spelling: -es (teaches, goes), consonant + y → -ies (studies, tries), vowel + y → -s (plays, enjoys)
- be vs do questions (Is your brother good at…? / Does your brother like…?)
- error spotting ("Which sentence is correct / has a mistake?") and rewriting statements as negatives, questions, wh- questions, and tags

Benchmarks used: a Grade 5 SVA quiz with items like "Mathematics (is, are)…", "The jury (has, have)…", "My friends who are in the band (wants, want)…", "Everyone (needs, need)…"; K5 Learning / Wayground descriptions of grade 5 SVA scope (collective nouns, indefinite pronouns, compound subjects, subject separated from verb); Cambridge A2 Flyers grammar list (be, there is/are, present simple, question forms).

## Reading and Vocabulary Difficulty Benchmark (2026-09-19)

Checked against CCSS Grade 5 reading standards (RI.5.1 quote accurately as evidence, RI.5.2 two or more main ideas, RI.5.8 how an author uses reasons and evidence, RL.5.3 compare characters, RL.5.4 figurative language, RL.5.6 how point of view influences the telling) and the HMH Into Reading Module 1 selection assessments (character analysis, cause and effect, text type, comparisons, inference, multiple choice + short answer). Findings and changes:

Reading
- The homework passages are short (150-350 words) and their questions were mostly literal or single-skill. Added to each: "Which sentence from the passage best supports…" text-evidence questions, vocabulary-in-context questions (conscious, household name, frenzy, treacherous, context-clue types), a compare-characters question, and a reasons/evidence question.
- Module 1 includes an opinion text (Government Must Fund Inventors), an informational text (Wheelchair Sports), and literary texts, but the homework only covered informational/narrative. Added three ~450-550 word passages in those genres: "Schools Should Fund Young Inventors" (author's opinion, reasons, evidence, counterarguments), "Rolling into the Game" (wheelchair sports history and rules, definition clues, sequence structure), and "The Flying Bathtub" (third-person limited, simile, idiom, character change, theme). Each has 9-10 questions including a short answer that requires citing details.
- New skill tags: Text Evidence, Vocabulary in Context, Compare and Contrast.

Vocabulary
- Grade 5 vocabulary assessments test context clues, word forms / parts of speech, synonyms and antonyms, and multiple meanings. The app covered definitions, cloze, synonyms, and antonyms, but distractors were random list words, so a noun blank could be solved by eliminating verbs. Distractors now share the target word's part of speech.
- Added a Word Forms mode for the homework skill "Some words may need to be changed": the sentence is blanked and the choices are forms of the same word (chug / chugs / chugged / chugging; cylinder / cylinders). Forms are generated in `app.js` (`wordForms`) for verbs and nouns; a word can override with `forms: [...]`. Only words that appear in two or more forms across their sentences are used, so 17 extra inflected sentences were added.
- Definitions stay in the teacher's wording because the matching section of the quiz is likely to reuse it.

## Listening Difficulty Benchmark (2026-09-19)

The first version had 6-line dialogues with five literal questions, all answerable from a single line. Grade 5 listening tests (Cambridge A2 Flyers listening, school dialogue quizzes) ask for details across several turns plus inference: why a speaker says something, how they feel, what a phrase means in context, and what the speakers will do next. Dialogues were rewritten to 11-13 lines with a small conflict or decision, and each now has 7-8 questions mixing detail (numbers, days, times), reason, feeling, spoken-phrase meaning ("travel more than a school bus", "ended up drinking his water"), and next-step questions. A fifth dialogue (a safety inspector's visit) uses the Week 2 vocabulary.

## Missing Reference Material (log)

Recorded 2026-09-19. None of these block practice; add them if they become available.

1. **Anchor Charts from the HW folder** — Author's Purpose, Text Structure, Figurative Language, Central Idea, Point of View. Only a small Point of View chart appears on HW page 07. The app currently uses text-only charts written from general knowledge. *Highest value: Author's Purpose has no homework coverage at all.*
2. **Into Reading passages** — Government Must Fund Inventors, The Inventor's Secret, Winds of Hope, Wheelchair Sports, Captain Arsenio. The quiz may ask about these texts directly; the homework passages only practice the skills. *Second highest value.*
3. **Know-It, Show-It workbook** pages 4 & 7 (short vowels), 11 & 14 (long a and e), 19 & 24 (long i and o). The phonics MCQ sets copy the homework format instead.
4. **My Next Grammar Lesson 4-5 pages** — not required; practice was generated from the homework format and standard rules.
5. **Teacher definitions** for phonograph, impoverished, irrigate, maneuver, prototype, eccentric — these six shaded words on the list were not on any HW1 sheet; app definitions are self-written.
