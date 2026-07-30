(function () {
  'use strict';

  function normalizePayload(payload) {
    const fallback = window.APP_BOOTSTRAP || { data: {}, pricing: {} };
    const source = payload && typeof payload === 'object' ? payload : {};
    const data = source.data && typeof source.data === 'object' ? source.data : fallback.data;
    const pricing = source.pricing && typeof source.pricing === 'object' ? source.pricing : fallback.pricing;

    return {
      version: source.version || fallback.version || '',
      updatedAt: source.updatedAt || '',
      data: {
        clientes: Array.isArray(data.clientes) ? data.clientes : [],
        contatos: Array.isArray(data.contatos) ? data.contatos : [],
        municipios: Array.isArray(data.municipios) ? data.municipios : [],
        servicos: Array.isArray(data.servicos) ? data.servicos : [],
        regioes: Array.isArray(data.regioes) ? data.regioes : [],
        implantacao: Array.isArray(data.implantacao) ? data.implantacao : [],
        config: data.config && typeof data.config === 'object' ? data.config : {}
      },
      pricing: {
        reajustes: pricing.reajustes && typeof pricing.reajustes === 'object' ? pricing.reajustes : {},
        historicoReajuste: Array.isArray(pricing.historicoReajuste) ? pricing.historicoReajuste : [],
        faixasDesconto: Array.isArray(pricing.faixasDesconto) ? pricing.faixasDesconto : [],
        linkDados: Array.isArray(pricing.linkDados) ? pricing.linkDados : []
      }
    };
  }

  function apply(payload, source) {
    const normalized = normalizePayload(payload);
    window.AppData = {
      source: source || 'static',
      updatedAt: normalized.updatedAt,
      version: normalized.version,
      data: normalized.data,
      pricing: normalized.pricing
    };
    // Compatibilidade temporária com os módulos atuais.
    window.APP_DATA = normalized.data;
    window.LINK_DATA_PRICING = normalized.pricing;
    window.dispatchEvent(new CustomEvent('app-data-changed', { detail: window.AppData }));
    return normalized;
  }

  function useStatic() {
    return apply(window.APP_BOOTSTRAP || {}, 'static');
  }

  async function initialize(force) {
    if (!window.GoogleSheetsService || !GoogleSheetsService.isConfigured()) {
      const payload = useStatic();
      return { source: 'fallback', payload, error: null };
    }
    const result = await GoogleSheetsService.synchronize(Boolean(force));
    if (result && result.payload) apply(result.payload, result.source);
    else useStatic();
    return result;
  }

  function getData() { return window.AppData; }

  window.AppDataLoader = { initialize, apply, useStatic, getData };
})();
