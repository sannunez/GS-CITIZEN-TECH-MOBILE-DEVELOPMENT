# AJA HelperApp

Aplicativo Expo, React Native e TypeScript com navegacao por abas do Expo Router, na ordem Topicos, Feed e Perfil.

## Executar

```powershell
npm install
npm start
```

A API em `AJA-HelperApp-BE` precisa estar em execucao na porta 5080 e conectada ao MySQL. O aplicativo nao utiliza dados simulados quando a API esta indisponivel: apresenta uma mensagem de erro com opcao de tentar novamente.

## Endereco da API

O endereco padrao no emulador Android do Android Studio e `http://10.0.2.2:5080`. No navegador e no simulador iOS, o padrao e `http://localhost:5080`. O aplicativo nao deduz o endereco da API a partir do Metro, pois ele pode selecionar um adaptador virtual ou VPN sem acesso ao backend.

Para informar um endereco explicitamente, crie `.env.local` na pasta do aplicativo:

```dotenv
EXPO_PUBLIC_API_URL=http://IP_DO_COMPUTADOR:5080
```

No navegador da propria maquina, pode usar `http://localhost:5080`. No celular fisico, informe o IP local do computador, com os dois dispositivos na mesma rede. Utilize o IPv4 do adaptador com acesso ao roteador, evitando enderecos de adaptadores virtuais e VPNs. Para outros emuladores, configure o endereco do host indicado pelo fabricante. Reinicie o Expo depois de alterar essa variavel. Nao coloque credenciais do banco no aplicativo.

O MySQL e a API precisam estar em execucao antes de cadastrar ou entrar. Na pasta `AJA-HelperApp-BE`, execute:

```powershell
dotnet run --project .\src\Aja.HelperApp.Api --launch-profile http
```

Confirme que o terminal exibe `Now listening on: http://0.0.0.0:5080` e teste `http://localhost:5080/health` no navegador do computador. Iniciar somente o Expo nao inicia o backend. Se a API encerrar com erro de conexao ao MySQL, corrija a configuracao do banco conforme o README do backend. Em um celular fisico, teste tambem o endereco `/health` utilizando o IP do computador; a rede e o firewall precisam permitir esse acesso.

## Feed

- A tela inicial permite cadastro com nome, e-mail e senha, com link para o login de contas existentes.
- O login valida as credenciais na API. AsyncStorage persiste o token, a validade e os dados do usuario, incluindo o ID. A senha nao e persistida no aparelho.
- Ao abrir novamente, o aplicativo valida a sessao na API. Se ela expirar, solicita novo login. AsyncStorage nao oferece criptografia; esta persistencia atende ao prototipo.
- Abas inferiores Topicos, Feed e Perfil. Perfil mostra os dados da sessao e permite sair da conta.
- A aba Perfil consulta todas as postagens do usuario conectado, em ordem de data decrescente. Cada postagem permite exclusao por ID, apos confirmar no pop-up. A lista e atualizada ao retornar para a aba ou puxar para baixo.
- `src/components/PostagemCard.tsx`: card com tres areas, para nome do autor, imagem e texto.
- `src/screens/FeedScreen.tsx`: lista virtualizada, com tres cards na area util da tela e margens laterais e verticais.
- Texto visual limitado a duas linhas para manter a altura dos tres cards; o rotulo de acessibilidade preserva o texto completo.
- API consultada em lotes de tres registros, com scroll infinito enquanto existirem outras postagens.
- A carga seguinte tambem verifica o tamanho do conteudo e a proximidade do fim durante o scroll. O rodape oferece Carregar mais postagens, evitando depender de um unico evento da lista.
- Postagens ordenadas pela data de criacao decrescente, com ID como desempate. O cursor identifica a data e o ID da ultima postagem da pagina anterior.
- Botao flutuante no canto inferior direito abre o formulario de texto e URL de imagem. A API atribui a postagem ao usuario autenticado e registra a data em UTC; ao retornar, o feed e atualizado.
- Atualizacao ao puxar a lista para baixo, tratamento de imagens ausentes e falhas de carregamento.
- Requisicoes em andamento sao canceladas ao atualizar ou desmontar a tela; cargas simultaneas sao bloqueadas.

Em um banco novo, as migrations da API criam dez perfis ficticios, vinte postagens e sete topicos. Para experimentar, cadastre sua conta ou utilize `ana@aja.example`, senha `AjaDemo@2026`. As sete contas de moradores compartilham essa senha publica; os tres perfis institucionais nao possuem senha habilitada. Um banco existente recebe as migrations pendentes ao iniciar a API.

## Topicos

A primeira aba consulta `GET /api/topicos`. `src/components/TopicoCard.tsx` mostra autor, titulo, texto e o array de assuntos como bullet points. Textos com mais de 280 caracteres e listas com mais de tres itens podem ser expandidos com Ler mais e recolhidos com Ler menos.

Os exemplos incluem mobilizacao por percursos acessiveis, convite para palestra e orientacoes da moderacao, com hashtags de participacao. Os perfis da Prefeitura, Cultura SP e moderacao AJA sao demonstrativos; os convites e propostas nao representam anuncios oficiais. Os autores sao consultados no banco pela API com INNER JOIN entre topicos e usuarios.

Cada topico possui texto, autor, array de assuntos e contador de interesses. O frontend separa cada string do array por ponto e virgula, remove itens vazios e exibe os resultados em bullet points. Os exemplos incluem strings com varios itens separados por `;`.

Tenho interesse chama `POST /api/topicos/{id}/interesse`, atualiza o contador e desabilita o botao apos sucesso. Cliques simultaneos compartilham a mesma requisicao. O controle de uma curtida por usuario e topico fica apenas na memoria desta execucao do aplicativo, inclusive ao alternar abas ou contas. Nenhum historico de curtidas e salvo no banco ou no AsyncStorage. Reiniciar o aplicativo ou recarregar o JavaScript permite curtir novamente; a API armazena somente o total, sem garantir unicidade entre reinicios ou outros dispositivos.

## Acessibilidade

Formularios possuem rotulos e dicas acessiveis. Abas e botoes informam sua finalidade; controles de leitura e interesse anunciam estado expandido, selecionado, desabilitado e ocupado. Contadores e erros usam regioes de anuncio. Os itens das listas sao identificados por numero e quantidade, e as imagens possuem rotulos. A confirmacao de exclusao oculta a lista de fundo da navegacao assistiva enquanto o modal esta aberto.

As propriedades preparam a interface para leitores de tela como o TalkBack. A navegacao por gestos, a ordem de foco e os anuncios ainda devem ser conferidos manualmente em Android com o TalkBack ativado.

## Verificar

```powershell
npm run typecheck
npm run lint
node --test tests/*.test.cjs
```
