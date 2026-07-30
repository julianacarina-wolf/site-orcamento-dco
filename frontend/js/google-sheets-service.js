(function () {
  'use strict';

  const STORAGE_KEY = 'orcamentosDco.googleSheetsCache.v4';
  const CONFIG = window.GOOGLE_SHEETS_CONFIG || {};

  function isConfigured() {
    return Boolean(CONFIG.apiUrl && /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(?:\?.*)?$/i.test(CONFIG.apiUrl));
  }

  function readCache() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const cache = JSON.parse(raw);
      return cache && cache.payload && cache.savedAt ? cache : null;
    } catch (error) {
      console.warn('Cache da planilha inválido; ele será ignorado.', error);
      return null;
    }
  }

  function writeCache(payload) {
    const cache = { savedAt: new Date().toISOString(), version: payload.version || '', payload };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cache)); }
    catch (error) { console.warn('Não foi possível gravar o cache local.', error); }
    return cache;
  }

  function buildUrl(action, options, callback) {
    const url = new URL(CONFIG.apiUrl);
    url.searchParams.set('action', action);
    if (CONFIG.apiKey) url.searchParams.set('key', CONFIG.apiKey);
    if (options && options.nocache) url.searchParams.set('_', String(Date.now()));
    if (callback) url.searchParams.set('callback', callback);
    return url.toString();
  }

  function requestJsonp(action, options) {
    return new Promise((resolve, reject) => {
      const callback = '__gsCallback_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      const script = document.createElement('script');
      const timeoutMs = Number(CONFIG.requestTimeoutMs) || 30000;
      let finished = false;
      const cleanup = () => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        script.remove();
        try { delete window[callback]; } catch (_) { window[callback] = undefined; }
      };
      window[callback] = result => {
        cleanup();
        if (!result || result.success !== true) reject(new Error((result && result.error) || `Erro na consulta “${action}”.`));
        else resolve(result);
      };
      script.onerror = () => { cleanup(); reject(new Error(`Não foi possível consultar “${action}” no Google Sheets.`)); };
      script.src = buildUrl(action, options, callback);
      script.async = true;
      const timer = setTimeout(() => { cleanup(); reject(new Error(`A consulta “${action}” excedeu o tempo limite.`)); }, timeoutMs);
      document.head.appendChild(script);
    });
  }

  async function requestFetch(action, options) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(CONFIG.requestTimeoutMs) || 30000);
    let response;
    try {
      response = await fetch(buildUrl(action, options), { cache: 'no-store', redirect: 'follow', signal: controller.signal, headers: { Accept: 'application/json' } });
    } catch (error) {
      if (error && error.name === 'AbortError') throw new Error(`A consulta “${action}” excedeu o tempo limite.`);
      throw error;
    } finally { clearTimeout(timeout); }
    if (!response.ok) throw new Error(`Falha HTTP ${response.status} na consulta “${action}”.`);
    const text = await response.text();
    let result;
    try { result = JSON.parse(text); }
    catch (_) { throw new Error(`A consulta “${action}” não retornou JSON válido.`); }
    if (!result.success) throw new Error(result.error || `Erro na consulta “${action}”.`);
    return result;
  }

  async function request(action, options = {}) {
    if (!isConfigured()) throw new Error('URL da API do Google Sheets não configurada ou inválida.');
    if (location.protocol === 'file:') return requestJsonp(action, options);
    try { return await requestFetch(action, options); }
    catch (error) {
      console.warn(`Fetch falhou em “${action}”; tentando JSONP.`, error);
      return requestJsonp(action, options);
    }
  }

  function normalizePayload(payload) {
    if (!payload || typeof payload !== 'object' || !payload.data || !payload.pricing) throw new Error('Resposta da planilha em formato inesperado.');
    return payload;
  }

  async function loadOnline(force) {
    const actions = ['status','clientes','contatos','municipios','regioes','servicos','linkdados','configuracoes','implantacao','historico_reajuste'];
    const results = await Promise.all(actions.map(action => request(action, { nocache: force })));
    const byAction = Object.fromEntries(actions.map((action, index) => [action, results[index]]));
    const config = byAction.configuracoes;
    return normalizePayload({
      version: (config.system && config.system.version) || byAction.status.version || '',
      updatedAt: byAction.status.updatedAt || new Date().toLocaleString('pt-BR'),
      data: {
        clientes: byAction.clientes.data,
        contatos: byAction.contatos.data,
        municipios: byAction.municipios.data,
        regioes: byAction.regioes.data,
        servicos: byAction.servicos.data,
        implantacao: byAction.implantacao.data,
        config: config.data
      },
      pricing: {
        reajustes: config.reajustes,
        historicoReajuste: byAction.historico_reajuste.data,
        faixasDesconto: config.faixasDesconto,
        linkDados: byAction.linkdados.data
      }
    });
  }

  async function synchronize(force = false) {
    const cache = readCache();
    const maxAge = Math.max(0, Number(CONFIG.cacheMinutes) || 0) * 60000;
    if (!force && cache && maxAge > 0) {
      const savedAt = new Date(cache.savedAt).getTime();
      if (Number.isFinite(savedAt) && Date.now() - savedAt < maxAge) return { source: 'cache', cache, payload: cache.payload };
    }
    try {
      const payload = await loadOnline(force);
      const saved = writeCache(payload);
      return { source: 'online', cache: saved, payload };
    } catch (error) {
      console.error('Falha na sincronização com Google Sheets:', error);
      if (cache) return { source: 'stale-cache', cache, payload: cache.payload, error };
      return { source: 'fallback', payload: window.APP_BOOTSTRAP || null, error };
    }
  }

  async function testConnection() {
    const result = await request('status', { nocache: true });
    return { version: result.version || '', updatedAt: result.updatedAt || '', spreadsheetId: result.spreadsheetId || '' };
  }

  function clearCache() { localStorage.removeItem(STORAGE_KEY); }
  window.GoogleSheetsService = { isConfigured, synchronize, testConnection, clearCache, readCache, request };
})();
