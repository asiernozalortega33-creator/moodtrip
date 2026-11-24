const SC=[["Barcelona",4,["fiesta","cultural"],"equi","amigos","mid","2026-06-12"],["Barcelona",3,["romantico","cultural"],"equi","pareja","mid",""],
["Granada",3,["romantico","cultural"],"equi","pareja","mid","2026-05-14"],["Lisboa",3,["cultural","foto"],"equi","pareja","mid","2026-07-02"],
["Budapest",3,["cultural","romantico"],"equi","pareja","mid",""]];
const out=[];
const strip=h=>h.replace(/<span class="chow">/g," | CÓMO: ").replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim();
for(const [c,d,m,r,co,pr,dt] of SC){
  try{await ensureCity(c);const k0=resolveKey(c);if(k0&&!isAuto(k0))await loadAux(k0);}catch(e){}
  const key=resolveKey(c);
  const g=generar(c,d,m,r,co,{presup:pr,inDate:dt});
  out.push(`\n##### ${c} ${d}d [${m}] ${dt||"sin fecha"}`);
  g.plan.forEach((day,i)=>{const M=g.meta[i];
    out.push(` Día ${i+1} ${M.title}`);
    let prev=null;
    day.forEach(s=>{if(s.a.marker)return;
      if(prev&&prev.a.real&&s.a.real)out.push("        ↳ "+strip(connector(prev,s,c,key)));
      out.push(`   ${s.time}-${s.end||"     "} ${String(s.lb).padEnd(11)} ${s.a.real?"":"G "}${s.a.t.slice(0,50)}${s.a.el?` [${s.a.el>0?"+":""}${s.a.el} m]`:""}`);
      prev=s;});
  });
}
return out.join("\n");
