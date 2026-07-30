/* Repositório local e interface do histórico de orçamentos. */
App.Orcamentos={
  key:'orcamentosDco.v2', currentId:null,
  list(){try{return JSON.parse(localStorage.getItem(this.key)||'[]');}catch{return[];}},
  write(items){localStorage.setItem(this.key,JSON.stringify(items));},
  id(){return globalThis.crypto?.randomUUID?.()||('orc-'+Date.now()+'-'+Math.random().toString(16).slice(2));},
  validate(){
    const selectors=[];if(App.tableIncluded('link'))selectors.push('#linkItems tr');if(App.tableIncluded('internet'))selectors.push('#internetItems tr');if(App.tableIncluded('implantacao'))selectors.push('#installations tr');
    const blocked=selectors.length?[...document.querySelectorAll(selectors.join(','))].filter(tr=>tr.dataset.invalidInfrastructure==='1'):[];
    if(blocked.length){alert(`Não foi possível salvar. Há ${blocked.length} item(ns) incluído(s) sem infraestrutura da PRODEPA.`);blocked[0].scrollIntoView({behavior:'smooth',block:'center'});return false;}return true;
  },
  enrich(data){const cliente=App.Clientes?.current();return {...data,id:this.currentId||this.id(),clienteDados:App.Clientes?.snapshot?.()||{},contato:App.$('#contato')?.value||'',clienteNome:cliente?.sigla||cliente?.instituicao||data.clienteDados?.instituicao||'',instituicao:data.clienteDados?.instituicao||'',cnpj:data.clienteDados?.cnpj||'',totalGlobal:App.totalGlobalValue?.()||this.readMoney(App.$('#totalGlobal')?.textContent),updatedAt:new Date().toISOString()};},
  readMoney(text=''){return Number(String(text).replace(/[^0-9,-]/g,'').replaceAll('.','').replace(',','.'))||0;},
  save(){if(!this.validate())return;const record=this.enrich(App.snapshot());const items=this.list();const idx=items.findIndex(x=>x.id===record.id);if(idx>=0)items[idx]=record;else items.unshift(record);this.write(items);this.currentId=record.id;localStorage.setItem('orcamentoAtual',JSON.stringify(record));alert(idx>=0?'Orçamento atualizado.':'Orçamento salvo no histórico deste navegador.');},
  open(id){const x=this.list().find(r=>r.id===id);if(!x)return;this.currentId=x.id;localStorage.setItem('orcamentoAtual',JSON.stringify(x));App.load(x);this.close();window.scrollTo({top:0,behavior:'smooth'});},
  duplicate(id){const x=this.list().find(r=>r.id===id)||(id?null:App.snapshot());if(!x)return;const copy=typeof structuredClone==='function'?structuredClone(x):JSON.parse(JSON.stringify(x));delete copy.id;copy.numero=this.nextCopyNumber(copy.numero);this.currentId=null;App.load(copy);this.close();alert('Cópia criada. Altere o número e clique em Salvar.');},
  nextCopyNumber(n=''){return n?`${n} - CÓPIA`:'';},
  remove(id){if(!confirm('Excluir este orçamento salvo?'))return;this.write(this.list().filter(x=>x.id!==id));if(this.currentId===id)this.currentId=null;this.render();},
  reset(){if(!confirm('Criar um novo orçamento? As alterações não salvas serão perdidas.'))return;this.currentId=null;localStorage.removeItem('orcamentoAtual');location.reload();},
  show(){App.$('#budgetModal').hidden=false;App.$('#budgetSearch').value='';this.render();setTimeout(()=>App.$('#budgetSearch').focus(),20);},
  close(){App.$('#budgetModal').hidden=true;},
  searchText(x){return [x.numero,x.data,x.clienteNome,x.instituicao,x.cnpj].join(' ').toLowerCase();},
  render(){const q=(App.$('#budgetSearch')?.value||'').trim().toLowerCase();const rows=this.list().filter(x=>!q||this.searchText(x).includes(q));App.$('#budgetCount').textContent=`${rows.length} registro(s)`;App.$('#budgetEmpty').hidden=rows.length>0;App.$('#budgetListBody').innerHTML=rows.map(x=>`<tr><td><strong>${this.escape(x.numero||'Sem número')}</strong></td><td>${this.date(x.data)}</td><td>${this.escape(x.clienteNome||x.instituicao||'')}</td><td class="money">${App.brl.format(Number(x.totalGlobal)||0)}</td><td>${this.dateTime(x.updatedAt)}</td><td class="budget-actions"><button data-open="${x.id}">Abrir</button><button data-copy="${x.id}">Duplicar</button><button class="danger" data-delete="${x.id}">Excluir</button></td></tr>`).join('');},
  escape(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));},
  date(v){if(!v)return'';const [y,m,d]=String(v).slice(0,10).split('-');return d&&m&&y?`${d}/${m}/${y}`:v;},
  dateTime(v){if(!v)return'';try{return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(v));}catch{return v;}},
  bind(){
    App.$('#openBtn').onclick=()=>this.show();App.$('#duplicateBtn').onclick=()=>this.duplicate();App.$('#closeBudgetModal').onclick=()=>this.close();App.$('[data-close-budget-modal]').onclick=()=>this.close();App.$('#budgetSearch').oninput=()=>this.render();
    App.$('#budgetListBody').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.open)this.open(b.dataset.open);if(b.dataset.copy)this.duplicate(b.dataset.copy);if(b.dataset.delete)this.remove(b.dataset.delete);};
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!App.$('#budgetModal').hidden)this.close();});
  }
};
App.save=()=>App.Orcamentos.save();App.reset=()=>App.Orcamentos.reset();
