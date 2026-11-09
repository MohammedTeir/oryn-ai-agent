/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

test('render failures show only safe copy and a user-triggered retry restores children', () => {
  const program = `
    const assert = require('node:assert/strict');
    const fs = require('node:fs');
    const Module = require('node:module');
    const ts = require('typescript');
    const file = process.argv[1];
    const oldLoad = Module._load;
    Module._load = function(request, parent, isMain) {
      if (request === 'react-native') return { View: 'View', Text: 'Text', Pressable: 'Pressable', StyleSheet: { create: x => x } };
      return oldLoad.call(this, request, parent, isMain);
    };
    const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    const mod = new Module(file, module); mod.filename = file; mod.paths = Module._nodeModulePaths(require('node:path').dirname(file)); mod._compile(compiled, file);
    const Boundary = mod.exports.RecoveryBoundary;
    assert.deepEqual(Boundary.getDerivedStateFromError(new Error('secret exception')), { failed: true });
    const instance = new Boundary({ message: 'Safe error', retryLabel: 'Try again', children: 'content' });
    instance.setState = update => { instance.state = { ...instance.state, ...update }; };
    assert.equal(instance.render(), 'content');
    instance.state = { failed: true };
    const fallback = instance.render();
    assert.equal(fallback.props.children[0].props.children, 'Safe error');
    assert.equal(fallback.props.children[1].props.accessibilityLabel, 'Try again');
    assert.equal(JSON.stringify(fallback).includes('secret exception'), false);
    fallback.props.children[1].props.onPress();
    assert.equal(instance.render(), 'content');
  `;
  const run = spawnSync(process.execPath, ['-e', program, path.join(__dirname, '../production/RecoveryBoundary.tsx')], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
});
