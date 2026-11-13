using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Aja.HelperApp.Api.Contracts;
using Aja.HelperApp.Api.Models;
using Aja.HelperApp.Api.Data;
using Aja.HelperApp.Api.Data.Converters;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Aja.HelperApp.Api.Data.Queries;

var passed = 0;

void Check(bool condition, string description)
{
    if (!condition)
    {
        throw new InvalidOperationException(description);
    }

    passed++;
    Console.WriteLine($"OK: {description}");
}

bool IsValid(object value) => Validator.TryValidateObject(value, new ValidationContext(value), [], true);

var normalized = new TopicoRequest
{
    Assuntos = [" acessibilidade ; deficiência visual ", "ACESSIBILIDADE", "Parque Doroteia", ";"]
}.NormalizarAssuntos();

Check(normalized.SequenceEqual(["acessibilidade", "deficiência visual", "Parque Doroteia"]),
    "Tópicos separados por ponto e vírgula, aparados e sem duplicações");
Check(!IsValid(new TopicoRequest { Assuntos = [] }), "Array de tópicos vazio rejeitado");
Check(!IsValid(new TopicoRequest { Assuntos = [";", " "] }), "Tópicos sem conteúdo rejeitados");
Check(!IsValid(new TopicoRequest { Assuntos = null! }), "Array de tópicos nulo rejeitado");
Check(IsValid(new TopicoRequest { Assuntos = ["comunicação acessível"], PostagemId = null }),
    "Tópico sem postagem aceito");
Check(!IsValid(new TopicoRequest { Assuntos = ["teste"], PostagemId = 0 }), "FK de postagem inválida rejeitada");
Check(IsValid(new PostagemRequest { UsuarioId = 1, Texto = null, ImagemUrl = null }),
    "Texto e imagem nullable preservados no contrato");
Check(!IsValid(new PostagemRequest { UsuarioId = 0, Texto = "Teste" }), "Autor com ID inválido rejeitado");
Check(!IsValid(new PostagemRequest { UsuarioId = 1, ImagemUrl = "imagem-sem-url" }), "Link de imagem inválido rejeitado");
Check(!IsValid(new UsuarioRequest { Nome = " " }), "Nome de usuário vazio rejeitado");
Check(IsValid(new UsuarioRequest { Nome = "Perfil fictício", Biografia = "" }), "Biografia vazia aceita");

var user = new Usuario { Id = 1, Nome = "Perfil fictício", Biografia = "Parque Doroteia" };
var post = new Postagem { Id = 1, Texto = "Caso demonstrativo", UsuarioId = user.Id, Usuario = user };
var topic = new Topico
{
    Id = 1,
    Assuntos = ["orientação acessível"],
    PostagemId = post.Id,
    Postagem = post,
    UsuarioId = user.Id,
    Usuario = user
};
user.Postagens.Add(post);
post.Topicos.Add(topic);

var response = post.ToResponse();
var json = JsonSerializer.Serialize(response, new JsonSerializerOptions(JsonSerializerDefaults.Web));
using var document = JsonDocument.Parse(json);
Check(document.RootElement.GetProperty("autor").GetProperty("id").GetInt64() == user.Id,
    "Resposta inclui autor sem serializar ciclos de navegação");
Check(document.RootElement.GetProperty("topicos").GetArrayLength() == 1,
    "Resposta inclui tópicos associados à postagem");

var converter = new StringArrayJsonConverter();
var sourceTopics = new[] { "deficiência visual", "São Paulo", "comunicação; orientação" };
var encodedTopics = converter.ConvertToProvider(sourceTopics) as string
    ?? throw new InvalidOperationException("A conversão para JSON não retornou uma string.");
var decodedTopics = converter.ConvertFromProvider(encodedTopics) as string[]
    ?? throw new InvalidOperationException("A conversão do JSON não retornou um array.");
Check(sourceTopics.SequenceEqual(decodedTopics), "Tópicos e acentos preservados na conversão JSON MySQL");

var topicSnapshot = StringArrayJsonConverter.Comparer.Snapshot(sourceTopics);
sourceTopics[0] = "comunicação visual";
Check(!StringArrayJsonConverter.Comparer.Equals(sourceTopics, topicSnapshot),
    "Alteração de um elemento do array detectada pelo comparador");

using var database = new AjaDbContext(new DbContextOptionsBuilder<AjaDbContext>()
    .UseMySql("Server=localhost;Port=3306;Database=aja_helperapp;User ID=root", new MySqlServerVersion(new Version(8, 0, 41)))
    .Options);

Check(database.Database.ProviderName == "Pomelo.EntityFrameworkCore.MySql", "Provedor MySQL configurado");
var topicEntity = database.Model.FindEntityType(typeof(Topico))!;
var postEntity = database.Model.FindEntityType(typeof(Postagem))!;
var userEntity = database.Model.FindEntityType(typeof(Usuario))!;
var subjectsProperty = topicEntity.FindProperty(nameof(Topico.Assuntos))!;
Check(subjectsProperty.GetColumnType() == "json" && !subjectsProperty.IsNullable,
    "Assuntos mapeados para JSON NOT NULL");
Check(topicEntity.FindProperty(nameof(Topico.PostagemId))!.IsNullable, "FK de tópico aceita NULL");
Check(postEntity.FindProperty(nameof(Postagem.Texto))!.IsNullable && postEntity.FindProperty(nameof(Postagem.ImagemUrl))!.IsNullable,
    "Texto e imagem mantidos como nullable no banco");
Check(!postEntity.FindProperty(nameof(Postagem.UsuarioId))!.IsNullable, "FK de autor obrigatória no banco");
Check(userEntity.FindProperty(nameof(Usuario.Id))!.GetColumnType() == "bigint"
    && postEntity.FindProperty(nameof(Postagem.Id))!.GetColumnType() == "bigint"
    && topicEntity.FindProperty(nameof(Topico.Id))!.GetColumnType() == "bigint", "Todas as PKs mapeadas para BIGINT");
Check(topicEntity.GetForeignKeys().Single(fk => fk.Properties.Any(property => property.Name == nameof(Topico.PostagemId))).DeleteBehavior == DeleteBehavior.SetNull,
    "Exclusão de postagem mantém o tópico com FK nula");
Check(postEntity.GetForeignKeys().Single().DeleteBehavior == DeleteBehavior.Restrict,
    "Relacionamento impede exclusão de autor com postagens");

var seedModel = database.GetService<IDesignTimeModel>().Model;
Check(seedModel.FindEntityType(typeof(Usuario))!.GetSeedData().Count() == 10
    && seedModel.FindEntityType(typeof(Postagem))!.GetSeedData().Count() == 20
    && seedModel.FindEntityType(typeof(Topico))!.GetSeedData().Count() == 7,
    "Carga inicial contém dez usuários, vinte postagens e sete tópicos");
Check(database.Database.GetMigrations().Count() == 4, "Migrations de contas, autoria e interesse encontradas além da inicial");
Check(!database.Database.HasPendingModelChanges(), "Snapshot e modelo atual sem divergências");

var migrationSql = database.GetService<IMigrator>().GenerateScript();
Check(migrationSql.Contains("AUTO_INCREMENT", StringComparison.OrdinalIgnoreCase)
    && migrationSql.Contains("json NOT NULL", StringComparison.OrdinalIgnoreCase),
    "SQL da migration gera AUTO_INCREMENT e JSON NOT NULL");
Check(migrationSql.Contains("INSERT INTO `usu_usuarios`", StringComparison.Ordinal)
    && migrationSql.Contains("INSERT INTO `pos_postagens`", StringComparison.Ordinal)
    && migrationSql.Contains("INSERT INTO `top_topicos`", StringComparison.Ordinal),
    "SQL da migration inclui dados demonstrativos das três tabelas");

var feedSql = PostagemFeedQuery.Criar(database, null).Take(4).ToQueryString();
Check(feedSql.Contains("INNER JOIN `usu_usuarios`", StringComparison.Ordinal)
    && feedSql.Contains("`usu_nome`", StringComparison.Ordinal), "Feed consulta postagem e nome do autor com JOIN");
Check(feedSql.Contains("ORDER BY", StringComparison.OrdinalIgnoreCase)
    && feedSql.Contains("DESC", StringComparison.OrdinalIgnoreCase)
    && feedSql.Contains("LIMIT", StringComparison.OrdinalIgnoreCase), "Feed ordenado e limitado no banco");
var nextPageSql = PostagemFeedQuery.Criar(database, 10).Take(4).ToQueryString();
Check(nextPageSql.Contains("WHERE", StringComparison.OrdinalIgnoreCase)
    && nextPageSql.Contains("<", StringComparison.Ordinal), "Próxima página filtra IDs anteriores ao cursor");

Check(IsValid(new CadastroRequest { Nome = "Teste", Email = "teste@example.org", Senha = "SenhaTeste@2026" }), "Cadastro válido aceito");
Check(!IsValid(new CadastroRequest { Nome = "Teste", Email = "email-invalido", Senha = "SenhaTeste@2026" }), "E-mail inválido rejeitado");
Check(!IsValid(new CadastroRequest { Nome = "Teste", Email = "teste@example.org", Senha = "123" }), "Senha curta rejeitada");
var passwordHasher = new Microsoft.AspNetCore.Identity.PasswordHasher<Usuario>();
var hash = (string)seedModel.FindEntityType(typeof(Usuario))!.GetSeedData().First()[nameof(Usuario.SenhaHash)]!;
Check(passwordHasher.VerifyHashedPassword(user, hash, "AjaDemo@2026") != Microsoft.AspNetCore.Identity.PasswordVerificationResult.Failed,
    "Hash demonstrativo validado pelo PasswordHasher");
Check(passwordHasher.VerifyHashedPassword(user, hash, "senha-incorreta") == Microsoft.AspNetCore.Identity.PasswordVerificationResult.Failed,
    "Senha incorreta rejeitada");
Check(userEntity.GetIndexes().Any(index => index.IsUnique && index.Properties.Single().Name == nameof(Usuario.Email)), "E-mail possui índice único");
Check(feedSql.IndexOf("pos_criada_em` DESC", StringComparison.Ordinal) >= 0, "Feed ordenado pela data decrescente");
Check(migrationSql.Contains("WHERE NOT EXISTS", StringComparison.Ordinal), "Novos dados demonstrativos preservam registros que já utilizam os IDs");
Check(!migrationSql.Contains("0001-01-01", StringComparison.Ordinal), "Migration usa data inicial compatível com MySQL");
var dates = seedModel.FindEntityType(typeof(Postagem))!.GetSeedData().Select(post => (DateTime)post[nameof(Postagem.CriadaEm)]!).ToArray();
Check(dates.All(date => date.Year == 2026) && dates.Distinct().Count() == 20, "Vinte datas demonstrativas distintas e determinísticas");
var minhasPostagensSql = PostagemFeedQuery.Criar(database, null, 42).ToQueryString();

Check(minhasPostagensSql.Contains("WHERE", StringComparison.OrdinalIgnoreCase)
    && minhasPostagensSql.Contains("`pos_usuario_id` = @", StringComparison.Ordinal)
    && minhasPostagensSql.Contains(" = 42;", StringComparison.Ordinal),
    "Perfil filtra postagens pelo autor no banco");

Check(minhasPostagensSql.Contains("pos_criada_em` DESC", StringComparison.Ordinal)
    && !minhasPostagensSql.Contains("LIMIT", StringComparison.OrdinalIgnoreCase),
    "Perfil lista todas as postagens do autor por data decrescente");

var listarMinhas = typeof(Aja.HelperApp.Api.Controllers.PostagensController)
    .GetMethod("ListarMinhas")!;

Check(Attribute.IsDefined(listarMinhas, typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute)),
    "Listagem de postagens do perfil exige autenticacao");

var topicosSql = TopicoQuery.Criar(database).ToQueryString();

Check(topicosSql.Contains("INNER JOIN `usu_usuarios`", StringComparison.Ordinal)
    && topicosSql.Contains("`usu_nome`", StringComparison.Ordinal),
    "Tópicos consultam nome do autor com INNER JOIN");

Check(!topicEntity.FindProperty(nameof(Topico.UsuarioId))!.IsNullable,
    "Tópico possui autor obrigatório");

Check(topicEntity.GetForeignKeys()
    .Single(fk => fk.Properties.Any(property => property.Name == nameof(Topico.UsuarioId)))
    .DeleteBehavior == DeleteBehavior.Restrict,
    "Exclusão de autor com tópicos protegida por FK");

Check(IsValid(new TopicoRequest { Texto = "Uma conversa sem lista de itens.", Assuntos = [] }),
    "Tópico com texto pode ser publicado sem lista");

Check(document.RootElement.GetProperty("topicos")[0].GetProperty("autor").GetProperty("id").GetInt64() == user.Id,
    "Resposta de tópico inclui o perfil autor");

Check(topicEntity.FindProperty(nameof(Topico.Interesses))!.GetColumnName() == "top_interesses",
    "Contador de interesses mapeado para a tabela de tópicos");

Check(topicosSql.Contains("top_interesses", StringComparison.Ordinal),
    "Listagem de tópicos inclui o contador de interesses");

var topicosDemonstrativos = seedModel.FindEntityType(typeof(Topico))!.GetSeedData();

Check(topicosDemonstrativos.All(topico => (int)topico[nameof(Topico.Interesses)]! > 0),
    "Tópicos demonstrativos possuem interesses pré-configurados");

Console.WriteLine($"{passed} verificações de contratos, autenticação, migrations e feed aprovadas.");
