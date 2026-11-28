// Temporadas: con fecha, lo que está cerrado ese mes no entra en el plan; sin fecha, la parada avisa.
const out=[];let fail=0;const bad=m=>{fail++;out.push("MAL "+m);};
const names=g=>g.plan.flat().filter(s=>s.a&&s.a.real).map(s=>s.a.t);
const C=[
 ["Chamonix",4,["aventura","foto"],"2026-11-12",/aiguille du midi|br[eé]vent|montenvers|lac blanc/i,false],
 ["Chamonix",4,["aventura","foto"],"2027-07-14",/aiguille du midi|montenvers|br[eé]vent|lac blanc/i,true],
 ["Santorini",4,["romantico","fiesta"],"2027-01-20",/catamar|koo club|ammoudi fish|santo wines/i,false],
 ["Santorini",4,["romantico","fiesta"],"2027-07-08",/catamar|koo club|ammoudi fish|santo wines/i,true],
 ["Interlaken",4,["aventura","romantico"],"2027-01-15",/harder kulm|schynige|san beato|dos lagos/i,false],
 ["Interlaken",4,["aventura","romantico"],"2027-07-15",/harder kulm|schynige|san beato|dos lagos/i,true],
];
for(const [c,d,m,dt,rx,expect] of C){
  const g=generar(c,d,m,"equi","pareja",{presup:"mid",inDate:dt});const n=names(g);const hit=n.filter(x=>rx.test(x));
  out.push(`${c} ${dt}: ${hit.length?"incluye "+hit.join(", "):"nada de temporada"}`);
  if(expect&&!hit.length)bad(`${c} en ${dt} debería incluir algo de temporada`);
  if(!expect&&hit.length)bad(`${c} en ${dt} incluye algo cerrado: ${hit.join(", ")}`);
  const P=g.trip.days.flatMap(D=>dayProblems(g.trip,D).map(p=>p.t));if(P.length)bad(`${c} ${dt}: ${P.join(" · ")}`);
}
// sin fecha: las paradas de temporada llevan el aviso
const g=generar("Chamonix",4,["aventura","foto"],"equi","pareja",{presup:"mid",inDate:""});
const s=g.plan.flat().filter(x=>x.a&&x.a.season);out.push("Chamonix sin fecha, con aviso de temporada: "+(s.map(x=>`${x.a.t} (solo ${x.a.season})`).join("; ")||"ninguna"));
if(!s.length)bad("sin fecha no se avisa de la temporada");
out.push(fail?`>> ${fail} FALLOS`:">> todo bien");
return out.join("\n");
