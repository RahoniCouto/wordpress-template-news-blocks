# WordPress Template News Blocks

Plugin de blocos Gutenberg criado para estender o `wordpress-template-news`.

Este plugin será responsável pelos blocos editoriais customizados usados para montar páginas flexíveis em estilo news/editorial, especialmente a Home do site.

O projeto faz parte de um estudo prático de arquitetura WordPress voltado a portais e sites editoriais, com foco em blocos dinâmicos, experiência de edição no Gutenberg, semântica, reutilização de componentes e separação clara de responsabilidades entre tema e plugin.

---

## Status atual

Plugin funcional com blocos editoriais dinâmicos já implementados.

Blocos disponíveis:

- Editorial Hero
- Breaking News
- News Section

Blocos planejados:

- Latest News
- Ad Placeholder
- Featured Authors

Requisitos mínimos:

- WordPress 6.7+
- PHP 8.1+
- Node.js compatível com `@wordpress/scripts`

---

## Fronteira de responsabilidade

O tema `wordpress-template-news` é responsável por:

- templates WordPress;
- Template Hierarchy;
- estrutura visual do frontend;
- estilos globais do tema;
- `theme.json`;
- estilos base do editor;
- suporte ao conteúdo Gutenberg nativo.
- image sizes específicos quando disponíveis.

Este plugin é responsável por:

- blocos Gutenberg editoriais customizados;
- metadados e atributos dos blocos;
- experiência de edição;
- seleção editorial de posts;
- resolução automática ou manual de conteúdo;
- prevenção de repetição de matérias entre blocos editoriais;
- overrides editoriais de título, chamada e imagem;
- renderização dinâmica;
- semântica dos headings editoriais;
- assets específicos dos blocos no editor e no frontend.

Os blocos não dependem de template-parts do tema para renderizar seu conteúdo.

Quando o tema fornece image sizes específicos, o plugin pode aproveitá-los. Caso contrário, utiliza tamanhos nativos do WordPress como fallback.

---

## Arquitetura editorial

### Ordem dos blocos como prioridade editorial

A ordem dos blocos no conteúdo Gutenberg define a prioridade das matérias.

Quando mais de um bloco editorial tenta utilizar o mesmo post, o bloco que aparece primeiro no conteúdo possui prioridade.

Exemplo:

1. Breaking News usa o post A.
2. Editorial Hero aparece depois e não pode reutilizar o post A.
3. News Section resolve seus posts excluindo A e os demais posts já consumidos.
4. Uma segunda News Section também exclui tudo que foi efetivamente utilizado pelos blocos anteriores.

Essa regra é aplicada tanto no editor quanto no frontend.

Uma matéria só é registrada como consumida quando o bloco realmente possui condições de renderizá-la.

---

### Overrides associados à matéria

Customizações editoriais que pertencem a uma matéria são associadas ao ID do post, e não à posição temporária que ele ocupa no bloco.

Conceitualmente:

    postOverrides[postId]
    ├── titleOverride
    ├── excerptOverride
    └── imageOverrideId

Isso evita que uma customização criada para uma matéria seja aplicada acidentalmente a outra quando o conteúdo automático muda.

Exemplo:

- post A recebe título e imagem customizados;
- o bloco passa a exibir o post B;
- post B utiliza seus próprios valores;
- se o post A voltar a ser utilizado, seus overrides anteriores voltam com ele.

O mesmo contrato é compartilhado pelo Editorial Hero e pela News Section.

O Breaking News utiliza a mesma estrutura, mas atualmente consome apenas `titleOverride`, porque não possui chamada ou imagem.

Configurações que pertencem ao próprio bloco continuam sendo atributos do bloco.

Exemplos:

- label do Breaking News;
- posição da mídia do Editorial Hero;
- categoria e layout da News Section.

---

## Política de headings editoriais

Os blocos editoriais principais participam de uma política automática de hierarquia semântica.

O editor não escolhe manualmente h1, h2 ou h3.

Blocos candidatos atualmente:

- Editorial Hero
- Breaking News
- News Section

A regra geral é:

- o primeiro candidato editorial principal efetivamente renderizado utiliza `h1`;
- os candidatos principais seguintes utilizam `h2`;
- títulos internos utilizam níveis derivados automaticamente do heading principal.

Isso evita que a hierarquia da página dependa de uma decisão manual do editor.

### News Section com título

Quando a News Section possui título, o título da seção representa seu heading editorial principal.

Exemplo quando é o primeiro bloco editorial:

    H1 — Título da seção
    ├── H2 — Destaque
    ├── H2 — Secundária
    ├── H2 — Secundária
    └── H2 — Secundária

Se um bloco anterior já consumiu o `h1`:

    H2 — Título da seção
    ├── H3 — Destaque
    ├── H3 — Secundária
    ├── H3 — Secundária
    └── H3 — Secundária

### News Section sem título

Quando a seção não possui título, a matéria de destaque assume o papel de heading editorial principal.

Exemplo:

    H1 — Destaque
    ├── H2 — Secundária
    ├── H2 — Secundária
    └── H2 — Secundária

A News Section não é renderizada se não houver uma matéria válida no slot de destaque.

Dessa forma, uma seção incompleta também não consome o heading principal nem reserva posts secundários.

---

## Experiência de edição

O plugin segue a seguinte regra de interface:

**Conteúdo visual é editado preferencialmente diretamente no canvas. Configurações estruturais permanecem no Inspector.**

Exemplos de conteúdo editável diretamente na prévia:

- título de matéria;
- chamada editorial;
- imagem editorial;
- headline do Breaking News;
- label do Breaking News;
- título da News Section;
- label do link “Ver todas”.

Exemplos de configurações mantidas no Inspector:

- seleção de matéria;
- modo automático ou manual;
- categoria;
- layout;
- URL do link “Ver todas”;
- posição da mídia.

Componentes editoriais reutilizáveis são compartilhados entre os blocos para manter comportamento consistente.

---

## Componentes compartilhados

O plugin possui componentes reutilizáveis para responsabilidades editoriais específicas.

Entre eles:

- `PostPicker`
- `CategoryPicker`
- `MediaOverrideControl`
- `EditorialTextOverrideControl`
- `EditorialPostSlotControl`

Esses componentes não determinam o layout final dos blocos.

Cada bloco continua responsável pelo próprio markup e composição visual.

---

## Blocos disponíveis

### Editorial Hero

Bloco editorial de grande destaque.

Características:

- bloco dinâmico;
- seleção manual de uma matéria;
- prevenção de repetição com blocos editoriais anteriores;
- título original como fallback;
- título customizável inline;
- chamada original como fallback;
- chamada customizável inline;
- imagem destacada como fallback;
- imagem customizável inline;
- overrides associados ao ID da matéria;
- posição da mídia à esquerda ou à direita;
- link automático para o post;
- categoria e data da matéria;
- suporte a `alignwide`;
- participação automática na hierarquia de headings;
- renderização dinâmica em PHP.

Blocos antigos que utilizavam atributos individuais de override continuam possuindo compatibilidade durante a migração para `postOverrides`.

---

### Breaking News

Barra editorial de urgência para destacar uma matéria selecionada manualmente.

Características:

- bloco dinâmico;
- seleção manual de uma matéria;
- prevenção de repetição com blocos editoriais anteriores;
- headline original como fallback;
- headline customizável inline;
- override associado ao ID da matéria;
- label padrão `Breaking News`;
- label customizável inline;
- link automático para o post;
- tempo relativo para publicações recentes;
- data para publicações mais antigas;
- sem imagem;
- sem ticker;
- sem carrossel;
- sem múltiplos itens;
- suporte a `alignwide`;
- participação automática na hierarquia de headings;
- renderização dinâmica em PHP.

O label é um elemento visual/editorial e não participa da hierarquia semântica de headings.

Blocos antigos com `titleOverride` continuam compatíveis durante a migração para `postOverrides`.

---

### News Section

Seção editorial composta por uma matéria de destaque e três matérias secundárias.

A estrutura possui quatro slots fixos:

1. Destaque
2. Secundária 1
3. Secundária 2
4. Secundária 3

A matéria de destaque é obrigatória para que a seção seja renderizada.

#### Categoria opcional

A seção pode ou não estar associada a uma categoria.

Com categoria:

- o nome da categoria é usado como título da seção por padrão;
- o título pode ser customizado;
- posts automáticos pertencem à categoria selecionada;
- substituições manuais também ficam limitadas à categoria;
- o link “Ver todas” utiliza a archive da categoria por padrão.

Sem categoria:

- o título da seção é opcional;
- posts automáticos podem vir de qualquer categoria;
- substituições manuais podem utilizar qualquer post elegível;
- não existe URL automática para “Ver todas”;
- o editor pode fornecer uma URL manual.

#### Seleção automática

No modo automático, slots sem substituição manual recebem os posts publicados mais recentes que ainda estão disponíveis para a seção.

A ordenação é determinística:

- data decrescente;
- ID decrescente como critério de desempate.

Posts utilizados por blocos editoriais anteriores são excluídos da resolução.

#### Seleção manual

No modo manual, cada slot pode ser definido individualmente.

Slots vazios permanecem vazios e não são preenchidos automaticamente.

A posição dos slots é preservada.

#### Overrides

Cada post utilizado pela seção pode possuir:

- título editorial;
- chamada editorial;
- imagem editorial.

Os overrides são associados ao ID da matéria.

Atualmente a chamada é exibida visualmente apenas na matéria de destaque.

Se uma matéria secundária possuir um `excerptOverride`, o valor continua preservado e volta a ser utilizado caso a matéria passe a ocupar o destaque.

#### Layouts

A News Section possui duas variações de desktop.

**Layout 1**

- imagem da matéria principal à esquerda;
- conteúdo principal à direita;
- três matérias secundárias em colunas;
- imagem à esquerda e conteúdo à direita dentro de cada card secundário.

**Layout 2**

- conteúdo da matéria principal à esquerda;
- imagem principal à direita;
- três matérias secundárias em colunas;
- imagem acima e conteúdo abaixo dentro de cada card secundário.

No mobile, os dois layouts convergem para:

- destaque empilhado;
- imagem acima do conteúdo principal;
- matérias secundárias compactas;
- imagem à esquerda;
- conteúdo à direita.

#### Estado local do editor

A News Section utiliza `resolvedPostIds` para comunicar ao Gutenberg quais posts estão efetivamente resolvidos naquele momento.

Esse atributo possui `role: "local"` e existe apenas para coordenação da experiência de edição.

Ele não representa a fonte de verdade do frontend e não deve ser persistido como configuração editorial.

No frontend, os posts são resolvidos novamente a partir de:

- categoria;
- modo de seleção;
- slots configurados;
- posts já consumidos anteriormente.

---

## Renderização dinâmica

Os três blocos disponíveis atualmente são dinâmicos.

O conteúdo final não é salvo como HTML estático no post.

Cada bloco possui um `render.php` responsável por:

- validar seus atributos;
- validar os posts utilizados;
- aplicar overrides;
- respeitar o contexto de posts já consumidos;
- definir a hierarquia semântica;
- gerar o markup final.

Os arquivos dentro de `build/` são artefatos gerados e não devem ser editados manualmente.

Alterações devem ser realizadas em `src/` e posteriormente compiladas.

---

## Estrutura principal

    wordpress-template-news-blocks.php

    inc/
    ├── blocks.php
    ├── editorial-post-overrides.php
    ├── heading-context.php
    ├── post-context.php
    ├── post-selection.php
    └── setup.php

    src/
    ├── blocks/
    │   ├── breaking-news/
    │   ├── editorial-hero/
    │   └── news-section/
    │
    ├── components/
    │   ├── category-picker/
    │   ├── editorial-post-slot-control/
    │   ├── editorial-text-override-control/
    │   ├── media-override-control/
    │   └── post-picker/
    │
    ├── hooks/
    │   ├── use-news-section-posts/
    │   └── use-previous-editorial-post-ids/
    │
    └── utils/
        └── editorial-post-overrides.js

    build/
    └── blocks/

---

## Desenvolvimento

Instalar dependências: `npm install`

Rodar o build em modo de desenvolvimento: `npm run start`

Gerar o build de produção: `npm run build`

Verificar JavaScript: `npm run lint:js`

Aplicar a formatação disponibilizada pelo `@wordpress/scripts`: `npm run format`

Atualizar os pacotes WordPress utilizados no projeto: `npm run packages-update`

---

## Fluxo de alteração

O fluxo esperado para alterações nos blocos é:

1. modificar arquivos em `src/` ou helpers em `inc/`;
2. executar o lint;
3. gerar novamente o build;
4. validar os arquivos PHP;
5. verificar whitespace e diferenças acidentais;
6. testar editor e frontend.

O diretório `build/` deve permanecer sincronizado com `src/`, mas nunca ser tratado como fonte de implementação.

---

## Validação recomendada

Antes de concluir uma alteração relevante:

- `npm run lint:js`
- `npm run build`
- `git diff --check`
- executar `php -l` nos arquivos PHP alterados;
- validar o comportamento dos blocos no Gutenberg;
- validar a renderização no frontend;
- testar a ordem dos blocos quando houver deduplicação editorial;
- conferir a hierarquia de headings gerada.
