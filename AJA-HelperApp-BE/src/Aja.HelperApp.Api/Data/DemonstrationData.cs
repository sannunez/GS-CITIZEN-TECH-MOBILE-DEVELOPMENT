using Aja.HelperApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Aja.HelperApp.Api.Data;

internal static class DemonstrationData
{
    public const string DemoSenhaHash = "AQAAAAIAAYagAAAAEGnjthc2h5n9E4FJCAnCT9jZO/KdPNIpn2Z6JICQIDM3ur/KdmGvbT+cMI0/xgHEow==";

    public static void Configure(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Usuario>().HasData(
            new Usuario
            {
                Id = 1,
                Nome = "Ana Ribeiro",
                Email = "ana@aja.example",
                SenhaHash = DemoSenhaHash,
                Biografia = "Perfil fictício de uma moradora cega do Parque Doroteia, Zona Sul de São Paulo."
            },
            new Usuario
            {
                Id = 2,
                Nome = "Bruno Santos",
                Email = "bruno@aja.example",
                SenhaHash = DemoSenhaHash,
                Biografia = "Perfil fictício de um morador surdo interessado em comunicação acessível no Parque Doroteia."
            },
            new Usuario
            {
                Id = 3,
                Nome = "Carla Lima",
                Email = "carla@aja.example",
                SenhaHash = DemoSenhaHash,
                Biografia = "Perfil fictício de uma moradora que participa de melhorias de acessibilidade no Parque Doroteia."
            });

        modelBuilder.Entity<Postagem>().HasData(
            new Postagem
            {
                Id = 1,
                Texto = "Caso demonstrativo: uma travessia no Parque Doroteia precisa de recursos de orientação para pessoas cegas.",
                UsuarioId = 1,
                CriadaEm = new DateTime(2026, 11, 12, 9, 0, 0, DateTimeKind.Utc)
            },
            new Postagem
            {
                Id = 2,
                Texto = "Caso demonstrativo: informações de atendimento em um espaço público do Parque Doroteia poderiam contar com comunicação visual acessível a pessoas surdas.",
                UsuarioId = 2,
                CriadaEm = new DateTime(2026, 11, 12, 8, 0, 0, DateTimeKind.Utc)
            },
            new Postagem
            {
                Id = 3,
                Texto = "Caso demonstrativo: obstáculos na calçada dificultam a circulação e a orientação de moradores do Parque Doroteia.",
                ImagemUrl = "https://placehold.co/1200x800/png?text=Imagem+demonstrativa",
                UsuarioId = 3,
                CriadaEm = new DateTime(2026, 11, 12, 7, 0, 0, DateTimeKind.Utc)
            });

        var nomes = new[]
        {
            "Lucas Oliveira",
            "Mariana Costa",
            "Pedro Alves",
            "Juliana Souza"
        };

        for (var i = 0; i < nomes.Length; i++)
        {
            modelBuilder.Entity<Usuario>().HasData(new Usuario
            {
                Id = i + 4,
                Nome = nomes[i],
                Email = $"demo{i + 4}@aja.example",
                SenhaHash = DemoSenhaHash,
                Biografia = "Perfil fictício do Parque Doroteia."
            });
        }

        var assuntos = new[]
        {
            "calçadas livres de obstáculos",
            "sinalização visual nos serviços públicos",
            "orientação tátil nas travessias",
            "comunicação acessível a pessoas surdas",
            "acesso seguro às praças",
            "participação de pessoas cegas nas melhorias",
            "informações de transporte em formato visual",
            "continuidade do piso tátil",
            "atendimento inclusivo",
            "travessias acessíveis"
        };

        for (var id = 4; id <= 20; id++)
        {
            modelBuilder.Entity<Postagem>().HasData(new Postagem
            {
                Id = id,
                UsuarioId = (id % 7) + 1,
                Texto = $"Caso demonstrativo {id}: discussão sobre {assuntos[(id - 4) % assuntos.Length]} no Parque Doroteia, São Paulo.",
                ImagemUrl = id % 3 == 0 ? $"https://placehold.co/900x600/png?text=Caso+demonstrativo+{id}" : null,
                CriadaEm = new DateTime(2026, 11, 12, 10, 0, 0, DateTimeKind.Utc).AddMinutes(id * 15)
            });
        }

        modelBuilder.Entity<Topico>().HasData(
            new Topico
            {
                Id = 1,
                Assuntos = ["deficiência visual", "travessia", "orientação acessível"],
                UsuarioId = 1,
                Titulo = "Uma travessia que acolha todo mundo",
                Interesses = 24,
                Texto = "Quem caminha pelo bairro sabe como uma orientação clara faz diferença. Vamos reunir experiências sobre travessias e entender o que ajuda pessoas cegas a circular com autonomia? Conte sua experiência e ajude a construir uma proposta com quem vive esse desafio. #DoroteiaAcessível #SuaVozTransforma",
                PostagemId = 1
            },
            new Topico
            {
                Id = 2,
                Assuntos = ["deficiência auditiva", "comunicação visual", "serviços públicos"],
                UsuarioId = 2,
                Titulo = "Informação também precisa ser acessível",
                Interesses = 18,
                Texto = "Avisos só por alto-falante deixam muita gente de fora. Que tal conversar sobre painéis visuais, legendas e outras formas de comunicação nos espaços públicos? Pessoas surdas precisam participar dessa conversa desde o começo. #ComunicaçãoParaTodos #DoroteiaInclui",
                PostagemId = 2
            },
            new Topico
            {
                Id = 3,
                Assuntos = ["calçadas", "mobilidade", "Parque Doroteia"],
                UsuarioId = 3,
                Titulo = "Calçada livre, bairro mais acolhedor",
                Interesses = 32,
                Texto = "Um obstáculo pequeno pode virar uma grande barreira para quem usa bengala. Compartilhe observações sobre os caminhos do bairro e explique como isso afeta sua rotina. Vamos organizar os relatos sem expor dados pessoais de ninguém. #CaminhoLivre #JuntosPeloDoroteia",
                PostagemId = 3
            },
            new Topico
            {
                Id = 4,
                UsuarioId = 1001,
                Titulo = "Boas-vindas à conversa do bairro!",
                Interesses = 45,
                Texto = "Aqui, cada experiência importa. Apoiar uma melhoria não significa concordar com todas as soluções propostas. Ouça quem encontra barreiras no dia a dia, traga evidências e mantenha o respeito. Estes são exemplos fictícios para experimentar o AJA. #Participe #AcessibilidadeÉDireito",
                Assuntos = ["acessibilidade", "participação cidadã", "São Paulo"]
            });

        InstitutionalDemonstrationData.Configure(modelBuilder);
    }
}
