const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

function montarHook(buscarPostagens) {
  const slots = [];
  const efeitos = [];
  let posicao = 0;
  let iniciado = false;

  const react = {
    useState(inicial) {
      const indice = posicao++;

      if (!(indice in slots)) {
        slots[indice] = inicial;
      }

      return [slots[indice], valor => {
        slots[indice] = typeof valor === 'function' ? valor(slots[indice]) : valor;
      }];
    },
    useRef(inicial) {
      const indice = posicao++;

      if (!(indice in slots)) {
        slots[indice] = { current: inicial };
      }

      return slots[indice];
    },
    useCallback(callback) {
      return callback;
    },
    useEffect(callback) {
      if (!iniciado) {
        efeitos.push(callback);
      }
    },
  };

  const file = path.resolve('src/hooks/useFeed.ts');
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const exports = {};

  vm.runInNewContext(outputText, {
    exports,
    AbortController,
    require(name) {
      if (name === 'react') {
        return react;
      }

      if (name === '@/services/postagens') {
        return { buscarPostagens };
      }

      throw new Error(`Import inesperado: ${name}`);
    },
  });

  function ler() {
    posicao = 0;
    return exports.useFeed();
  }

  ler();
  iniciado = true;
  efeitos.forEach(efeito => efeito());

  return { ler };
}

function aguardar() {
  return new Promise(resolve => setImmediate(resolve));
}

function pagina(ids, temMais = false) {
  return {
    itens: ids.map(id => ({ id })),
    temMais,
    proximoCursor: temMais ? ids[ids.length - 1] : null,
  };
}

test('feed libera a carga seguinte apos ignorar um evento durante a primeira requisicao', async () => {
  let concluirPrimeira;
  const cursores = [];

  const hook = montarHook(cursor => {
    cursores.push(cursor);

    if (cursores.length === 1) {
      return new Promise(resolve => { concluirPrimeira = resolve; });
    }

    return Promise.resolve(pagina([3, 2, 1]));
  });

  hook.ler().carregarMais();
  assert.equal(cursores.length, 1);

  concluirPrimeira(pagina([6, 5, 4], true));
  await aguardar();

  hook.ler().carregarMais();
  hook.ler().carregarMais();
  await aguardar();

  assert.deepEqual(cursores, [null, 4]);
  assert.equal(hook.ler().postagens.length, 6);
  assert.equal(hook.ler().temMais, false);
  assert.equal(hook.ler().carregando, false);
});

test('atualizacao descarta a pagina antiga que responde depois da nova', async () => {
  let concluirAntiga;
  let chamadas = 0;

  const hook = montarHook(() => {
    chamadas++;

    if (chamadas === 1) {
      return new Promise(resolve => { concluirAntiga = resolve; });
    }

    return Promise.resolve(pagina([9, 8, 7], true));
  });

  hook.ler().atualizar();
  await aguardar();

  concluirAntiga(pagina([3, 2, 1]));
  await aguardar();

  assert.equal(hook.ler().postagens[0].id, 9);
  assert.equal(hook.ler().temMais, true);
  assert.equal(hook.ler().carregando, false);
});

test('falha na proxima pagina permite tentar novamente com o mesmo cursor', async () => {
  const cursores = [];

  const hook = montarHook(cursor => {
    cursores.push(cursor);

    if (cursores.length === 1) {
      return Promise.resolve(pagina([6, 5, 4], true));
    }

    if (cursores.length === 2) {
      return Promise.reject(new Error('Conexao interrompida'));
    }

    return Promise.resolve(pagina([3, 2, 1]));
  });

  await aguardar();
  hook.ler().carregarMais();
  await aguardar();

  assert.ok(hook.ler().erro);
  hook.ler().tentarNovamente();
  await aguardar();

  assert.deepEqual(cursores, [null, 4, 4]);
  assert.equal(hook.ler().postagens.length, 6);
  assert.equal(hook.ler().erro, null);
});
