# Publicação do Google Apps Script

1. Abra a planilha Google Sheets.
2. Acesse **Extensões → Apps Script**.
3. Substitua o conteúdo de `Code.gs` pelo arquivo desta pasta.
4. Em **Configurações do projeto**, marque a opção para mostrar o arquivo de manifesto e copie `appsscript.json` se desejar usar o fuso de Belém.
5. Clique em **Implantar → Nova implantação**.
6. Tipo: **Aplicativo da Web**.
7. Executar como: **Você**.
8. Quem pode acessar: **Qualquer pessoa**.
9. Copie a URL terminada em `/exec`.
10. Cole a URL em `js/google-sheets-config.js`.

## Chave opcional

Em **Configurações do projeto → Propriedades do script**, crie a propriedade `API_KEY`.
Depois informe o mesmo valor no campo `apiKey` de `js/google-sheets-config.js`.

A chave reduz acessos acidentais, mas não deve ser considerada um segredo forte porque fica disponível no JavaScript do navegador.
