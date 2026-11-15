using System.ComponentModel.DataAnnotations;

namespace Aja.HelperApp.Api.Contracts;

public sealed class PostagemRequest
{
    public string? Texto { get; init; }

    [Url]
    public string? ImagemUrl { get; init; }

    [Range(1, long.MaxValue)]
    public long UsuarioId { get; init; }
}

public sealed record PostagemResponse(
    long Id,
    string? Texto,
    string? ImagemUrl,
    UsuarioResponse Autor,
    IReadOnlyList<TopicoResponse> Topicos,
    DateTime CriadaEm
);
