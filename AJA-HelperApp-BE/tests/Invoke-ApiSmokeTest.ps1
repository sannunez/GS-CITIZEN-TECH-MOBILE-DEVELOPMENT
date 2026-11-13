[CmdletBinding()]
param([string]$BaseUrl = 'http://localhost:5080')

$ErrorActionPreference = 'Stop'
$BaseUrl = $BaseUrl.TrimEnd('/')
$userId = $null
$postId = $null
$topicId = $null
$passed = 0
$script:token = $null

function Invoke-Api {
    param([string]$Method, [string]$Path, [object]$Body, [int]$ExpectedStatus = 200)

    $request = @{ Uri = "$BaseUrl$Path"; Method = $Method; UseBasicParsing = $true; TimeoutSec = 30 }
    if ($script:token) { $request.Headers = @{ Authorization = 'Bearer ' + $script:token } }
    if ($null -ne $Body) {
        $request.ContentType = 'application/json; charset=utf-8'
        $request.Body = [System.Text.Encoding]::UTF8.GetBytes(($Body | ConvertTo-Json -Depth 8))
    }

    try {
        $response = Invoke-WebRequest @request
        $status = [int]$response.StatusCode
        $data = if ($response.Content) { $response.Content | ConvertFrom-Json } else { $null }
    }
    catch {
        if (-not $_.Exception.Response) { throw }
        $status = [int]$_.Exception.Response.StatusCode
        $data = $null
    }

    if ($status -ne $ExpectedStatus) {
        throw "$Method $Path retornou $status; esperado $ExpectedStatus."
    }

    return $data
}

function Assert-Result {
    param([bool]$Condition, [string]$Description)
    if (-not $Condition) { throw "Falha: $Description" }
    $script:passed++
    Write-Host "OK: $Description"
}

try {
    $health = Invoke-Api -Method GET -Path '/health'
    Assert-Result ($health.status -eq 'ok' -and $health.database -eq 'MySQL') 'API conectada ao MySQL'
    $cursor = $null
    $seen = [System.Collections.Generic.HashSet[long]]::new()
    $lastDate = [DateTimeOffset]::MaxValue
    do {
        $path = '/api/postagens/feed?limite=3'
        if ($null -ne $cursor) { $path += '&antesDeId=' + $cursor }
        $page = Invoke-Api -Method GET -Path $path
        if ($page.itens.Count -gt 3) { throw 'Feed retornou mais de tres itens.' }
        foreach ($item in $page.itens) {
            if (-not $seen.Add([long]$item.id)) { throw 'Postagem duplicada na paginacao.' }
            $date = [DateTimeOffset]::Parse($item.criadaEm)
            if ($date -gt $lastDate) { throw 'Feed fora de ordem cronologica.' }
            $lastDate = $date
        }
        if ($page.temMais -and ($null -eq $page.proximoCursor -or $page.proximoCursor -eq $cursor)) { throw 'Cursor sem progresso.' }
        $cursor = $page.proximoCursor
    } while ($page.temMais)
    Assert-Result ($seen.Count -ge 20) 'Feed com ao menos vinte postagens, paginado por data sem duplicacoes'

    Invoke-Api -Method POST -Path '/api/postagens' -ExpectedStatus 401 -Body @{ texto = 'Sem sessao'; usuarioId = 1 } | Out-Null
    Assert-Result $true 'Postagem sem autenticacao rejeitada'

    Invoke-Api -Method POST -Path '/api/topicos/1/interesse' -ExpectedStatus 401 | Out-Null
    Assert-Result $true 'Interesse sem autenticacao rejeitado'
    $emailTeste = 'teste-' + [guid]::NewGuid().ToString('N') + '@example.org'
    $auth = Invoke-Api -Method POST -Path '/api/auth/cadastro' -ExpectedStatus 200 -Body @{
        nome = 'Teste ' + [guid]::NewGuid().ToString('N')
        email = $emailTeste
        senha = 'SenhaTeste@2026'
    }
    $script:token = $auth.accessToken
    $user = Invoke-Api -Method GET -Path '/api/auth/me'
    $userId = $user.id
    Assert-Result ($userId -gt 0) 'Usuario criado com ID gerado pelo banco'
    Invoke-Api -Method POST -Path '/api/auth/login' -ExpectedStatus 401 -Body @{ email = $emailTeste; senha = 'SenhaErrada@2026' } | Out-Null
    Assert-Result $true 'Login com senha incorreta rejeitado'
    $login = Invoke-Api -Method POST -Path '/api/auth/login' -Body @{ email = $emailTeste; senha = 'SenhaTeste@2026' }
    Assert-Result (-not [string]::IsNullOrWhiteSpace($login.accessToken)) 'Login valida credenciais no banco e emite token'

    $user = Invoke-Api -Method PUT -Path "/api/usuarios/$userId" -Body @{
        nome = 'Usuario atualizado'
        biografia = 'Biografia atualizada.'
    }
    Assert-Result ($user.nome -eq 'Usuario atualizado') 'Usuario atualizado'

    $post = Invoke-Api -Method POST -Path '/api/postagens' -ExpectedStatus 201 -Body @{
        texto = 'Caso demonstrativo de teste no Parque Doroteia.'
        imagemUrl = $null
        usuarioId = $userId
    }
    $postId = $post.id
    Assert-Result ($post.autor.id -eq $userId -and $null -eq $post.imagemUrl) 'Postagem criada com autor e imagem nula'
    $dataUtc = ([string]$post.criadaEm -match 'Z$') -or ($post.criadaEm -is [DateTime] -and $post.criadaEm.Kind -eq [DateTimeKind]::Utc)
    Assert-Result $dataUtc 'Data de criacao retornada em UTC'
    $feedAtualizado = Invoke-Api -Method GET -Path '/api/postagens/feed?limite=3'
    Assert-Result ($feedAtualizado.itens[0].id -eq $postId) 'Nova postagem aparece no inicio do feed'

    Invoke-Api -Method DELETE -Path "/api/usuarios/$userId" -ExpectedStatus 409 | Out-Null
    Assert-Result $true 'Exclusao de autor com postagem bloqueada'

    $topic = Invoke-Api -Method POST -Path '/api/topicos' -ExpectedStatus 201 -Body @{
        assuntos = @('acessibilidade;orientacao', 'Parque Doroteia', 'ACESSIBILIDADE')
        postagemId = $postId
    }
    $topicId = $topic.id
    Assert-Result ($topic.assuntos.Count -eq 3 -and $topic.postagemId -eq $postId) 'Array normalizado e associado a postagem'

    $interesse = Invoke-Api -Method POST -Path "/api/topicos/$topicId/interesse"
    Assert-Result ($interesse.id -eq $topicId -and $interesse.interesses -eq 1) 'Interesse incrementado no banco'

    $topic = Invoke-Api -Method GET -Path "/api/topicos/$topicId"
    Assert-Result ($topic.interesses -eq 1) 'Contador persistido na leitura do topico'

    Invoke-Api -Method POST -Path ('/api/topicos/' + [long]::MaxValue + '/interesse') -ExpectedStatus 404 | Out-Null
    Assert-Result $true 'Interesse em topico inexistente retorna 404'

    $post = Invoke-Api -Method GET -Path "/api/postagens/$postId"
    Assert-Result ($post.topicos.Count -eq 1 -and $post.topicos[0].id -eq $topicId) 'Leitura com usuario e topicos relacionados'

    $post = Invoke-Api -Method PUT -Path "/api/postagens/$postId" -Body @{
        texto = 'Postagem de teste atualizada.'
        imagemUrl = 'https://example.org/imagem-demonstrativa.png'
        usuarioId = $userId
    }
    Assert-Result ($post.texto -eq 'Postagem de teste atualizada.' -and $post.topicos.Count -eq 1) 'Postagem atualizada preservando topicos'

    $topic = Invoke-Api -Method PUT -Path "/api/topicos/$topicId" -Body @{
        assuntos = @('comunicacao acessivel', 'deficiencia auditiva')
        postagemId = $postId
    }
    Assert-Result ($topic.assuntos.Count -eq 2) 'Topico atualizado'

    Invoke-Api -Method POST -Path '/api/topicos' -ExpectedStatus 400 -Body @{
        assuntos = @(';', ' ')
        postagemId = $null
    } | Out-Null
    Assert-Result $true 'Topico sem assuntos validos rejeitado'

    Invoke-Api -Method POST -Path '/api/postagens' -ExpectedStatus 403 -Body @{
        texto = 'Autor inexistente'
        usuarioId = [long]::MaxValue
    } | Out-Null
    Assert-Result $true 'Postagem atribuida a outro autor rejeitada'

    Invoke-Api -Method POST -Path '/api/topicos' -ExpectedStatus 400 -Body @{
        assuntos = @('teste')
        postagemId = [long]::MaxValue
    } | Out-Null
    Assert-Result $true 'Topico com postagem inexistente rejeitado'

    Invoke-Api -Method DELETE -Path "/api/postagens/$postId" -ExpectedStatus 204 | Out-Null
    Invoke-Api -Method GET -Path "/api/postagens/$postId" -ExpectedStatus 404 | Out-Null
    $postId = $null
    Assert-Result $true 'Postagem excluida e consulta retorna 404'

    $topic = Invoke-Api -Method GET -Path "/api/topicos/$topicId"
    Assert-Result ($null -eq $topic.postagemId) 'Topico preservado com FK nula apos exclusao da postagem'

    Invoke-Api -Method DELETE -Path "/api/topicos/$topicId" -ExpectedStatus 204 | Out-Null
    Invoke-Api -Method GET -Path "/api/topicos/$topicId" -ExpectedStatus 404 | Out-Null
    $topicId = $null
    Assert-Result $true 'Topico excluido'

    Invoke-Api -Method DELETE -Path "/api/usuarios/$userId" -ExpectedStatus 204 | Out-Null
    Invoke-Api -Method GET -Path "/api/usuarios/$userId" -ExpectedStatus 404 | Out-Null
    $userId = $null
    Assert-Result $true 'Usuario excluido'

    Write-Host "$passed verificacoes aprovadas. Registros temporarios removidos."
}
finally {
    foreach ($entry in @(@{ Resource = 'topicos'; Id = $topicId }, @{ Resource = 'postagens'; Id = $postId }, @{ Resource = 'usuarios'; Id = $userId })) {
        if ($null -ne $entry.Id) {
            try {
                Invoke-Api -Method DELETE -Path ("/api/" + $entry.Resource + '/' + $entry.Id) -ExpectedStatus 204 | Out-Null
            }
            catch {
                Write-Warning ("Nao foi possivel remover o registro temporario " + $entry.Resource + '/' + $entry.Id)
            }
        }
    }
}
