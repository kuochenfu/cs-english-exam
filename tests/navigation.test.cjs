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
  let timerId = 0, choices = [], cancelCount = 0;
  function element(id) {
    if (elements.has(id)) return elements.get(id);
    const e = { id, dataset: {}, style: {}, disabled: false, value: '', textContent: '', classList: { add() {}, remove() {} }, setAttribute(k, v) { this[k] = v; }, focus() {}, querySelector() { return element('form-submit'); } };
    let html = '';
    Object.defineProperty(e, 'innerHTML', { get: () => html, set(value) {
      html = value;
      if (id === 'app') choices = [...value.matchAll(/<button data-idx="(\d+)"/g)].map(m => ({ dataset: { idx: m[1] }, disabled: false, classList: { add() {} } }));
    }});
    elements.set(id, e); return e;
  }
  const window = { APP_VERSION: 'test', scrollTo() {}, addEventListener() {} };
  const history = { state: null, pushState(state) { this.state = state; historyEntries.push(state); }, replaceState(state) { this.state = state; historyEntries[historyEntries.length ? historyEntries.length - 1 : 0] = state; } };
  const speechSynthesis = { cancel() { cancelCount++; }, speak() {}, getVoices() { return []; } };
  const context = vm.createContext({ window, history, speechSynthesis, SpeechSynthesisUtterance: function() {}, document: { getElementById: element, querySelectorAll: s => s === '.choices button' ? choices : [], title: '' }, localStorage: { getItem: k => saved.get(k) || null, setItem: (k,v) => saved.set(k,v), removeItem: k => saved.delete(k) }, setTimeout(fn) { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id), confirm: () => false, fetch: async () => { throw Error('Unexpected fetch'); }, console });
  // Only omit startup networking. All renderers and click handlers are unchanged.
  vm.runInContext(source.replace(/loadAll\(\)\.then\(renderHome\);\s*$/, '').replace(/loadAll\(\);\s*$/, ''), context);
  const run = code => vm.runInContext(code, context);
  context.fixture = fixture;
  run(`currentExam = { id: '2026-10-quiz1', title: 'Grade 5 Quiz 1', subtitle: 'Module 1', grade: 5 }; Object.assign(data, fixture); examIndex.exams = [currentExam, {id:'other', title:'Other test', subtitle:'Module 2', available:true}]; currentExam.available = true;`);
  return { run, context, element, timers, saved, historyEntries, choices: () => choices, cancelCount: () => cancelCount, flush() { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); } };
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
