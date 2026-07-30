# Simulador de Orçamentos PRODEPA

Versão **1.2.1 — estrutura reorganizada**.

O projeto foi separado por responsabilidade para facilitar manutenção, publicação e futuras evoluções.

## Estrutura

```text
site-orcamento-dco/
├── frontend/                 Site executado no navegador
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── dados/
├── apps-script/              API do Google Sheets
│   ├── Code.gs
│   ├── appsscript.json
│   └── README.md
├── planilhas/                Planilha-base e correções locais
├── scripts/                  Conversor da planilha para bootstrap.js
├── docs/                     Documentação técnica e atualização
├── .github/workflows/        Publicação automática no GitHub Pages
├── requirements.txt
└── CHANGELOG.md
```

## Abrir por duplo clique

1. Extraia o arquivo ZIP.
2. Abra a pasta `frontend`.
3. Dê duplo clique em `index.html`.

A integração em `file://` usa JSONP e mantém a base local como contingência.

## Atualizar somente o site

Arquivos de interface, módulos e estilos ficam em `frontend/`.
Alterações nessa pasta **não exigem nova implantação do Apps Script**.

## Atualizar o Apps Script

Somente é necessária nova implantação quando houver alteração em:

- `apps-script/Code.gs`;
- `apps-script/appsscript.json`;
- endpoints ou formato da API.

Consulte `docs/ATUALIZACAO.md` e `apps-script/README.md`.

## Atualizar a planilha-base do repositório

1. Substitua `planilhas/simulador-base.xlsx`.
2. Faça commit e push.
3. O workflow gera `frontend/dados/bootstrap.js` e publica o site.

## GitHub Pages

Em **Settings → Pages**, selecione **GitHub Actions**. O workflow publica apenas o conteúdo de `frontend/`, mantendo a URL do site sem `/frontend`.

## Armazenamento dos orçamentos

Os orçamentos são gravados no `localStorage` do navegador. Eles permanecem no mesmo navegador e computador, mas não são compartilhados entre dispositivos.
