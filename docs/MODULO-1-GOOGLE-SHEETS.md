# Módulo 1 — Integração com Google Sheets

## Arquitetura

Google Sheets → Google Apps Script → JSON → navegador → cache local.

A planilha é a fonte principal. Os arquivos `dados/data.js` e `dados/pricing.js` continuam no projeto como contingência para a primeira abertura sem internet.

## Dados sincronizados

- clientes;
- contatos;
- municípios;
- regiões e infraestrutura;
- serviços de TI;
- preços de Link de Dados;
- configurações de cálculo;
- faixas de desconto;
- reajustes;
- dados auxiliares de implantação.

## Publicação do Apps Script

1. Na planilha, abra **Extensões → Apps Script**.
2. Substitua o conteúdo do editor pelo arquivo `apps-script/Code.gs`.
3. Salve o projeto.
4. Clique em **Implantar → Nova implantação**.
5. Tipo: **Aplicativo da Web**.
6. Executar como: **Você**.
7. Acesso: **Qualquer pessoa**.
8. Autorize e copie a URL terminada em `/exec`.

A URL desta implantação já está informada em `js/google-sheets-config.js`.

## Atualizações do código do Apps Script

Sempre que o arquivo `Code.gs` for alterado:

1. abra **Implantar → Gerenciar implantações**;
2. edite a implantação existente;
3. selecione **Nova versão**;
4. confirme a implantação.

Apenas salvar o código não atualiza a versão pública já implantada.

## Testes

Abra no navegador:

- `URL_DO_APPS_SCRIPT?action=status`
- `URL_DO_APPS_SCRIPT?action=clientes`
- `URL_DO_APPS_SCRIPT?action=bundle`

A resposta deve começar com `{"success":true`.

## Cache e contingência

- cache local válido por 15 minutos;
- o botão **Atualizar planilha** força nova leitura e ignora o cache do navegador e o cache temporário do Apps Script;
- se a API falhar, o sistema usa o último cache salvo;
- se ainda não existir cache, usa os arquivos estáticos do projeto.
