# Grade 5 Fall Midterm — Reading Anchor Charts

Seven "Midterm focus" charts, one per Reading Comprehension Skill in the notice: Author's Purpose, Text Structure, Theme, Figurative Language, Character, Literary Elements, Elements of Poetry. Each has a poster image, a guide, how-to steps, a "watch out" tip, **five worked examples**, and a quick check. The runtime copy is `anchorCharts` in `data/exams/2026-11-midterm/reading.json`.

The teacher's Module 2 anchor charts were not available. These are original study guides built from the research below. All example sentences are original. Examples that mention Mary, Colin, Dickon, Matt, or Kate are invented scenes, not quotes from the Into Reading texts.

## Posters

- Images: `assets/2026-11-midterm/anchor-charts/<skill>.webp` (1536×2304, 2:3, shown at 1024×1536)
- Sources: `content/2026-11-midterm/anchor-chart-posters/<skill>.html`. These are self-contained HTML files with emoji icons. A script in each file drops worked examples that would overflow the box, so posters show two or three.
- To re-render a poster, run headless Chrome on its HTML file:
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --force-device-scale-factor=1.5 --window-size=1024,1536 --virtual-time-budget=2000 --screenshot=<skill>.png file://$PWD/<skill>.html`, then `cwebp -q 86 -m 6 <skill>.png -o <skill>.webp`
- If you change chart text in `reading.json`, update the poster HTML to match, and the other way round.

## Research (2026-10-22)

- **Module scope:** Into Reading Grade 5 Module 2 is "What a Story!". Its essential question is "How does genre affect the way a story is told?" The genre focus is fiction: characters, setting, plot, conflict, plus poetry, myth, and fantasy/adventure. The selection assessment for "Airborn" checks literary elements, figurative language, and characters. Source: [OnCourse Into Reading Module 2 unit](https://app.oncoursesystems.com/curriculum/9490/9465799/unit/37409309).
- **Standards:** CCSS RL.5.2 (theme from how characters respond to challenges / how a speaker reflects), RL.5.3 (compare characters, settings, events), RL.5.4 (figurative language: metaphor, simile), RL.5.5 (chapters, scenes, stanzas form the overall structure), RL.5.6 (narrator's point of view). Source: [NJSLS Grade 5 ELA](https://www.nj.gov/education/standards/ela/Docs/2016NJSLS-ELA_Grade5.pdf), [Muscogee 5th Grade Reading Standards Checklist](https://sites.muscogee.k12.ga.us/k12curriculum/wp-content/uploads/sites/5/2014/09/5th-Grade-Reading-Standards-Checklist.pdf).
- **Author's Purpose:** P.I.E. (persuade, inform, entertain), with explain and describe added in upper grades. Sources: [WeAreTeachers](https://www.weareteachers.com/authors-purpose-anchor-charts/), [KnowItAll PIE lesson](https://www.knowitall.org/lessons/authors-purpose-pie-1).
- **Text Structure:** five nonfiction structures with signal words, plus a graphic organizer for each. Source: [Reading Vine](https://www.readingvine.com/collections/text-structure/).
- **Theme:** topic vs. theme, a theme written as a full sentence that applies to everyone, and turning "determination" into "Never give up on your dreams." Sources: [Reading Vine theme](https://www.readingvine.com/examples/theme/), [Virginia DOE lesson](https://doe.virginia.gov/home/showpublisheddocument/31772/638047077356700000).
- **Character:** direct vs. indirect characterization and the S.T.E.A.L. clues (speech, thoughts, effect on others, actions, looks). Sources: [Teach Starter STEAL](https://www.teachstarter.com/au/teaching-resource/steal-characterisation-anchor-charts/), [Virginia DOE characterization](https://doe.virginia.gov/home/showpublisheddocument/31816/638047083254430000).
- **Elements of Poetry:** line, stanza, rhyme scheme, rhythm/meter, repetition, refrain, imagery, forms such as free verse. Source: [Teach Simple poetry anchor charts](https://teachsimple.com/blog/anchor-charts/poetry-anchor-chart/).
- **Figurative Language:** simile, metaphor, personification, hyperbole, idiom, alliteration, onomatopoeia (L.5.5). No single authoritative chart was found; the content follows the standard definitions.

Not found online: the official HMH Grade 5 Module 2 anchor chart wording. Replace or adjust these charts if the teacher's charts become available.
