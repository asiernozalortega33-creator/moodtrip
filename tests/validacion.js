// Todo plan recién generado debe pasar el validador del día (horarios, cierres, que quepa, comidas a su hora…).
const out=[];let n=0,bad=0;const kinds={};
for(const k in DB){if(isAuto(k))continue;const city=(DESTINOS.find(d=>d.key===k)||{n:k}).n;
  for(const [d,m,co,r,dt] of [[4,["fiesta","cultural"],"amigos","intenso","2026-08-14"],[3,["relax","romantico"],"pareja","equi",""],[5,["cultural","gastro"],"familia","chill","2027-01-20"]]){
    const g=generar(city,d,m,r,co,{presup:"mid",inDate:dt});n++;
    g.trip.days.forEach((D,i)=>dayProblems(g.trip,D).forEach(p=>{bad++;const t=p.t.replace(/[0-9:]+/g,"#").replace(/^[^ ]+ /,"");kinds[t.slice(0,40)]=(kinds[t.slice(0,40)]||0)+1;if(out.length<14)out.push(`${city} ${d}d ${co} D${i+1}: ${p.t}`);}));}}
return (bad?">> FALLOS · ":">> todo bien · ")+`${n} viajes, ${bad} problemas\n`+out.join("\n")+"\n--- tipos:\n"+Object.entries(kinds).sort((a,b)=>b[1]-a[1]).map(([k,v])=>v+"× "+k).join("\n");
