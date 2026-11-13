# AJA HelperApp - Backend

API REST em C# e ASP.NET Core 10, com MySQL 8.0, Entity Framework Core 9, Pomelo, migrations e Swagger. A versao do Entity Framework Core e a ferramenta dotnet-ef acompanham o provedor Pomelo 9.0.0, que suporta EF Core 9.

Contexto do prototipo: Parque Doroteia, Zona Sul de Sao Paulo, com foco em pessoas cegas e surdas. Todos os perfis e relatos iniciais sao ficticios. As postagens nao comprovam a existencia de barreiras em locais reais.

## Organizacao

- `AJA-HelperApp-BE.sln`: solution do backend.
- `src/Aja.HelperApp.Api/Controllers`: endpoints REST.
- `src/Aja.HelperApp.Api/Contracts`: entradas, respostas e validacao.
- `src/Aja.HelperApp.Api/Models`: entidades.
- `src/Aja.HelperApp.Api/Data`: contexto, relacionamentos e mapeamento das tabelas.
- `src/Aja.HelperApp.Api/Migrations`: migrations incrementais e snapshot do modelo.
- `scripts/Set-DatabaseConnection.ps1`: configuracao local da conexao.
- `tests/Invoke-ApiSmokeTest.ps1`: teste HTTP do CRUD e dos relacionamentos.

## Preparar e executar

Requisitos: SDK .NET 10 e MySQL 8.0 em execucao. A versao de referencia do servidor esta em `Database:ServerVersion`, atualmente `8.0.41`.

Na pasta `AJA-HelperApp-BE`:

```powershell
dotnet restore .\AJA-HelperApp-BE.sln --configfile .\NuGet.Config
.\scripts\Set-DatabaseConnection.ps1
dotnet run --project .\src\Aja.HelperApp.Api --launch-profile http
```

O script de conexao solicita a senha sem exibi-la e salva a connection string nos User Secrets do .NET, fora do repositorio. Os valores padrao sao servidor `localhost`, porta `3306`, banco `aja_helperapp` e usuario `root`. Execute esse script para configurar as credenciais MySQL, inclusive se uma conexao anterior ja tiver sido configurada. Para alterar os valores padrao:

```powershell
.\scripts\Set-DatabaseConnection.ps1 -DatabaseHost localhost -Port 3306 -DatabaseName aja_helperapp -UserName root
```

O usuario precisa poder criar o banco, caso ele ainda nao exista, e alterar seu esquema para aplicar as migrations. A configuracao tambem pode ser fornecida pela variavel de ambiente `ConnectionStrings__DefaultConnection`.

Ao iniciar, a API chama `Database.MigrateAsync()`. Se o banco nao existir, o provedor MySQL o cria; em seguida, aplica as migrations pendentes. As quatro migrations criam o esquema e, em um banco novo, dez perfis ficticios, vinte postagens e sete topicos. A tabela `__EFMigrationsHistory` registra as migrations aplicadas: reiniciar a API nao duplica a carga. Os dados demonstrativos estao definidos em `Data/DemonstrationData.cs` e incorporados nas migrations.

A migration de contas e datas preserva registros preexistentes que ocupem os IDs da carga adicional. Portanto, um banco ja utilizado pode ter uma quantidade diferente de vinte postagens. Usuarios antigos sem credenciais recebem e-mails internos `legacy-{id}@aja.invalid` e nao podem fazer login; cadastre uma nova conta. As contas demonstrativas originais recebem credenciais de teste. Datas de postagens antigas sao estimativas da migration, pois o esquema anterior nao registrava o momento da publicacao.

Essa inicializacao acontece na API, nao no aplicativo Expo. O frontend consome a API para cadastro, login, feed e publicacao.

- API local: `http://localhost:5080`.
- Swagger em Development: `http://localhost:5080/swagger`.
- Saude e conexao: `GET http://localhost:5080/health`.

O perfil HTTP escuta em `0.0.0.0:5080` para permitir acesso futuro pelo celular na rede local. No celular sera utilizado o IP do computador. O CORS permite os enderecos locais do Expo Web listados em `appsettings.json`; outros enderecos web podem ser adicionados a `Cors:AllowedOrigins`. Nenhuma regra de firewall e alterada automaticamente.

## Banco de dados

Todas as chaves sao `long` em C#, mapeadas para `bigint` no MySQL. As PKs utilizam `AUTO_INCREMENT`, que considera os IDs inseridos na carga inicial. O esquema utiliza `utf8mb4` para armazenar textos em portugues.

| Tabela | Campos |
| --- | --- |
| `usu_usuarios` | `usu_id` PK; `usu_nome` obrigatorio, ate 100 caracteres; `usu_email` obrigatorio e unico; `usu_senha_hash` obrigatorio; `usu_biografia` obrigatoria, podendo ser vazia |
| `pos_postagens` | `pos_id` PK; `pos_texto` nullable; `pos_imagem_url` nullable; `pos_usuario_id` FK obrigatoria; `pos_criada_em` obrigatorio, UTC |
| `top_topicos` | `top_id` PK; `top_titulo` varchar(180); `top_texto` longtext; `top_assuntos` json NOT NULL; `top_postagem_id` FK nullable; `top_usuario_id` FK obrigatoria; `top_interesses` int obrigatorio |

Um usuario possui varias postagens. Uma postagem pode ter varios registros de topicos. Um registro de topicos possui um array de assuntos e pode estar sem postagem associada.

Excluir um usuario com postagens retorna 409. Excluir uma postagem preserva seus topicos e define `top_postagem_id` como NULL. Excluir um topico nao exclui a postagem.

O nome `top_topicos` utiliza underscore, mantendo o mesmo padrao das demais tabelas.

## Endpoints

`POST /api/topicos/{id}/interesse` exige autenticacao e incrementa `top_interesses` diretamente no banco com uma atualizacao atomica. Retorna ID e total atualizado; um topico inexistente retorna 404. A carga demonstrativa possui contadores predefinidos. Nao existe tabela ou registro de quem demonstrou interesse: a restricao de uma curtida vale somente no cliente enquanto o aplicativo permanece aberto, nao sendo uma garantia entre reinicios ou dispositivos.

A listagem de topicos faz INNER JOIN entre `top_topicos` e `usu_usuarios`, retornando titulo, texto, assuntos e perfil autor. POST exige token e atribui o autor pela sessao; PUT e DELETE sao permitidos somente ao autor. A migration `TopicosComAutoria` preenche a autoria dos registros antigos a partir da postagem associada ou do perfil demonstrativo da moderacao, antes de criar a FK.

Os perfis ficticios da moderacao AJA, Prefeitura e Cultura SP utilizam IDs reservados 1001 a 1003, e-mails `@aja.example` e senha desabilitada. As propostas e o evento cultural sao demonstracoes, sem vinculo oficial ou anuncio real. A carga inclui topicos com e sem lista de itens.

O feed utiliza `GET /api/postagens/feed?limite=3`. Para continuar, envie `antesDeId` com o `proximoCursor` da resposta. O limite aceito e de um a tres itens. A resposta contem `itens`, `temMais` e `proximoCursor`. A consulta faz JOIN entre postagens e usuarios para incluir o nome do autor e ordena por `CriadaEm DESC, Id DESC`. O cursor resolve a data e o ID da postagem de referencia. Busca um registro adicional internamente para identificar se existe outra pagina, mas devolve somente o limite solicitado.

A listagem original `GET /api/postagens` continua disponivel para o CRUD.

`GET /api/postagens/minhas` exige token e retorna todas as postagens do usuario autenticado, com autor e data, em ordem decrescente. O ID do autor vem do token; o cliente nao escolhe outro usuario nessa consulta. `DELETE /api/postagens/{id}` exclui uma postagem pelo ID somente quando ela pertence ao usuario conectado, retornando 204; para outro autor, retorna 403.

| Recurso | Listar | Consultar | Criar | Atualizar | Excluir |
| --- | --- | --- | --- | --- | --- |
| Usuarios | `GET /api/usuarios` | `GET /api/usuarios/{id}` | `POST /api/usuarios` | `PUT /api/usuarios/{id}` | `DELETE /api/usuarios/{id}` |
| Postagens | `GET /api/postagens` | `GET /api/postagens/{id}` | `POST /api/postagens` | `PUT /api/postagens/{id}` | `DELETE /api/postagens/{id}` |
| Topicos | `GET /api/topicos` | `GET /api/topicos/{id}` | `POST /api/topicos` | `PUT /api/topicos/{id}` | `DELETE /api/topicos/{id}` |

POST de postagens e topicos retorna 201 e o endereco do recurso. PUT retorna 200. DELETE retorna 204. IDs inexistentes retornam 404. Entradas invalidas ou FKs inexistentes retornam 400. As respostas de postagens incluem o autor, os topicos relacionados e `criadaEm` em UTC.

Cadastro: `POST /api/auth/cadastro` ou `POST /api/usuarios`, com nome, e-mail e senha. Login: `POST /api/auth/login`, com e-mail e senha. Ambos retornam 200 com `accessToken` e `expiresIn`. Senhas sao armazenadas com hash por `PasswordHasher`, nunca em texto puro. E-mails duplicados retornam 409; credenciais incorretas retornam 401.

`GET /api/auth/me` retorna ID, nome, e-mail e biografia do usuario autenticado. Envie `Authorization: Bearer TOKEN` nesse endpoint e nas operacoes protegidas. O token expira em sete dias. O aplicativo armazena a sessao no AsyncStorage e a remove ao sair; o logout local nao revoga tokens ja emitidos.

Criar uma conta:

```json
{
  "nome": "Morador demonstrativo",
  "email": "morador@example.org",
  "senha": "SenhaExemplo@2026"
}
```

PUT de usuario recebe `nome` e `biografia`. Somente o proprio usuario pode atualizar ou excluir seu perfil. POST, PUT e DELETE de postagens exigem autenticacao; somente o autor pode alterar ou excluir a postagem. O `usuarioId` enviado precisa coincidir com o ID do token. A API registra a data ao criar a postagem, sem aceitar uma data enviada pelo cliente.

Criar ou atualizar uma postagem:

```json
{
  "texto": "Caso demonstrativo de acessibilidade no Parque Doroteia.",
  "imagemUrl": null,
  "usuarioId": 1
}
```

Texto e imagem podem ser nulos, conforme o esquema solicitado. Links informados precisam ser URLs validas. A imagem inicial e um placeholder externo, nao uma evidencia real.

Conta demonstrativa local: `ana@aja.example`, senha `AjaDemo@2026`. As sete contas ficticias compartilham essa senha publica; nao use esta carga em producao. Para manter as chaves de tokens em um diretorio especifico, configure `DataProtection:KeysDirectory` fora do repositorio, com permissoes restritas. Sem essa opcao, o ASP.NET utiliza o armazenamento padrao de chaves do usuario do processo.

Criar ou atualizar um grupo de topicos:

```json
{
  "assuntos": ["acessibilidade;deficiencia visual", "Parque Doroteia"],
  "postagemId": 1
}
```

O banco armazena o array em uma coluna JSON nativa do MySQL. Na API, `assuntos` continua sendo um array de strings. A conversao entre JSON e `string[]` e feita por `StringArrayJsonConverter`, com comparador para detectar alteracoes nos elementos. A API aceita varios itens e tambem separa assuntos por ponto e virgula dentro de cada item. Espacos extras, itens vazios e repeticoes sao removidos. O exemplo acima gera tres elementos. Para um topico ainda sem postagem, envie `postagemId: null`.

## Verificar

Compilar:

```powershell
dotnet build .\AJA-HelperApp-BE.sln --no-restore
```

Validar contratos, nulabilidade, normalizacao de topicos, serializacao e mapeamento MySQL sem precisar de conexao com o banco:

```powershell
dotnet restore .\tests\Aja.HelperApp.ContractChecks --configfile .\NuGet.Config
dotnet run --project .\tests\Aja.HelperApp.ContractChecks --no-restore
```

Esse projeto de verificacao referencia a API e utiliza o provedor MySQL para validar o modelo e as migrations sem abrir conexao com o servidor.

Com a API em execucao, em outro terminal:

```powershell
.\tests\Invoke-ApiSmokeTest.ps1
```

O teste cria seus proprios registros, verifica o CRUD, validacoes e a preservacao dos topicos na exclusao da postagem, e remove os registros temporarios. Ele nao apaga os dados demonstrativos nem outros registros existentes.

## Proximas migrations

```powershell
dotnet tool restore --configfile .\NuGet.Config
dotnet ef migrations add NomeDaAlteracao --project .\src\Aja.HelperApp.Api --startup-project .\src\Aja.HelperApp.Api
```

Para aplicar manualmente, se necessario:

```powershell
dotnet ef database update --project .\src\Aja.HelperApp.Api --startup-project .\src\Aja.HelperApp.Api
```

## Validacao

A solution compila e as verificacoes de contratos cobrem o modelo, as migrations, a carga demonstrativa, o hash de senha e a consulta paginada por data. O teste HTTP exercita cadastro, login, autoria, feed e CRUD, removendo os registros criados pelo proprio teste. Permanece o aviso NU1902 de vulnerabilidade no MySqlConnector 2.4.0; essa dependencia preexistente precisa ser atualizada para uma versao corrigida e compativel antes de publicar o backend.
