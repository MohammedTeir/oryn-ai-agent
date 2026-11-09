/* global __dirname */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
test('production entry does not import feasibility execution or preview modules', () => {
  const root = path.resolve(__dirname, '..');
  const seen = new Set();
  function visit(file) {
    if (seen.has(file)) return;
    seen.add(file);
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/(?:from\s+|require\()['"](\.[^'"]+)['"]/g)) {
      const target = path.resolve(path.dirname(file), match[1]);
      const resolved = [target, `${target}.ts`, `${target}.tsx`, `${target}.json`].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
      if (resolved && /\.tsx?$/.test(resolved)) visit(resolved);
    }
  }
  visit(path.join(root, 'production/index.ts'));
  const files = [...seen].map(f => path.relative(root, f));
  assert.ok(files.includes('production/App.tsx'));
  assert.ok(files.includes('milestone1/AppLanguage.tsx'), 'Shell uses the shared stored-language provider');
  assert.ok(files.includes('storage/languagePreference.ts'), 'Shell uses the validated language preference store');
  for (const file of files) assert.doesNotMatch(file, /(^|\/)(PreviewRoot|ApprovalExample|PreviewLanguage|oryn-observer)(\.|\/|$)/, `Unsafe production import: ${file}`);
  assert.ok(!files.includes('App.tsx'), 'Feasibility app must not enter the production graph');
});
