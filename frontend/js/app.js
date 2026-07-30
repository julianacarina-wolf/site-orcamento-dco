App.setSyncStatus=function(message,type){const el=App.$('#syncStatus');if(!el)return;el.textContent=message;el.className='sync-status '+(type||'');};
App.syncSummary=function(result){
  const p=result&&result.payload;
  if(!p)return'';
  const d=p.data||{},pricing=p.pricing||{};
  const counts=[
    `${(d.clientes||[]).length} clientes`,
    `${(d.regioes||[]).length} municípios`,
    `${(d.servicos||[]).length} serviços`,
    `${(pricing.linkDados||[]).length} preços de link`
  ];
  return counts.join(' • ');
};
App.refreshFromSheets=async function(){
  const button=App.$('#syncBtn');
  if(button)button.disabled=true;
  App.setSyncStatus('Atualizando dados da planilha…','loading');
  const current=App.snapshot();
  try{
    const result=await AppDataLoader.initialize(true);
    App.rebuildDataIndexes();
    App.populateBaseSelectors();
    App.load(current);
    App.recalcAll();
    if(result.source==='online'){
      const details=App.syncSummary(result);
      App.setSyncStatus(`Planilha atualizada${result.payload.updatedAt?' em '+result.payload.updatedAt:''}${details?' — '+details:''}.`,'success');
    }else{
      const reason=result.error&&result.error.message?` ${result.error.message}`:'';
      App.setSyncStatus(`Não foi possível acessar a planilha. Dados locais mantidos.${reason}`,'warning');
    }
  }catch(error){
    console.error(error);
    App.setSyncStatus(`Erro ao atualizar: ${error.message||error}`,'warning');
  }finally{
    if(button)button.disabled=false;
  }
};
App.populateBaseSelectors=function(){
  const cliente=App.$('#cliente');
  const previous=cliente?cliente.value:'';
  if(cliente){cliente.innerHTML='<option value="">Selecione...</option>'+App.D.clientes.map((c,i)=>App.option(i,`${c.sigla||''}${c.sigla?' — ':''}${c.instituicao||''}`)).join('');if(previous&&App.D.clientes[Number(previous)])cliente.value=previous;}
  const ano=App.$('#anoTabela');
  if(ano&&!ano.options.length){ano.innerHTML=[2021,2022,2023,2024,2025,2026].map(y=>App.option(y,y)).join('')+App.option('regional','Região de Integração (teste)');ano.value='2026';}
};
App.init=async function(){
  App.$('#data').value=new Date().toISOString().slice(0,10);
  App.setSyncStatus('Carregando base de dados…','loading');
  const sync=await AppDataLoader.initialize(false);
  App.rebuildDataIndexes();
  App.populateBaseSelectors();
  const details=App.syncSummary(sync);
  if(sync.source==='online')App.setSyncStatus(`Dados sincronizados${sync.payload.updatedAt?' em '+sync.payload.updatedAt:''}${details?' — '+details:''}.`,'success');
  else if(sync.source==='cache')App.setSyncStatus(`Dados carregados do cache local${details?' — '+details:''}.`,'success');
  else if(sync.source==='stale-cache')App.setSyncStatus(`Planilha indisponível. Usando o último cache salvo.${sync.error?' '+sync.error.message:''}`,'warning');
  else if(!GoogleSheetsService.isConfigured())App.setSyncStatus('Integração ainda não configurada. Usando a base estática do projeto.','warning');
  else App.setSyncStatus(`Planilha indisponível. Usando a base estática do projeto.${sync.error?' '+sync.error.message:''}`,'warning');

  App.$('#cliente').onchange=App.fillClient;App.$('#contato').onchange=()=>App.Contatos.fill();App.$('#anoTabela').onchange=()=>{App.updateMethodUI();App.recalcAll();};App.$('#addLinkBtn').onclick=()=>App.addAccessRow('link');App.$('#addInternetBtn').onclick=()=>App.addAccessRow('internet');App.$('#addTiBtn').onclick=()=>App.addTiRow('regular');App.$('#addTiAnnualBtn').onclick=()=>App.addTiRow('annual');App.$('#addInstallationBtn').onclick=()=>App.addInstallationRow();App.initTableToggles();App.$('#printBtn').onclick=()=>App.PDF.print();App.$('#saveBtn').onclick=App.save;App.$('#newBtn').onclick=App.reset;App.$('#syncBtn').onclick=App.refreshFromSheets;App.Orcamentos.bind();App.updateMethodUI();const saved=localStorage.getItem('orcamentoAtual');if(saved){try{const current=JSON.parse(saved);App.Orcamentos.currentId=current.id||null;App.load(current);}catch(e){console.error(e);localStorage.removeItem('orcamentoAtual');}}if(!document.querySelector('#installations tr')){App.addInstallationRow();App.addAccessRow('link');App.addAccessRow('internet');App.addTiRow('regular');App.addTiRow('annual');}};
document.addEventListener('DOMContentLoaded',()=>{App.init().catch(error=>{console.error(error);App.setSyncStatus(`Erro ao iniciar o sistema: ${error.message||error}`,'warning');});});
