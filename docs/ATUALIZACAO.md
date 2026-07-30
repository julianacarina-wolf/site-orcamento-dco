# Guia de atualização

## Versão 1.2.1

**Apps Script alterado:** não  
**Nova implantação do Apps Script:** não  
**Mudança principal:** reorganização de pastas e ajuste do workflow do GitHub Pages.

## Quando atualizar apenas o frontend

Substitua ou envie ao GitHub os arquivos dentro de `frontend/`.
Não é necessário mexer no Google Apps Script.

## Quando fazer nova implantação do Apps Script

Faça uma nova implantação somente quando o conteúdo de `apps-script/Code.gs` ou `apps-script/appsscript.json` for alterado.

Passos:

1. Abra o projeto no Google Apps Script.
2. Substitua o código pelos arquivos da pasta `apps-script/`.
3. Acesse **Implantar → Gerenciar implantações**.
4. Clique em **Editar**.
5. Selecione **Nova versão**.
6. Clique em **Implantar**.
7. Confirme se a URL `/exec` continua igual; se mudar, atualize `frontend/js/google-sheets-config.js`.

## Teste local

Abra `frontend/index.html` com duplo clique e confirme:

- carregamento dos clientes;
- seleção dos contatos;
- botão Atualizar planilha;
- salvamento e abertura de orçamento;
- impressão/PDF.

## Publicação no GitHub

O workflow converte a planilha e publica o conteúdo de `frontend/` automaticamente. A pasta `frontend` não aparece na URL pública.
