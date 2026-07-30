/* Módulo de contatos relacionados aos órgãos. Aceita diferentes nomes de colunas da planilha. */
App.Contatos={
  all(){return Array.isArray(App.D.contatos)?App.D.contatos:[];},
  value(obj,names){for(const n of names){if(obj&&obj[n]!=null&&String(obj[n]).trim())return String(obj[n]).trim();}return'';},
  clientKeys(c){return [c?.sigla,c?.instituicao,c?.cnpj].filter(Boolean).map(App.norm);},
  forClient(c){
    const keys=this.clientKeys(c);
    return this.all().filter(x=>{
      const refs=[this.value(x,['sigla','cliente','orgao','órgão','instituicao','instituição']),this.value(x,['cnpj'])].filter(Boolean).map(App.norm);
      return refs.some(r=>keys.some(k=>r===k||r.includes(k)||k.includes(r)));
    });
  },
  label(x){const nome=this.value(x,['nome','contato','responsavel','responsável','representante']);const cargo=this.value(x,['cargo','funcao','função']);return [nome,cargo].filter(Boolean).join(' — ')||'Contato sem nome';},
  populate(c,selected=''){
    const select=App.$('#contato');if(!select)return;
    const list=c?this.forClient(c):[];
    select.innerHTML='<option value="">Contato principal / preenchimento manual</option>'+list.map((x,i)=>App.option(i,this.label(x))).join('');
    select.dataset.items=JSON.stringify(list);
    if(selected!==''&&list[Number(selected)]){select.value=String(selected);this.fill();}
  },
  selected(){const s=App.$('#contato');if(!s||s.value==='')return null;try{return JSON.parse(s.dataset.items||'[]')[Number(s.value)]||null;}catch{return null;}},
  fill(){const x=this.selected();if(!x)return;App.$('#responsavel').value=this.value(x,['nome','contato','responsavel','responsável','representante']);App.$('#cargo').value=this.value(x,['cargo','funcao','função']);App.$('#telefone').value=this.value(x,['telefone','fone','celular']);App.$('#email').value=this.value(x,['email','e-mail']);}
};
