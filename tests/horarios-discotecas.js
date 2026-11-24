const SC=[["Barcelona",4,["fiesta","cultural"],"equi","amigos","mid","2026-12-01"],["Berlin",3,["fiesta"],"equi","amigos","mid","2026-11-23"],
["Paris",4,["fiesta","cultural"],"equi","amigos","mid",""],["Granada",3,["cultural"],"equi","pareja","mid","2027-01-12"],
["Londres",4,["cultural"],"equi","solo","mid","2027-01-18"],["Barcelona",3,["cultural"],"intenso","pareja","mid","2026-07-14"],
["Estocolmo",3,["fiesta"],"equi","amigos","mid","2026-12-10"],["Roma",3,["cultural"],"equi","pareja","mid","2026-11-30"]];
const WD=["dom","lun","mar","mié","jue","vie","sáb"];
const out=[];
for(const [c,d,m,r,co,pr,dt] of SC){
  try{await ensureCity(c);const k0=resolveKey(c);if(k0&&!isAuto(k0))await loadAux(k0);}catch(e){}
  const g=generar(c,d,m,r,co,{presup:pr,inDate:dt});
  out.push(`\n##### ${c} ${d}d [${m}] ${r} ${dt||"sin fecha"}  noches=${g.trip.night.join(",")}`);
  const issues=[];
  g.plan.forEach((day,i)=>{const M=g.meta[i];const D=g.trip.days[i];
    out.push(` Día ${i+1} (${D.wd!=null?WD[D.wd]:"?"}) ${M.title}`);
    day.forEach(s=>{if(s.a.marker)return;
      const h=s.a.hours?` [${s.a.hours.known?"":"~"}${s.a.hours.o}-${s.a.hours.c}${s.a.hours.late?" TARDE":""}${s.a.hours.cut?" acortada":""}]`:"";
      const cl=s.a.club?` {${s.a.club.txt}${s.a.club.open===false?" NO ABRE":""}}`:"";
      out.push(`   ${s.time}-${s.end||"     "} ${String(s.lb).padEnd(11)} ${s.a.real?"":"G "}${s.a.t.slice(0,46)}${h}${cl}`);
      if(s.a.hours&&s.a.hours.late)issues.push(`D${i+1} tarde ${s.a.t}`);
      if(s.a.hours&&!s.a.hours.late){const st=toMin(s.time);if(st<toMin(s.a.hours.o)-30)issues.push(`D${i+1} antes de abrir ${s.a.t}`);}
      if(s.a.club&&s.a.club.open===false)issues.push(`D${i+1} disco cerrada ${s.a.t}`);
    });
    M.why.forEach(w=>{if(/cierra|abre|discoteca|copas/i.test(w))out.push("     · "+w);});
  });
  out.push(" >> "+(issues.join(" | ")||"sin problemas")+"  · guía: horarios "+(g.trip&&tripGuide(g.trip,g.plan).hours.length)+", discos "+tripGuide(g.trip,g.plan).clubs.length);
}
return out.join("\n");
