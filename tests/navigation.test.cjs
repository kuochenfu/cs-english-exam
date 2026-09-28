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

// Quiz 1 recall regression coverage: exercise real handlers, not a copy of the engine.
function startRecall(h, options = {}) {
  h.context.recallOptions = {
    items: [{id:'thief',label:'thief',answer:'thief',sentence:'The thief ran away.',hint:'Use ie.',explanation:'Put i before e.'}],
    mode:'practice',kind:'spell',missKey:'spell:q1-recall',topicId:'spell:q1-practice:week0',title:'Spelling',...options
  };
  h.run(`quiz1Recall({...recallOptions, parents:[{title:'Spelling',render:spellingTopic}]})`);
}
function answerRecall(h, value) {
  h.element('q1-answer').value=value;
  h.element('q1-form').onsubmit({preventDefault(){}});
}

test('all Quiz 1 words have authored recall material and exact cloze answers', () => {
  assert.equal(fixture.vocabulary.words.length,30);
  for (const w of fixture.vocabulary.words) {
    assert.equal(w.contexts.length,2,w.word);
    for (const q of w.contexts) {
      assert.equal((q.prompt.match(/____/g)||[]).length,1,w.word);
      assert.equal(q.choices.filter(c=>c===q.answer).length,1,w.word);
      assert.equal(new Set(q.choices).size,4,w.word);
      assert.ok(q.explanation && q.answer);
    }
  }
  const lists=fixture.spelling.lists.filter(l=>l.words);
  assert.equal(lists.flatMap(l=>l.words).length,36);
  assert.deepEqual(lists.map(l=>l.week),[1,2,3]);
  for(const l of lists) for(const w of l.words) assert.ok(w.pattern,w.word);
});

test('cloze and word forms use the actual past-tense answer instead of a stem', () => {
  const h=harness();
  h.context.wordFixture={...fixture.vocabulary.words.find(w=>w.word==='photograph'), contexts:[{prompt:'Yesterday, she ____ the birds.',answer:'photographed',choices:['photographed','irrigated','specialized','conceived'],explanation:'Yesterday needs past tense.'}]};
  h.run('data.vocabulary={words:[wordFixture]}; vocabularyTopic()');
  h.element('m3').onclick();
  assert.match(h.element('app').innerHTML,/photographed/);
  // Index 0 is the exact curated answer regardless of randomized display order.
  h.choices().find(b=>b.dataset.idx==='0').onclick();
  assert.match(h.element('fb').innerHTML,/Yesterday needs past tense/);
  assert.equal(h.timers.size,0);
  h.run('vocabularyTopic()');h.element('m6').onclick();
  assert.match(h.element('app').innerHTML,/photographed/);
});

test('week filtering covers vocabulary, spelling lists, and mixed-week phonics questions', () => {
  const h=harness();
  for(const [week,count] of [[1,9],[2,11],[3,10]]) {
    assert.equal(h.run(`quiz1Words(${week}).length`),count);
    assert.equal(h.run(`quiz1Lists(${week}).flatMap(l=>l.words||[]).length`),12);
    assert.equal(h.run(`quiz1Lists(${week}).filter(l=>l.weeks).flatMap(l=>l.items).every(q=>q.week===${week})`),true);
  }
  h.run('vocabularyTopic()');h.element('q1-week').value='2';h.element('q1-week').onchange();
  h.element('q1-learn').onclick();
  assert.match(h.element('app').innerHTML,/auditorium/);
  assert.doesNotMatch(h.element('app').innerHTML,/>chug</);
  h.element('back-btn').onclick();
  assert.match(h.element('app').innerHTML,/value="2" selected/);
});

test('letter alignment distinguishes omitted, extra, replaced and unsafe input', () => {
  const h=harness();
  assert.match(h.run("quiz1LetterFeedback('thif','thief')"),/\+e/);
  assert.match(h.run("quiz1LetterFeedback('thieff','thief')"),/<del>f<\/del>/);
  assert.match(h.run("quiz1LetterFeedback('thxef','thief')"),/x → i/);
  assert.doesNotMatch(h.run("quiz1LetterFeedback('<img>','thief')"),/<img>/);
});

test('incorrect spelling waits for correction and a delayed recheck; first score never inflates', () => {
  const h=harness();h.run('shuffle = a => a');
  const items=['thief','brain','sign','dough'].map(w=>({id:w,label:w,answer:w,sentence:`Say ${w}.`,hint:'Hint',explanation:'Pattern'}));
  startRecall(h,{items});
  answerRecall(h,'theif');
  assert.equal(h.timers.size,0);
  assert.match(h.element('q1-feedback').innerHTML,/thief/);
  h.element('q1-hide').onclick();
  assert.doesNotMatch(h.element('q1-feedback').textContent,/thief/);
  answerRecall(h,'thief');
  assert.equal(h.run("missedCount('spell:q1-recall')"),1,'copying a correction does not clear a mistake');
  h.element('q1-next').onclick();
  for(const w of ['brain','sign','dough']) {answerRecall(h,w);h.element('q1-next').onclick();}
  assert.match(h.element('app').innerHTML,/Recheck/);
  answerRecall(h,'thief');h.element('q1-next').onclick();
  assert.match(h.element('app').innerHTML,/Independent first answers: 3 \/ 4 \(75%\)/);
  assert.match(h.element('app').innerHTML,/Corrections completed: 1/);
  assert.match(h.element('app').innerHTML,/Independent rechecks: 1 \/ 1/);
  assert.equal(h.run("readProgress('spell:q1-practice:week0').best"),75);
  assert.equal(h.run("missedCount('spell:q1-recall')"),0);
});

test('hinted correct answers and their rechecks cannot award a perfect spelling badge', () => {
  const h=harness();startRecall(h);
  h.element('q1-hint').onclick();answerRecall(h,'thief');h.element('q1-next').onclick();
  answerRecall(h,'thief');h.element('q1-next').onclick();
  assert.match(h.element('app').innerHTML,/Independent first answers: 0 \/ 1 \(0%\)/);
  assert.match(h.element('app').innerHTML,/Words with hints: 1/);
  assert.equal(h.run('!!ensureExamGame().badges.spelling_champ'),false);
});

test('mini tests have no hints, no immediate answer reveal, and show results only at the end', () => {
  const h=harness();startRecall(h,{mode:'test',topicId:'spell:q1-test:week0'});
  assert.doesNotMatch(h.element('app').innerHTML,/id="q1-hint"/);
  answerRecall(h,'wrong');
  assert.equal(h.element('q1-feedback').textContent,'Answer saved. Results appear at the end.');
  assert.doesNotMatch(h.element('q1-actions').innerHTML,/Hide answer/);
  h.element('q1-next').onclick();
  assert.match(h.element('app').innerHTML,/wrong → thief/);
  assert.equal(h.run("missedCount('spell:q1-recall')"),1);
});

test('empty and repeated submissions do not score; repeated Next cannot duplicate rewards', () => {
  const h=harness();startRecall(h,{mode:'test'});
  answerRecall(h,'   ');assert.equal(h.element('q1-answer').disabled,false);
  answerRecall(h,'thief');answerRecall(h,'thief');
  const next=h.element('q1-next').onclick;next();
  const stars=h.run('ensureExamGame().stars');next();
  assert.equal(h.run('ensureExamGame().stars'),stars);
  assert.match(h.element('app').innerHTML,/Independent first answers: 1 \/ 1/);
});

test('new practice preserves legacy scores, earned badges and another exam; review is reachable', () => {
  const h=harness();
  h.run(`progress['2026-10-quiz1:spell:m1_w1_short_vowels:type']={best:90}; progress['other:vocab:word']={best:80}; ensureExamGame().badges.first_quest='2026-09-20';`);
  startRecall(h,{mode:'test'});answerRecall(h,'wrong');h.element('q1-next').onclick();
  assert.equal(h.run("progress['2026-10-quiz1:spell:m1_w1_short_vowels:type'].best"),90);
  assert.equal(h.run("progress['other:vocab:word'].best"),80);
  assert.equal(h.run('ensureExamGame().badges.first_quest'),'2026-09-20');
  h.run('spellingTopic({week:2})');assert.match(h.element('app').innerHTML,/Review missed \(1\)/);
  h.element('q1-review').onclick();assert.match(h.element('app').innerHTML,/Spelling · Practice/);
  h.run("currentExam.id='2026-04-midterm'; vocabularyTopic()");assert.doesNotMatch(h.element('app').innerHTML,/q1-week|q1-practice/);
});

test('leaving new recall stops speech and has no timer that can reopen the question', () => {
  const h=harness();h.context.window.speechSynthesis=h.context.speechSynthesis;
  startRecall(h);answerRecall(h,'wrong');
  const before=h.cancelCount();h.run('renderHome()');const home=h.element('app').innerHTML;
  h.flush();assert.equal(h.element('app').innerHTML,home);assert.ok(h.cancelCount()>before);
});

test('week-specific MCQ scores do not overwrite all-week scores or orphan missed items', () => {
  const h=harness();
  h.run(`progress['2026-10-quiz1:vocab:blank']={best:60}; data.vocabulary={words:[fixture.vocabulary.words[0]]}; vocabularyTopic({week:1});`);
  h.element('m3').onclick();
  h.choices().find(b=>b.dataset.idx==='0').onclick();h.element('quiz-next').onclick();
  assert.equal(h.run("readProgress('vocab:blank').best"),60);
  assert.equal(h.run("readProgress('vocab:blank:week1').best"),100);
  h.run("recordMissed('vocab:blank',{id:'chug',label:'chug'}); vocabularyTopic()");
  assert.match(h.element('app').innerHTML,/Review Fill in the Blank \(1\)/);
  h.element('r3').onclick();
  assert.match(h.element('app').innerHTML,/Fill in the Blank/);
});

test('learning cards award nothing and scope reset removes recall data only for this exam', () => {
  const h=harness();h.run(`quiz1Learn('vocab',1,homeTrail())`);
  assert.equal(h.run('ensureExamGame().stars'),0);
  h.run(`progress['2026-10-quiz1:vocab:q1-practice:week1']={best:50}; missed['2026-10-quiz1:vocab:q1-context']=[{id:'chug'}]; progress['other:vocab:q1-practice:week1']={best:80}; progressScreen();`);
  h.context.confirm=()=>true;h.element('reset-btn').onclick();
  assert.equal(h.run("progress['2026-10-quiz1:vocab:q1-practice:week1']"),undefined);
  assert.equal(h.run("missed['2026-10-quiz1:vocab:q1-context']"),undefined);
  assert.equal(h.run("progress['other:vocab:q1-practice:week1'].best"),80);
});
