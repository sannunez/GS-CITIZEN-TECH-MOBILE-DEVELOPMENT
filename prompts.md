# Prompts de apoio ao aprendizado

**Projeto:** AJA, Global Solution CitizenTech 2026, Mobile Development & IOT.

Este documento reúne nove exemplos propostos de prompts para estudo e orientação no contexto do componente mobile da AJA. As perguntas tratam da compreensão do enunciado, do funcionamento das tecnologias e da verificação do aplicativo, sem solicitar a produção de código ou a execução do trabalho pela ferramenta.

Os exemplos não foram extraídos da conversa de desenvolvimento e não representam um histórico real ou completo de utilização de IA. Os campos de aplicação da resposta e validação descrevem possibilidades de uso e formas de conferência, não atividades realizadas a partir dessas consultas.

## 1. Compreensão do enunciado

**Ferramenta utilizada:** ChatGPT, como ferramenta sugerida para a consulta.

**Objetivo:** Entender o que a disciplina de Mobile solicita para a Global Solution.

**Prompt:**

> Leia o documento da GS que anexei e me explique o que preciso entregar em Mobile. Quais tecnologias são citadas? Preciso incluir prints e vídeo? Quero entender os requisitos para organizar meu trabalho.

**Aplicação da resposta:** Uso previsto: organizar uma lista de requisitos e distinguir as funcionalidades do aplicativo dos materiais necessários para a entrega.

**Validação:** Conferir as orientações diretamente na seção Mobile Development & IOT do documento e na tarefa da disciplina, verificando duração do vídeo, conteúdo do README e formato de envio.

## 2. Reaproveitamento do aplicativo na web

**Ferramenta utilizada:** ChatGPT, como ferramenta sugerida para a consulta.

**Objetivo:** Compreender as possibilidades de executar o projeto Mobile no navegador.

**Prompt:**

> Estou usando React Native com Expo. Consigo aproveitar esse mesmo projeto para abrir a AJA como uma aplicação web? O que pode funcionar igual e o que preciso conferir nas telas e na navegação?

**Aplicação da resposta:** Uso previsto: entender quais partes podem ser compartilhadas e quais diferenças de comportamento precisam ser avaliadas no navegador.

**Validação:** Consultar a documentação das tecnologias usadas e comparar a execução no navegador e no emulador, observando navegação, imagens, formulários e adaptação ao tamanho da tela.

## 3. Integração do frontend com um backend em C#

**Ferramenta utilizada:** ChatGPT, como ferramenta sugerida para a consulta.

**Objetivo:** Entender a comunicação com uma API em C# a partir da experiência anterior com Java.

**Prompt:**

> É a primeira vez que desenvolvo um backend em C#, antes eu usava Java. Como faço a comunicação do frontend em React Native com essa API? Muda alguma coisa na forma de enviar os dados e receber a resposta? O que preciso conferir no endereço, nas rotas e no login para os dois funcionarem juntos? Me explique as diferenças para eu conseguir fazer essa integração.

**Aplicação da resposta:** Uso previsto: distinguir as diferenças na organização do backend dos conceitos de requisição HTTP, métodos, dados em JSON e autenticação utilizados pelo frontend.

**Validação:** Comparar as rotas e os dados documentados no Swagger com as requisições feitas pelo aplicativo. Conferir os códigos de resposta e observar se os dados enviados e recebidos correspondem ao esperado, sem expor senhas ou tokens nos registros.

## 4. Comunicação entre o emulador e o backend

**Ferramenta utilizada:** ChatGPT, como ferramenta sugerida para a consulta.

**Objetivo:** Entender uma falha de comunicação entre o aplicativo e a API local.

**Prompt:**

> Meu backend abre no navegador do computador, mas o aplicativo no emulador Android não consegue conectar. Por onde começo a conferir? O endereço localhost significa a mesma coisa no computador e no emulador?

**Aplicação da resposta:** Uso previsto: orientar a investigação do endereço da API, da porta de execução e da diferença entre o computador e o dispositivo emulado.

**Validação:** Comparar o endereço configurado no frontend com o endereço exibido pelo backend e consultar a documentação do emulador antes de alterar a configuração.

## 5. Entendimento da resposta do ViaCEP

**Ferramenta utilizada:** ChatGPT, como ferramenta sugerida para a consulta.

**Objetivo:** Aprender como uma consulta de CEP fornece os dados para o formulário de denúncia.

**Prompt:**

> Quero entender como funciona o ViaCEP. Ele devolve o endereço inteiro em um texto ou separa rua, bairro, cidade e estado? Ele também informa o número da casa? Como posso conferir o que veio na resposta?

**Aplicação da resposta:** Uso previsto: compreender o formato JSON e identificar quais informações vêm do serviço e quais precisam ser preenchidas pelo usuário.

**Validação:** Consultar a documentação do ViaCEP e observar respostas para um CEP válido e um CEP inexistente, conferindo os nomes dos campos e a ausência do número do imóvel.

## 6. Preferências e persistência de dados

**Ferramenta utilizada:** ChatGPT, como ferramenta sugerida para a consulta.

**Objetivo:** Diferenciar o estado da interface, o armazenamento local e o banco de dados.

**Prompt:**

> Se o usuário ativar o modo escuro e fechar o aplicativo, como essa escolha pode continuar salva? Qual é a diferença entre usar um Context, salvar no aparelho e salvar no banco? Quero entender quando cada um faz sentido.

**Aplicação da resposta:** Uso previsto: compreender o papel do contexto no compartilhamento das preferências e a diferença entre manter uma informação em memória e persistir seus dados.

**Validação:** Comparar o comportamento ao navegar entre telas e ao fechar e reabrir o aplicativo. Conferir no código quais informações são armazenadas localmente e quais são enviadas ao backend.

## 7. Context com AsyncStorage

**Ferramenta utilizada:** ChatGPT, como ferramenta sugerida para a consulta.

**Objetivo:** Relembrar como compartilhar dados entre telas e manter as preferências salvas ao fechar o aplicativo.

**Prompt:**

> Não lembro exatamente como usar um Context com AsyncStorage. Pode me explicar como os dois trabalham juntos para manter dados e preferências, como modo escuro e tamanho do texto? Onde entra o Provider e como outra tela acessa ou altera esses valores? Quero entender a sequência para implementar por conta própria.

**Aplicação da resposta:** Uso previsto: revisar a criação e o consumo do contexto, a recuperação das preferências ao iniciar o aplicativo e o salvamento quando o usuário altera uma opção.

**Validação:** Conferir a explicação com a documentação de React e AsyncStorage. Na implementação da equipe, alterar uma preferência, navegar entre telas e fechar e reabrir o aplicativo, verificando se a escolha continua aplicada.

## 8. Verificação da acessibilidade e dos erros

**Ferramenta utilizada:** ChatGPT, como ferramenta sugerida para a consulta.

**Objetivo:** Aprender a verificar se as telas são compreensíveis e se os erros recebem tratamento adequado.

**Prompt:**

> Como posso testar se meu aplicativo está fácil de usar para uma pessoa cega ou com baixa visão? O que devo observar ao usar o TalkBack e aumentar as letras? Também quero saber quais situações simples posso testar no login e no cadastro de denúncias, como deixar um campo vazio ou informar um CEP errado.

**Aplicação da resposta:** Uso previsto: organizar uma revisão manual da leitura dos controles, da navegação, do tamanho dos textos e das mensagens apresentadas ao usuário.

**Validação:** Percorrer as telas com o leitor de tela, conferir contraste e ampliação de fonte e registrar o comportamento de campos vazios, credenciais inválidas, CEP inexistente e falha de conexão. Comparar os resultados com o comportamento esperado.

## 9. Revisão do projeto antes da entrega

**Ferramenta utilizada:** ChatGPT, como ferramenta sugerida para a consulta.

**Objetivo:** Orientar uma conferência dos requisitos e identificar possíveis pendências ou erros antes do envio.

**Prompt:**

> Compare meu projeto Mobile com o enunciado da GS. Ele está atendendo ao que foi solicitado? O que ainda falta na aplicação e nos materiais de entrega? Existem erros ou pontos que eu preciso conferir? Separe o que você conseguiu verificar do que depende de executar o app ou consultar a tarefa do professor. Quero uma revisão com explicações para eu mesmo fazer os ajustes necessários.

**Aplicação da resposta:** Uso previsto: organizar uma lista de conferência, relacionar as funcionalidades aos requisitos e priorizar os pontos que precisam de revisão pela equipe.

**Validação:** Conferir cada apontamento no enunciado, na tarefa da disciplina e no projeto. Executar os fluxos principais, verificar a persistência dos dados e revisar README, prints e acesso ao vídeo. Registrar os resultados observados, sem tratar a análise da ferramenta como garantia de atendimento integral ou de nota.

## Orientação para utilização

As sugestões devem ser avaliadas pela equipe e confrontadas com o enunciado, a documentação técnica e o comportamento observado no aplicativo. A responsabilidade pelas decisões, pela implementação e pela explicação do projeto permanece com os integrantes.

Para utilizar este arquivo como registro de consultas efetivamente realizadas, substitua os exemplos pelos prompts realmente enviados e preencha aplicação e validação somente com o que tiver ocorrido. Este conjunto de exemplos, por si só, não comprova o histórico de uso de IA no desenvolvimento.
