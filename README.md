# WordPress Template News Blocks

Plugin de blocos Gutenberg criado para estender o `wordpress-template-news`.

Este plugin será responsável pelos blocos editoriais customizados usados para montar páginas flexíveis em estilo news/editorial, especialmente a Home do site.

## Status atual

Bootstrap inicial.

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

## Blocos planejados

- Editorial Hero
- Plantão
- News Section
- Latest News
- Ad Placeholder
- Featured Authors

## Desenvolvimento

Instalar dependências:

```bash
npm install