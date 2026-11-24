const out=[];let n=0,bad=0;
for(const k in DB){if(isAuto(k))continue;const city=(DESTINOS.find(d=>d.key===k)||{n:k}).n;
  for(const [d,m,dt] of [[4,["fiesta","cultural"],"2026-08-14"],[3,["relax","romantico"],""]]){n++;
    try{const g=generar(city,d,m,"equi","amigos",{presup:"mid",inDate:dt});
      const html=g.plan.map((day,i)=>day.filter(s=>!s.a.marker).map((s,j,a)=>j?connector(a[j-1],s,city,g.key):"").join("")).join("");
      if(/undefined|NaN/.test(html))throw new Error("texto raro en conectores");
      const why=g.meta.flatMap(x=>x.why).join(" ");if(/undefined|NaN/.test(why))throw new Error("texto raro en why: "+why.match(/.{40}(undefined|NaN).{20}/));
    }catch(e){bad++;out.push(k+" "+d+"d: "+e.message);}}}
return n+" viajes, "+bad+" con error\n"+out.join("\n");
