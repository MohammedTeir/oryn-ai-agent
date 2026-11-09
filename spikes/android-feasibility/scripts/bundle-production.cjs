const path = require('node:path');
const fs = require('node:fs');
const Metro = require('metro');
(async () => {
  const root = path.dirname(require.resolve('../package.json'));
  const config = await Metro.loadConfig({ cwd: root, config: path.join(root, 'metro.config.js') });
  config.maxWorkers = 2;
  config.resetCache = true;
  const out = path.join(root, 'artifacts', 'production.android.js');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await Metro.runBuild(config, { entry: path.join(root, 'production', 'index.ts'), out, platform: 'android', dev: false, minify: false });
  console.log('Production shell entry bundled.');
})().catch(error => { console.error(error); process.exitCode = 1; });
