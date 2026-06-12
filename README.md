# WordPress Template News Blocks

Plugin de blocos Gutenberg criado para estender o `wordpress-template-news`.

Este plugin será responsável pelos blocos editoriais customizados usados para montar páginas flexíveis em estilo news/editorial, especialmente a Home do site.

---

## Status atual

Plugin funcional com blocos editoriais dinâmicos já implementados.

Blocos disponíveis:

- Editorial Hero
- Breaking News

Blocos planejados:

- News Section
- Latest News
- Ad Placeholder
- Featured Authors

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

Este plugin é responsável por:

- blocos Gutenberg editoriais customizados;
- metadados dos blocos;
- controles no editor;
- lógica editorial de seleção de posts;
- renderização dinâmica quando necessário;
- assets específicos dos blocos no editor e no frontend.

---

## Política de headings editoriais

Os blocos editoriais principais participam de uma política automática de hierarquia semântica.

O editor não escolhe manualmente h1, h2 ou h3.

A regra atual é:

- o primeiro bloco editorial candidato renderizado no conteúdo principal usa h1;
- os demais blocos editoriais candidatos usam h2;
- títulos internos de cards/seções futuras devem usar um nível abaixo do título principal da seção.

Blocos candidatos atualmente:

- Editorial Hero
- Breaking News

Essa decisão evita que editores quebrem a hierarquia da página ao montar a Home no Gutenberg.

---

## Blocos disponíveis

### Editorial Hero

Bloco editorial de destaque para a Home.

Características:

- bloco dinâmico;
- seleção manual de post;
- título vindo do post por padrão;
- override customizado de título;
- chamada/excerpt vindo do post por padrão;
- override customizado de chamada;
- imagem destacada do post por padrão;
- override de imagem;
- suporte a posição da mídia;
- link automático para o post;
- suporte a alignwide;
- CSS Grid interno próprio;
- renderização dinâmica em PHP.

O bloco não depende da grid global do tema e não usa template-parts do tema.

---

### Breaking News

Barra editorial de urgência para destacar uma matéria selecionada manualmente.

Características:

- bloco dinâmico;
- seleção manual de post;
- headline vinda do post por padrão;
- override customizado de headline;
- label padrão Breaking News;
- label customizável;
- link automático para o post;
- tempo relativo/data do post;
- sem imagem;
- sem ticker;
- sem carrossel;
- sem múltiplos itens;
- suporte a alignwide;
- renderização dinâmica em PHP.

A headline participa da política automática de h1 / h2.

O label Breaking News é visual/editorial e não é usado como heading semântico.

## Desenvolvimento

Instalar dependências:

```bash
npm install
```

Rodar build de desenvolvimento:

```bash
npm run start
```

Gerar build de produção:

```bash
npm run build
```