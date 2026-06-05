// Grade 4 English Review — quiz engine
// Run via local server: `python3 -m http.server` then open http://localhost:8000

const $ = (id) => document.getElementById(id);
const app = $("app");

const STORE_KEY = "cs-english-exam-progress";
const MISSED_KEY = "cs-english-exam-missed";
const GAME_KEY = "cs-english-exam-game";
const VOICE_KEY = "cs-english-exam-voice";
const EXAM_KEY = "cs-english-exam-current-exam";
const progress = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
const missed = JSON.parse(localStorage.getItem(MISSED_KEY) || "{}");
const game = JSON.parse(localStorage.getItem(GAME_KEY) || "{}");
const saveProgress = () => localStorage.setItem(STORE_KEY, JSON.stringify(progress));
const saveMissed = () => localStorage.setItem(MISSED_KEY, JSON.stringify(missed));
const saveGame = () => localStorage.setItem(GAME_KEY, JSON.stringify(game));

// ---------- Game layer ----------
const TOPIC_META = {
  vocab: { id: "vocab", icon: "📖", title: "Vocabulary", place: "Vocabulary Village" },
  spell: { id: "spell", icon: "🔤", title: "Phonics & Spelling", place: "Phonics Forest" },
  grammar: { id: "grammar", icon: "✏️", title: "Grammar", place: "Grammar Tower" },
  reading: { id: "reading", icon: "📚", title: "Reading", place: "Reading River" },
  listen: { id: "listen", icon: "👂", title: "Listening", place: "Listening Lab" },
};

const BADGES = [
  { id: "first_quest", icon: "⭐", name: "First Quest", desc: "Complete any practice round." },
  { id: "daily_hero", icon: "🏁", name: "Daily Hero", desc: "Finish today's missions." },
  { id: "reading_detective", icon: "🔎", name: "Reading Detective", desc: "Complete 3 reading passages." },
  { id: "grammar_wizard", icon: "🧙", name: "Grammar Wizard", desc: "Score 90%+ in grammar." },
  { id: "spelling_champ", icon: "🏆", name: "Spelling Champ", desc: "Get a perfect spelling or phonics score." },
  { id: "listening_star", icon: "🎧", name: "Listening Star", desc: "Complete 2 listening dialogues." },
  { id: "boss_defeated", icon: "💥", name: "Boss Defeated", desc: "Clear all missed questions." },
];

function todayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function ensureExamGame() {
  const id = currentExam?.id || "default";
  if (!game[id]) {
    game[id] = {
      stars: 0,
      dates: {},
      totals: { vocab: 0, spell: 0, grammar: 0, reading: 0, listen: 0 },
      best: { vocab: 0, spell: 0, grammar: 0, reading: 0, listen: 0 },
      badges: {},
      hadMissed: false
    };
  }
  return game[id];
}

function ensureTodayGame() {
  const examGame = ensureExamGame();
  const today = todayString();
  if (!examGame.dates[today]) {
    examGame.dates[today] = {
      topics: {},
      completions: 0,
      stars: 0
    };
  }
  return examGame.dates[today];
}

function topicCategory(topicId) {
  if (topicId.startsWith("vocab")) return "vocab";
  if (topicId.startsWith("spell")) return "spell";
  if (topicId.startsWith("grammar")) return "grammar";
  if (topicId.startsWith("reading")) return "reading";
  if (topicId.startsWith("listen")) return "listen";
  return "vocab";
}

function topicIsAvailable(topicId) {
  if (topicId === "vocab") return !!data.vocabulary?.words?.length;
  if (topicId === "spell") return !!data.spelling?.lists?.length;
  if (topicId === "grammar") return !!(data.grammar?.items?.length || data.grammar?.practiceSets?.length);
  if (topicId === "reading") return !!(data.reading?.passages?.length || data.reading?.anchorCharts?.length);
  if (topicId === "listen") return !!data.listening?.dialogues?.length;
  return false;
}

function dailyMissions() {
  return [
    { id: "reading", topic: "reading", text: "Complete one reading passage" },
    { id: "spell", topic: "spell", text: "Practice phonics or spelling" },
    { id: "grammar", topic: "grammar", text: "Win one grammar round" },
    { id: "listen", topic: "listen", text: "Finish one listening dialogue" },
    { id: "vocab", topic: "vocab", text: "Practice vocabulary" },
  ].filter(m => topicIsAvailable(m.topic)).slice(0, 3);
}

function dailyMissionCount() {
  const today = ensureTodayGame();
  const missions = dailyMissions();
  const done = missions.filter(m => today.topics[m.topic]).length;
  return { done, total: missions.length };
}

function totalMissedForCurrentExam() {
  if (!currentExam) return 0;
  const prefix = `${currentExam.id}:`;
  return Object.entries(missed)
    .filter(([key]) => key.startsWith(prefix))
    .reduce((sum, [,items]) => sum + items.length, 0);
}

function unlockBadges(topicId, pct) {
  const examGame = ensureExamGame();
  const category = topicCategory(topicId);
  const { done, total } = dailyMissionCount();
  const earned = [];
  const canEarn = {
    first_quest: Object.values(examGame.totals).reduce((sum, n) => sum + n, 0) >= 1,
    daily_hero: total > 0 && done >= total,
    reading_detective: examGame.totals.reading >= 3,
    grammar_wizard: category === "grammar" && pct >= 90,
    spelling_champ: category === "spell" && pct === 100,
    listening_star: examGame.totals.listen >= 2,
    boss_defeated: examGame.hadMissed && totalMissedForCurrentExam() === 0,
  };

  BADGES.forEach(b => {
    if (canEarn[b.id] && !examGame.badges[b.id]) {
      examGame.badges[b.id] = todayString();
      earned.push(b);
    }
  });
  return earned;
}

function recordGameCompletion(topicId, pct, correct, total) {
  const examGame = ensureExamGame();
  const today = ensureTodayGame();
  const category = topicCategory(topicId);
  const firstTopicToday = !today.topics[category];
  const starsEarned = Math.max(3, pct === 100 ? 10 : pct >= 80 ? 8 : pct >= 60 ? 6 : 4) + (firstTopicToday ? 2 : 0);

  today.topics[category] = true;
  today.completions++;
  today.stars += starsEarned;
  examGame.stars += starsEarned;
  examGame.totals[category] = (examGame.totals[category] || 0) + 1;
  examGame.best[category] = Math.max(examGame.best[category] || 0, pct);

  const badges = unlockBadges(topicId, pct);
  saveGame();

  return { starsEarned, badges, correct, total };
}

function gameRewardHTML(result) {
  if (!result) return "";
  return `<div class="reward-box">
    <div><b>+${result.starsEarned} stars</b> added to your quest map.</div>
    ${result.badges.length ? `<div class="badge-unlocks">${result.badges.map(b => `<span class="badge earned" title="${b.desc}">${b.icon} ${b.name}</span>`).join("")}</div>` : ""}
  </div>`;
}

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
  voices = voices.slice(0, 5);
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

const examIndex = { defaultExamId: null, exams: [] };
const data = {};
let currentExam = null;

function progressKey(topicId) {
  return currentExam ? `${currentExam.id}:${topicId}` : topicId;
}

function missedKey(topicId) {
  return progressKey(topicId);
}

function readProgress(topicId) {
  const key = progressKey(topicId);
  return progress[key] || (currentExam?.id === examIndex.defaultExamId ? progress[topicId] : null);
}

function writeProgress(topicId, pct) {
  const key = progressKey(topicId);
  const today = new Date().toISOString().slice(0,10);
  const prev = readProgress(topicId);
  progress[key] = { best: Math.max(prev?.best || 0, pct), lastDate: today, lastScore: pct };
  saveProgress();
}

function readTopicProgress(topicId) {
  const exact = readProgress(topicId);
  if (!currentExam) return null;

  const prefix = `${currentExam.id}:${topicId}:`;
  const entries = Object.entries(progress)
    .filter(([key]) => key.startsWith(prefix))
    .map(([,value]) => value);
  if (exact && !entries.length) return { text: `Best: ${exact.best}% · ${exact.lastDate}` };
  if (!entries.length) return null;

  const best = Math.max(...entries.map(p => p.best || 0));
  const latest = entries
    .map(p => p.lastDate)
    .filter(Boolean)
    .sort()
    .pop();
  return { text: `Best: ${best}% · ${entries.length} mode${entries.length === 1 ? "" : "s"}${latest ? ` · ${latest}` : ""}` };
}

function recordMissed(topicId, item) {
  const key = missedKey(topicId);
  if (!missed[key]) missed[key] = [];
  const next = { ...item, missedAt: new Date().toISOString().slice(0,10) };
  const idx = missed[key].findIndex(x => x.id === next.id);
  if (idx >= 0) missed[key][idx] = next;
  else missed[key].push(next);
  ensureExamGame().hadMissed = true;
  saveMissed();
  saveGame();
}

function clearMissed(topicId, id) {
  const key = missedKey(topicId);
  if (!missed[key]) return;
  missed[key] = missed[key].filter(x => x.id !== id);
  if (!missed[key].length) delete missed[key];
  saveMissed();
}

function missedItems(topicId) {
  return missed[missedKey(topicId)] || [];
}

function missedCount(topicId) {
  return missedItems(topicId).length;
}

function missedCountForPrefix(topicId) {
  if (!currentExam) return 0;
  const prefix = `${currentExam.id}:${topicId}`;
  return Object.entries(missed)
    .filter(([key]) => key === prefix || key.startsWith(`${prefix}:`))
    .reduce((sum, [,items]) => sum + items.length, 0);
}

async function loadAll() {
  const files = ["vocabulary", "spelling", "grammar", "reading", "listening"];
  try {
    const examRes = await fetch("data/exams.json");
    const index = await examRes.json();
    examIndex.defaultExamId = index.defaultExamId;
    examIndex.exams = index.exams;

    const savedExamId = localStorage.getItem(EXAM_KEY);
    const savedExam = examIndex.exams.find(e => e.id === savedExamId && e.available);
    if (!savedExam) {
      currentExam = null;
      renderExamPicker();
      return;
    }

    currentExam = savedExam;
    for (const f of files) {
      const r = await fetch(`data/exams/${currentExam.id}/${f}.json`);
      data[f] = await r.json();
    }
    localStorage.setItem(EXAM_KEY, currentExam.id);
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

async function selectExam(examId) {
  const exam = examIndex.exams.find(e => e.id === examId);
  if (!exam || !exam.available) return;
  currentExam = exam;
  localStorage.setItem(EXAM_KEY, currentExam.id);
  await loadAll();
  renderHome();
}

function renderExamPicker() {
  app.innerHTML = `
    <div class="panel">
      <h2>Choose a test to practice</h2>
      <div class="cards">
        ${examIndex.exams.map(exam => `
          <div class="card ${exam.available ? "" : "disabled"}" data-exam="${exam.id}">
            <div class="icon">${exam.available ? "📘" : "🗂️"}</div>
            <h2>${exam.title}</h2>
            <div>${exam.subtitle}</div>
            <div class="progress">${exam.status}</div>
          </div>`).join("")}
      </div>
    </div>`;
  document.querySelectorAll(".card[data-exam]").forEach(c => {
    const exam = examIndex.exams.find(e => e.id === c.dataset.exam);
    if (exam?.available) c.onclick = () => selectExam(exam.id);
  });
}

// ---------- Home ----------
function moduleWeeksLabel() {
  const match = currentExam?.subtitle.match(/Module\s+(\d+).*Weeks?\s+([0-9-]+)/i);
  return match ? `Module ${match[1]} W${match[2]}` : currentExam?.subtitle || "Current test";
}

function grammarLabel() {
  return (data.grammar?.title || "Grammar")
    .replace(/^Grammar\s*[—-]\s*/, "")
    .replace(/^(.+?)\s*\(My Next Grammar,\s*/, "$1 (")
    .replace("Lessons ", "L")
    .replace("Lesson ", "L");
}

function topicCards(moduleLabel) {
  return [
    { ...TOPIC_META.vocab, desc: `${moduleLabel} words` },
    { ...TOPIC_META.spell, desc: "Dictation + sound sorts" },
    { ...TOPIC_META.grammar, desc: grammarLabel() },
    { ...TOPIC_META.reading, desc: "Anchor charts + passages" },
    { ...TOPIC_META.listen, desc: "Dialogue + questions" },
  ];
}

function dailyMissionsHTML() {
  const today = ensureTodayGame();
  const missions = dailyMissions();
  const { done, total } = dailyMissionCount();
  if (!missions.length) return "";
  return `<div class="mission-panel">
    <div class="mission-head">
      <div>
        <h3>Today's Missions</h3>
        <p>${done}/${total} complete</p>
      </div>
      <div class="mission-ring" aria-label="${done} of ${total} daily missions complete">${done}/${total}</div>
    </div>
    <div class="mission-list">
      ${missions.map(m => {
        const meta = TOPIC_META[m.topic];
        const complete = !!today.topics[m.topic];
        return `<button class="mission ${complete ? "complete" : ""}" data-mission-topic="${meta.id}">
          <span>${complete ? "✓" : meta.icon}</span>
          <span>${m.text}</span>
        </button>`;
      }).join("")}
    </div>
  </div>`;
}

function badgesHTML() {
  const examGame = ensureExamGame();
  return `<div class="badges-panel">
    <h3>Badges</h3>
    <div class="badges">
      ${BADGES.map(b => {
        const earned = !!examGame.badges[b.id];
        return `<span class="badge ${earned ? "earned" : "locked"}" title="${b.desc}">
          ${earned ? b.icon : "◇"} ${b.name}
        </span>`;
      }).join("")}
    </div>
  </div>`;
}

function renderHome() {
  if (!currentExam) return renderExamPicker();
  const moduleLabel = moduleWeeksLabel();
  const topics = topicCards(moduleLabel);
  const examGame = ensureExamGame();
  const today = ensureTodayGame();
  const missedTotal = totalMissedForCurrentExam();
  app.innerHTML = `
    <div class="panel">
      <div class="quest-header">
        <div>
          <h2>Final Exam Quest Map</h2>
          <p class="exam-label">${currentExam.title} · ${currentExam.subtitle}</p>
        </div>
        <div class="stars-box">
          <span>⭐</span>
          <b>${examGame.stars}</b>
          <small>stars</small>
        </div>
      </div>
      ${dailyMissionsHTML()}
      ${missedTotal ? `<button id="boss-review" class="boss-button">💥 Boss Review · ${missedTotal} missed</button>` : `<div class="boss-clear">💥 Boss defeated: no missed questions waiting.</div>`}
      ${badgesHTML()}
      <h3>Quest Map</h3>
      <p class="exam-label">${currentExam.title} · ${currentExam.subtitle}</p>
      <div class="cards quest-map">
        ${topics.map(t => {
          const p = readTopicProgress(t.id);
          const miss = missedCountForPrefix(t.id);
          const pStr = p ? p.text : "Not tried yet";
          const doneToday = !!today.topics[t.id];
          return `<div class="card quest-card ${doneToday ? "done-today" : ""}" data-topic="${t.id}">
            <div class="icon">${t.icon}</div>
            <div class="quest-place">${t.place}</div>
            <h2>${t.title}</h2>
            <div>${t.desc}</div>
            <div class="progress">${doneToday ? "Today complete · " : ""}${pStr}${miss ? ` · ${miss} to review` : ""}</div>
          </div>`;
        }).join("")}
      </div>
      <button class="ghost" id="change-exam">Change test</button>
    </div>`;
  document.querySelectorAll(".card").forEach(c => {
    c.onclick = () => routes[c.dataset.topic]();
  });
  document.querySelectorAll("button[data-mission-topic]").forEach(b => {
    b.onclick = () => routes[b.dataset.missionTopic]();
  });
  if ($("boss-review")) $("boss-review").onclick = bossReview;
  $("change-exam").onclick = renderExamPicker;
}

function bossReview() {
  const topics = topicCards(moduleWeeksLabel())
    .map(t => ({ ...t, missed: missedCountForPrefix(t.id) }))
    .filter(t => t.missed);

  if (!topics.length) {
    const badges = unlockBadges("reading:boss-clear", 100);
    saveGame();
    app.innerHTML = `
      <div class="panel boss-panel">
        <h2>💥 Boss Defeated</h2>
        <p>No missed questions are waiting right now.</p>
        ${gameRewardHTML({ starsEarned: 0, badges })}
        <button onclick="renderHome()">Back to Quest Map</button>
      </div>`;
    return;
  }

  app.innerHTML = `
    <div class="panel boss-panel">
      <h2>💥 Boss Review</h2>
      <p>Clear missed questions to defeat each boss.</p>
      <div class="boss-list">
        ${topics.map(t => `<button data-boss-topic="${t.id}" class="boss-card">
          <span class="boss-icon">${t.icon}</span>
          <span><b>${t.title}</b> <small>${t.missed} missed question${t.missed === 1 ? "" : "s"}</small></span>
        </button>`).join("")}
      </div>
      <button class="ghost" onclick="renderHome()">🏠 Quest Map</button>
    </div>`;
  document.querySelectorAll("button[data-boss-topic]").forEach(b => {
    b.onclick = () => routes[b.dataset.bossTopic]();
  });
}

// ---------- Generic Quiz Runner ----------
function runQuiz(topicId, title, items, getQ, options = {}) {
  // items: array; getQ(item) -> {prompt, choices, answer, extra?}
  if (!items.length) {
    app.innerHTML = `
      <div class="panel">
        <h2>${title}</h2>
        <p>No review items are available right now.</p>
        <button class="ghost" onclick="renderHome()">🏠 Home</button>
      </div>`;
    return;
  }
  let i = 0, correct = 0;
  const missed = [];
  const order = shuffle([...items.keys()]);
  const itemId = options.itemId || ((item) => item.id || item.word || item.q);
  const itemLabel = options.itemLabel || ((item) => item.word || item.q || "Question");
  const afterFinish = options.afterFinish || renderHome;

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
        const id = String(itemId(item));
        document.querySelectorAll(".choices button").forEach(x => {
          x.disabled = true;
          if (+x.dataset.idx === answer) x.classList.add("correct");
          else if (x === b) x.classList.add("wrong");
        });
        const fb = $("fb");
        if (isCorrect) {
          correct++;
          clearMissed(topicId, id);
          fb.textContent = "✅ Correct!";
          fb.className = "feedback good";
        }
        else { missed.push({ item, picked: choices[picked], answer: choices[answer] });
               recordMissed(topicId, { id, label: itemLabel(item), title });
               fb.innerHTML = `❌ The answer is <b>${choices[answer]}</b>.`;
               fb.className = "feedback bad"; }
        setTimeout(() => { i++; step(); }, isCorrect ? 700 : 1600);
      };
    });
    if (options.afterRender) options.afterRender(item);
    if (options.onStep) options.onStep(item);
  }

  function finish() {
    const pct = Math.round((correct/order.length)*100);
    writeProgress(topicId, pct);
    const reward = recordGameCompletion(topicId, pct, correct, order.length);
    app.innerHTML = `
      <div class="panel">
        <h2>🎉 Done!</h2>
        <p>Score: <b>${correct} / ${order.length}</b> (${pct}%)</p>
        ${gameRewardHTML(reward)}
        ${missed.length ? `<details open><summary>Review ${missed.length} missed:</summary>
          <ul>${missed.map(m => `<li>${getQ(m.item).prompt.replace(/<[^>]+>/g,'')} → <b>${m.answer}</b> (you said: ${m.picked})</li>`).join("")}</ul></details>` : "<p>Perfect score! 🌟</p>"}
        <button id="finish-next">Done</button>
        <button class="ghost" onclick="renderHome()">🏠 Home</button>
      </div>`;
    $("finish-next").onclick = afterFinish;
  }

  step();
}

function shuffle(a) { for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

function emptyTopic(title) {
  app.innerHTML = `
    <div class="panel">
      <h2>${title}</h2>
      <p>This section does not have practice items yet.</p>
      <button class="ghost" onclick="renderHome()">🏠 Home</button>
    </div>`;
}

// ---------- Vocabulary ----------
function vocabularyTopic() {
  const words = data.vocabulary.words;
  if (!words.length) return emptyTopic("Vocabulary");
  const missedDef = missedCount("vocab:definition");
  const missedWord = missedCount("vocab:word");
  const missedBlank = missedCount("vocab:blank");

  const reviewWords = (topicId) => words.filter(w => missedItems(topicId).some(m => m.id === w.word));
  const startDefinition = (items = words) => runQuiz("vocab:definition", "Word → Definition", items, (w) => {
    const wrongs = shuffle(words.filter(x => x.word !== w.word)).slice(0,3);
    const choices = shuffle([w, ...wrongs]).map(x => x.definition);
    return { prompt: `What does <b>${w.word}</b> (${w.pos}) mean?`, choices, answer: choices.indexOf(w.definition) };
  }, { itemId: w => w.word, itemLabel: w => w.word, afterFinish: vocabularyTopic });
  const startWord = (items = words) => runQuiz("vocab:word", "Definition → Word", items, (w) => {
    const wrongs = shuffle(words.filter(x => x.word !== w.word)).slice(0,3);
    const choices = shuffle([w, ...wrongs]).map(x => x.word);
    return { prompt: `Which word means: <i>"${w.definition}"</i>?`, choices, answer: choices.indexOf(w.word) };
  }, { itemId: w => w.word, itemLabel: w => w.word, afterFinish: vocabularyTopic });
  const startBlank = (items = words) => runQuiz("vocab:blank", "Fill in the Blank", items, (w) => {
    const blanked = w.example.replace(new RegExp(`\\b${w.word}\\w*`, "i"), "____");
    const wrongs = shuffle(words.filter(x => x.word !== w.word)).slice(0,3);
    const choices = shuffle([w, ...wrongs]).map(x => x.word);
    return { prompt: blanked, choices, answer: choices.indexOf(w.word) };
  }, { itemId: w => w.word, itemLabel: w => w.word, afterFinish: vocabularyTopic });

  app.innerHTML = `
    <div class="panel">
      <h2>📖 Vocabulary</h2>
      <p>Pick a practice mode:</p>
      <button id="m1">Word → Definition</button>
      <button id="m2">Definition → Word</button>
      <button id="m3">Fill in the Blank</button>
      ${missedDef ? `<button class="ghost" id="r1">Review Word → Definition (${missedDef})</button>` : ""}
      ${missedWord ? `<button class="ghost" id="r2">Review Definition → Word (${missedWord})</button>` : ""}
      ${missedBlank ? `<button class="ghost" id="r3">Review Fill in the Blank (${missedBlank})</button>` : ""}
      <button class="ghost" onclick="renderHome()">🏠 Home</button>
    </div>`;
  $("m1").onclick = () => startDefinition();
  $("m2").onclick = () => startWord();
  $("m3").onclick = () => startBlank();
  if ($("r1")) $("r1").onclick = () => startDefinition(reviewWords("vocab:definition"));
  if ($("r2")) $("r2").onclick = () => startWord(reviewWords("vocab:word"));
  if ($("r3")) $("r3").onclick = () => startBlank(reviewWords("vocab:blank"));
}

// ---------- Spelling / Phonics ----------
function spellingTopic() {
  const lists = data.spelling.lists;
  if (!lists.length) return emptyTopic("Phonics & Spelling");
  app.innerHTML = `
    <div class="panel">
      <h2>🔤 Phonics & Spelling</h2>
      <p>Pick a list:</p>
      ${lists.map((l,idx) => {
        const topicId = `spell:${l.id || idx}`;
        const p = readTopicProgress(topicId);
        const miss = missedCountForPrefix(topicId);
        return `<button data-i="${idx}">${l.title}${p ? ` · ${p.text}` : ""}</button>${miss ? `<button class="ghost" data-review-i="${idx}">Review missed (${miss})</button>` : ""}`;
      }).join("")}
      <button class="ghost" onclick="renderHome()">🏠 Home</button>
    </div>`;
  document.querySelectorAll(".panel button[data-i]").forEach(b => {
    b.onclick = () => {
      const list = lists[+b.dataset.i];
      if (list.sortGame) sortGame(list); else spellingListMenu(list);
    };
  });
  document.querySelectorAll(".panel button[data-review-i]").forEach(b => {
    b.onclick = () => {
      const list = lists[+b.dataset.reviewI];
      if (list.sortGame) sortGame(list, true); else spellingListMenu(list);
    };
  });
}

function spellingListMenu(list) {
  window.__currentSpellingList = list;
  const baseId = `spell:${list.id || list.title}`;
  const chooseId = `${baseId}:choose`;
  const typeId = `${baseId}:type`;
  const chooseProgress = readProgress(chooseId);
  const typeProgress = readProgress(typeId);
  const chooseMissed = missedCount(chooseId);
  const typeMissed = missedCount(typeId);

  app.innerHTML = `
    <div class="panel">
      <h2>${list.title}</h2>
      <p>Start with listening practice, then try the full spelling test.</p>
      <button id="spell-choose">Listen & Choose${chooseProgress ? ` · Best ${chooseProgress.best}%` : ""}</button>
      ${chooseMissed ? `<button class="ghost" id="spell-choose-review">Review Listen & Choose (${chooseMissed})</button>` : ""}
      <button id="spell-type">Type Spelling${typeProgress ? ` · Best ${typeProgress.best}%` : ""}</button>
      ${typeMissed ? `<button class="ghost" id="spell-type-review">Review Type Spelling (${typeMissed})</button>` : ""}
      <button class="ghost" onclick="spellingTopic()">← More lists</button>
      <button class="ghost" onclick="renderHome()">🏠 Home</button>
    </div>`;
  $("spell-choose").onclick = () => spellingChoiceQuiz(list);
  $("spell-type").onclick = () => dictation(list);
  if ($("spell-choose-review")) $("spell-choose-review").onclick = () => spellingChoiceQuiz(list, true);
  if ($("spell-type-review")) $("spell-type-review").onclick = () => dictation(list, true);
}

function spellingChoiceQuiz(list, reviewOnly = false) {
  const topicId = `spell:${list.id || list.title}:choose`;
  const words = reviewOnly ? list.words.filter(w => missedItems(topicId).some(m => m.id === w.word)) : list.words;
  const makeChoices = (item) => {
    const wrongs = shuffle(list.words.filter(w => w.word !== item.word)).slice(0, 3);
    return shuffle([item, ...wrongs]).map(w => w.word);
  };
  runQuiz(topicId, `${list.title} — Listen & Choose`, words, (item) => {
    const choices = makeChoices(item);
    window.__spellReplay = () => speak(item.sentence);
    return {
      prompt: "Which word completes the sentence?",
      choices,
      answer: choices.indexOf(item.word),
      extra: `${voicePicker()}<button onclick="window.__spellReplay()" class="ghost" style="margin-bottom:8px">🔊 Replay sentence</button>`
    };
  }, {
    itemId: item => item.word,
    itemLabel: item => item.word,
    afterFinish: () => spellingListMenu(list),
    afterRender: bindVoicePicker,
    onStep: item => speak(item.sentence)
  });
}

function dictation(list, reviewOnly = false) {
  window.__currentSpellingList = list;
  let i = 0, correct = 0;
  const topicId = `spell:${list.id || list.title}:type`;
  const words = reviewOnly ? list.words.filter(w => missedItems(topicId).some(m => m.id === w.word)) : list.words;
  if (!words.length) return spellingTopic();
  const order = shuffle([...words.keys()]);
  const missed = [];

  function step() {
    if (i >= order.length) return finish();
    const item = words[order[i]];
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
        clearMissed(topicId, item.word);
        fb.textContent = `✅ "${item.word}" — ${item.sentence}`;
        fb.className = "feedback good";
      } else {
        missed.push({ word: item.word, guess, sentence: item.sentence });
        recordMissed(topicId, { id: item.word, label: item.word, title: list.title });
        fb.innerHTML = `❌ Correct spelling: <b>${item.word}</b><br><i>${item.sentence}</i>`;
        fb.className = "feedback bad";
      }
      setTimeout(() => { i++; step(); }, guess === item.word.toLowerCase() ? 1200 : 2400);
    };
  }

  function finish() {
    const pct = Math.round((correct/order.length)*100);
    writeProgress(topicId, pct);
    const reward = recordGameCompletion(topicId, pct, correct, order.length);
    app.innerHTML = `
      <div class="panel">
        <h2>🎉 Done!</h2>
        <p>Score: <b>${correct} / ${order.length}</b> (${pct}%)</p>
        ${gameRewardHTML(reward)}
        ${missed.length ? `<details open><summary>Review ${missed.length} missed:</summary>
          <ul>${missed.map(m => `<li><b>${m.word}</b> — you wrote "${m.guess}"</li>`).join("")}</ul></details>` : "<p>Perfect! 🌟</p>"}
        <button id="more-spelling-modes">More modes</button>
        ${missedCount(topicId) ? `<button class="ghost" id="review-dictation">Review this list (${missedCount(topicId)})</button>` : ""}
        <button class="ghost" onclick="renderHome()">🏠 Home</button>
      </div>`;
    $("more-spelling-modes").onclick = () => spellingListMenu(list);
    if ($("review-dictation")) $("review-dictation").onclick = () => dictation(list, true);
  }

  step();
}

function sortGame(list, reviewOnly = false) {
  // Build flat word→correctGroup map
  const topicId = `spell:${list.id || list.title}`;
  const reviewIds = new Set(missedItems(topicId).map(m => m.id));
  const groupNames = Object.keys(list.groups);
  const wordGroup = {};
  const allWords = [];
  groupNames.forEach(g => list.groups[g].forEach(w => {
    if (!reviewOnly || reviewIds.has(w)) {
      wordGroup[w] = g;
      allWords.push(w);
    }
  }));
  if (!allWords.length) return spellingTopic();

  const placed = {}; // word -> chosen group
  let remaining = shuffle([...allWords]);
  let finalRecorded = false;
  let finalReward = null;

  function render() {
    if (remaining.length === 0 && !finalRecorded) {
      const total = allWords.length;
      const right = Object.entries(placed).filter(([w,g]) => wordGroup[w] === g).length;
      const pct = Math.round((right/total)*100);
      writeProgress(topicId, pct);
      finalReward = recordGameCompletion(topicId, pct, right, total);
      finalRecorded = true;
    }

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
        ${remaining.length === 0 ? `${gameRewardHTML(finalReward)}<button onclick="renderHome()">🏠 Home</button>` : ""}
      </div>`;
    let selected = null;
    document.querySelectorAll(".sort-word[data-w]").forEach(el => {
      el.onclick = () => {
        selected = el.dataset.w;
        document.querySelectorAll(".sort-word[data-w]").forEach(x => x.classList.remove("selected"));
        el.classList.add("selected");
      };
    });
    document.querySelectorAll(".sort-bin").forEach(bin => {
      bin.onclick = () => {
        if (!selected) return;
        placed[selected] = bin.dataset.g;
        if (wordGroup[selected] === bin.dataset.g) {
          clearMissed(topicId, selected);
        } else {
          recordMissed(topicId, { id: selected, label: selected, title: list.title });
        }
        remaining = remaining.filter(w => w !== selected);
        selected = null;
        render();
      };
    });
  }
  render();
}

// ---------- Grammar ----------
function grammarTopic() {
  const mainItems = data.grammar.items || [];
  const practiceSets = [
    ...(mainItems.length ? [{
      id: "main",
      title: "Mixed Practice",
      description: data.grammar.intro || "Mixed grammar review.",
      items: mainItems
    }] : []),
    ...(data.grammar.practiceSets || [])
  ];
  if (!practiceSets.length) return emptyTopic("Grammar");

  const makeQuestion = (it) => ({
    prompt: it.q + (it.use ? ` <span class="tag">${it.use}</span>` : ""),
    choices: it.choices,
    answer: it.answer
  });

  const start = (set, quizItems = set.items) => {
    const topicId = `grammar:${set.id}`;
    runQuiz(topicId, set.title, quizItems, makeQuestion, {
      itemId: it => it.id || it.q,
      itemLabel: it => it.q,
      afterFinish: grammarTopic
    });
  };

  app.innerHTML = `
    <div class="panel">
      <h2>✏️ Grammar</h2>
      <p>Choose a practice set:</p>
      <div class="practice-list">
        ${practiceSets.map((set, idx) => {
          const topicId = `grammar:${set.id}`;
          const p = readProgress(topicId);
          const miss = missedCount(topicId);
          return `<div class="practice-set">
            <button data-grammar-set="${idx}">${set.title}${p ? ` · Best ${p.best}%` : ""}</button>
            ${set.description ? `<div class="practice-desc">${set.description}</div>` : ""}
            ${miss ? `<button class="ghost review-button" data-grammar-review="${idx}">Review missed (${miss})</button>` : ""}
          </div>`;
        }).join("")}
      </div>
      <button class="ghost" onclick="renderHome()">🏠 Home</button>
    </div>`;
  document.querySelectorAll("button[data-grammar-set]").forEach(b => {
    b.onclick = () => start(practiceSets[+b.dataset.grammarSet]);
  });
  document.querySelectorAll("button[data-grammar-review]").forEach(b => {
    b.onclick = () => {
      const set = practiceSets[+b.dataset.grammarReview];
      const topicId = `grammar:${set.id}`;
      const reviewItems = set.items.filter(it => missedItems(topicId).some(m => m.id === String(it.id || it.q)));
      start(set, reviewItems);
    };
  });
}

// ---------- Reading ----------
function readingTopic() {
  const passages = data.reading.passages || [];
  const charts = data.reading.anchorCharts || [];
  if (!passages.length && !charts.length) return emptyTopic("Reading Comprehension");
  app.innerHTML = `
    <div class="panel">
      <h2>📚 Reading Comprehension</h2>
      <p>Choose what to do:</p>
      ${charts.length ? `<button id="charts">📋 Anchor Charts (review skills)</button>` : ""}
      ${passages.length ? `<h3>Then practice with a passage:</h3>
      ${passages.map((p,i) => {
        const topicId = `reading:${p.id || p.title}`;
        const miss = missedCount(topicId);
        const prog = readProgress(topicId);
        return `<button data-p="${i}">${p.title}${prog ? ` · Best ${prog.best}%` : ""}</button>${miss ? `<button class="ghost" data-review-p="${i}">Review missed (${miss})</button>` : ""}`;
      }).join("")}` : ""}
      <br><button class="ghost" onclick="renderHome()">🏠 Home</button>
    </div>`;
  if ($("charts")) $("charts").onclick = showAnchorCharts;
  document.querySelectorAll("button[data-p]").forEach(b => {
    b.onclick = () => readPassage(data.reading.passages[+b.dataset.p]);
  });
  document.querySelectorAll("button[data-review-p]").forEach(b => {
    b.onclick = () => readPassage(data.reading.passages[+b.dataset.reviewP], true);
  });
}

function showAnchorCharts() {
  const defaultCharts = [
    { name: "Ideas and Support",
      body: "<b>Main idea</b> = what a paragraph is mostly about. <b>Support</b> = the details, facts, or examples that prove it.<br><br>Ask: What is this paragraph telling me? Which sentences give proof?",
      ex: [
        "<b>Idea:</b> The deep ocean remains largely unexplored. <b>Support:</b> Scientists estimate that over 80% of the ocean floor has never been mapped, and new species are discovered on nearly every deep-sea expedition.",
        "<b>Idea:</b> Ancient Rome's road system was key to its power. <b>Support:</b> The Romans built over 50,000 miles of roads, allowing armies to march quickly and merchants to trade across the empire."
      ] },
    { name: "Text Structure",
      body: "How an author organizes ideas:<ul><li><b>Description</b> — for example, such as</li><li><b>Sequence</b> — first, next, then, finally</li><li><b>Compare/Contrast</b> — like, unlike, both</li><li><b>Cause/Effect</b> — because, so, since</li><li><b>Problem/Solution</b> — problem, solved, fixed</li></ul>",
      ex: [
        "<b>Compare/Contrast:</b> Both alligators and crocodiles are large reptiles, but they differ in important ways. Unlike crocodiles, which have V-shaped snouts, alligators have wide, U-shaped ones. Crocodiles also tolerate salt water, while alligators prefer freshwater.",
        "<b>Problem/Solution:</b> By the 1960s, bald eagles were nearly extinct because the pesticide DDT was weakening their eggshells. To solve this, the government banned DDT in 1972 and launched breeding programs. As a result, the bald eagle population recovered and was removed from the endangered list in 2007."
      ] },
    { name: "Figurative Language",
      body: "<ul><li><b>Simile</b>: compares with <i>like</i>/<i>as</i> — <i>her smile was like sunshine</i></li><li><b>Metaphor</b>: says one thing IS another — <i>the classroom was a zoo</i></li><li><b>Personification</b>: gives human traits to things — <i>the wind whispered</i></li><li><b>Hyperbole</b>: huge exaggeration — <i>I've told you a million times</i></li><li><b>Idiom</b>: hidden meaning — <i>raining cats and dogs</i></li></ul>",
      ex: [
        "<b>Metaphor:</b> \"The detective's mind was a steel trap — once a clue entered, it never escaped.\" The author compares the mind to a steel trap to show how sharp and focused the detective is.",
        "<b>Personification:</b> \"The volcano slept for centuries, then awoke with a furious roar that shook the countryside.\" The volcano is given human actions — sleeping and waking — to dramatize how suddenly it erupted."
      ] },
    { name: "Central Idea",
      body: "The most important point of the <b>whole text</b>. Bigger than the topic.<br><br><b>Topic</b> = one or two words. <b>Central idea</b> = a full sentence. Look at the title, first paragraph, last paragraph, and ideas that repeat.",
      ex: [
        "<b>Topic:</b> the water cycle. <b>Central idea:</b> Earth constantly recycles its water through evaporation, condensation, and precipitation, which means the water you drink today may have once been part of a glacier thousands of years ago.",
        "<b>Topic:</b> the Great Wall of China. <b>Central idea:</b> The Great Wall was built over many centuries by multiple dynasties, not as a single project but as a series of walls meant to protect China's northern borders from invasion."
      ] },
    { name: "Text and Graphic Features",
      body: "Special parts that help readers: <b>headings, bold words, captions, maps, diagrams, charts, photos, sidebars</b>. Ask: what does this feature show me that the words alone don't?",
      ex: [
        "An article about climate change includes a <b>line graph</b> showing global temperatures rising from 1900 to today. The graph makes the trend instantly clear in a way that paragraphs of data alone cannot.",
        "A history textbook has a <b>sidebar</b> with a primary source — a letter written by a Civil War soldier. This feature lets readers hear a real person's voice from that era, adding depth beyond the main text."
      ] },
    { name: "Summary",
      body: "A short retelling in your own words. Rules:<ol><li>Short</li><li>Your own words</li><li>Most important ideas only</li><li>No opinions</li><li>In order</li></ol>For stories try: <i>Somebody / Wanted / But / So / Then</i>.",
      ex: [
        "<b>Story:</b> Somebody: a young inventor named Elara. Wanted: to win the school science fair with a solar-powered water filter. But: her prototype broke the night before. So: she stayed up redesigning it with simpler parts. Then: she didn't win first place, but a local engineer offered to help her build a full-scale version.",
        "<b>Nonfiction:</b> The International Space Station orbits Earth at about 17,500 mph and has been continuously occupied since 2000. Astronauts from many countries live aboard for months, conducting experiments in microgravity that cannot be done on Earth."
      ] },
    { name: "Theme",
      body: "The <b>lesson or message</b> of a story. Look at: what the character learns, how the character changes. A theme is a full sentence — not just \"friendship\" but <i>\"True friends help each other even when it's hard.\"</i>",
      ex: [
        "A student copies her friend's homework to save time, then both receive zeros when the teacher notices. She realizes the shortcut cost her more than the effort would have. <b>Theme:</b> Dishonesty may seem easier in the moment, but it leads to consequences that honest effort would have avoided.",
        "A boy refuses to include a new classmate in his group project. Later, when he's the new kid at a different school, no one picks him either. <b>Theme:</b> Treat others the way you would want to be treated, because you never know when you'll be in their shoes."
      ] },
  ];
  const charts = data.reading.anchorCharts || defaultCharts;
  app.innerHTML = `
    <div class="panel">
      <h2>📋 Anchor Charts</h2>
      ${charts.map(c => `<details><summary>${c.name}</summary><div class="anchor-chart-content">${c.image ? `<img class="anchor-chart-image" src="${c.image}" alt="${c.imageAlt || c.name}">` : ""}<div>${c.body}<div class="anchor-chart-examples"><b>Examples:</b><ol>${(c.ex || []).map(x => `<li>${x}</li>`).join("")}</ol></div></div></div></details>`).join("")}
      <br><button onclick="readingTopic()">← Back</button>
      <button class="ghost" onclick="renderHome()">🏠 Home</button>
    </div>`;
}

function readPassage(passage, reviewOnly = false) {
  const topicId = `reading:${passage.id || passage.title}`;
  const reviewIds = new Set(missedItems(topicId).map(m => m.id));
  const questions = reviewOnly ? passage.questions.filter(q => reviewIds.has(q.q)) : passage.questions;
  if (!questions.length) return readingTopic();
  window.__currentPassage = passage;
  window.__currentPassageReviewOnly = reviewOnly;
  // Pre-shuffle choice order per question so answer letters aren't always in the same spot.
  const qOrders = questions.map(q => q.choices ? shuffle([...q.choices.keys()]) : []);

  app.innerHTML = `
    <div class="panel">
      <h2>${passage.title}</h2>
      <div>${passage.skills.map(s => `<span class="tag">${data.reading.skills[s] || s}</span>`).join("")}</div>
      ${passage.image ? `<img class="passage-image" src="${passage.image}" alt="${passage.imageAlt || passage.title}">` : ""}
      <div class="passage">${passage.body}</div>
      ${voicePicker()}
      <div style="margin:8px 0;display:flex;gap:8px;flex-wrap:wrap">
        <button id="play-passage">🔊 Listen to Passage</button>
        <button id="stop-passage" class="ghost">⏹ Stop</button>
      </div>
      <h3>Questions</h3>
      <p style="color:var(--muted)">Read the passage above (you can scroll back any time), pick one answer for each question, then click <b>Submit all answers</b> at the bottom.</p>
      ${reviewOnly ? `<p class="review-note">Reviewing missed questions only.</p>` : ""}
      ${questions.map((q, qi) => `
        <div class="qa-block" data-qi="${qi}" style="margin:18px 0;padding:14px;border:2px solid var(--border);border-radius:14px">
          <div class="question"><b>${qi+1}.</b> ${q.q} <span class="tag">${data.reading.skills[q.skill] || q.skill}</span></div>
          ${q.choices ? `<div class="choices">
            ${qOrders[qi].map(idx => `
              <label style="display:block;background:white;border:2px solid var(--border);padding:12px 16px;border-radius:12px;margin:6px 0;cursor:pointer">
                <input type="radio" name="q${qi}" value="${idx}" style="margin-right:8px"> ${q.choices[idx]}
              </label>`).join("")}
          </div>` : `<textarea name="q${qi}" rows="3" style="width:100%;box-sizing:border-box;font:inherit;border:2px solid var(--border);border-radius:12px;padding:12px;margin-top:8px" placeholder="Write your answer here."></textarea>
          <p style="color:var(--muted);font-size:0.9rem">This short answer will show a sample answer after you submit.</p>`}
          <div class="feedback" id="fb${qi}"></div>
        </div>
      `).join("")}
      <button id="submit-all">✅ Submit all answers</button>
      <button class="ghost" onclick="readingTopic()">← Back</button>
    </div>`;

  bindVoicePicker();
  $("play-passage").onclick = () => {
    const plain = passage.body.replace(/\[.*?\]/g, "");
    speak(plain);
  };
  $("stop-passage").onclick = () => speechSynthesis.cancel();

  $("submit-all").onclick = () => {
    let correct = 0;
    const missed = [];
    let unanswered = 0;
    let shortAnswers = 0;
    let blankShortAnswers = 0;
    questions.forEach((q, qi) => {
      const qId = q.q;
      const fb = $(`fb${qi}`);
      const block = document.querySelector(`.qa-block[data-qi="${qi}"]`);
      if (!q.choices) {
        shortAnswers++;
        const response = document.querySelector(`textarea[name="q${qi}"]`);
        if (!response.value.trim()) blankShortAnswers++;
        response.disabled = true;
        fb.innerHTML = `Sample answer: <b>${q.sampleAnswer || "Answers may vary. Use details from the passage."}</b>`;
        fb.className = "feedback good";
        return;
      }

      const picked = document.querySelector(`input[name="q${qi}"]:checked`);
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
        clearMissed(topicId, qId);
        fb.textContent = "✅ Correct!";
        fb.className = "feedback good";
      } else {
        fb.innerHTML = `❌ Correct: <b>${q.choices[q.answer]}</b>`;
        fb.className = "feedback bad";
        recordMissed(topicId, { id: qId, label: q.q, title: passage.title });
        missed.push({ q: q.q, answer: q.choices[q.answer], picked: q.choices[+picked.value] });
      }
      if (!picked) recordMissed(topicId, { id: qId, label: q.q, title: passage.title });
    });

    const total = questions.filter(q => q.choices).length;
    const pct = total ? Math.round((correct/total)*100) : 0;
    writeProgress(topicId, pct);
    const reward = recordGameCompletion(topicId, pct, correct, total || questions.length);

    // Show summary at top, scroll to it
    const summary = document.createElement("div");
    summary.className = "panel";
    summary.style.marginTop = "0";
    summary.innerHTML = `
      <h2>🎉 Score: ${correct} / ${total} (${pct}%)</h2>
      ${unanswered ? `<p style="color:var(--bad)">${unanswered} question(s) left blank.</p>` : ""}
      ${shortAnswers ? `<p>${shortAnswers} short answer question(s) showed sample answers${blankShortAnswers ? `; ${blankShortAnswers} were blank` : ""}.</p>` : ""}
      ${gameRewardHTML(reward)}
      <button onclick="readPassage(window.__currentPassage, window.__currentPassageReviewOnly)">🔁 Try again</button>
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
  if (!data.listening.dialogues.length) return emptyTopic("Listening Comprehension");
  app.innerHTML = `
    <div class="panel">
      <h2>👂 Listening Comprehension</h2>
      <p>Pick a dialogue. You'll hear a short conversation, then answer the questions. You can replay it any time.</p>
      ${data.listening.dialogues.map((d,i) => {
        const topicId = `listen:${d.id || d.title}`;
        const miss = missedCount(topicId);
        const prog = readProgress(topicId);
        return `<button data-d="${i}">${d.title}${prog ? ` · Best ${prog.best}%` : ""}</button>${miss ? `<button class="ghost" data-review-d="${i}">Review missed (${miss})</button>` : ""}`;
      }).join("")}
      <br><button class="ghost" onclick="renderHome()">🏠 Home</button>
    </div>`;
  document.querySelectorAll("button[data-d]").forEach(b => {
    b.onclick = () => playDialogue(data.listening.dialogues[+b.dataset.d]);
  });
  document.querySelectorAll("button[data-review-d]").forEach(b => {
    b.onclick = () => playDialogue(data.listening.dialogues[+b.dataset.reviewD], true);
  });
}

function pickTwoVoices() {
  // Try to find a female + male voice for the two speakers; fall back to selectedVoice for both.
  const female = voices.find(v => /(ava|samantha|allison|zoe|joelle|nicky|noelle|aria|jenny|female|woman)/i.test(v.name));
  const male   = voices.find(v => /(evan|tom|alex|fred|aaron|nathan|male|man)/i.test(v.name));
  return [female || selectedVoice, male || selectedVoice];
}

function playDialogue(dialogue, reviewOnly = false) {
  const topicId = `listen:${dialogue.id || dialogue.title}`;
  const reviewIds = new Set(missedItems(topicId).map(m => m.id));
  const questions = reviewOnly ? dialogue.questions.filter(q => reviewIds.has(q.q)) : dialogue.questions;
  if (!questions.length) return listeningTopic();
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
      ${reviewOnly ? `<p class="review-note">Reviewing missed questions only.</p>` : ""}
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
    runQuiz(topicId, dialogue.title, questions, (q) => ({
      prompt: q.q,
      choices: q.choices,
      answer: q.answer,
      extra: `<button onclick="window.__replayDialogue()" class="ghost" style="margin-bottom:8px">🔊 Replay dialogue</button>`
    }), { itemId: q => q.q, itemLabel: q => q.q, afterFinish: listeningTopic });
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
    localStorage.removeItem(MISSED_KEY);
    localStorage.removeItem(GAME_KEY);
    for (const k in progress) delete progress[k];
    for (const k in missed) delete missed[k];
    for (const k in game) delete game[k];
    renderHome();
  }
};

loadAll().then(renderHome);
