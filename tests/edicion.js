// Edición avanzada: cada operación hace lo que debe o se rechaza con un motivo; el día nunca queda imposible,
// y al volver a aplicar las mismas operaciones sobre un plan recién generado sale exactamente lo mismo.
const out=[];let fail=0;
const show=(T,d)=>{const r=renderPlanDay(T,T.days[d]);return r.row.filter(s=>!s.a.marker).map(s=>`${s.time}-${s.end||""} ${s.a.t}`).join(" | ");};
const check=(name,res,expectOk)=>{const good=!!res.ok===expectOk;if(!good)fail++;out.push(`${good?"OK ":"MAL"} ${name}: ${res.ok?"hecho":"rechazado → "+res.why}`);};
const gen=()=>generar("Barcelona",3,["cultural","gastro"],"equi","pareja",{presup:"mid",inDate:"2026-12-02"}); // miércoles
let g=gen();const T=g.trip;const d=1,D=T.days[d];
out.push("ANTES  D2: "+show(T,d));
const idx=f=>D.slots.findIndex(f);
const edits=[];const doE=(name,e,ok)=>{const r=applyEdit(T,e);check(name,r,ok);if(r.ok)edits.push(e);return r;};
// 1) mover una visita
const iv=idx(s=>s.cat==="sight"&&s.label!=="Excursión");
doE("día lleno: mover la primera visita abajo (retrasaría el atardecer)",{d,op:"move",i:iv,dir:1},false);
{const D0=T.days[0],k=D0.slots.findIndex(s=>s.cat==="sight");doE("llegada: mover una visita abajo",{d:0,op:"move",i:k,ref:slotRef(D0,D0.slots[k]),dir:1},true);}
// 2) mover la comida → no se mueve, se cambia su hora
doE("mover la comida",{d,op:"move",i:idx(s=>s.cat==="comida"),dir:-1},false);
// 3) la Sagrada Família (cierra 18:00 en invierno) a las 19:30 → imposible
const isf=idx(s=>s.item&&/sagrada/i.test(s.item.nm));
if(isf>=0)doE("Sagrada Família a las 19:30 (cierra a las 18:00)",{d,op:"time",i:isf,at:tmin("19:30")},false);
// 4) comer más tarde
doE("comida a las 15:00",{d,op:"time",i:idx(s=>s.cat==="comida"),at:tmin("15:00")},true);
// 5) alargar una visita a 3 h
const iv2=idx(s=>s.cat==="sight");doE("una visita dura 3 h",{d,op:"time",i:iv2,dur:180},true);
// 6) añadir un sitio sugerido cercano
const c=addCandidates(T,d,3);out.push("    sugerencias: "+c.map(x=>shortNm(x.a.nm)+" "+x.km.toFixed(1)+" km").join(", "));
if(c[0])doE("añadir "+shortNm(c[0].a.nm),{d,op:"add",nm:c[0].a.nm},true);
// 7) con el día ya lleno por tus cambios (3 h en la Sagrada Família y comida a las 15:00), no cabe más: se rechaza con motivo
doE("día lleno: añadir Casa Vicens",{d,op:"own",nm:"Casa Vicens",c:[41.4035,2.1508],dur:60},false);
doE("día lleno: 1 h libre tras la comida (se perdería el atardecer)",{d,op:"pause",after:idx(s=>s.cat==="comida"),dur:60},false);
// 8) el día de llegada tiene hueco: sitio propio y tiempo libre entran
const d0=0,i0=()=>T.days[d0].slots.findIndex(s=>s.cat==="comida");
doE("llegada: añadir un sitio propio (Casa Vicens)",{d:d0,op:"own",nm:"Casa Vicens",c:[41.4035,2.1508],dur:60},true);
doE("llegada: 45 min libres justo tras la comida (Casa Vicens ya no daría tiempo)",{d:d0,op:"pause",after:i0(),dur:45},false);
doE("llegada: 45 min libres antes de cenar",{d:d0,op:"pause",after:T.days[d0].slots.findIndex(s=>s.cat==="cena")-1,dur:45},true);
out.push("DESPUÉS D1: "+show(T,d0));
// 9) día de vuelta: algo de 5 h no cabe antes del aeropuerto
const dl=T.dias-1;doE("parada de 5 h el último día",{d:dl,op:"own",nm:"Museo inventado de prueba",c:T.P.center,dur:300},false);
out.push("DESPUÉS D2: "+show(T,d));
const probs=dayProblems(T,D);out.push("problemas que quedan en D2: "+(probs.map(p=>p.t).join(" · ")||"ninguno"));
// 10) reabrir: plan nuevo + las mismas ediciones = mismo resultado
const g2=gen();edits.forEach(e=>applyEdit(g2.trip,e));
const same=show(g2.trip,d)===show(T,d)&&show(g2.trip,0)===show(T,0);if(!same)fail++;
out.push(`${same?"OK ":"MAL"} reabrir y reaplicar ${edits.length} ediciones da el mismo día`);
out.push(fail?`>> ${fail} FALLOS`:">> todo bien");
return out.join("\n");
