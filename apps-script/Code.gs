/**
 * API do Simulador de Orçamentos DCO.
 * Planilha mestre: simulador-2026.
 *
 * Publique como Aplicativo da Web:
 *   Executar como: você
 *   Quem pode acessar: qualquer pessoa
 */
const SPREADSHEET_ID = '1YI33i6smpFUGMWxKos4th-IjHSIVigT28Xotsz9zJpg';
const CACHE_SECONDS = 300;

function doGet(e) {
  try {
    validateApiKey_(e);
    const action = String((e && e.parameter && e.parameter.action) || 'bundle').toLowerCase();
    const handlers = {
      bundle: getBundle_,
      status: getStatus_,
      clientes: getClientes_,
      contatos: getContatos_,
      municipios: getMunicipios_,
      regioes: getRegioes_,
      servicos: getServicos_,
      linkdados: getLinkDados_,
      configuracoes: getConfiguracoes_,
      implantacao: getImplantacao_,
      historico_reajuste: getHistoricoReajuste_
    };
    if (!handlers[action]) throw new Error('Ação inválida: ' + action);
    return json_({ success: true, ...handlers[action](e) });
  } catch (error) {
    return json_({ success: false, error: error.message || String(error) });
  }
}

function getBundle_(e) {
  const cache = CacheService.getScriptCache();
  const forceRefresh = String((e && e.parameter && e.parameter.refresh) || '') === '1';
  const cached = forceRefresh ? null : cache.get('bundle-v2');
  if (cached) return JSON.parse(cached);

  const config = getConfiguracoes_();
  const payload = {
    version: config.system.version,
    updatedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'),
    data: {
      clientes: getClientes_().data,
      contatos: getContatos_().data,
      municipios: getMunicipios_().data,
      servicos: getServicos_().data,
      regioes: getRegioes_().data,
      config: config.data,
      implantacao: getImplantacao_().data
    },
    pricing: {
      reajustes: config.reajustes,
      historicoReajuste: getHistoricoReajuste_().data,
      faixasDesconto: config.faixasDesconto,
      linkDados: getLinkDados_().data
    }
  };
  cache.put('bundle-v2', JSON.stringify(payload), CACHE_SECONDS);
  return payload;
}

function getStatus_() {
  const config = getConfiguracoes_();
  return {
    version: config.system.version,
    updatedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'),
    spreadsheetId: SPREADSHEET_ID
  };
}

function getClientes_() {
  const rows = values_('clientes', 2, 1, 12);
  return { data: rows.filter(nonEmpty_).map(r => ({
    sigla: text_(r[0]), instituicao: text_(r[1]), esfera: text_(r[2]),
    cnpj: text_(r[3]), representante: text_(r[4]), cargo: text_(r[5]),
    telefone: text_(r[6]), endereco: text_(r[7]), bairro: text_(r[8]),
    cep: text_(r[9]), municipio: text_(r[10]), uf: text_(r[11])
  })) };
}

function getContatos_() {
  const sheet = sheet_('contatos');
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return { data: [] };
  const headers = values.shift().map(normalizeHeader_);
  return { data: values.filter(nonEmpty_).map(row => objectFromRow_(headers, row)) };
}

function getMunicipios_() {
  const sheet = sheet_('municipios');
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return { data: [] };
  const headers = values.shift().map(normalizeHeader_);
  return { data: values.filter(nonEmpty_).map(row => objectFromRow_(headers, row)) };
}

function getServicos_() {
  const rows = values_('servicos', 2, 1, 15);
  return { data: rows.filter(r => text_(r[3])).map(r => ({
    area: text_(r[0]), subarea: text_(r[1]), codigo: text_(r[2]),
    descricao: text_(r[3]), tipo: text_(r[4]), grandeza: text_(r[8]),
    faturamento: text_(r[10]), precoMensal: number_(r[14]),
    precoAnual: number_(r[12]),
    sobConsulta: [r[9], r[11], r[12]].some(v => text_(v).toLowerCase() === 'sob consulta')
  })) };
}

function getRegioes_() {
  const rows = values_('regiao', 6, 1, 8);
  return { data: rows.filter(r => text_(r[0]) && (text_(r[3]) || text_(r[5]))).map(r => ({
    municipio: text_(r[0]), backbone: text_(r[1]), ultimaMilha: text_(r[2]),
    atendido: text_(r[3]), mesorregiao: text_(r[4]), regiao: text_(r[5]),
    atualizacao: text_(r[6]), precoMbps: number_(r[7])
  })) };
}

function getLinkDados_() {
  const rows = values_('linkdados', 2, 1, 15);
  return { data: rows.filter(r => text_(r[1]) && text_(r[2])).map(r => ({
    municipio: text_(r[1]), modalidade: text_(r[2]), tecnologias: text_(r[3]),
    mesorregiao: text_(r[6]), atendido: text_(r[7]), regiao: text_(r[8]),
    degrau: text_(r[9]), unitTransporte2026: number_(r[11]),
    cmanut2026: number_(r[13]), precoFinal1Mbps2026: number_(r[14])
  })) };
}


function getImplantacao_() {
  return { data: readGenericSheet_('implantacao') };
}

function getHistoricoReajuste_() {
  return { data: readGenericSheet_('historico-reajuste') };
}

function readGenericSheet_(name) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(name);
  if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) return [];
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values.shift().map(normalizeHeader_);
  return values.filter(nonEmpty_).map(row => objectFromRow_(headers, row));
}

function getConfiguracoes_() {
  const sheet = sheet_('pconfig');
  const reajustes = {};
  for (let row = 2; row <= 6; row++) {
    const year = sheet.getRange(row, 1).getValue();
    if (year) reajustes[String(Math.trunc(Number(year)))] = number_(sheet.getRange(row, 2).getValue());
  }

  const faixasDesconto = [];
  for (let row = 12; row <= sheet.getLastRow(); row++) {
    const [min, max, factor] = sheet.getRange(row, 1, 1, 3).getValues()[0];
    if (min === '' || max === '' || factor === '') {
      if (faixasDesconto.length) break;
      continue;
    }
    faixasDesconto.push({ min: number_(min), max: number_(max), fator: number_(factor) });
  }

  const system = readSystemConfig_();
  return {
    data: {
      taxaAdministrativa: number_(sheet.getRange('G2').getValue()),
      reaparelhamento: number_(sheet.getRange('G3').getValue()),
      impostos: number_(sheet.getRange('G4').getValue()),
      ativacao: number_(sheet.getRange('G7').getValue()),
      configFibra: number_(sheet.getRange('G8').getValue()),
      configRadio: number_(sheet.getRange('G9').getValue()),
      internetMbps: number_(sheet.getRange('G14').getValue(), 23)
    },
    reajustes,
    faixasDesconto,
    system
  };
}

function readSystemConfig_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName('SISTEMA');
  const defaults = { version: '1.0.0' };
  if (!sheet || sheet.getLastRow() < 2) return defaults;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getDisplayValues();
  rows.forEach(r => {
    const key = normalizeHeader_(r[0]);
    if (key) defaults[key] = text_(r[1]);
  });
  defaults.version = defaults.versao || defaults.version;
  return defaults;
}

function validateApiKey_(e) {
  const expected = PropertiesService.getScriptProperties().getProperty('API_KEY');
  if (!expected) return;
  const received = String((e && e.parameter && e.parameter.key) || '');
  if (received !== expected) throw new Error('Chave de acesso inválida.');
}

function sheet_(name) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
  if (!sheet) throw new Error('Aba não encontrada: ' + name);
  return sheet;
}

function values_(sheetName, startRow, startColumn, columns) {
  const sheet = sheet_(sheetName);
  const rows = Math.max(0, sheet.getLastRow() - startRow + 1);
  return rows ? sheet.getRange(startRow, startColumn, rows, columns).getValues() : [];
}

function nonEmpty_(row) { return row.some(v => text_(v) !== ''); }
function text_(value) { return value === null || value === undefined ? '' : String(value).trim(); }
function number_(value, fallback) {
  if (value === null || value === undefined || value === '' || text_(value).toLowerCase() === 'sob consulta') return fallback || 0;
  if (typeof value === 'number') return value;
  const normalized = String(value).trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
  const result = Number(normalized);
  return Number.isFinite(result) ? result : (fallback || 0);
}
function normalizeHeader_(value) {
  return text_(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
}
function objectFromRow_(headers, row) {
  const object = {};
  headers.forEach((header, index) => { if (header) object[header] = text_(row[index]); });
  return object;
}
function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
