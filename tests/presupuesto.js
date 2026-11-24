// Presupuesto del plan: suma las paradas reales, cada partida dice de dónde sale, y las alternativas más baratas
// son equivalentes, caben en el día y ahorran de verdad.
const out=[];let fail=0;const bad=m=>{fail++;out.push("MAL "+m);};
const eur=r=>`${r[0]}-${r[1]} €`;
for(const [c,d,m,co,pr,dt,n] of [["Barcelona",3,["cultural","gastro"],"pareja","mid","2026-12-02",2],["Budapest",4,["fiesta","relax"],"amigos","low","2027-03-11",4],["Tokio",4,["cultural","gastro"],"solo","high","2027-04-06",1]]){
  try{await ensureCity(c);const k=resolveKey(c);if(k&&!isAuto(k))await loadAux(k);}catch(e){}
  const g=generar(c,d,m,"equi",co,{presup:pr,inDate:dt});
  const B=tripBudget(g.trip,g.plan,n);
  out.push(`\n## ${c} ${d} días · ${co} (${n} ${n===1?"persona":"personas"}) · presupuesto ${pr}`);
  Object.entries(B.cats).forEach(([k,v])=>out.push(`   ${BUDGET_CATS[k].padEnd(24)} ${eur([v.lo,v.hi]).padEnd(12)} (${v.src.join(", ")||"—"})`));
  out.push(`   POR PERSONA ${eur(B.pp)} · GRUPO ${eur(B.group)} · en destino por día ${eur(B.perDay)} · reservar: ${B.book.length} · sin precio propio: ${B.noPrice.length}`);
  // comprobaciones
  if(!(B.pp[0]<=B.pp[1]))bad(c+": rango al revés");
  if(B.days.some(x=>x.items.some(it=>isNaN(it.lo)||isNaN(it.hi)||it.lo<0)))bad(c+": precios no numéricos o negativos");
  const sum=B.days.reduce((t,x)=>t+x.lo,0);if(Math.abs(sum-B.onTrip[0])>B.days.length)bad(c+`: la suma por días (${sum}) no cuadra con el total (${B.onTrip[0]})`);
  if(B.days.some(x=>x.items.some(it=>it.src==="gratis"&&it.hi>0)))bad(c+": algo «gratis» con precio");
  const alts=cheaperAlternatives(g.trip,g.plan,4);
  out.push("   Más barato: "+(alts.map(a=>`D${a.d+1} ${shortNm(a.from)} → ${shortNm(a.to)} (ahorras ${eur(a.save)} por persona, ${a.km.toFixed(1)} km)`).join(" | ")||"ninguna"));
  // aplicar la primera alternativa: debe entrar sin romper el día
  if(alts[0]){const D=g.trip.days[alts[0].d],i=refIdx(D,alts[0].ref,-1);const r=applyEdit(g.trip,{d:alts[0].d,op:"repl",ref:alts[0].ref,i,nm:alts[0].to});
    if(!r.ok)bad(c+": la alternativa ofrecida no se puede aplicar: "+r.why);else if(dayProblems(g.trip,D).length)bad(c+": la alternativa deja problemas en el día");
    else{const plan2=g.trip.days.map(D=>renderPlanDay(g.trip,D).row);const B2=tripBudget(g.trip,plan2,n);out.push(`   Tras aplicarla: ${eur(B2.pp)} por persona`);if(B2.pp[1]>B.pp[1])bad(c+": la alternativa no abarata");}}
}
out.push(fail?`>> ${fail} FALLOS`:">> todo bien");
return out.join("\n");
