// Build-only dependency fixture; never selected as the app's entry point.
const path = require('node:path');
const fs = require('node:fs');
const Metro = require('metro');
(async () => {
  const root = path.dirname(require.resolve('../package.json'));
  const config = await Metro.loadConfig({ cwd: root, config: path.join(root, 'metro.config.js') });
  config.resetCache = true;
  config.maxWorkers = 2;
  const out = path.join(root, 'artifacts', 'dependency-compatibility.android.js');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await Metro.runBuild(config, {
    entry: path.join(root, 'compatibility', 'dependency-entry.ts'),
    out, platform: 'android', dev: false, minify: false,
  });
  console.log('Android Metro dependency fixture bundled. No SDK request or device rendering was tested.');
})().catch(error => { console.error(error); process.exitCode = 1; });
