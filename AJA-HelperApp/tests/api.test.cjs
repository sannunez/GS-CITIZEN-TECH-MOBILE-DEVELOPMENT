const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

function obterUrl(plataforma, urlConfigurada) {
  const file = path.resolve('src/config/api.ts');
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: file,
  });

  const exports = {};

  vm.runInNewContext(outputText, {
    exports,
    require(name) {
      assert.equal(name, 'react-native');
      return { Platform: { OS: plataforma } };
    },
    process: {
      env: { EXPO_PUBLIC_API_URL: urlConfigurada },
    },
  });

  return exports.API_URL;
}

test('Android usa o endereco do computador no emulador sem depender do Metro', () => {
  assert.equal(obterUrl('android'), 'http://10.0.2.2:5080');
});

test('web e iOS utilizam localhost por padrao', () => {
  assert.equal(obterUrl('web'), 'http://localhost:5080');
  assert.equal(obterUrl('ios'), 'http://localhost:5080');
});

test('endereco explicito para celular tem prioridade e remove espacos e barras finais', () => {
  assert.equal(
    obterUrl('android', '  http://192.168.1.103:5080///  '),
    'http://192.168.1.103:5080',
  );
});

test('variavel vazia mantem o endereco padrao', () => {
  assert.equal(obterUrl('android', '  '), 'http://10.0.2.2:5080');
});
