/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

test('shared controls expose labels, disabled behavior and announced status', () => {
  const program = `
    const assert = require('node:assert/strict');
    const fs = require('node:fs');
    const Module = require('node:module');
    const ts = require('typescript');
    const oldLoad = Module._load;
    Module._load = function(request, parent, isMain) {
      if (request === 'react-native') return { Text: 'Text', Pressable: 'Pressable', StyleSheet: { create: x => x } };
      if (request === '../typography') return oldLoad.call(this, require('node:path').resolve(require('node:path').dirname(parent.filename), '../typography.ts'), parent, isMain);
      return oldLoad.call(this, request, parent, isMain);
    };
    function load(file) {
      const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
      const mod = new Module(file, module); mod.filename = file; mod.paths = Module._nodeModulePaths(require('node:path').dirname(file)); mod._compile(js, file); return mod.exports;
    }
    const { ActionButton } = load(process.argv[1]); const { StatusMessage } = load(process.argv[2]);
    let pressed = 0; const onPress = () => { pressed++; };
    const enabled = ActionButton({ label: 'Open', onPress });
    assert.equal(enabled.props.accessibilityRole, 'button'); assert.equal(enabled.props.accessibilityLabel, 'Open');
    assert.equal(enabled.props.accessibilityState.disabled, false); assert.ok(enabled.props.style[0].minHeight >= 48);
    enabled.props.onPress(); assert.equal(pressed, 1);
    const disabled = ActionButton({ label: 'Open', onPress, disabled: true });
    assert.equal(disabled.props.disabled, true); assert.equal(disabled.props.accessibilityState.disabled, true);
    assert.equal(disabled.props.onPress, undefined); assert.equal(pressed, 1);
    const error = StatusMessage({ message: 'Unavailable', error: true });
    assert.equal(error.props.accessibilityRole, 'alert'); assert.equal(error.props.accessibilityLiveRegion, 'polite'); assert.equal(error.props.children, 'Unavailable');
    assert.equal(StatusMessage({ message: 'Loading' }).props.accessibilityLiveRegion, 'polite');
  `;
  const run = spawnSync(process.execPath, ['-e', program, path.join(__dirname, '../production/components/ActionButton.tsx'), path.join(__dirname, '../production/components/StatusMessage.tsx')], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
});
