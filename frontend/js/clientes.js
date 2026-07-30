/* Módulo de clientes: centraliza preenchimento e leitura dos dados cadastrais. */
App.Clientes={
  current(){return App.D.clientes[Number(App.$('#cliente')?.value)]||null;},
  address(c){return [c?.endereco,c?.bairro,c?.cep,c?.municipio,c?.uf].filter(Boolean).join(', ');},
  fill(){
    const c=this.current();
    if(!c){this.clear();App.Contatos?.populate(null);return;}
    App.$('#cnpj').value=c.cnpj||'';
    App.$('#instituicao').value=c.instituicao||'';
    App.$('#municipioCliente').value=c.municipio||'';
    App.$('#endereco').value=this.address(c);
    App.Contatos?.populate(c);
    if(!App.$('#contato')?.value){
      App.$('#responsavel').value=c.representante||'';
      App.$('#cargo').value=c.cargo||'';
      App.$('#telefone').value=c.telefone||'';
      App.$('#email').value=c.email||'';
    }
  },
  clear(){['cnpj','instituicao','responsavel','cargo','telefone','email','municipioCliente','endereco'].forEach(id=>{const el=App.$('#'+id);if(el)el.value='';});},
  snapshot(){return Object.fromEntries(['cnpj','instituicao','responsavel','cargo','telefone','email','municipioCliente','endereco'].map(id=>[id,App.$('#'+id)?.value||'']));},
  restore(data={}){Object.entries(data).forEach(([id,value])=>{const el=App.$('#'+id);if(el)el.value=value||'';});}
};
App.fillClient=()=>App.Clientes.fill();
