(function () {
  'use strict';

  const STORAGE_KEY = 'orcamentosDco.googleSheetsCache.v2';
  const CONFIG = window.GOOGLE_SHEETS_CONFIG || {};
  const STATIC_DATA = window.APP_DATA;
  const STATIC_PRICING = window.LINK_DATA_PRICING;

  function isConfigured() {
    return Boolean(CONFIG.apiUrl && /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(?:\?.*)?$/i.test(CONFIG.apiUrl));
  }

  function readCache() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const cache = JSON.parse(raw);
      if (!cache || !cache.payload || !cache.savedAt) return null;
      return cache;
    } catch (error) {
      console.warn('Cache da planilha inválido; ele será ignorado.', error);
      return null;
    }
  }

  function writeCache(payload) {
    const cache = {
      savedAt: new Date().toISOString(),
      version: payload.version || '',
      payload
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Não foi possível gravar o cache da planilha.', error);
    }
    return cache;
  }

  function fetchWithTimeout(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(CONFIG.requestTimeoutMs) || 20000);
    return fetch(url, {
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    }).finally(() => clearTimeout(timeout));
  }

  async function request(action, options = {}) {
    if (!isConfigured()) throw new Error('URL da API do Google Sheets não configurada ou inválida.');

    const url = new URL(CONFIG.apiUrl);
    url.searchParams.set('action', action);
    if (CONFIG.apiKey) url.searchParams.set('key', CONFIG.apiKey);
    if (options.nocache) {
      url.searchParams.set('refresh', '1');
      url.searchParams.set('_', String(Date.now()));
    }

    let response;
    try {
      response = await fetchWithTimeout(url.toString());
    } catch (error) {
      if (error && error.name === 'AbortError') throw new Error('A consulta à planilha excedeu o tempo limite.');
      throw new Error('Não foi possível conectar ao Google Sheets. Verifique a internet e a implantação do Apps Script.');
    }

    if (!response.ok) throw new Error(`Falha HTTP ${response.status} ao consultar a planilha.`);

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch (_) {
      throw new Error('O Apps Script não retornou JSON válido. Verifique se a implantação está pública e usa a função doGet.');
    }
    if (!result.success) throw new Error(result.error || 'A API da planilha retornou erro.');
    return result;
  }

  function normalizePayload(payload) {
    if (!payload || typeof payload !== 'object') throw new Error('Resposta da planilha vazia.');
    if (!payload.data || !payload.pricing) throw new Error('Resposta da planilha em formato inesperado.');

    const data = payload.data;
    const pricing = payload.pricing;
    data.clientes = Array.isArray(data.clientes) ? data.clientes : [];
    data.contatos = Array.isArray(data.contatos) ? data.contatos : [];
    data.municipios = Array.isArray(data.municipios) ? data.municipios : [];
    data.servicos = Array.isArray(data.servicos) ? data.servicos : [];
    data.regioes = Array.isArray(data.regioes) ? data.regioes : [];
    data.implantacao = Array.isArray(data.implantacao) ? data.implantacao : [];
    data.config = data.config && typeof data.config === 'object' ? data.config : {};
    pricing.reajustes = pricing.reajustes && typeof pricing.reajustes === 'object' ? pricing.reajustes : {};
    pricing.faixasDesconto = Array.isArray(pricing.faixasDesconto) ? pricing.faixasDesconto : [];
    pricing.linkDados = Array.isArray(pricing.linkDados) ? pricing.linkDados : [];
    return payload;
  }

  function applyPayload(payload) {
    const normalized = normalizePayload(payload);
    window.APP_DATA = normalized.data;
    window.LINK_DATA_PRICING = normalized.pricing;
    window.dispatchEvent(new CustomEvent('google-sheets-data-applied', { detail: normalized }));
    return normalized;
  }

  function applyStaticFallback() {
    if (STATIC_DATA) window.APP_DATA = STATIC_DATA;
    if (STATIC_PRICING) window.LINK_DATA_PRICING = STATIC_PRICING;
  }

  async function synchronize(force = false) {
    const cache = readCache();
    const maxAge = Math.max(0, Number(CONFIG.cacheMinutes) || 0) * 60 * 1000;

    if (!force && cache && maxAge > 0) {
      const savedAt = new Date(cache.savedAt).getTime();
      if (Number.isFinite(savedAt) && Date.now() - savedAt < maxAge) {
        applyPayload(cache.payload);
        return { source: 'cache', cache, payload: cache.payload };
      }
    }

    try {
      const result = await request('bundle', { nocache: force });
      const payload = normalizePayload({
        version: result.version || '',
        updatedAt: result.updatedAt || '',
        data: result.data,
        pricing: result.pricing
      });
      applyPayload(payload);
      const saved = writeCache(payload);
      return { source: 'online', cache: saved, payload };
    } catch (error) {
      console.error('Falha na sincronização com Google Sheets:', error);
      if (cache) {
        applyPayload(cache.payload);
        return { source: 'stale-cache', cache, payload: cache.payload, error };
      }
      applyStaticFallback();
      return { source: 'fallback', payload: null, error };
    }
  }

  async function testConnection() {
    const result = await request('status', { nocache: true });
    return {
      version: result.version || '',
      updatedAt: result.updatedAt || '',
      spreadsheetId: result.spreadsheetId || ''
    };
  }

  function clearCache() {
    localStorage.removeItem(STORAGE_KEY);
  }

  window.GoogleSheetsService = {
    isConfigured,
    synchronize,
    testConnection,
    clearCache,
    readCache
  };
})();
