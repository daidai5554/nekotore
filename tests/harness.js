// index.html のスクリプトを Node で読み込むための最小スタブ
const fs = require('fs');
const path = require('path');

function loadApp() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const js = html.split('<script>')[1].split('</script>')[0];
  const el = () => ({ innerHTML: '', hidden: true, textContent: '', value: '', style: {}, classList: { add() { }, remove() { } }, querySelector: () => null, querySelectorAll: () => [], setAttribute() { }, select() { }, appendChild() { } });
  const els = {};
  const g = {
    document: { addEventListener() { }, querySelector: s => els[s] || (els[s] = el()), visibilityState: 'visible' },
    window: { scrollTo() { } },
    localStorage: { _: {}, getItem(k) { return this._[k] || null; }, setItem(k, v) { this._[k] = v; } },
    navigator: {}, location: { protocol: 'file:' },
    setInterval: () => 0, setTimeout: () => 0, clearTimeout() { }, requestAnimationFrame: () => 0,
    matchMedia: () => ({ matches: false }), performance: { now: () => 0 }
  };
  const names = Object.keys(g);
  // 必要な内部シンボルを外へ出す
  const expose = `return { get S() { return S; }, set S(v) { S = v; }, EX, EXM, MOT, MOTMAP, BASEP, SEG, solve, lerpP, buildProgram, candidates, canUse, makeItem, estSec, dayEst, allowImpact, bmi, fresh, GROUPS, TEMPLATES, SPLITS, LIMITS, EQUIP, GOALS, LEVELS,
    startSession, markDone, finishSession, player, calcExp, kcalOf, render, A, stopTimer, sessItem, nextDayIdx,
    get view() { return view; }, set view(v) { view = v; }, get draft() { return draft; }, set draft(v) { draft = v; }, get step() { return step; }, set step(v) { step = v; },
    ...(typeof sessionKcal === 'function' ? { sessionKcal } : {}), ...(typeof repSec === 'function' ? { repSec } : {}) };`;
  const fn = new Function(...names, js + '\n' + expose);
  return fn(...names.map(n => g[n]));
}
module.exports = { loadApp };
