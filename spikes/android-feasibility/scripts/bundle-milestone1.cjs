const path = require('node:path');
const fs = require('node:fs');
const Metro = require('metro');
(async () => {
  const root = path.dirname(require.resolve('../package.json'));
  const config = await Metro.loadConfig({ cwd: root, config: path.join(root, 'metro.config.js') });
  config.maxWorkers = 2;
  config.resetCache = true;
  const out = path.join(root, 'artifacts', 'milestone1.android.js');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await Metro.runBuild(config, { entry: path.join(root, 'milestone1', 'index.ts'), out, platform: 'android', dev: false, minify: false });
  console.log('Milestone 1 navigation entry bundled.');
})().catch(error => { console.error(error); process.exitCode = 1; });
