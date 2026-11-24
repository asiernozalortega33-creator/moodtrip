// Pruebas A-F del encargo: se ejecutan contra el motor real en el navegador (pp/ev.js)
const T=[
 ["A","Budapest",4,["romantico","cultural","gastro"],"equi","pareja","mid","2026-12-03"],
 ["B","Barcelona",3,["fiesta","gastro","aventura"],"intenso","amigos","mid","2026-12-10"],
 ["C","Roma",5,["cultural","gastro","relax"],"chill","mayores","mid","2027-04-13"],
 ["D","Ámsterdam",3,["cultural","foto"],"equi","solo","mid","2027-05-06"],
 ["E","París",4,["cultural","aventura"],"equi","familia","mid","2027-07-08"],
 ["F","Chamonix",3,["aventura","relax"],"chill","pareja","mid","2027-07-15"],
];
const out=[];
for(const [id,c,d,m,r,co,pr,dt] of T){
  try{const k0=await ensureCity(c);const k=resolveKey(c)||k0;if(k&&!isAuto(k))await loadAux(k);}catch(e){}
  const key=resolveKey(c);
  const g=generar(c,d,m,r,co,{presup:pr,inDate:dt});
  const adv=moodAdvice(g.key,{moods:m,compania:co,presup:pr,ritmo:r,dias:d,date:dt});
  let stops=0,named=0,fit=0,dups=0,overlap=0,closedV=0,late=0,maxWalk=0,steepNoT=0,nights=[],buda=0,pest=0,perDay=[];
  const seen=new Set();
  g.plan.forEach((day,i)=>{const D=g.trip.days[i];const S=day.filter(s=>!s.a.marker&&s.cat!=="libre");
    let b=0,p=0,prev=null;
    S.forEach(s=>{stops++;if(s.a.real){named++;if((s.a.m||[]).some(x=>m.includes(x)))fit++;if(seen.has(s.a.t))dups++;seen.add(s.a.t);
      if(s.a.closed&&s.a.closed.today)closedV++;if(s.a.hours&&s.a.hours.late)late++;
      const cc=COORDS[s.a.t];if(cc&&c==="Budapest"){if(cc[1]<19.046)b++;else p++;}}
      if(prev&&prev.end&&s.time&&toMin(s.time)<toMin(prev.end))overlap++;
      if(prev&&prev.a.real&&s.a.real){const h=connector(prev,s,c,g.key,g.trip.o).replace(/<[^>]+>/g," ");const w=h.match(/(\d+) min · ~/);if(w)maxWalk=Math.max(maxWalk,+w[1]*(/ve andando|Paseo largo/.test(h)?1:0));if(/sube (\d+) m/.test(h)&&+h.match(/sube (\d+) m/)[1]>=60&&/ve andando/.test(h))steepNoT++;}
      prev=s;});
    if(c==="Budapest"){buda+=b>0?1:0;pest+=p>0?1:0;}
    perDay.push(`${g.meta[i].title.slice(0,40)} [${(g.meta[i].dmoods||[]).map(x=>MOODNM[x]).join("+")}] ${S.filter(s=>s.a.real&&s.cat==="sight").length} visitas`+(c==="Budapest"?` (Buda ${b}/Pest ${p})`:""));
    nights.push(S.filter(s=>["copas","disco"].includes(s.cat)).map(s=>(s.cat==="disco"?"DISCO ":"copas ")+(s.a.real?shortNm(s.a.t):"(genérico)")).join(" → ")||"—");
  });
  out.push(`\n##### TEST ${id} — ${c} ${d}d · ${co} · [${m.join(", ")}] · ${r} · ${dt}${isAuto(g.key)?" · GUÍA AUTOMÁTICA":""}`);
  out.push(` Paradas ${stops} · con nombre propio ${named} (${Math.round(named/stops*100)}%) · encajan con sus moods ${fit}/${named} (${Math.round(fit/Math.max(1,named)*100)}%)`);
  out.push(` Duplicados ${dups} · solapes ${overlap} · en día de cierre ${closedV} · después del cierre ${late} · tramo andando más largo ${maxWalk} min · subidas ≥60 m andando ${steepNoT}`);
  if(c==="Budapest")out.push(` Días que pisan Buda: ${buda} · días que pisan Pest: ${pest}`);
  perDay.forEach((x,i)=>out.push(`   D${i+1}: ${x} · noche: ${nights[i]}`));
  if(adv){out.push(" Moods: "+adv.sel.map(r=>`${r.nm} ${r.score}`).join(" · ")+(adv.sugg.length?" · sugiere: "+adv.sugg.map(r=>`${r.nm} (${r.top.join(", ")})`).join(" | "):" · sin sugerencias"));adv.notes.forEach(n=>out.push("   nota: "+n));}
}
return out.join("\n");
