// すべてのテストを順に実行する：node tests/run_all.js
const { execFileSync } = require('child_process');
const path = require('path');
const suites = ['motion', 'angles', 'breath', 'program', 'numbers', 'simulate', 'flow'];
let failed = 0;
for (const s of suites) {
  const f = path.join(__dirname, `${s}.test.js`);
  try { const out = execFileSync(process.execPath, [f], { encoding: 'utf8' }); console.log(`✔ ${s}: ${out.trim().split('\n').pop()}`); }
  catch (e) { failed++; console.log(`✘ ${s}\n${(e.stdout || '') + (e.stderr || '')}`); }
}
console.log(failed ? `\n${failed}件のテストが失敗` : '\nすべてのテストに合格');
process.exitCode = failed ? 1 : 0;
