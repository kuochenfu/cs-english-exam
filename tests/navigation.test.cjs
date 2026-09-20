// No dependencies or build step: node --test tests/navigation.test.cjs
// Runs the real app's event handlers with a small DOM/timer boundary.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = process.env.APP_SOURCE ? fs.readFileSync(process.env.APP_SOURCE, 'utf8') : fs.readFileSync('app.js', 'utf8');
const fixture = Object.fromEntries(['vocabulary', 'spelling', 'grammar', 'reading', 'listening'].map(k => [k, JSON.parse(fs.readFileSync(`data/exams/2026-10-quiz1/${k}.json`))]));

function harness() {
  const elements = new Map(), timers = new Map(), saved = new Map(), historyEntries = [];
  let timerId = 0, choices = [], renderedButtons = [], cancelCount = 0;
  function element(id) {
    if (elements.has(id)) return elements.get(id);
    const e = { id, dataset: {}, style: {}, disabled: false, value: '', textContent: '', classList: { add() {}, remove() {} }, setAttribute(k, v) { this[k] = v; }, focus() {}, scrollIntoView() {}, querySelector() { return element('form-submit'); } };
    let html = '';
    Object.defineProperty(e, 'innerHTML', { get: () => html, set(value) {
      html = value;
      if (id === 'app') renderedButtons = [...value.matchAll(/<button\b([^>]*)>/g)].map(m => {
        const attrs = m[1]; const dataset = {};
        for (const a of attrs.matchAll(/data-([a-z-]+)="([^"]*)"/g)) dataset[a[1].replace(/-([a-z])/g, (_,c)=>c.toUpperCase())] = a[2];
        return {dataset, disabled:false, attrs};
      });
      if (id === 'app') choices = [...value.matchAll(/<button data-idx="(\d+)"/g)].map(m => ({ dataset: { idx: m[1] }, disabled: false, classList: { add() {} } }));
    }});
    elements.set(id, e); return e;
  }
  const window = { APP_VERSION: 'test', scrollTo() {}, addEventListener() {} };
  const history = { state: null, pushState(state) { this.state = state; historyEntries.push(state); }, replaceState(state) { this.state = state; historyEntries[historyEntries.length ? historyEntries.length - 1 : 0] = state; } };
  const speechSynthesis = { cancel() { cancelCount++; }, speak() {}, getVoices() { return []; } };
  const context = vm.createContext({ window, history, speechSynthesis, SpeechSynthesisUtterance: function() {}, document: { getElementById: element, querySelectorAll: s => {
    if (s === '.choices button') return choices;
    const attr = s.match(/\[data-([a-z-]+)\]/)?.[1]?.replace(/-([a-z])/g, (_,c)=>c.toUpperCase());
    if (attr) return renderedButtons.filter(b => attr in b.dataset);
    if (s === '.card') return renderedButtons.filter(b => /class="[^"]*\bcard\b/.test(b.attrs));
    return [];
  }, title: '' }, localStorage: { getItem: k => saved.get(k) || null, setItem: (k,v) => saved.set(k,v), removeItem: k => saved.delete(k) }, setTimeout(fn) { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id), confirm: () => false, fetch: async () => { throw Error('Unexpected fetch'); }, console });
  // Only omit startup networking. All renderers and click handlers are unchanged.
  vm.runInContext(source.replace(/loadAll\(\)\.then\(renderHome\);\s*$/, '').replace(/loadAll\(\);\s*$/, ''), context);
  const run = code => vm.runInContext(code, context);
  context.fixture = fixture;
  run(`currentExam = { id: '2026-10-quiz1', title: 'Grade 5 Quiz 1', subtitle: 'Module 1', grade: 5 }; Object.assign(data, fixture); examIndex.exams = [currentExam, {id:'other', title:'Other test', subtitle:'Module 2', available:true}]; currentExam.available = true;`);
  return { run, context, element, timers, saved, historyEntries, choices: () => choices, buttons: () => renderedButtons, cancelCount: () => cancelCount, flush() { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); } };
}

test('leaving a just-answered quiz cannot render the next question over Home', () => {
  const h = harness();
  h.run(`runQuiz('vocab:word', 'Practice', [{word:'one'},{word:'two'}], w => ({prompt:w.word, choices:['yes','no'], answer:0}));`);
  h.choices().find(b => b.dataset.idx === '0').onclick();
  h.run('renderHome()');
  const home = h.element('app').innerHTML;
  h.flush();
  assert.equal(h.element('app').innerHTML, home);
});

test('leaving dictation cancels auto-advance; a repeated submit is ignored', () => {
  const h = harness();
  h.run(`dictation({id:'demo', title:'Demo', words:[{word:'cat',sentence:'A cat.'},{word:'dog',sentence:'A dog.'}]});`);
  h.element('ans').value = 'cat';
  h.element('f').onsubmit({ preventDefault() {} });
  h.element('f').onsubmit({ preventDefault() {} });
  assert.equal(h.timers.size, 1);
  h.run('renderExamPicker()');
  const picker = h.element('app').innerHTML;
  h.flush();
  assert.equal(h.element('app').innerHTML, picker);
});

test('all 30 word pictures render in both definition modes; all 9 passages have pictures', () => {
  const h = harness();
  const all = fixture.vocabulary.words;
  for (const word of all) {
    h.context.wordFixture = word;
    h.run('data.vocabulary = {words:[wordFixture]}; vocabularyTopic()');
    h.element('m1').onclick();
    assert.ok(h.element('app').innerHTML.includes(word.image), word.word + ' definition');
    h.run('vocabularyTopic()'); h.element('m2').onclick();
    assert.ok(h.element('app').innerHTML.includes(word.image), word.word + ' word');
    assert.ok(fs.existsSync(word.image));
  }
  h.run('readingTopic()');
  for (const passage of fixture.reading.passages) {
    assert.ok(h.element('app').innerHTML.includes(passage.image));
    assert.ok(fs.existsSync(passage.image));
  }
});

test('Back consistently follows the parent, and browser history replay does not push', () => {
  const h = harness();
  h.run('renderHome(); vocabularyTopic()');
  h.element('m1').onclick();
  h.element('back-btn').onclick();
  assert.match(h.element('app').innerHTML, /Pick a practice mode/);
  h.element('back-btn').onclick();
  assert.match(h.element('app').innerHTML, /Quest Map/);
  const length = h.historyEntries.length;
  h.context.prior = h.historyEntries[1];
  h.run('restoreScreen({state:prior})');
  assert.match(h.element('app').innerHTML, /Pick a practice mode/);
  assert.equal(h.historyEntries.length, length);
  h.run('spellingListMenu(fixture.spelling.lists.find(l => !l.quiz && !l.sortGame))');
  h.element('spell-type').onclick();
  h.element('back-btn').onclick();
  assert.match(h.element('app').innerHTML, /Listen &amp; Choose|Listen & Choose/);
});

test('navigation stops speech and prevents delayed dialogue autoplay', () => {
  const h = harness(); h.context.window.speechSynthesis = h.context.speechSynthesis;
  h.run('playDialogue(fixture.listening.dialogues[0])');
  const before = h.cancelCount();
  h.run('renderHome()');
  assert.equal(h.timers.size, 0);
  assert.ok(h.cancelCount() > before);
});

test('data requests revalidate browser cache', async () => {
  const h = harness(); let options;
  h.context.fetch = async (url, opts) => { options = opts; return {ok:true, json:async () => ({})}; };
  await h.run("fetchJSON('data/exams.json')");
  assert.equal(options.cache, 'no-cache');
});

test('switching tests commits only the latest full dataset', async () => {
  const h = harness(); const pending = [];
  h.context.fetch = (url) => new Promise(resolve => pending.push({url,resolve}));
  const first = h.run("selectExam('2026-10-quiz1')");
  const second = h.run("selectExam('other')");
  pending.filter(x=>x.url.includes('/other/')).forEach(x=>x.resolve({ok:true,json:async()=>fixture[x.url.split('/').pop().split('.')[0]]}));
  await second;
  pending.filter(x=>!x.url.includes('/other/')).forEach(x=>x.resolve({ok:true,json:async()=>({stale:true})}));
  await first;
  assert.equal(h.run('currentExam.id'), 'other');
  assert.equal(h.run('data.reading.stale'), undefined);
});

test('leaving test loading does not jump back when the request finishes', async () => {
  const h = harness(), pending=[];
  h.context.fetch = url => new Promise(resolve=>pending.push({url,resolve}));
  const load = h.run("selectExam('other')");
  h.run('renderExamPicker()');
  pending.forEach(x=>x.resolve({ok:true,json:async()=>fixture[x.url.split('/').pop().split('.')[0]]}));
  await load;
  assert.match(h.element('app').innerHTML,/Choose a test/);
  assert.equal(h.run('currentExam.id'),'2026-10-quiz1');
});

test('reset is scoped to this test and cancellation changes nothing', () => {
  const h=harness();
  h.run(`progress['2026-10-quiz1:vocab:word']={best:90}; progress['other:vocab:word']={best:80}; missed['2026-10-quiz1:vocab:word']=[{id:'one'}]; game.other={stars:12}; progressScreen();`);
  h.element('reset-btn').onclick();
  assert.equal(h.run("progress['2026-10-quiz1:vocab:word'].best"),90);
  h.context.confirm=()=>true; h.element('reset-btn').onclick();
  assert.equal(h.run("progress['2026-10-quiz1:vocab:word']"),undefined);
  assert.equal(h.run("missed['2026-10-quiz1:vocab:word']"),undefined);
  assert.equal(h.run("progress['other:vocab:word'].best"),80);
  assert.equal(h.run('game.other.stars'),12);
});

test('every Grade 5 anchor chart has a local poster and full-size image link', () => {
  const h = harness();
  h.run('showAnchorCharts()');
  const html = h.element('app').innerHTML;
  const charts = fixture.reading.anchorCharts;
  assert.equal(charts.length, 11);
  for (const chart of charts) {
    assert.ok(chart.image && fs.existsSync(chart.image), chart.name);
    assert.match(fs.readFileSync(chart.image).subarray(1, 4).toString(), /PNG/);
    assert.ok(html.includes(`href="${chart.image}"`), chart.name + ' full-size link');
    assert.ok(html.includes(`src="${chart.image}"`), chart.name + ' poster');
  }
});

test('cat and fox badges render saved unlocks and award each badge only once', () => {
  const h = harness();
  h.run('renderHome()');
  let html = h.element('app').innerHTML;
  assert.equal((html.match(/class="badge locked"/g) || []).length, 7);
  const badges = h.run('BADGES');
  for (const badge of badges) {
    assert.ok(fs.existsSync(badge.image), badge.name);
    assert.ok(html.includes(badge.image));
  }
  const reward = h.run("recordGameCompletion('vocab:word', 100, 1, 1)");
  assert.equal(reward.badges.length, 1);
  assert.equal(reward.badges[0].id, 'first_quest');
  h.context.rewardFixture = reward;
  assert.match(h.run('gameRewardHTML(rewardFixture)'), /first_quest.jpg/);
  assert.match(h.run('gameRewardHTML(rewardFixture)'), /Just unlocked!/);
  assert.equal(h.run("recordGameCompletion('vocab:word', 100, 1, 1).badges.length"), 0);
  const savedBefore = h.saved.get('cs-english-exam-game');
  h.run('progressScreen()');
  html = h.element('app').innerHTML;
  assert.equal((html.match(/class="badge earned"/g) || []).length, 1);
  assert.match(html, /1 \/ 7 unlocked/);
  assert.equal(h.saved.get('cs-english-exam-game'), savedBefore);
});

test('reading/listening badges require different complete activities, not replayed or review-only rounds', () => {
  const h = harness();
  for (let i = 0; i < 3; i++) h.run("recordGameCompletion('reading:one', 100, 2, 2)");
  assert.equal(h.run('!!ensureExamGame().badges.reading_detective'), false);
  h.run("recordGameCompletion('reading:two', 100, 1, 1, {reviewOnly:true})");
  assert.equal(h.run('!!ensureExamGame().badges.reading_detective'), false);
  h.run("recordGameCompletion('reading:two', 100, 2, 2); recordGameCompletion('reading:three', 100, 2, 2)");
  assert.equal(h.run('!!ensureExamGame().badges.reading_detective'), true);
  h.run("recordGameCompletion('listen:one', 100, 2, 2); recordGameCompletion('listen:one', 100, 2, 2)");
  assert.equal(h.run('!!ensureExamGame().badges.listening_star'), false);
  h.run("recordGameCompletion('listen:two', 100, 2, 2)");
  assert.equal(h.run('!!ensureExamGame().badges.listening_star'), true);
});

test('a charts-only reading topic cannot create an impossible daily passage mission', () => {
  const h = harness(); h.run('data.reading = {passages:[], anchorCharts:[{name:"Guide"}]}');
  assert.equal(h.run('dailyMissions().some(m => m.topic === "reading")'), false);
});

test('empty activity completion gives no stars, missions, or badges', () => {
  const h = harness(); h.run("recordGameCompletion('spell:empty', NaN, 0, 0)");
  assert.equal(h.run('ensureExamGame().stars'), 0);
  assert.equal(h.run('dailyMissionCount().done'), 0);
});

test('clearing the last missed item then returning Home grants Boss Defeated without another round', () => {
  const h = harness();
  h.run("recordMissed('vocab:word', {id:'one',label:'one'}); clearMissed('vocab:word','one'); renderHome()");
  assert.equal(h.run('!!ensureExamGame().badges.boss_defeated'), true);
});

test('blank reading submission stays editable and cannot complete a mission or award stars', () => {
  const h = harness();
  h.run(`readPassage({id:'demo',title:'Demo',skills:[],body:'Read this.',questions:[{q:'Which?',skill:'evidence',choices:['Yes','No'],answer:0}]})`);
  h.context.document.querySelector = selector => selector.startsWith('.qa-block') ? {querySelectorAll:()=>[]} : null;
  h.context.document.createElement = () => ({style:{}, scrollIntoView(){}});
  h.element('app').insertBefore = () => {};
  h.element('submit-all').onclick();
  assert.equal(h.run('ensureExamGame().stars'), 0);
  assert.equal(h.element('submit-all').disabled, false);
});

test('Quest Map, daily mission, and Boss topic buttons lead to their actual screens and Back returns Home', () => {
  const h = harness();
  for (const topic of ['vocab','spell','grammar','reading','listen']) {
    h.run('renderHome()');
    h.buttons().find(b => b.dataset.topic === topic).onclick();
    assert.equal(h.run('currentScreen.parents.at(-1).title'), 'Home');
    h.element('back-btn').onclick();
    assert.equal(h.run('currentScreen.title'), 'Home');
  }
  h.run('renderHome()');
  const missions = h.run('dailyMissions().map(m => m.topic)');
  for (const topic of missions) {
    h.run('renderHome()');
    h.buttons().find(b => b.dataset.missionTopic === topic).onclick();
    assert.equal(h.run('currentScreen.parents.at(-1).title'), 'Home');
  }
  h.run("recordMissed('vocab:definition',{id:fixture.vocabulary.words[0].word,label:'word'}); bossReview()");
  h.buttons().find(b => b.dataset.bossTopic === 'vocab').onclick();
  h.element('r1').onclick();
  assert.equal(h.choices().length, 4);
  h.element('back-btn').onclick();
  assert.equal(h.run('currentScreen.title'), 'Vocabulary');
  h.element('back-btn').onclick();
  assert.equal(h.run('currentScreen.title'), 'Boss Review');
});

test('daily completion survives navigation, resets on a new date, and keeps earned badges', () => {
  const h = harness();
  h.run(`todayString = () => '2026-09-20';
    recordGameCompletion('reading:one', 0, 0, 1);
    recordGameCompletion('spell:one', 50, 1, 2);
    recordGameCompletion('grammar:one', 50, 1, 2); renderHome()`);
  assert.equal(h.run('dailyMissionCount().done'), 3);
  assert.equal(h.run('!!ensureExamGame().badges.daily_hero'), true);
  h.run("todayString = () => '2026-09-21'; renderHome()");
  assert.equal(h.run('dailyMissionCount().done'), 0);
  assert.equal(h.run('!!ensureExamGame().badges.daily_hero'), true);
});

test('grammar and spelling badges respect thresholds; review-only passages do not finish daily missions', () => {
  const h = harness();
  h.run("recordGameCompletion('grammar:test',89,89,100); recordGameCompletion('spell:test',99,99,100)");
  assert.equal(h.run('!!ensureExamGame().badges.grammar_wizard'), false);
  assert.equal(h.run('!!ensureExamGame().badges.spelling_champ'), false);
  h.run("recordGameCompletion('grammar:test',90,90,100); recordGameCompletion('spell:test',100,100,100)");
  assert.equal(h.run('!!ensureExamGame().badges.grammar_wizard'), true);
  assert.equal(h.run('!!ensureExamGame().badges.spelling_champ'), true);
  h.run("recordGameCompletion('reading:one',100,1,1,{reviewOnly:true})");
  assert.equal(h.run('!!ensureTodayGame().topics.reading'), false);
});

test('Boss badge needs previous mistakes and every remaining mistake cleared; saved badges stay exam scoped', () => {
  const h = harness();
  h.run('renderHome()');
  assert.equal(h.run('!!ensureExamGame().badges.boss_defeated'), false);
  h.run("recordMissed('vocab:word',{id:'a'}); recordMissed('grammar:main',{id:'b'}); clearMissed('vocab:word','a'); progressScreen()");
  assert.equal(h.run('!!ensureExamGame().badges.boss_defeated'), false);
  h.run("clearMissed('grammar:main','b'); progressScreen()");
  assert.equal(h.run('!!ensureExamGame().badges.boss_defeated'), true);
  h.run("currentExam = examIndex.exams[1]; renderHome()");
  assert.equal(h.run('Object.keys(ensureExamGame().badges).length'), 0);
  h.run("currentExam = examIndex.exams[0]; renderHome()");
  assert.equal(h.run('!!ensureExamGame().badges.boss_defeated'), true);
});
