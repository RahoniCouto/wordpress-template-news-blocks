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
- Latest News
- Ad Slot
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
- suporte ao conteúdo Gutenberg nativo;
- image sizes específicos quando disponíveis;
- dados editoriais do perfil de autores utilizados pelos templates e blocos.

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
- posições publicitárias manuais e AdSense;
- curadoria de autores WordPress no Featured Authors;
- assets específicos dos blocos no editor e no frontend.

Os blocos não dependem de template-parts do tema para renderizar seu conteúdo.

Quando o tema fornece image sizes específicos, o plugin pode aproveitá-los. Caso contrário, utiliza tamanhos nativos do WordPress como fallback.

A integração global com o Google AdSense, incluindo o carregamento do script global, permanece responsabilidade do site, do Site Kit ou de outra integração apropriada. O plugin é responsável apenas pelas unidades AdSense utilizadas pelo Ad Slot.

---

## Arquitetura editorial

### Ordem dos blocos como prioridade editorial

A ordem dos blocos no conteúdo Gutenberg define a prioridade das matérias.

Quando mais de um bloco editorial tenta utilizar o mesmo post, o bloco que aparece primeiro no conteúdo possui prioridade.

Exemplo:

1. Breaking News usa o post A.
2. Editorial Hero aparece depois e não pode reutilizar o post A.
3. News Section resolve seus posts excluindo A e os demais posts já consumidos.
4. Latest News também exclui tudo que foi efetivamente utilizado pelos blocos anteriores.
5. Blocos editoriais posteriores continuam respeitando as matérias já consumidas.

Essa regra é aplicada tanto no editor quanto no frontend.

Todos os blocos editoriais de notícias participam dessa coordenação no Gutenberg.

Blocos com seleção manual simples, como Editorial Hero e Breaking News, comunicam diretamente o `postId` selecionado. Blocos que resolvem matérias dinamicamente, como News Section e Latest News, utilizam `resolvedPostIds` com `role: "local"` para comunicar ao editor quais posts estão efetivamente resolvidos naquele momento.

Uma matéria só é registrada como consumida quando o bloco realmente possui condições de renderizá-la.

---

### Overrides associados à matéria

Customizações editoriais que pertencem a uma matéria são associadas ao ID do post, e não à posição temporária que ele ocupa no bloco.

Conceitualmente:

```
postOverrides[postId]
├── titleOverride
├── excerptOverride
└── imageOverrideId
```

Isso evita que uma customização criada para uma matéria seja aplicada acidentalmente a outra quando o conteúdo automático muda.

Exemplo:

- post A recebe título e imagem customizados;
- o bloco passa a exibir o post B;
- post B utiliza seus próprios valores;
- se o post A voltar a ser utilizado, seus overrides anteriores voltam com ele.

O mesmo contrato é compartilhado pelos blocos editoriais quando aplicável.

O Editorial Hero e a News Section podem utilizar título, chamada e imagem.

O Breaking News utiliza a mesma estrutura, mas atualmente consome apenas `titleOverride`, porque não possui chamada ou imagem.

O Latest News utiliza `titleOverride` e `imageOverrideId`, porque seus layouts não possuem chamada editorial.

Configurações que pertencem ao próprio bloco continuam sendo atributos do bloco.

Exemplos:

- label do Breaking News;
- posição da mídia do Editorial Hero;
- categoria e layout da News Section;
- categoria, quantidade e layout do Latest News.

---

## Política de headings editoriais

Os blocos editoriais principais participam de uma política automática de hierarquia semântica.

O editor não escolhe manualmente h1, h2 ou h3.

Blocos candidatos atualmente:

- Editorial Hero
- Breaking News
- News Section
- Latest News
- Featured Authors

A regra geral é:

- o primeiro candidato editorial principal efetivamente renderizado utiliza `h1`;
- os candidatos principais seguintes utilizam `h2`;
- títulos internos utilizam níveis derivados automaticamente do heading principal.

Isso evita que a hierarquia da página dependa de uma decisão manual do editor.

### News Section com título

Quando a News Section possui título, o título da seção representa seu heading editorial principal.

Exemplo quando é o primeiro bloco editorial:

```
H1 — Título da seção
├── H2 — Destaque
├── H2 — Secundária
├── H2 — Secundária
└── H2 — Secundária
```

Se um bloco anterior já consumiu o `h1`:

```
H2 — Título da seção
├── H3 — Destaque
├── H3 — Secundária
├── H3 — Secundária
└── H3 — Secundária
```

### News Section sem título

Quando a seção não possui título, a matéria de destaque assume o papel de heading editorial principal.

Exemplo:

```
H1 — Destaque
├── H2 — Secundária
├── H2 — Secundária
└── H2 — Secundária
```

A News Section não é renderizada se não houver uma matéria válida no slot de destaque.

Dessa forma, uma seção incompleta também não consome o heading principal nem reserva posts secundários.

### Latest News

No Latest News, o título da seção representa o heading editorial principal e os títulos das matérias utilizam o nível imediatamente abaixo.

Sem categoria, o título padrão é `Últimas notícias`. Com categoria definida, o nome da categoria é utilizado como fallback.

Se nenhuma matéria elegível estiver disponível, o bloco não é renderizado e não consome o heading principal.

### Featured Authors

No Featured Authors, o título da seção representa o heading editorial principal.

Os nomes dos autores não são headings. Eles fazem parte de uma lista de autores e permanecem como conteúdo textual dentro dos links para os respectivos archives.

Se nenhum autor elegível estiver disponível, o bloco não é renderizado e não consome o heading principal.

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
- label do link “Ver todas”;
- título da seção do Latest News;
- título e imagem das matérias do Latest News;
- título da seção do Featured Authors.

Exemplos de configurações mantidas no Inspector:

- seleção de matéria;
- modo automático ou manual;
- categoria;
- layout;
- quantidade de matérias;
- URL do link “Ver todas”;
- exibição do link “Ver todas”;
- posição da mídia;
- tipo, placement e formato do Ad Slot;
- quantidade e seleção dos autores do Featured Authors.

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
- `AuthorPicker`

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

A News Section possui duas variações visuais.

**Layout 1**

- imagem da matéria principal à esquerda;
- conteúdo principal à direita;
- três matérias secundárias;
- composição adaptada conforme a largura disponível.

**Layout 2**

- conteúdo da matéria principal à esquerda;
- imagem principal à direita;
- três matérias secundárias;
- composição adaptada conforme a largura disponível.

Os dois layouts respondem à largura real disponível no próprio bloco utilizando Container Queries, sem depender de uma composição estrutural específica da página.

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

### Latest News

Listagem cronológica de notícias recentes com seleção exclusivamente automática.

Características:

- bloco dinâmico;
- quantidade configurável entre 3 e 5 matérias;
- quantidade padrão de 4 matérias;
- categoria opcional;
- posts recentes ordenados por data e ID de forma determinística;
- prevenção de repetição com blocos editoriais anteriores;
- título padrão `Últimas notícias` quando não existe categoria;
- nome da categoria como título padrão quando uma categoria está definida;
- título da seção customizável inline;
- título das matérias customizável inline;
- imagem editorial customizável por matéria;
- overrides associados ao ID da matéria;
- link `Ver todas` opcional;
- archive da categoria como destino automático quando existe categoria;
- URL manual para `Ver todas` quando não existe categoria;
- layout Horizontal;
- layout Vertical;
- responsividade interna orientada à largura do próprio bloco com Container Queries;
- participação automática na hierarquia de headings;
- renderização dinâmica em PHP.

No layout Horizontal, cada item apresenta imagem, categoria, título e data.

No layout Vertical, cada item apresenta imagem, título e data.

Posts sem imagem destacada continuam elegíveis. O editor pode fornecer uma imagem customizada apenas para aquela ocorrência através de `imageOverrideId`.

O Latest News utiliza `resolvedPostIds` com `role: "local"` para comunicar ao Gutenberg quais matérias foram resolvidas automaticamente. No frontend, os posts são resolvidos novamente a partir da configuração persistida e do contexto editorial corrente.

---

### Ad Slot

Posição publicitária reutilizável dentro da composição Gutenberg.

Características:

- bloco dinâmico;
- tipos `manual` e `adsense`;
- placement `horizontal` ou `rectangle`;
- formatos publicitários predefinidos;
- anúncio Manual com imagem e URL opcional;
- links manuais clicáveis com `rel="sponsored"`;
- configuração global do AdSense Client ID;
- Ad Slot ID configurado por ocorrência;
- preview do AdSense no Gutenberg sem carregar anúncios reais;
- integração independente do Site Kit;
- script global do AdSense não é carregado pelo bloco;
- identificação visual `Publicidade`;
- formatos adaptados à largura disponível com Container Queries;
- imagens manuais preservadas com `object-fit: contain`;
- não participa da seleção ou deduplicação de matérias;
- não participa da hierarquia de headings.

Formatos disponíveis no MVP:

**Horizontal**

- Mobile Banner — 320 × 50
- Large Mobile Banner — 320 × 100
- Leaderboard — 728 × 90
- Super Leaderboard — 970 × 90
- Billboard — 970 × 250

**Rectangle**

- Medium Rectangle — 300 × 250

Quando a dimensão nominal de um formato não cabe no container disponível, o Ad Slot reduz sua geometria proporcionalmente sem trocar automaticamente o formato escolhido.

No modo Manual, a imagem é contida dentro da geometria do formato sem crop ou distorção.

No modo AdSense, a unidade continua responsiva e utiliza o placement como `data-ad-format`. O carregamento global do AdSense permanece responsabilidade do site.

O AdSense Client ID pode ser configurado em **Configurações → WordPress Template News Blocks**.

---

### Featured Authors

Seção editorial para destacar autores e colunistas reais do WordPress através de curadoria manual.

Características:

- bloco dinâmico;
- seleção manual e ordenada de autores;
- quantidade configurável entre 3 e 5 autores;
- quantidade padrão de 5 autores;
- prevenção de repetição do mesmo autor dentro da própria ocorrência do bloco;
- usuários elegíveis precisam possuir ao menos uma matéria `post` publicada;
- utiliza `display_name` como nome do autor;
- utiliza a foto editorial fornecida pelo tema quando disponível;
- utiliza o avatar nativo do WordPress como fallback;
- utiliza iniciais como fallback visual quando nenhuma imagem está disponível;
- utiliza o cargo editorial do perfil do autor quando disponível;
- conta dinamicamente apenas posts `post` publicados;
- singularização e pluralização de `matéria` e `matérias`;
- cada card direciona para o archive individual do autor;
- título padrão `Nossos principais autores`;
- título da seção customizável inline;
- link `Ver todas` opcional;
- URL de `Ver todas` configurada manualmente;
- responsividade orientada à largura real do próprio bloco com Container Queries;
- 1 coluna em containers estreitos;
- 2 colunas a partir de 36rem;
- 4 colunas a partir de 48rem;
- em 64rem ou mais, utiliza uma coluna por autor efetivamente renderizado, até o limite de 5;
- participação automática na hierarquia de headings;
- não participa da seleção ou deduplicação de matérias;
- renderização dinâmica em PHP.

O Featured Authors não cria CPT, sistema próprio de usuários, ranking de autores ou contexto global de deduplicação entre blocos de autores.

Os dados editoriais do perfil pertencem ao tema e ao usuário WordPress. O bloco persiste apenas a configuração editorial da ocorrência, como IDs selecionados, quantidade, título e link `Ver todas`. Nome, foto, cargo, archive e contagem de matérias são resolvidos dinamicamente.

---

## Renderização dinâmica

Os seis blocos disponíveis atualmente são dinâmicos.

O conteúdo final não é salvo como HTML estático no post.

Cada bloco possui um `render.php` responsável por validar seus atributos e gerar o markup final.

Nos blocos editoriais de notícias, a renderização também é responsável, quando aplicável, por:

- validar os posts utilizados;
- aplicar overrides;
- respeitar o contexto de posts já consumidos;
- definir a hierarquia semântica.

No Ad Slot, a renderização decide entre anúncio Manual e unidade AdSense e não participa do contexto editorial de posts ou headings.

No Featured Authors, a renderização resolve os usuários selecionados, seus dados editoriais atuais, avatar, contagem de matérias e archive individual. O bloco não participa do contexto editorial de posts.

Os arquivos dentro de `build/` são artefatos gerados e não devem ser editados manualmente.

Alterações devem ser realizadas em `src/` e posteriormente compiladas.

---

## Estrutura principal

```
wordpress-template-news-blocks.php

inc/
├── blocks.php
├── editorial-post-overrides.php
├── heading-context.php
├── post-context.php
├── post-selection.php
├── settings.php
└── setup.php

src/
├── blocks/
│   ├── ad-slot/
│   ├── breaking-news/
│   ├── editorial-hero/
│   ├── featured-authors/
│   ├── latest-news/
│   └── news-section/
│
├── components/
│   ├── author-picker/
│   ├── category-picker/
│   ├── editorial-post-slot-control/
│   ├── editorial-text-override-control/
│   ├── media-override-control/
│   └── post-picker/
│
├── hooks/
│   ├── use-latest-news-posts/
│   ├── use-news-section-posts/
│   └── use-previous-editorial-post-ids/
│
└── utils/
    └── editorial-post-overrides.js

build/
└── blocks/
```

---

## Desenvolvimento

Instalar dependências: `npm install`

Rodar o build em modo de desenvolvimento: `npm run start`

Gerar o build de produção: `npm run build`

Verificar JavaScript: `npm run lint:js`

Aplicar a formatação disponibilizada pelo `@wordpress/scripts`: `npm run format`
