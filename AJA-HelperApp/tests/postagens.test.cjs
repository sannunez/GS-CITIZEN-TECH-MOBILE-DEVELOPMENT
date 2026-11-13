const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

function criarServico(fetchMock, modulo = 'postagens') {
  const file = path.resolve(`src/services/${modulo}.ts`);
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: file,
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require(name) {
      if (name === '@/config/api') return { API_URL: 'http://localhost:5080' };
      if (name === '@/services/http') return criarServico(fetchMock, 'http');
      throw new Error(`Import inesperado: ${name}`);
    },
    fetch: fetchMock,
    URL,
    Headers,
  }, { filename: file });
  return exports;
}

test('primeira página pede três postagens sem cursor', async () => {
  const controller = new AbortController();
  const service = criarServico(async (url, options) => {
    assert.equal(url, 'http://localhost:5080/api/postagens/feed?limite=3');
    assert.equal(options.signal, controller.signal);
    return { ok: true, json: async () => ({ itens: [], temMais: false, proximoCursor: null }) };
  });
  const page = await service.buscarPostagens(null, controller.signal);
  assert.equal(page.temMais, false);
});

test('próxima página envia o cursor sem alterar o limite', async () => {
  const service = criarServico(async url => {
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get('limite'), '3');
    assert.equal(parsed.searchParams.get('antesDeId'), '8');
    return { ok: true, json: async () => ({ itens: [], temMais: false, proximoCursor: null }) };
  });
  await service.buscarPostagens(8);
});

test('resposta HTTP de erro não é tratada como página válida', async () => {
  const service = criarServico(async () => ({ ok: false }));
  await assert.rejects(service.buscarPostagens(null), /Não foi possível carregar/);
});

test('página que informa mais resultados precisa de cursor válido', async () => {
  const service = criarServico(async () => ({
    ok: true,
    json: async () => ({ itens: [], temMais: true, proximoCursor: null }),
  }));
  await assert.rejects(service.buscarPostagens(null), /Não foi possível interpretar/);
});

test('publicação envia token e ID do usuário da sessão', async () => {
  const service = criarServico(async (url, options) => {
    assert.equal(url, 'http://localhost:5080/api/postagens');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.get('Authorization'), 'Bearer token-teste');
    assert.equal(JSON.parse(options.body).usuarioId, 42);
    return { ok: true, status: 201, json: async () => ({ id: 1 }) };
  });
  await service.criarPostagem({ texto: 'Teste', imagemUrl: null, usuarioId: 42 }, 'token-teste');
});

test('login valida usuário na API e retorna sessão sem senha', async () => {
  let requests = 0;
  const service = criarServico(async (url, options) => {
    requests++;
    if (url.endsWith('/login')) {
      assert.equal(JSON.parse(options.body).email, 'teste@example.org');
      return { ok: true, status: 200, json: async () => ({ accessToken: 'token-teste', expiresIn: 3600 }) };
    }
    assert.ok(url.endsWith('/me'));
    assert.equal(options.headers.get('Authorization'), 'Bearer token-teste');
    return { ok: true, status: 200, json: async () => ({ id: 42, nome: 'Teste', email: 'teste@example.org', biografia: '' }) };
  }, 'autenticacao');
  const session = await service.autenticar('login', { email: 'teste@example.org', senha: 'SenhaTeste@2026' });
  assert.equal(requests, 2);
  assert.equal(session.usuario.id, 42);
  assert.ok(session.expiraEm > Date.now());
  assert.equal(JSON.stringify(session).includes('SenhaTeste@2026'), false);
});

test('credenciais rejeitadas não produzem uma sessão', async () => {
  const service = criarServico(async () => ({
    ok: false, status: 401, json: async () => ({ mensagem: 'E-mail ou senha inválidos.' }),
  }), 'autenticacao');
  await assert.rejects(service.autenticar('login', { email: 'teste@example.org', senha: 'errada' }), error => error.status === 401);
});

test('falha de conexao informa o endereco da API e orienta iniciar o backend', async () => {
  const service = criarServico(async () => {
    throw new TypeError('fetch failed: java.net.ConnectException');
  }, 'http');

  await assert.rejects(service.solicitar('/api/auth/login'), error => {
    assert.match(error.message, /http:\/\/localhost:5080/);
    assert.match(error.message, /backend/);
    assert.doesNotMatch(error.message, /java\.net/);
    return true;
  });
});

test('cancelamento preserva o erro original da requisicao', async () => {
  const controller = new AbortController();
  const cancelamento = new Error('Requisicao cancelada');

  controller.abort();

  const service = criarServico(async () => {
    throw cancelamento;
  }, 'http');

  await assert.rejects(
    service.solicitar('/api/auth/me', { signal: controller.signal }),
    error => error === cancelamento,
  );
});

test('perfil consulta postagens do usuario autenticado com token e cancelamento', async () => {
  const controller = new AbortController();
  const service = criarServico(async (url, options) => {
    assert.equal(url, 'http://localhost:5080/api/postagens/minhas');
    assert.equal(options.headers.get('Authorization'), 'Bearer token-perfil');
    assert.equal(options.signal, controller.signal);

    return {
      ok: true,
      status: 200,
      json: async () => [{ id: 21, autor: { id: 42 } }],
    };
  });

  const postagens = await service.buscarMinhasPostagens('token-perfil', controller.signal);

  assert.equal(postagens.length, 1);
  assert.equal(postagens[0].autor.id, 42);
});

test('exclusao envia DELETE pelo ID e aceita resposta 204 sem JSON', async () => {
  const service = criarServico(async (url, options) => {
    assert.equal(url, 'http://localhost:5080/api/postagens/21');
    assert.equal(options.method, 'DELETE');
    assert.equal(options.headers.get('Authorization'), 'Bearer token-perfil');

    return { ok: true, status: 204 };
  });

  const resultado = await service.excluirPostagem(21, 'token-perfil');

  assert.equal(resultado, undefined);
});

test('exclusao recusada pela API continua sendo tratada como erro', async () => {
  const service = criarServico(async () => ({
    ok: false,
    status: 403,
    json: async () => ({ mensagem: 'Esta postagem pertence a outro usuario.' }),
  }));

  await assert.rejects(
    service.excluirPostagem(21, 'token-perfil'),
    error => error.status === 403,
  );
});

test('topicos consultam a API preservando autores e itens da lista', async () => {
  const controller = new AbortController();
  const service = criarServico(async (url, options) => {
    assert.equal(url, 'http://localhost:5080/api/topicos');
    assert.equal(options.signal, controller.signal);

    return {
      ok: true,
      status: 200,
      json: async () => [{
        id: 1,
        titulo: 'Bairro acessivel',
        texto: 'Vamos conversar!',
        assuntos: ['Ouvir moradores', 'Documentar barreiras'],
        autor: { id: 1001, nome: 'Moderacao AJA' },
      }],
    };
  }, 'topicos');

  const topicos = await service.buscarTopicos(controller.signal);

  assert.equal(topicos[0].autor.nome, 'Moderacao AJA');
  assert.equal(topicos[0].assuntos.length, 2);
});

test('itens dos topicos separam ponto e virgula, removem vazios e repeticoes', () => {
  const util = criarServico(async () => {}, '../utils/topicos');
  const itens = util.separarItensTopico([' Ouvir moradores; Mapear barreiras;; ', 'Mapear barreiras; Encaminhar proposta']);

  assert.equal(itens.join('|'), 'Ouvir moradores|Mapear barreiras|Encaminhar proposta');
  assert.equal(util.separarItensTopico([]).length, 0);
});

test('cliques repetidos e simultaneos enviam apenas um interesse por usuario e topico', async () => {
  let chamadas = 0;
  let concluir;

  const service = criarServico(async (url, options) => {
    chamadas++;
    assert.equal(url, 'http://localhost:5080/api/topicos/1001/interesse');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.get('Authorization'), 'Bearer token-interesse');

    return new Promise(resolve => { concluir = resolve; });
  }, 'topicos');

  const primeira = service.demonstrarInteresse(1001, 42, 'token-interesse');
  const repetida = service.demonstrarInteresse(1001, 42, 'token-interesse');

  assert.equal(chamadas, 1);
  assert.equal(primeira, repetida);

  concluir({ ok: true, status: 200, json: async () => ({ id: 1001, interesses: 87 }) });
  await primeira;

  const resultado = await service.demonstrarInteresse(1001, 42, 'token-interesse');

  assert.equal(chamadas, 1);
  assert.equal(resultado.interesses, 87);
  assert.equal(service.jaDemonstrouInteresse(42, 1001), true);
  assert.equal(service.jaDemonstrouInteresse(43, 1001), false);
});

test('interesse com erro pode ser reenviado sem marcar a curtida como confirmada', async () => {
  let chamadas = 0;

  const service = criarServico(async () => {
    chamadas++;

    if (chamadas === 1) {
      throw new TypeError('Sem conexao');
    }

    return { ok: true, status: 200, json: async () => ({ id: 1, interesses: 25 }) };
  }, 'topicos');

  await assert.rejects(service.demonstrarInteresse(1, 42, 'token-interesse'));
  assert.equal(service.jaDemonstrouInteresse(42, 1), false);

  await service.demonstrarInteresse(1, 42, 'token-interesse');

  assert.equal(chamadas, 2);
  assert.equal(service.jaDemonstrouInteresse(42, 1), true);
});
