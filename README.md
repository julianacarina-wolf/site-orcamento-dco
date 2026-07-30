# Simulador de Orçamentos PRODEPA

Projeto estático modular preparado para GitHub Pages.

## Estrutura

- `index.html`: interface principal.
- `css/`: estilos de tela e impressão.
- `js/`: módulos separados de infraestrutura, cálculos, tabelas, armazenamento e interface.
- `dados/`: base gerada da planilha (`data.js` e `pricing.js`).
- `planilhas/`: planilha oficial e correções emergenciais.
- `scripts/`: conversor da planilha.
- `.github/workflows/`: atualização automática e publicação.

## Atualizar a base

1. Substitua `planilhas/simulador-base.xlsx`.
2. Faça o commit no GitHub.
3. O workflow converte a planilha, atualiza `dados/` e publica o site.

Para uma correção pontual de última milha, edite `planilhas/overrides.json`.

## Publicar

Em **Settings → Pages**, selecione **GitHub Actions**. Depois faça um commit ou execute manualmente o workflow na aba **Actions**.

## Integração com Google Sheets

Esta versão inclui o Módulo 1 de integração com a planilha mestre por Google Apps Script.

Publicação e configuração:

1. consulte `apps-script/README.md`;
2. publique o Apps Script;
3. copie a URL `/exec`;
4. informe-a em `js/google-sheets-config.js`;
5. publique o projeto no GitHub Pages.

O sistema mantém os arquivos estáticos como contingência e utiliza cache local quando a API estiver temporariamente indisponível.
