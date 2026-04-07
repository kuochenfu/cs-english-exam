// Grade 4 English Midterm Review — quiz engine
// Run via local server: `python3 -m http.server` then open http://localhost:8000

const $ = (id) => document.getElementById(id);
const app = $("app");

const STORE_KEY = "cs-english-exam-progress";
const VOICE_KEY = "cs-english-exam-voice";
const progress = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
const saveProgress = () => localStorage.setItem(STORE_KEY, JSON.stringify(progress));

// ---------- Voice selection ----------
let voices = [];
let selectedVoice = null;

function loadVoices() {
  voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith("en"));
  // Rank: prefer Premium/Enhanced/Neural, then known good US voices, then anything en-US.
  const score = (v) => {
    const n = (v.name + " " + (v.voiceURI || "")).toLowerCase();
    let s = 0;
    if (/premium/.test(n)) s += 100;
    if (/enhanced/.test(n)) s += 80;
    if (/neural|natural/.test(n)) s += 70;
    if (/(ava|zoe|allison|samantha|evan|tom|nicky|joelle|noelle|jenny|aria)/.test(n)) s += 30;
    if (v.lang === "en-US") s += 10;
    if (v.localService) s += 5;
    return s;
  };
  voices.sort((a, b) => score(b) - score(a));
  const saved = localStorage.getItem(VOICE_KEY);
  selectedVoice = voices.find(v => v.voiceURI === saved) || voices[0] || null;
}
if ("speechSynthesis" in window) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  if (selectedVoice) u.voice = selectedVoice;
  u.rate = 0.9;
  u.pitch = 1.0;
  u.lang = selectedVoice?.lang || "en-US";
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

function voicePicker() {
  if (!voices.length) return "";
  return `<div style="margin:8px 0">
    <label style="font-size:0.9rem;color:var(--muted)">🎙️ Voice: </label>
    <select id="voice-select" style="font:inherit;padding:6px 10px;border-radius:8px;border:2px solid var(--border)">
      ${voices.map(v => `<option value="${v.voiceURI}" ${v===selectedVoice?'selected':''}>${v.name} (${v.lang})</option>`).join("")}
    </select>
    <button class="ghost" id="voice-test" style="padding:6px 12px">Test</button>
  </div>`;
}
function bindVoicePicker() {
  const sel = $("voice-select");
  if (!sel) return;
  sel.onchange = () => {
    selectedVoice = voices.find(v => v.voiceURI === sel.value);
    localStorage.setItem(VOICE_KEY, sel.value);
  };
  $("voice-test").onclick = () => speak("Hi! Listen to this sentence and type the spelling word.");
}

const data = {};

async function loadAll() {
  const files = ["vocabulary", "spelling", "grammar", "reading", "listening"];
  try {
    for (const f of files) {
      const r = await fetch(`data/${f}.json`);
      data[f] = await r.json();
    }
  } catch (e) {
    app.innerHTML = `<div class="panel"><h2>⚠️ Couldn't load data</h2>
      <p>This app loads JSON files, which browsers block when opened directly.</p>
      <p><b>To run it:</b></p>
      <pre>cd ${"$"}(project folder)
python3 -m http.server</pre>
      <p>Then open <a href="http://localhost:8000">http://localhost:8000</a>.</p></div>`;
    throw e;
  }
}

// ---------- Home ----------
function renderHome() {
  const topics = [
    { id: "vocab",   icon: "📖", title: "Vocabulary",       desc: "Module 6 W1–3 words" },
    { id: "spell",   icon: "🔤", title: "Phonics & Spelling", desc: "Dictation + sound sorts" },
    { id: "grammar", icon: "✏️", title: "Grammar",          desc: "Modal verbs (Lesson 14)" },
    { id: "reading", icon: "📚", title: "Reading",          desc: "Anchor charts + passages" },
    { id: "listen",  icon: "👂", title: "Listening",        desc: "Dialogue + questions" },
  ];
  app.innerHTML = `
    <div class="panel">
      <h2>Pick a topic to practice</h2>
      <div class="cards">
        ${topics.map(t => {
          const p = progress[t.id];
          const pStr = p ? `Best: ${p.best}% · ${p.lastDate}` : "Not tried yet";
          return `<div class="card" data-topic="${t.id}">
            <div class="icon">${t.icon}</div>
            <h2>${t.title}</h2>
            <div>${t.desc}</div>
            <div class="progress">${pStr}</div>
          </div>`;
        }).join("")}
      </div>
    </div>`;
  document.querySelectorAll(".card").forEach(c => {
    c.onclick = () => routes[c.dataset.topic]();
  });
}

// ---------- Generic Quiz Runner ----------
function runQuiz(topicId, title, items, getQ) {
  // items: array; getQ(item) -> {prompt, choices, answer, extra?}
  let i = 0, correct = 0;
  const missed = [];
  const order = shuffle([...items.keys()]);

  function step() {
    if (i >= order.length) return finish();
    const item = items[order[i]];
    const { prompt, choices, answer, extra } = getQ(item);
    const choiceOrder = shuffle([...choices.keys()]);
    app.innerHTML = `
      <div class="panel">
        <div class="progress-bar"><div style="width:${(i/order.length)*100}%"></div></div>
        <h2>${title}</h2>
        ${extra || ""}
        <div class="question">${prompt}</div>
        <div class="choices">
          ${choiceOrder.map(idx => `<button data-idx="${idx}">${choices[idx]}</button>`).join("")}
        </div>
        <div class="feedback" id="fb"></div>
      </div>`;
    document.querySelectorAll(".choices button").forEach(b => {
      b.onclick = () => {
        const picked = +b.dataset.idx;
        const isCorrect = picked === answer;
        document.querySelectorAll(".choices button").forEach(x => {
          x.disabled = true;
          if (+x.dataset.idx === answer) x.classList.add("correct");
          else if (x === b) x.classList.add("wrong");
        });
        const fb = $("fb");
        if (isCorrect) { correct++; fb.textContent = "✅ Correct!"; fb.className = "feedback good"; }
        else { missed.push({ item, picked: choices[picked], answer: choices[answer] });
               fb.innerHTML = `❌ The answer is <b>${choices[answer]}</b>.`;
               fb.className = "feedback bad"; }
        setTimeout(() => { i++; step(); }, isCorrect ? 700 : 1600);
      };
    });
  }

  function finish() {
    const pct = Math.round((correct/order.length)*100);
    const today = new Date().toISOString().slice(0,10);
    const prev = progress[topicId];
    progress[topicId] = { best: Math.max(prev?.best || 0, pct), lastDate: today, lastScore: pct };
    saveProgress();
    app.innerHTML = `
      <div class="panel">
        <h2>🎉 Done!</h2>
        <p>Score: <b>${correct} / ${order.length}</b> (${pct}%)</p>
        ${missed.length ? `<details open><summary>Review ${missed.length} missed:</summary>
          <ul>${missed.map(m => `<li>${getQ(m.item).prompt.replace(/<[^>]+>/g,'')} → <b>${m.answer}</b> (you said: ${m.picked})</li>`).join("")}</ul></details>` : "<p>Perfect score! 🌟</p>"}
        <button onclick="renderHome()">🏠 Home</button>
      </div>`;
  }

  step();
}

function shuffle(a) { for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

// ---------- Vocabulary ----------
function vocabularyTopic() {
  const words = data.vocabulary.words;
  app.innerHTML = `
    <div class="panel">
      <h2>📖 Vocabulary</h2>
      <p>Pick a practice mode:</p>
      <button id="m1">Word → Definition</button>
      <button id="m2">Definition → Word</button>
      <button id="m3">Fill in the Blank</button>
      <button class="ghost" onclick="renderHome()">🏠 Home</button>
    </div>`;
  $("m1").onclick = () => runQuiz("vocab", "Word → Definition", words, (w) => {
    const wrongs = shuffle(words.filter(x => x.word !== w.word)).slice(0,3);
    const choices = shuffle([w, ...wrongs]).map(x => x.definition);
    return { prompt: `What does <b>${w.word}</b> (${w.pos}) mean?`, choices, answer: choices.indexOf(w.definition) };
  });
  $("m2").onclick = () => runQuiz("vocab", "Definition → Word", words, (w) => {
    const wrongs = shuffle(words.filter(x => x.word !== w.word)).slice(0,3);
    const choices = shuffle([w, ...wrongs]).map(x => x.word);
    return { prompt: `Which word means: <i>"${w.definition}"</i>?`, choices, answer: choices.indexOf(w.word) };
  });
  $("m3").onclick = () => runQuiz("vocab", "Fill in the Blank", words, (w) => {
    const blanked = w.example.replace(new RegExp(`\\b${w.word}\\w*`, "i"), "____");
    const wrongs = shuffle(words.filter(x => x.word !== w.word)).slice(0,3);
    const choices = shuffle([w, ...wrongs]).map(x => x.word);
    return { prompt: blanked, choices, answer: choices.indexOf(w.word) };
  });
}

// ---------- Spelling / Phonics ----------
function spellingTopic() {
  const lists = data.spelling.lists;
  app.innerHTML = `
    <div class="panel">
      <h2>🔤 Phonics & Spelling</h2>
      <p>Pick a list:</p>
      ${lists.map((l,idx) => `<button data-i="${idx}">${l.title}</button>`).join("")}
      <button class="ghost" onclick="renderHome()">🏠 Home</button>
    </div>`;
  document.querySelectorAll(".panel button[data-i]").forEach(b => {
    b.onclick = () => {
      const list = lists[+b.dataset.i];
      if (list.sortGame) sortGame(list); else dictation(list);
    };
  });
}

function dictation(list) {
  let i = 0, correct = 0;
  const order = shuffle([...list.words.keys()]);
  const missed = [];

  function step() {
    if (i >= order.length) return finish();
    const item = list.words[order[i]];
    app.innerHTML = `
      <div class="panel">
        <div class="progress-bar"><div style="width:${(i/order.length)*100}%"></div></div>
        <h2>${list.title}</h2>
        ${voicePicker()}
        <p>Listen to the sentence and type the missing word.</p>
        <button id="play">🔊 Play sentence</button>
        <p><i>Sentence will say the whole thing — you type the spelling word only.</i></p>
        <form id="f">
          <input type="text" id="ans" autocomplete="off" autofocus placeholder="type the word…" />
          <button type="submit">Check</button>
        </form>
        <div class="feedback" id="fb"></div>
      </div>`;
    bindVoicePicker();
    $("play").onclick = () => speak(item.sentence);
    speak(item.sentence);
    $("f").onsubmit = (e) => {
      e.preventDefault();
      const guess = $("ans").value.trim().toLowerCase();
      const fb = $("fb");
      if (guess === item.word.toLowerCase()) {
        correct++;
        fb.textContent = `✅ "${item.word}" — ${item.sentence}`;
        fb.className = "feedback good";
      } else {
        missed.push({ word: item.word, guess, sentence: item.sentence });
        fb.innerHTML = `❌ Correct spelling: <b>${item.word}</b><br><i>${item.sentence}</i>`;
        fb.className = "feedback bad";
      }
      setTimeout(() => { i++; step(); }, guess === item.word.toLowerCase() ? 1200 : 2400);
    };
  }

  function finish() {
    const pct = Math.round((correct/order.length)*100);
    const today = new Date().toISOString().slice(0,10);
    const prev = progress.spell;
    progress.spell = { best: Math.max(prev?.best || 0, pct), lastDate: today, lastScore: pct };
    saveProgress();
    app.innerHTML = `
      <div class="panel">
        <h2>🎉 Done!</h2>
        <p>Score: <b>${correct} / ${order.length}</b> (${pct}%)</p>
        ${missed.length ? `<details open><summary>Review ${missed.length} missed:</summary>
          <ul>${missed.map(m => `<li><b>${m.word}</b> — you wrote "${m.guess}"</li>`).join("")}</ul></details>` : "<p>Perfect! 🌟</p>"}
        <button onclick="spellingTopic()">More lists</button>
        <button class="ghost" onclick="renderHome()">🏠 Home</button>
      </div>`;
  }

  step();
}

function sortGame(list) {
  // Build flat word→correctGroup map
  const groupNames = Object.keys(list.groups);
  const wordGroup = {};
  const allWords = [];
  groupNames.forEach(g => list.groups[g].forEach(w => { wordGroup[w] = g; allWords.push(w); }));

  const placed = {}; // word -> chosen group
  let remaining = shuffle([...allWords]);

  function render() {
    app.innerHTML = `
      <div class="panel">
        <h2>${list.title}</h2>
        <p>Click a word, then click the bin where it belongs.</p>
        <div class="sort-row" id="bank">
          ${remaining.map(w => `<button class="sort-word" data-w="${w}">${w}</button>`).join("") || "<i>(All sorted!)</i>"}
        </div>
        ${groupNames.map(g => `
          <div class="sort-bin" data-g="${g}">
            <h4>${g}</h4>
            <div class="sort-row">
              ${Object.entries(placed).filter(([,gg]) => gg === g).map(([w]) => {
                const ok = wordGroup[w] === g;
                return `<span class="sort-word placed" style="color:${ok ? 'var(--good)' : 'var(--bad)'}">${ok ? '✓' : '✗'} ${w}</span>`;
              }).join("")}
            </div>
          </div>`).join("")}
        ${remaining.length === 0 ? `<button onclick="renderHome()">🏠 Home</button>` : ""}
      </div>`;
    let selected = null;
    document.querySelectorAll(".sort-word[data-w]").forEach(el => {
      el.onclick = () => {
        selected = el.dataset.w;
        document.querySelectorAll(".sort-word[data-w]").forEach(x => x.style.borderColor = "");
        el.style.borderColor = "var(--primary)";
      };
    });
    document.querySelectorAll(".sort-bin").forEach(bin => {
      bin.onclick = () => {
        if (!selected) return;
        placed[selected] = bin.dataset.g;
        remaining = remaining.filter(w => w !== selected);
        selected = null;
        render();
      };
    });
    if (remaining.length === 0) {
      const total = allWords.length;
      const right = Object.entries(placed).filter(([w,g]) => wordGroup[w] === g).length;
      const pct = Math.round((right/total)*100);
      const today = new Date().toISOString().slice(0,10);
      const prev = progress.spell;
      progress.spell = { best: Math.max(prev?.best || 0, pct), lastDate: today, lastScore: pct };
      saveProgress();
    }
  }
  render();
}

// ---------- Grammar ----------
function grammarTopic() {
  const items = data.grammar.items;
  runQuiz("grammar", data.grammar.title, items, (it) => ({
    prompt: it.q + (it.use ? ` <span class="tag">${it.use}</span>` : ""),
    choices: it.choices,
    answer: it.answer
  }));
}

// ---------- Reading ----------
function readingTopic() {
  app.innerHTML = `
    <div class="panel">
      <h2>📚 Reading Comprehension</h2>
      <p>Choose what to do:</p>
      <button id="charts">📋 Anchor Charts (review skills)</button>
      <h3>Then practice with a passage:</h3>
      ${data.reading.passages.map((p,i) => `<button data-p="${i}">${p.title}</button>`).join("")}
      <br><button class="ghost" onclick="renderHome()">🏠 Home</button>
    </div>`;
  $("charts").onclick = showAnchorCharts;
  document.querySelectorAll("button[data-p]").forEach(b => {
    b.onclick = () => readPassage(data.reading.passages[+b.dataset.p]);
  });
}

function showAnchorCharts() {
  const charts = [
    { name: "Ideas and Support",
      body: "<b>Main idea</b> = what a paragraph is mostly about. <b>Support</b> = the details, facts, or examples that prove it.<br><br>Ask: What is this paragraph telling me? Which sentences give proof?",
      ex: [
        "<b>Idea:</b> Bats are helpful animals. <b>Support:</b> They eat mosquitoes, pollinate flowers, and spread seeds.",
        "<b>Idea:</b> Recycling is good for the planet. <b>Support:</b> It saves trees, uses less energy than making new things, and keeps trash out of the ocean."
      ] },
    { name: "Text Structure",
      body: "How an author organizes ideas:<ul><li><b>Description</b> — for example, such as</li><li><b>Sequence</b> — first, next, then, finally</li><li><b>Compare/Contrast</b> — like, unlike, both</li><li><b>Cause/Effect</b> — because, so, since</li><li><b>Problem/Solution</b> — problem, solved, fixed</li></ul>",
      ex: [
        "<b>Sequence:</b> First, mix the flour and sugar. Next, add the eggs. Then, pour the batter into a pan. Finally, bake for 30 minutes.",
        "<b>Cause &amp; Effect:</b> The road was icy, so the cars drove very slowly. Because of the cold, several drivers slid into the ditch."
      ] },
    { name: "Figurative Language",
      body: "<ul><li><b>Simile</b>: compares with <i>like</i>/<i>as</i> — <i>her smile was like sunshine</i></li><li><b>Metaphor</b>: says one thing IS another — <i>the classroom was a zoo</i></li><li><b>Personification</b>: gives human traits to things — <i>the wind whispered</i></li><li><b>Hyperbole</b>: huge exaggeration — <i>I've told you a million times</i></li><li><b>Idiom</b>: hidden meaning — <i>raining cats and dogs</i></li></ul>",
      ex: [
        "<b>Simile:</b> The snow was as white as a fresh sheet of paper, and the trees stood like silent guards along the road.",
        "<b>Personification + Hyperbole:</b> The old door groaned when I pushed it open, and the room was so dusty I thought I would sneeze a thousand times."
      ] },
    { name: "Central Idea",
      body: "The most important point of the <b>whole text</b>. Bigger than the topic.<br><br><b>Topic</b> = one or two words. <b>Central idea</b> = a full sentence. Look at the title, first paragraph, last paragraph, and ideas that repeat.",
      ex: [
        "<b>Topic:</b> honeybees. <b>Central idea:</b> Honeybees do important jobs that help farmers grow food.",
        "<b>Topic:</b> the rainforest. <b>Central idea:</b> Rainforests are home to thousands of plants and animals that we cannot find anywhere else."
      ] },
    { name: "Text and Graphic Features",
      body: "Special parts that help readers: <b>headings, bold words, captions, maps, diagrams, charts, photos, sidebars</b>. Ask: what does this feature show me that the words alone don't?",
      ex: [
        "A science book about volcanoes has a <b>diagram</b> with arrows showing where the lava, ash, and gas come from — you can SEE the inside of the volcano without reading a long paragraph.",
        "A book about animals has a <b>photo</b> of a sloth with a <b>caption</b> that says, \"A sloth can sleep up to 20 hours a day.\" The caption gives a fact you might miss in the main text."
      ] },
    { name: "Summary",
      body: "A short retelling in your own words. Rules:<ol><li>Short</li><li>Your own words</li><li>Most important ideas only</li><li>No opinions</li><li>In order</li></ol>For stories try: <i>Somebody / Wanted / But / So / Then</i>.",
      ex: [
        "<b>Story:</b> Somebody: a girl named Mia. Wanted: to win the spelling bee. But: she got nervous and forgot a word. So: she practiced every night. Then: she came in second and felt proud.",
        "<b>Nonfiction:</b> Honeybees are important insects. They pollinate flowers for farmers, make honey, and live in hives run by a queen and thousands of workers."
      ] },
    { name: "Theme",
      body: "The <b>lesson or message</b> of a story. Look at: what the character learns, how the character changes. A theme is a full sentence — not just \"friendship\" but <i>\"True friends help each other even when it's hard.\"</i>",
      ex: [
        "A boy is afraid to try out for the soccer team but tries anyway and discovers he's better than he thought. <b>Theme:</b> You won't know what you can do until you try.",
        "Two sisters fight over a toy, then realize they had more fun playing together. <b>Theme:</b> Sharing with people you love is better than having something all to yourself."
      ] },
  ];
  app.innerHTML = `
    <div class="panel">
      <h2>📋 Anchor Charts</h2>
      ${charts.map(c => `<details><summary>${c.name}</summary><div>${c.body}<div style="margin-top:10px"><b>Examples:</b><ol><li>${c.ex[0]}</li><li>${c.ex[1]}</li></ol></div></div></details>`).join("")}
      <br><button onclick="readingTopic()">← Back</button>
      <button class="ghost" onclick="renderHome()">🏠 Home</button>
    </div>`;
}

function readPassage(passage) {
  window.__currentPassage = passage;
  // Pre-shuffle choice order per question so answer letters aren't always in the same spot.
  const qOrders = passage.questions.map(q => shuffle([...q.choices.keys()]));

  app.innerHTML = `
    <div class="panel">
      <h2>${passage.title}</h2>
      <div>${passage.skills.map(s => `<span class="tag">${data.reading.skills[s]}</span>`).join("")}</div>
      <div class="passage">${passage.body}</div>
      <h3>Questions</h3>
      <p style="color:var(--muted)">Read the passage above (you can scroll back any time), pick one answer for each question, then click <b>Submit all answers</b> at the bottom.</p>
      ${passage.questions.map((q, qi) => `
        <div class="qa-block" data-qi="${qi}" style="margin:18px 0;padding:14px;border:2px solid var(--border);border-radius:14px">
          <div class="question"><b>${qi+1}.</b> ${q.q} <span class="tag">${data.reading.skills[q.skill]}</span></div>
          <div class="choices">
            ${qOrders[qi].map(idx => `
              <label style="display:block;background:white;border:2px solid var(--border);padding:12px 16px;border-radius:12px;margin:6px 0;cursor:pointer">
                <input type="radio" name="q${qi}" value="${idx}" style="margin-right:8px"> ${q.choices[idx]}
              </label>`).join("")}
          </div>
          <div class="feedback" id="fb${qi}"></div>
        </div>
      `).join("")}
      <button id="submit-all">✅ Submit all answers</button>
      <button class="ghost" onclick="readingTopic()">← Back</button>
    </div>`;

  $("submit-all").onclick = () => {
    let correct = 0;
    const missed = [];
    let unanswered = 0;
    passage.questions.forEach((q, qi) => {
      const picked = document.querySelector(`input[name="q${qi}"]:checked`);
      const fb = $(`fb${qi}`);
      const block = document.querySelector(`.qa-block[data-qi="${qi}"]`);
      // Highlight choices
      block.querySelectorAll("label").forEach(lab => {
        const v = +lab.querySelector("input").value;
        lab.querySelector("input").disabled = true;
        if (v === q.answer) lab.style.background = "#d9f4e6", lab.style.borderColor = "var(--good)";
        if (picked && +picked.value === v && v !== q.answer) lab.style.background = "#fbdcdc", lab.style.borderColor = "var(--bad)";
      });
      if (!picked) {
        unanswered++;
        fb.innerHTML = `⚠️ No answer chosen. Correct: <b>${q.choices[q.answer]}</b>`;
        fb.className = "feedback bad";
        missed.push({ q: q.q, answer: q.choices[q.answer], picked: "(no answer)" });
      } else if (+picked.value === q.answer) {
        correct++;
        fb.textContent = "✅ Correct!";
        fb.className = "feedback good";
      } else {
        fb.innerHTML = `❌ Correct: <b>${q.choices[q.answer]}</b>`;
        fb.className = "feedback bad";
        missed.push({ q: q.q, answer: q.choices[q.answer], picked: q.choices[+picked.value] });
      }
    });

    const total = passage.questions.length;
    const pct = Math.round((correct/total)*100);
    const today = new Date().toISOString().slice(0,10);
    const prev = progress.reading;
    progress.reading = { best: Math.max(prev?.best || 0, pct), lastDate: today, lastScore: pct };
    saveProgress();

    // Show summary at top, scroll to it
    const summary = document.createElement("div");
    summary.className = "panel";
    summary.style.marginTop = "0";
    summary.innerHTML = `
      <h2>🎉 Score: ${correct} / ${total} (${pct}%)</h2>
      ${unanswered ? `<p style="color:var(--bad)">${unanswered} question(s) left blank.</p>` : ""}
      <button onclick="readPassage(window.__currentPassage)">🔁 Try again</button>
      <button class="ghost" onclick="readingTopic()">← Back to passages</button>
      <button class="ghost" onclick="renderHome()">🏠 Home</button>
    `;
    app.insertBefore(summary, app.firstChild);
    summary.scrollIntoView({ behavior: "smooth", block: "start" });
    $("submit-all").disabled = true;
    $("submit-all").style.opacity = "0.5";
  };
}

// ---------- Listening ----------
function listeningTopic() {
  app.innerHTML = `
    <div class="panel">
      <h2>👂 Listening Comprehension</h2>
      <p>Pick a dialogue. You'll hear a short conversation, then answer the questions. You can replay it any time.</p>
      ${data.listening.dialogues.map((d,i) => `<button data-d="${i}">${d.title}</button>`).join("")}
      <br><button class="ghost" onclick="renderHome()">🏠 Home</button>
    </div>`;
  document.querySelectorAll("button[data-d]").forEach(b => {
    b.onclick = () => playDialogue(data.listening.dialogues[+b.dataset.d]);
  });
}

function pickTwoVoices() {
  // Try to find a female + male voice for the two speakers; fall back to selectedVoice for both.
  const female = voices.find(v => /(ava|samantha|allison|zoe|joelle|nicky|noelle|aria|jenny|female|woman)/i.test(v.name));
  const male   = voices.find(v => /(evan|tom|alex|fred|aaron|nathan|male|man)/i.test(v.name));
  return [female || selectedVoice, male || selectedVoice];
}

function playDialogue(dialogue) {
  const [vA, vB] = pickTwoVoices();
  const speakers = {};
  let speakerOrder = 0;
  function voiceFor(speaker) {
    if (!(speaker in speakers)) {
      speakers[speaker] = (speakerOrder++ % 2 === 0) ? vA : vB;
    }
    return speakers[speaker];
  }

  function playAll() {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    dialogue.lines.forEach((line) => {
      const u = new SpeechSynthesisUtterance(`${line.speaker}: ${line.text}`);
      u.voice = voiceFor(line.speaker) || selectedVoice;
      u.rate = 0.9;
      u.lang = u.voice?.lang || "en-US";
      speechSynthesis.speak(u);
    });
  }

  app.innerHTML = `
    <div class="panel">
      <h2>${dialogue.title}</h2>
      ${voicePicker()}
      <button id="play">▶️ Play dialogue</button>
      <button id="stop" class="ghost">⏹ Stop</button>
      <button id="show" class="ghost">📜 Show transcript</button>
      <div id="transcript" style="display:none;margin-top:12px">
        ${dialogue.lines.map(l => `<p><b>${l.speaker}:</b> ${l.text}</p>`).join("")}
      </div>
      <br><button id="quiz">I'm ready — start questions →</button>
    </div>`;
  bindVoicePicker();
  $("play").onclick = playAll;
  $("stop").onclick = () => speechSynthesis.cancel();
  $("show").onclick = () => {
    const t = $("transcript");
    t.style.display = t.style.display === "none" ? "block" : "none";
  };
  window.__replayDialogue = playAll;
  $("quiz").onclick = () => {
    runQuiz("listen", dialogue.title, dialogue.questions, (q) => ({
      prompt: q.q,
      choices: q.choices,
      answer: q.answer,
      extra: `<button onclick="window.__replayDialogue()" class="ghost" style="margin-bottom:8px">🔊 Replay dialogue</button>`
    }));
  };
  // Auto-play once on entry
  setTimeout(playAll, 300);
}

// ---------- Routes ----------
const routes = {
  vocab: vocabularyTopic,
  spell: spellingTopic,
  grammar: grammarTopic,
  reading: readingTopic,
  listen: listeningTopic,
};

$("home-btn").onclick = renderHome;
$("reset-btn").onclick = () => {
  if (confirm("Reset all progress?")) {
    localStorage.removeItem(STORE_KEY);
    for (const k in progress) delete progress[k];
    renderHome();
  }
};

loadAll().then(renderHome);
