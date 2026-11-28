// MoodTrip · pantallas: itinerario, presupuesto, antes de ir, mapas, flujo y cuentas
// (archivo de la app: scripts clásicos que comparten el ámbito global, en el orden de index.html)
/* ============ Secciones temáticas por mood (lo mejor cerca de tu hotel) ============ */
function centroide(pool){
  if(!pool)return null;let la=0,lo=0,n=0;
  pool.forEach(a=>{const c=COORDS[a.nm];if(c){la+=c[0];lo+=c[1];n++;}});
  return n?[la/n,lo/n]:null;
}
function anclaTema(pool,barrio,hotelCoord){
  if(hotelCoord)return {coord:hotelCoord,label:"cerca de tu hotel"};
  const nb=norm(barrio||"");
  // ojo: solo busca el barrio entre los sitios de ESTA ciudad (no en COORDS global, o cruzaría ciudades)
  if(pool&&nb.length>=3){for(const a of pool){const c=COORDS[a.nm];if(c&&norm(a.nm).includes(nb))return {coord:c,label:"cerca de "+cap(barrio)};}}
  const c=centroide(pool);return {coord:c,label:c?"en el centro":""};
}
function temasPorMood(mood,pool,destino,ancla){
  let items=[];
  if(pool){
    const seen=new Set();
    let cands=pool.filter(a=>a.m&&a.m.includes(mood)&&!seen.has(a.nm)&&(seen.add(a.nm),true));
    if(ancla&&ancla.coord)cands.sort((a,b)=>{const ca=COORDS[a.nm],cb=COORDS[b.nm];return (ca?hav(ca,ancla.coord):999)-(cb?hav(cb,ancla.coord):999);});
    items=cands.slice(0,4).map(a=>{const c=COORDS[a.nm];let dist=null;if(c&&ancla&&ancla.coord){const km=hav(c,ancla.coord);dist=km<0.3?"a un paso":"~"+Math.max(1,Math.round(km/4.8*60))+" min a pie";}
      return {t:a.nm,d:a.d,q:a.q,real:true,m:a.m,cat:a.cat,dist};});
  }
  if(items.length<2){
    const gv=(MOODGEN[mood]||[]).map(s=>s.replace(/\{D\}/g,cap(destino)));
    for(const g of gv){if(items.length>=4)break;if(!items.some(it=>it.t===g))items.push({t:g,d:"",real:false,m:[mood],dist:null});}
  }
  return items.slice(0,4);
}

/* ============ Consejos ============ */
function consejos(destino){
  const L=[{e:"📌",t:"Reserva online las atracciones más famosas y las discotecas top (suelen tener lista o entrada anticipada)."},{e:"🗺️",t:"El plan agrupa cada día por zonas: sigue el orden para no cruzar la ciudad sin parar."}];
  const mood={cultural:{e:"🎫",t:"Mira los días/horas de entrada gratis o reducida en museos y palacios."},relax:{e:"😌",t:"No fuerces: si un día quieres saltarte una parada y alargar el spa, hazlo."},aventura:{e:"🥾",t:"Reserva las excursiones (Krka, Bukhansan, cuevas) con antelación y mira el tiempo."},gastro:{e:"🍴",t:"Reserva mesa en los restaurantes marcados, vuelan los findes."},fiesta:{e:"🌙",t:"El orden previa→disco está pensado para la hora real: la disco se llena de 01:00 en adelante."},romantico:{e:"🌅",t:"Reserva el atardecer/cena especial; las mejores mesas con vistas se van pronto."},compras:{e:"🛍️",t:"Compras: muchos comercios cierran a mediodía o el domingo; comprueba el horario."},souvenir:{e:"🎁",t:"Souvenirs: regatea en mercados y bazares, y compara antes de pagar."},foto:{e:"📸",t:"Fotos: ve a primera o última hora a los spots top para pillarlos sin gente."}};
  sel.moods.forEach(m=>mood[m]&&L.push(mood[m]));
  const comps={solo:{e:"🧍",t:"Solo/a: un free tour el primer día para orientarte y conocer gente."},pareja:{e:"💑",t:"En pareja: deja una noche libre para improvisar algo especial."},amigos:{e:"🧑‍🤝‍🧑",t:"En grupo: fijad el presupuesto de cada plan antes para evitar líos."},familia:{e:"👨‍👩‍👧",t:"Con peques: alterna cultura con parques o playas para que no se aburran."}};
  if(comps[sel.compania])L.push(comps[sel.compania]);
  const pres={low:{e:"🎒",t:"Mochilero: street food (mercados, pojangmacha, lángos), transporte público y free tours."},mid:{e:"💳",t:"Presupuesto medio: combina 1-2 experiencias especiales con planes gratis."},high:{e:"💎",t:"Premium: guías privados, mesas VIP en discoteca y restaurantes top reservados."}};
  if(pres[sel.presupuesto])L.push(pres[sel.presupuesto]);
  const barrio=document.getElementById("barrio").value.trim();
  if(barrio)L.push({e:"🏨",t:`Te alojas en ${barrio}: empieza cada día por lo más cercano y deja lo lejano para una única salida.`});
  const com={veg:"Vegetariano: en estas ciudades hay opciones; en mercados pide lo de verdura (lángos, bindaetteok, etc.).",vegan:"Vegano: usa HappyCow para localizar sitios 100% veganos cerca de cada parada.",celiac:"Sin gluten: lleva una tarjeta traducida; ojo con salsas de soja (Corea) y rebozados.",halal:"Halal: en Seúl, la zona de Itaewon concentra la mayor oferta halal."};
  if(com[sel.comida])L.push({e:"🍽️",t:com[sel.comida]});
  const fis={bajo:"Ritmo cómodo: tira de metro/taxi entre paradas y siéntate a menudo (las termas y cafés ayudan).",alto:"Te gusta andar: calzado MUY cómodo; muchas de estas zonas se disfrutan mejor a pie."};
  if(fis[sel.fisico])L.push({e:"🥾",t:fis[sel.fisico]});
  const mes=document.getElementById("mes").value;
  if(mes){const ver=["Junio","Julio","Agosto"],inv=["Diciembre","Enero","Febrero"];
    if(ver.includes(mes))L.push({e:"☀️",t:`En ${mes} hará calor: planes de exterior a primera hora o al atardecer, y reserva playa/terrazas. (En Croacia es plena temporada: reserva todo).`});
    else if(inv.includes(mes))L.push({e:"🧥",t:`En ${mes} hará frío y anochece pronto: ganan los planes de interior (termas, museos, jjimjilbang).`});
    else L.push({e:"🍃",t:`${mes} es temporada media: buen clima, menos colas y precios más bajos. Buena elección.`});}
  return L;
}

/* ============ RENDER ============ */
function flash(msg){const e=document.getElementById("err");e.textContent=msg;e.style.display="block";clearTimeout(flash._t);flash._t=setTimeout(()=>e.style.display="none",2800);}
const lbl=(arr,id)=>{const o=arr.find(x=>x.id===id);return o?(o.ic?o.ic+" ":"")+o.nm:"";};
function tipoDe(cat,m){
  const map={desayuno:["coffee","Desayuno"],comida:["utensils","Para comer"],cena:["wine","Para cenar"],atardecer:["sunset","Atardecer"],copas:["wine","Copas"],disco:["disc","Discoteca"],foto:["camera","Para fotos"],compras:["bag","Compras"],souvenir:["gift","Souvenirs"],familia:["smile","Para peques"],familianoche:["icecream","Plan en familia"]};
  if(map[cat])return map[cat];
  // visitas (sight): se etiqueta según su mood
  if(m){
    if(m.includes("cultural"))return ["landmark","Cultural"];
    if(m.includes("aventura"))return ["mountain","Aventura / naturaleza"];
    if(m.includes("relax"))return ["leaf","Relax"];
    if(m.includes("romantico"))return ["heart","Romántico"];
    if(m.includes("gastro"))return ["utensils","Gastronomía"];
    if(m.includes("fiesta"))return ["music","Ambiente"];
  }
  return ["pin","Visita"];
}
/* ============ VUELOS + HOTEL ============ */
async function geocode(q){
  if(!q)return null;
  try{
    const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=es&q=${encodeURIComponent(q)}`,{headers:{"Accept":"application/json"}});
    if(!r.ok)return null;const j=await r.json();
    if(j&&j[0]&&j[0].lat)return [parseFloat(j[0].lat),parseFloat(j[0].lon)];
  }catch(e){}
  return null;
}
function flightCard(s){const a=s.a;return `<div class="stop flight"><span class="ftime2">${ico("clock")} ${s.time} · ${s.svg?ico(s.svg,"rot-"+s.rot):""} ${s.lb}</span><div class="name">${a.t}</div><div class="desc" style="color:#445">${a.d}</div>${a.link?`<a class="flink" href="${a.link}" target="_blank" rel="noopener">${ico("refresh")} Seguir el vuelo en vivo ↗</a>`:""}</div>`;}
function fmtDate(d){if(!d)return "";const p=d.split("-");return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:d;}
document.getElementById("checkFlights").onclick=async function(){
  const fIn=document.getElementById("flightIn").value.trim(),fOut=document.getElementById("flightOut").value.trim();
  const dIn=document.getElementById("dateIn").value,dOut=document.getElementById("dateOut").value;
  const msg=document.getElementById("flightMsg");
  if(!fIn&&!fOut){msg.innerHTML="✍️ Escribe al menos un nº de vuelo (ej: IB3214).";return;}
  const btn=this;btn.disabled=true;btn.textContent="Consultando...";
  const lines=[];
  for(const job of [["in",fIn,dIn,"timeIn","🛬 llega","arr","a"],["out",fOut,dOut,"timeOut","🛫 sale","dep","de"]]){
    const num=job[1],date=job[2],field=job[3],verb=job[4],leg=job[5],prep=job[6];if(!num)continue;
    if(!date){lines.push(`📅 Pon la <b>fecha</b> de <b>${num.toUpperCase()}</b> (los nº de vuelo se repiten cada día).`);continue;}
    try{
      const r=await fetch(`/api/flight?n=${encodeURIComponent(num)}&date=${date}`);
      const j=await r.json();
      if(!j.ok){
        if(j.reason==="no_key"){lines.push(`<span class="warn">⚠️ Estado en vivo no configurado.</span> Pon las horas a mano abajo; al añadir la clave <b>AERODATABOX_KEY</b> en Vercel se activa solo.`);break;}
        if(j.reason==="api_429"){lines.push(`<span class="warn">⏳ Límite de consultas del plan gratis alcanzado.</span> Espera un momento y reintenta, o pon la hora a mano.`);continue;}
        if(j.reason&&j.reason.indexOf("api_")===0){lines.push(`La API de vuelos no respondió (${j.reason.replace("api_","error ")}). Pon la hora a mano.`);continue;}
        lines.push(`No encontré <b>${num.toUpperCase()}</b> para el ${fmtDate(date)}.`);continue;
      }
      const f=j.flights[0],L=f[leg]||{},O=f[leg==="arr"?"dep":"arr"]||{};
      if(L.time)document.getElementById(field).value=L.time;
      const ruta=leg==="arr"?`${O.city||O.iata||"?"} → ${L.city||L.iata||"?"}`:`${L.city||L.iata||"?"} → ${O.city||O.iata||"?"}`;
      lines.push(`<b>${(f.number||num).toUpperCase()}</b> · ${fmtDate(date)} · ${ruta} · ${f.status||"programado"} · ${verb} ${L.time||"—"}${L.terminal?" · T"+L.terminal:""}`);
    }catch(e){lines.push(`Error consultando ${num.toUpperCase()}.`);}
  }
  msg.innerHTML=lines.join("<br>");btn.disabled=false;btn.innerHTML=ico("refresh")+" Comprobar vuelos en vivo";
};
document.getElementById("go").onclick=async()=>{
  const destino=inDest.value.trim();let dias=parseInt(inDias.value,10);if(isNaN(dias)||dias<1)dias=1;if(dias>21)dias=21;
  if(!destino)return flash("Escribe un destino 📍");
  if(!sel.moods.length)return flash("Elige al menos un mood ✨");
  if(!sel.compania)return flash("¿Con quién viajas? 👥");
  if(!sel.presupuesto)return flash("Elige presupuesto 💰");
  if(!sel.ritmo)return flash("Elige el ritmo ⚡");
  const hotelName=document.getElementById("hotel").value.trim();
  const opts={arr:document.getElementById("timeIn").value||null,dep:document.getElementById("timeOut").value||null,flightIn:document.getElementById("flightIn").value.trim(),flightOut:document.getElementById("flightOut").value.trim()};
  const goBtn=document.getElementById("go");let hotelCoord=null;
  if(hotelName){goBtn.textContent="Localizando tu hotel...";hotelCoord=await geocode(hotelName+", "+cap(destino));goBtn.innerHTML="Crear mi plan "+ico("plane");}
  const {key,plan}=generar(destino,dias,sel.moods,sel.ritmo,sel.compania,opts);
  document.getElementById("rTitulo").textContent=`${cap(destino)} · ${dias} ${dias===1?"día":"días"}`;
  const pills=[sel.moods.map(m=>lbl(MOODS,m)).join(" + "),lbl(COMPANIA,sel.compania),lbl(PRESUP,sel.presupuesto),lbl(RITMO,sel.ritmo),key?"⭐ guía detallada":"🧭 plan a medida"];
  if(hotelName)pills.push((hotelCoord?"🏨 ":"🏨 ")+hotelName+(hotelCoord?"":" (sin localizar)"));
  if(opts.arr||opts.dep)pills.push("✈️ días de vuelo ajustados");
  document.getElementById("rSum").innerHTML=pills.map(p=>`<span class="pill">${p}</span>`).join("");
  const cont=document.getElementById("rDias");cont.innerHTML="";const pend=[];
  for(const k in stopData)delete stopData[k];usedImgs.clear();
  plan.forEach((day,i)=>{
    let stops="";
    day.forEach((s,j)=>{const id=`th-${i}-${j}`;
      if(s.a.marker){stops+=flightCard(s);return;} // tarjeta de vuelo (llegada/salida), sin foto ni conector
      const tp=tipoDe(s.a.vcat||s.cat,s.a.m);
      stopData[id]={name:s.a.t,timeLabel:`${s.time} · ${s.lb}`,desc:s.a.d,cat:s.cat,real:s.a.real,destino:cap(destino),img:null};
      stops+=`<div class="stop"><div class="thumb" id="${id}" data-id="${id}"><span class="mag">${ico("search")} detalles</span></div><div class="body"><span class="time">${ico("clock")} ${s.time} · ${s.lb}</span><span class="kind">${ico(tp[0])}${tp[1]}</span><div class="name">${s.a.t}</div>${s.a.d?`<div class="desc">${s.a.d}</div>`:`<div class="desc" style="color:#86868b">Plan sugerido para tu mood en ${cap(destino)}.</div>`}${s.a.real?`<span class="tip">${ico("pin")} sitio real · toca la foto para detalles</span>`:'<span class="tip" style="color:#86868b;background:#f5f5f7">toca la foto para detalles</span>'}</div></div>`;
      if(j<day.length-1&&!day[j+1].a.marker)stops+=connector(day[j],day[j+1],cap(destino),key);
      pend.push({id,a:s.a,cat:s.cat,destino:cap(destino)});});
    const el=document.createElement("div");el.className="day";el.style.animationDelay=(i*0.07)+"s";
    el.innerHTML=`<div class="day-head"><span class="n">${i+1}</span><span class="t">Día ${i+1}<small>${day.length} paradas · de la mañana a la noche</small></span></div><div class="tl">${stops}</div>`;
    cont.appendChild(el);});
  cont.querySelectorAll(".thumb").forEach(el=>el.addEventListener("click",()=>openModal(el.dataset.id)));
  // ---- Secciones temáticas por mood: "lo mejor cerca de tu hotel" ----
  const tcont=document.getElementById("rTematicos");tcont.innerHTML="";
  const tpool=poolDe(key);const barrioTxt=document.getElementById("barrio").value.trim();
  const ancla=anclaTema(tpool,barrioTxt,hotelCoord);let tHtml="";
  sel.moods.forEach((mood,mi)=>{
    const md=MOODS.find(x=>x.id===mood)||{ic:"📍",nm:mood};
    const items=temasPorMood(mood,tpool,destino,ancla);
    let inner="";
    items.forEach((it,j)=>{const id=`tm-${mi}-${j}`;
      stopData[id]={name:it.t,timeLabel:`${md.nm}`,desc:it.d,cat:it.cat||mood,real:it.real,destino:cap(destino),img:null};
      inner+=`<div class="stop"><div class="thumb" id="${id}" data-id="${id}"><span class="mag">${ico("search")} detalles</span></div><div class="body"><span class="kind">${ico(md.svg||"pin")}${md.nm}</span><div class="name">${it.t}</div>${it.d?`<div class="desc">${it.d}</div>`:`<div class="desc" style="color:#86868b">Lo mejor de ${md.nm.toLowerCase()} en ${cap(destino)}.</div>`}${it.real?`<span class="tip">${ico("pin")} sitio real${it.dist?" · "+it.dist:""} · toca la foto</span>`:'<span class="tip" style="color:#86868b;background:#f5f5f7">sugerencia · toca la foto</span>'}</div></div>`;
      pend.push({id,a:{t:it.t,d:it.d,q:it.q,real:it.real,m:it.m},cat:it.cat||mood,destino:cap(destino)});});
    tHtml+=`<div class="day"><div class="day-head"><span class="n">${ico(md.svg||"pin")}</span><span class="t">Si quieres ${md.nm}<small>Lo mejor ${ancla.label||"de la ciudad"} · toca para detalles</small></span></div><div class="tl">${inner}</div></div>`;
  });
  if(tHtml)tHtml=`<h3 style="font-size:19px;font-weight:700;margin:34px 4px 14px;display:flex;align-items:center;gap:8px;color:var(--ink)"><span style="color:var(--acc);display:inline-flex;width:20px;height:20px">${ico("sparkles")}</span>Planes temáticos cerca de tu hotel</h3>`+tHtml;
  tcont.innerHTML=tHtml;
  tcont.querySelectorAll(".thumb").forEach(el=>el.addEventListener("click",()=>openModal(el.dataset.id)));
  const cs=consejos(destino);const nt=document.getElementById("rNotas");nt.style.animationDelay=(plan.length*0.07+0.1)+"s";
  nt.innerHTML=`<h3 style="display:flex;align-items:center;gap:8px"><span style="color:var(--acc);display:inline-flex;width:20px;height:20px">${ico("bulb")}</span>Consejos para tu viaje</h3><div class="nlist">${cs.map(c=>`<div class="ni"><span class="e">${c.e}</span><span>${c.t}</span></div>`).join("")}</div>`;
  const res=document.getElementById("result");res.classList.add("show");res.scrollIntoView({behavior:"smooth"});
  pend.forEach((p,idx)=>setTimeout(()=>{const el=document.getElementById(p.id);if(el)loadThumb(el,p.a,p.cat,p.destino,p.id);},idx*110));
};
document.getElementById("redo").onclick=()=>{document.getElementById("result").classList.remove("show");window.scrollTo({top:0,behavior:"smooth"});};

/* ============ FLUJO MULTIPANTALLA (landing · globo · encontrado) ============ */
(function(){
  const $=id=>document.getElementById(id);
  const anok=()=>window.anime && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const flow=$("flow");
  const WD=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const MO=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const CTRY={JP:"Japón",ES:"España",FR:"Francia",IT:"Italia",GB:"Reino Unido",PT:"Portugal",DE:"Alemania",NL:"Países Bajos",GR:"Grecia",HU:"Hungría",CZ:"Chequia",AT:"Austria",HR:"Croacia",KR:"Corea del Sur",TR:"Turquía",PL:"Polonia",SE:"Suecia",BE:"Bélgica",DK:"Dinamarca",IE:"Irlanda",US:"EE.UU.",TH:"Tailandia",AE:"E.A.U.",MA:"Marruecos",EG:"Egipto",MX:"México",AR:"Argentina",BR:"Brasil",SG:"Singapur",ID:"Indonesia",IS:"Islandia",NO:"Noruega",FI:"Finlandia",CH:"Suiza"};
  function fmtLong(date,time){if(!date)return "—";const d=new Date(date+"T00:00:00");if(isNaN(d))return (typeof fmtDate==="function"?fmtDate(date):date)+(time?" · "+time:"");return `${WD[d.getDay()]}, ${d.getDate()} de ${MO[d.getMonth()]}${time?" · "+time:""}`;}
  function diffDays(a,b){if(!a||!b)return null;const d=Math.round((new Date(b+"T00:00:00")-new Date(a+"T00:00:00"))/864e5);return d>=1?d:null;}
  function showScr(id){[...flow.querySelectorAll(".scr")].forEach(s=>s.classList.toggle("active",s.id===id));}
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  // imagen de fondo en alta resolución desde Wikimedia Commons (filtra basura: pdf/tif/svg/mapas/logos)
  async function bgOne(q){try{const u="https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=8&gsrsearch="+encodeURIComponent(q)+"&prop=imageinfo&iiprop=url|mime&iiurlwidth=1600";const r=await fetch(u);const j=await r.json();const p=j&&j.query&&j.query.pages;if(!p)return null;const arr=Object.values(p).sort((a,b)=>(a.index||0)-(b.index||0));for(const x of arr){const ii=x.imageinfo&&x.imageinfo[0];if(!ii)continue;const url=ii.thumburl||ii.url||"";if(!/^image\/(jpe?g|png)$/i.test(ii.mime||""))continue;if(/\.pdf|\.tif|\.svg|\.gif|logo|map|flag|coat[_ ]of|diagram|plate|scan|document|seal/i.test(url))continue;return url;}}catch(e){}return null;}
  async function bgImg(city,extra){const qs=[city+" "+(extra||"skyline"),city+" cityscape",city+" panorama",city];for(const q of qs){const u=await bgOne(q);if(u)return u;}return null;}
  // fondo del landing: ala sobre las nubes (verificada)
  $("landBg").style.backgroundImage="url('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Airplane_wing_sky_and_clouds.jpg/1920px-Airplane_wing_sky_and_clouds.jpg')";

  // reveal del planner clásico, con prefill opcional del vuelo
  let lastTrip=null;
  function revealPlanner(pf){
    if(pf){
      if(pf.dest)$("destino").value=pf.dest;
      if(pf.days){const v=Math.min(21,Math.max(1,pf.days));$("dias").value=v;if(typeof markQuick==="function")markQuick();}
      if(pf.inNum)$("flightIn").value=pf.inNum;
      if(pf.inDate)$("dateIn").value=pf.inDate;
      if(pf.inTime)$("timeIn").value=pf.inTime;
      if(pf.outNum)$("flightOut").value=pf.outNum;
      if(pf.outDate)$("dateOut").value=pf.outDate;
      if(pf.outTime)$("timeOut").value=pf.outTime;
      const af=document.querySelector(".afinar");if(af&&(pf.inNum||pf.outNum))af.open=true;
    }
    if(anok()){
      anime({targets:"#flow",opacity:[1,0],duration:460,easing:"easeOutQuad",complete:()=>flow.classList.add("hidden")});
      const els=document.querySelectorAll("header .badge, header h1, header p, .panel .field, .panel .afinar, .panel .go");
      anime.set(els,{opacity:0,translateY:16});
      anime({targets:els,opacity:[0,1],translateY:[16,0],delay:anime.stagger(45,{start:240}),duration:520,easing:"easeOutCubic"});
    }else{flow.classList.add("hidden");}
    window.scrollTo({top:0});
  }

  // animación del globo (avión sobre el arco + pasos)
  let planeAnim=null,stepTimers=[];
  function startGlobeAnim(){
    const steps=[...document.querySelectorAll("#gSteps .step")];
    steps.forEach(s=>s.classList.remove("on","done"));
    stepTimers.forEach(clearTimeout);stepTimers=[];
    steps[0].classList.add("on");
    stepTimers.push(setTimeout(()=>{steps[0].classList.add("done");steps[1].classList.add("on");},1100));
    stepTimers.push(setTimeout(()=>{steps[1].classList.add("done");steps[2].classList.add("on");},2200));
    if(anok()){
      anime({targets:"#scrGlobe .globe-top,#scrGlobe .route,#scrGlobe .globe-wrap,#scrGlobe .steps",opacity:[0,1],translateY:[18,0],delay:anime.stagger(90),duration:600,easing:"easeOutCubic"});
      try{
        const p=anime.path("#arcPath");
        planeAnim=anime({targets:"#gPlane",translateX:p("x"),translateY:p("y"),rotate:p("angle"),duration:2600,easing:"easeInOutSine",direction:"alternate",loop:true});
        anime({targets:".arc-end",scale:[1,1.5],opacity:[.6,1],direction:"alternate",loop:true,duration:900,easing:"easeInOutSine",delay:anime.stagger(300)});
      }catch(e){}
    }
  }
  function stopGlobeAnim(){if(planeAnim){planeAnim.pause();planeAnim=null;}stepTimers.forEach(clearTimeout);
    const steps=[...document.querySelectorAll("#gSteps .step")];steps.forEach(s=>{s.classList.remove("on");s.classList.add("done");});}

  async function startTrip(numIda,dateIda,numVta,dateVta){
    const msg=$("landMsg");msg.textContent="";
    numIda=(numIda||"").trim();numVta=(numVta||"").trim();
    if(!numIda){msg.textContent="Escribe tu número de vuelo de ida.";return;}
    if(!dateIda){msg.textContent="Añade la fecha del vuelo (los nº se repiten cada día).";$("landDate").focus();return;}
    showScr("scrGlobe");startGlobeAnim();
    const t0=Date.now();
    let ida=null,vta=null,err=null;
    try{
      const r=await fetch(`/api/flight?n=${encodeURIComponent(numIda)}&date=${dateIda}`);const j=await r.json();
      if(j.ok)ida=j.flights[0]; else err=j.reason;
    }catch(e){err="error";}
    if(ida){ // pinta la ruta en el globo
      const D=ida.dep||{},A=ida.arr||{};
      $("gOrig").innerHTML=`${D.iata||"—"} <small>${D.city||""}</small>`;
      $("gDest").innerHTML=`${A.iata||"—"} <small>${A.city||""}</small>`;
    }
    if(numVta&&dateVta){try{const r=await fetch(`/api/flight?n=${encodeURIComponent(numVta)}&date=${dateVta}`);const j=await r.json();if(j.ok)vta=j.flights[0];}catch(e){}}
    // tiempo mínimo de show del globo
    await sleep(Math.max(0,2600-(Date.now()-t0)));
    if(!ida){
      showScr("scrLand");stopGlobeAnim();
      msg.textContent = err==="no_key" ? "La detección en vivo no está configurada. Usa \"Planear sin vuelo\"."
        : err==="api_429" ? "Límite de consultas alcanzado. Prueba en un momento o usa \"Planear sin vuelo\"."
        : `No encontré ${numIda.toUpperCase()} para esa fecha. Revisa el número y la fecha.`;
      return;
    }
    stopGlobeAnim();
    // datos para la pantalla "encontrado"
    const A=ida.arr||{},D=ida.dep||{};
    const city=A.city||A.iata||"Tu destino";
    const ctry=CTRY[A.country]||A.country||"";
    const days=diffDays(A.date||dateIda,(vta&&vta.dep&&vta.dep.date)|| (dateVta||null));
    $("fDest").textContent=ctry?`${city}, ${ctry}`:city;
    $("fDays").textContent=days?`${days} días`:"";$("fDays").style.display=days?"":"none";
    $("fArr").textContent=fmtLong(A.date||dateIda,A.time);
    const hasDep=!!(vta||dateVta);
    $("rowSalida").style.display=hasDep?"":"none";
    if(hasDep)$("fDep").textContent=vta?fmtLong((vta.dep&&vta.dep.date)||dateVta,vta.dep&&vta.dep.time):fmtLong(dateVta,null);
    $("fFlights").textContent=[ida.number,vta&&vta.number].filter(Boolean).map(s=>s.toUpperCase()).join(" · ")||"—";
    // imagen de destino de fondo (alta resolución, varios queries con respaldo)
    try{const u=await bgImg(city,"skyline");if(u)$("foundBg").style.backgroundImage=`url('${u}')`;}catch(e){}
    lastTrip={dest:city,days:days,inNum:(ida.number||numIda).toUpperCase(),inDate:dateIda,inTime:A.time,
      outNum:vta?(vta.number||numVta).toUpperCase():(numVta?numVta.toUpperCase():""),outDate:dateVta||"",outTime:vta&&vta.dep?vta.dep.time:""};
    showScr("scrFound");
  }

  // ===== Pantalla 4 · moods en burbujas =====
  const MU="https://upload.wikimedia.org/wikipedia/commons/thumb/";
  const MOODB=[
    {id:"foto",svg:"camera",nm:"Lugares únicos",ds:"Rincones que no salen en las guías.",img:MU+"f/f9/Lake_Reflection%2C_Idyllwild%2C_CA_2013_%2814723107919%29.jpg/960px-Lake_Reflection%2C_Idyllwild%2C_CA_2013_%2814723107919%29.jpg"},
    {id:"gastro",svg:"utensils",nm:"Comer increíble",ds:"Sabores que recordarás siempre.",img:MU+"6/65/Pork_tagliatelle_pasta_dish_at_restaurant_in_Rome%2C_Italy.jpg/960px-Pork_tagliatelle_pasta_dish_at_restaurant_in_Rome%2C_Italy.jpg"},
    {id:"cultural",svg:"landmark",nm:"Cultura e historia",ds:"Museos, templos y siglos de historia.",img:MU+"8/83/Princeton_University_Art_Museum_Ancient_Mediterranean_Art_Gallery.jpg/960px-Princeton_University_Art_Museum_Ancient_Mediterranean_Art_Gallery.jpg"},
    {id:"aventura",svg:"mountain",nm:"Naturaleza",ds:"Aire libre, rutas y paisajes.",img:MU+"4/4e/Beech_Forest_%28AU%29%2C_Great_Otway_National_Park%2C_Beauchamp_Falls_--_2019_--_1271.jpg/960px-Beech_Forest_%28AU%29%2C_Great_Otway_National_Park%2C_Beauchamp_Falls_--_2019_--_1271.jpg"},
    {id:"relax",svg:"leaf",nm:"Relax total",ds:"Desconectar sin mirar el reloj.",img:MU+"f/fa/Budapest_Sz%C3%A9chenyi_Baths_R02.jpg/960px-Budapest_Sz%C3%A9chenyi_Baths_R02.jpg"},
    {id:"fiesta",svg:"music",nm:"Vida nocturna",ds:"La noche también es viaje.",img:MU+"d/de/88mph_high_res_illuminated_dance_floor_20260411.jpg/960px-88mph_high_res_illuminated_dance_floor_20260411.jpg"},
    {id:"romantico",svg:"heart",nm:"Para dos",ds:"Planes pensados en pareja.",img:MU+"2/2e/A_couple_silhouette_at_Ras_jebel_beach_during_a_golden_sunset.jpg/960px-A_couple_silhouette_at_Ras_jebel_beach_during_a_golden_sunset.jpg"},
    {id:"compras",svg:"bag",nm:"Compras",ds:"Calles, mercados y vitrinas.",img:MU+"7/7e/Night_view_of_Market_Street%2C_and_Christmas_Lights_-_geograph.org.uk_-_2720244.jpg/960px-Night_view_of_Market_Street%2C_and_Christmas_Lights_-_geograph.org.uk_-_2720244.jpg"},
    {id:"souvenir",svg:"gift",nm:"Recuerdos",ds:"Crear momentos que se queden para siempre.",img:MU+"f/f5/Souvenirs_-_panoramio_%284%29.jpg/960px-Souvenirs_-_panoramio_%284%29.jpg"}
  ];
  const flowMoods=new Set();
  function syncNext(){const n=$("moodNext");if(n)n.style.opacity=flowMoods.size?"1":".45";}
  (function(){const c=$("bubbles");if(!c)return;MOODB.forEach(m=>{
    const b=document.createElement("div");b.className="moodc";
    b.innerHTML=`<div class="ph" style="background-image:url('${m.img}')"></div><span class="mi">${ico(m.svg)}</span><span class="mn">${m.nm}</span><span class="md">${m.ds}</span>`;
    b.onclick=()=>{if(flowMoods.has(m.id)){flowMoods.delete(m.id);b.classList.remove("on");}else{if(flowMoods.size>=3)return;flowMoods.add(m.id);b.classList.add("on");}syncNext();if(typeof updatePrefSummary==="function")updatePrefSummary();};
    c.appendChild(b);});syncNext();})();

  // ===== Pantalla 6 · itinerario oscuro =====
  const MO2=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  // el nombre de cada día sale de lo que hay ese día (zona, sitios, tipo de día), no de una lista fija
  function dayName(i,total,city){const m=ITIN&&ITIN.meta&&ITIN.meta[i];if(m)return m.title;if(i===0)return"Llegada a "+city;if(total>1&&i===total-1)return"Último día en "+city;return"Día "+(i+1);}
  function daySub(i){const m=ITIN&&ITIN.meta&&ITIN.meta[i];return m?m.sub:"";}
  const BEST={budapest:["May – Sep","16° – 27°"],seoul:["Abr – Jun","12° – 24°"],split:["May – Sep","19° – 29°"],estambul:["Abr – Jun","12° – 24°"],atenas:["Abr – Jun","16° – 27°"],sevilla:["Mar – May","15° – 26°"],madrid:["Abr – Jun","12° – 25°"],roma:["Abr – Jun","13° – 25°"],florencia:["Abr – Jun","13° – 25°"],venecia:["Abr – Jun","12° – 23°"],milan:["Abr – Jun","12° – 24°"],niza:["May – Sep","17° – 26°"],paris:["May – Sep","13° – 24°"],londres:["May – Sep","12° – 22°"],edimburgo:["May – Ago","9° – 19°"],dublin:["May – Ago","10° – 19°"],amsterdam:["May – Sep","11° – 21°"],bruselas:["May – Sep","11° – 21°"],berlin:["May – Sep","13° – 24°"],munich:["May – Sep","11° – 23°"],viena:["May – Sep","13° – 25°"],praga:["May – Sep","12° – 24°"],cracovia:["May – Sep","12° – 24°"],copenhague:["May – Ago","12° – 21°"],estocolmo:["May – Ago","11° – 21°"],oporto:["May – Sep","14° – 25°"],lisboa:["Abr – Oct","15° – 27°"],barcelona:["May – Jun · Sep – Oct","17° – 27°"],granada:["Mar – May · Oct","13° – 26°"],valencia:["Abr – Jun · Sep – Oct","15° – 27°"],malaga:["Abr – Jun · Sep – Oct","17° – 28°"],bilbao:["May – Sep","14° – 25°"],napoles:["Abr – Jun · Sep – Oct","15° – 27°"],tokio:["Mar – May · Oct – Nov","12° – 24°"],palma:["May – Jun · Sep – Oct","18° – 28°"],chamonix:["Jun – Sep · Dic – Mar","8° – 22°"],interlaken:["Jun – Sep","10° – 24°"],santorini:["May – Jun · Sep – Oct","20° – 28°"]};
  let ITIN=null;
  window.curItin=()=>ITIN; // para el transporte con líneas (vive fuera de este bloque)
  function shortDate(d){if(!d)return"";const x=new Date(d+"T00:00:00");return isNaN(x)?"":`${x.getDate()} ${MO2[x.getMonth()]}`;}
  function longDay(date0,off){const x=new Date(date0+"T00:00:00");if(isNaN(x))return"";x.setDate(x.getDate()+off);return `${WD[x.getDay()]} ${x.getDate()} ${MO[x.getMonth()]}`;}
  let flowHotelCoord=null;
  function generateItin(){
    const tp=lastTrip||{};const destino=(tp.dest||$("destino").value||"tu destino");
    const days=Math.min(21,Math.max(1,tp.days||3));
    const moods=[...flowMoods];
    const comp=(typeof sel!=="undefined"&&sel.compania)||"amigos";
    const ritmo=(typeof sel!=="undefined"&&sel.ritmo)||"equi";
    if(typeof sel!=="undefined"){sel.moods=moods;sel.presupuesto=sel.presupuesto||"mid";}
    const opts={arr:tp.inTime||null,dep:tp.outTime||null,flightIn:tp.inNum||"",flightOut:tp.outNum||"",inDate:tp.inDate||"",presup:(typeof sel!=="undefined"&&sel.presupuesto)||"mid"};
    const genArgs=[destino,days,moods,ritmo,comp,opts];
    const res=generar(...genArgs);
    ITIN={plan:res.plan,meta:res.meta,trip:res.trip,key:res.key,city:cap(destino),days,inDate:tp.inDate,hotelCoord:flowHotelCoord,cur:0,genArgs,edits:[],msg:null,budget:tp.budget?{...tp.budget}:null};
    // viaje guardado con cambios: se vuelven a aplicar (el motor es determinista)
    if(Array.isArray(tp.edits)&&tp.edits.length){let lost=0;tp.edits.forEach(e=>{if(applyEdit(res.trip,e).ok)ITIN.edits.push(e);else lost++;});tp.edits=null;redrawAllDays();
      if(lost)ITIN.msg={day:0,bad:true,txt:`No he podido volver a aplicar ${lost} de tus ${lost+ITIN.edits.length} cambios: con el plan de hoy ya no caben o ese sitio ya no está. El resto sigue como lo dejaste.`};}
    ITIN.guide=tripGuide(res.trip,res.plan);
    $("itinCity").textContent=`Tu viaje a ${ITIN.city}`;
    const nights=Math.max(1,days-1);
    $("itinMeta").textContent=`${days} ${days===1?"día":"días"} · ${nights} ${nights===1?"noche":"noches"}`;
    if(isAuto(ITIN.key)){const b=document.createElement("div");b.className="auto-badge";b.title="Sitios reales sacados de Wikipedia/Wikidata y OpenStreetMap, ordenados por lo conocidos que son. Sin IA.";b.innerHTML=`${ico("sparkles")} Guía automática · Wikipedia y OpenStreetMap`;$("itinMeta").appendChild(b);}
    if(!ITIN.inDate){const bx=document.createElement("div");bx.className="itin-date";
      bx.innerHTML=`<b>${ico("calendar")} ¿Cuándo vas?</b>Sin fecha, el atardecer va a una hora aproximada y no sé qué está cerrado ni qué noches abren las discotecas.<div class="row"><input type="date" min="${new Date().toISOString().slice(0,10)}" aria-label="Fecha del primer día"/><button type="button">Ajustar el plan</button></div>`;
      const inp=bx.querySelector("input");
      bx.querySelector("button").onclick=()=>{if(!inp.value){inp.focus();return;}lastTrip=Object.assign({},lastTrip||{},{inDate:inp.value});const cur=ITIN.cur||0;generateItin();if(cur&&ITIN.plan[cur])renderItinDay(cur);if(typeof flash==="function")flash("Plan ajustado a tus fechas");};
      $("itinMeta").appendChild(bx);}
    transitPing();
    paintAdjust();
    ITIN.events=null;loadEvents(ITIN.key,ITIN.inDate,days).then(ev=>{if(ITIN&&ITIN.key===res.key){ITIN.events=ev||[];renderEvents();}});
    paintDayList();
    renderItinDay(0);
  }
  function paintAdjust(){
    let box=$("itinAdj");if(!box){box=document.createElement("details");box.id="itinAdj";box.className="itin-adj";const dl=$("dayList");dl.parentNode.insertBefore(box,dl);}
    const r=(sel&&sel.ritmo)||"equi",ms=[...flowMoods];
    box.innerHTML=`<summary>${ico("sliders")} Ajustar el viaje</summary><div class="adj-b"><span class="adj-l">Ritmo</span><div class="adj-c">${RITMO.map(x=>`<button type="button" data-r="${x.id}" class="${x.id===r?"on":""}">${x.nm}</button>`).join("")}</div>
      <span class="adj-l">Presupuesto</span><div class="adj-c">${PRESUP.map(x=>`<button type="button" data-b="${x.id}" class="${x.id===((sel&&sel.presupuesto)||"mid")?"on":""}">${x.nm}</button>`).join("")}</div>
      <span class="adj-l">Moods <small>(hasta 3)</small></span><div class="adj-c adj-m">${MOODB.filter(m=>m.id!=="souvenir").map(m=>`<button type="button" data-m="${m.id}" class="${ms.includes(m.id)?"on":""}">${MOODNM[m.id]||m.nm}</button>`).join("")}</div>
      <button type="button" class="adj-go">Rehacer el viaje</button><p class="dnote">Rehace todos los días con el nuevo ritmo, presupuesto y moods${ITIN&&ITIN.edits&&ITIN.edits.length?"; tus cambios a mano se perderían":""}.</p></div>`;
    let pr=r,pm=new Set(ms),pb=(sel&&sel.presupuesto)||"mid";const b0=pb;
    box.querySelectorAll("[data-b]").forEach(b=>b.onclick=()=>{pb=b.dataset.b;box.querySelectorAll("[data-b]").forEach(x=>x.classList.toggle("on",x===b));});
    box.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{pr=b.dataset.r;box.querySelectorAll("[data-r]").forEach(x=>x.classList.toggle("on",x===b));});
    box.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{const m=b.dataset.m;if(pm.has(m)){if(pm.size>1)pm.delete(m);}else if(pm.size<3)pm.add(m);box.querySelectorAll("[data-m]").forEach(x=>x.classList.toggle("on",pm.has(x.dataset.m)));});
    box.querySelector(".adj-go").onclick=()=>{const same=pr===r&&pb===b0&&pm.size===ms.length&&ms.every(m=>pm.has(m));if(same){box.open=false;return;}
      const keepB=ITIN.budget;replanWith(()=>{if(sel){sel.ritmo=pr;sel.presupuesto=pb;}flowMoods.clear();pm.forEach(m=>flowMoods.add(m));if(lastTrip)lastTrip.budget=keepB;},"con "+(RITMO.find(x=>x.id===pr)||{}).nm.toLowerCase()+" y "+[...pm].map(m=>MOODNM[m]).join(" + "));};
  }
  function paintDayList(){
    const dl=$("dayList");dl.innerHTML="";
    const g=document.createElement("button");g.className="day-item day-guide";g.dataset.k="guide";
    const nb=ITIN.guide&&ITIN.guide.books.length;
    g.innerHTML=`<span class="dg-t">${ico("list")} Antes de ir</span><small>${nb?`${nb} ${nb===1?"cosa que reservar":"cosas que reservar"}`:"Transporte, horarios y costumbres"}</small>`;
    g.onclick=()=>renderGuide();dl.appendChild(g);
    if(ITIN.trip){const bp=document.createElement("button");bp.className="day-item day-guide day-bud";bp.dataset.k="budget";
      let st="";try{const S0=budgetState();const B=tripBudget(ITIN.trip,ITIN.plan,S0.people,{flightPP:S0.flight!=null?S0.flight:undefined,lodgeNight:S0.lodge!=null?S0.lodge:undefined});st=`${fmtMoney(B.pp[0])}–${fmtMoney(B.pp[1])} € por persona`;}catch(e){st="Lo que cuesta tu plan";}
      bp.innerHTML=`<span class="dg-t">${ico("wallet")} Presupuesto</span><small>${st}</small>`;bp.onclick=()=>renderBudget();dl.appendChild(bp);}
    ITIN.plan.forEach((_,i)=>{const m=ITIN.meta[i]||{};const b=document.createElement("button");b.className="day-item";b.dataset.k=i;
      b.innerHTML=`<span>Día ${i+1}<em class="dk dk-${m.type||"barrio"}">${m.short||""}</em></span><small>${dayName(i,ITIN.plan.length,ITIN.city)}</small>`;b.onclick=()=>renderItinDay(i);dl.appendChild(b);});
  }
  const GMQ={desayuno:"cafeterías para desayunar",sight:"qué ver",comida:"restaurantes de comida típica",cena:"restaurantes para cenar",atardecer:"miradores para ver el atardecer",copas:"bares de copas",disco:"discotecas",foto:"miradores",compras:"calles comerciales",souvenir:"tiendas de recuerdos",familia:"planes con niños",familianoche:"heladerías",merienda:"pastelerías"};
  function markDayList(k){[...$("dayList").children].forEach(b=>{const on=b.dataset.k===String(k);b.classList.toggle("on",on);
    // en el móvil la lista de días es una tira horizontal: que el día elegido se vea
    if(on&&window.innerWidth<=860){const dl=$("dayList");dl.scrollTo({left:Math.max(0,b.offsetLeft-dl.offsetLeft-16),behavior:"smooth"});}});}
  function paintDayInfo(i){
    const m=ITIN.meta[i]||{};const el=$("dayInfo");if(!el)return;
    const chips=[];
    if(m.kicker)chips.push(`<span class="ichip ik-${m.type}">${ico(m.type==="excursion"?"train":m.type==="llegada"?"plane":m.type==="salida"?"plane":"walk")} ${m.kicker}</span>`);
    if(m.from)chips.push(`<span class="ichip">${ico("clock")} ${m.from} – ${m.to}</span>`);
    if(m.checks)chips.push(m.checks.ok?`<span class="ichip ichk" title="Comprobado: horarios de apertura, días de cierre, que todo quepa (también antes del vuelo), comidas y cenas a su hora, atardecer y noches de apertura de las discotecas.">${ico("check")} Plan revisado</span>`:`<span class="ichip ichk bad" title="${esc(m.checks.left.join(" · "))}">${ico("alert")} ${m.checks.left.length} ${m.checks.left.length===1?"aviso":"avisos"}</span>`);
    chips.push(`<button type="button" class="ichip tr-day" title="Consulta en Transitous los trayectos largos de hoy y rehace el horario con sus minutos reales">${ico("train")} Actualizar con el transporte real</button>`);
    if(m.dmoods&&m.dmoods.length)chips.push(`<span class="ichip" title="Lo que se vive hoy según las paradas del día">${ico("sparkles")} Hoy: ${m.dmoods.map(x=>MOODNM[x]).join(" + ")}</span>`);
    if(m.km!=null)chips.push(`<span class="ichip">${ico("route")} ${m.km.toFixed(1).replace(".",",")} km · ${m.walkPct}% a pie</span>`);
    const W=m.why||[];
    const why=W.slice(0,3).map(t=>`<li>${t}</li>`).join("")+(W.length>3?`<li class="wmore" hidden>${W.slice(3).join("</li><li class=\"wmore\" hidden>")}</li>`:"");
    const pb=(m.planB||[]).map(p=>`<li>${ico(p.ic)}<span>${p.t}</span></li>`).join("");
    el.onclick=e=>{const b=e.target.closest(".tr-day");if(b)updateDayTransit(b);};
    el.innerHTML=`<div class="ichips">${chips.join("")}</div>
      ${why&&window.innerWidth<=860?`<details class="iplanb iwhy-m"><summary>${ico("bulb")} Por qué hoy es así</summary><ul class="iwl">${W.map(t=>`<li>${t}</li>`).join("")}</ul></details>`:""}
      ${why&&window.innerWidth>860?`<div class="iwhy"><b>${ico("bulb")} Por qué hoy es así</b><ul>${why}</ul>${W.length>3?`<button class="wbtn" onclick="this.parentNode.querySelectorAll('.wmore').forEach(x=>x.hidden=false);this.remove()">Ver ${W.length-3} más</button>`:""}</div>`:""}
      ${pb?`<details class="iplanb"><summary>${ico("sliders")} Plan B: si llueve, si vas cansado…</summary><ul>${pb}</ul></details>`:""}`;
  }
  function stopChips(s,info){
    const a=s.a,out=[];
    if(a.price&&a.price.txt)out.push(`<span class="dchip${a.price.free?" free":""}">${ico("wallet")} ${a.price.txt}</span>`);
    else if(a.real&&!a.auto&&!a.own&&info.price)out.push(`<span class="dchip">${ico("wallet")} ${info.price}</span>`);
    if(a.dur&&!a.libre)out.push(`<span class="dchip">${ico("clock")} ${fmtDur(a.dur)}</span>`);
    if(a.book&&a.book[0]!=="opcional")out.push(`<span class="dchip warn" title="${a.book[1]}">${ico("ticket")} Reserva con ${a.book[0].replace(/\s*\(.*\)/,"")}</span>`);
    if(a.closed)out.push(`<span class="dchip${a.closed.today?" bad":""}">${ico("alert")} ${a.closed.today?"¡Cerrado ese día! Cámbialo":"Cierra "+a.closed.txt}</span>`);
    if(a.hours)out.push(`<span class="dchip${a.hours.late?" bad":""}" title="${a.hours.txt}">${ico(a.hours.late?"alert":"calendar")} ${a.hours.late?"Cierra a las "+a.hours.c+": no llegas":(a.hours.known?"Abierto "+a.hours.o+"–"+a.hours.c:"Suele cerrar a las "+a.hours.c)}</span>`);
    if(a.season&&!(ITIN&&ITIN.inDate))out.push(`<span class="dchip warn" title="Pon la fecha del viaje y solo entrará si está abierto">${ico("calendar")} Solo ${a.season}</span>`);
    if(a.club)out.push(`<span class="dchip${a.club.open===false?" bad":""}" title="${a.club.months?"Solo "+a.club.months:""}">${ico(a.club.open===false?"alert":"calendar")} ${a.club.open===false?"Esa noche no suele abrir":(a.club.open?"Abre esa noche":"Suele abrir "+a.club.txt)}</span>`);
    return out.join("");
  }
  function stopActs(s){
    const sl=s.slot;if(!sl)return "";const exc=sl.label==="Excursión",mov=EDIT_MOVABLE.has(sl.cat)&&!exc;
    return `<div class="dacts">${mov?`<button class="dact" data-act="up" title="Adelantar" aria-label="Adelantar">${ico("arrow","r-up")}</button><button class="dact" data-act="down" title="Retrasar" aria-label="Retrasar">${ico("arrow","r-down")}</button>`:""}${exc?"":`<button class="dact" data-act="time" title="Cambiar la hora o lo que dura">${ico("clock")} Hora</button>`}${sl.cat!=="pausa"?`<button class="dact" data-act="swap" title="Cambiar por otra opción cercana">${ico("refresh")} Cambiar</button>`:""}<button class="dact" data-act="del" title="Quitar del plan" aria-label="Quitar">${ico("x")}</button></div>`;
  }
  function renderItinDay(i){
    if(!ITIN)return;
    if(ITIN.msg&&ITIN.msg.day!==i)ITIN.msg=null;
    ITIN.cur=i;
    $("scrItin").classList.remove("guide-on");
    markDayList(i);
    const m=ITIN.meta[i]||{};
    const stops=ITIN.plan[i].filter(s=>!(s.a&&s.a.marker));
    $("itinDayDate").textContent=(ITIN.inDate?longDay(ITIN.inDate,i)+" · ":"")+`Día ${i+1} de ${ITIN.plan.length}`;
    $("itinTitle").textContent=dayName(i,ITIN.plan.length,ITIN.city);
    $("itinSub").textContent=(m.focus?m.focus+" · ":"")+(m.sub||"");
    paintDayInfo(i);
    const nx=$("itinNextDay");if(nx)nx.innerHTML=(i<ITIN.plan.length-1?"Siguiente día ":"Resumen y reserva ")+ico("arrow");
    const dp=$("dayPhoto");
    if(dp){dp.style.backgroundImage="";const first=stops.find(s=>s.a&&s.a.real&&(s.cat==="sight"||s.cat==="atardecer"))||stops.find(s=>s.a&&s.a.real);
      (async()=>{let u=(first&&typeof IMG!=="undefined"&&IMG[first.a.t])||null;
        if(!u&&first&&typeof commonsImg==="function")u=await commonsImg(first.a.q||ITIN.city);
        if(u&&ITIN.cur===i)dp.style.backgroundImage=`url('${u}')`;})();}
    const tl=$("itinTimeline");tl.innerHTML="";const pend=[];
    let nPin=0;stops.forEach(s=>{s._n=stopCoord(s)?++nPin:0;});
    let prevReal=null;
    stops.forEach((s,j)=>{
      const id=`di-${i}-${j}`;const cat=s.a.vcat||s.cat;
      if(s.a.libre){
        const row=document.createElement("div");row.className="dstop dfree";
        row.innerHTML=`<div class="dt">${s.time}</div><div class="dmid"><div class="dn">${ico("coffee")} ${s.a.t} <span class="dto">hasta las ${s.end}</span></div><div class="dd">${s.a.d}</div>${s.slot?stopActs(s):""}</div><div></div>`;
        if(s.slot)row.onclick=e=>{const b=e.target.closest(".dact");if(b){e.stopPropagation();editStop(i,s,b.dataset.act,b);}};
        tl.appendChild(row);return;
      }
      if(prevReal&&prevReal.a.real&&s.a.real&&typeof connector==="function"){const c=document.createElement("div");c.className="dconnwrap";c.innerHTML=connector(prevReal,s,ITIN.city,ITIN.key,ITIN.trip&&ITIN.trip.o);tl.appendChild(c);}
      prevReal=s;
      const info=(typeof getInfo==="function")?getInfo({cat,name:s.a.t,destino:ITIN.city,kind:s.a.kind}):{price:"€€"};
      if(typeof stopData!=="undefined")stopData[id]={name:s.a.t,timeLabel:`${s.time}${s.end?" – "+s.end:""} · ${s.lb}`,desc:s.a.d,cat,real:s.a.real,destino:ITIN.city,img:null,kind:s.a.kind,dur:s.a.dur,price:s.a.price,book:s.a.book,closed:s.a.closed,near:s.a.near,auto:s.a.auto,gm:s.a.gm,hours:s.a.hours,club:s.a.club,own:s.a.own,key:ITIN.key,season:s.a.season};
      let hotelChip="";
      if(ITIN.hotelCoord&&typeof COORDS!=="undefined"&&COORDS[s.a.t]){const km=hav(COORDS[s.a.t],ITIN.hotelCoord);const mn=km<0.3?"a un paso":"~"+Math.max(1,Math.round(km/4.8*60))+" min a pie";hotelChip=`<span class="dchip">${ico("bed")} ${mn} del hotel</span>`;}
      const row=document.createElement("div");row.className="dstop"+(s._n&&nPin>=2?" has-n":"")+(s.a.real?"":" dgen");row.dataset.id=id;
      // parada sin sitio concreto: se dice y se abre el mapa justo en esa zona (con reseñas reales)
      const gq=!s.a.real&&!s.a.marker?(s.a.gm||(GMQ[cat]?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(GMQ[cat]+" en "+ITIN.city)}`:"")):"";
      const near=s.a.near&&s.a.near.length?`<div class="dnear">${ico("pin")} Al lado, de paso: ${s.a.near.join(", ")}</div>`:"";
      const acts=stopActs(s);
      row.innerHTML=`<div class="dt">${s.time}${s.end?`<small>${s.end}</small>`:""}</div><div class="dmid"><div class="dlb">${s.lb}</div><div class="dn">${s._n&&nPin>=2?`<span class="dnum">${s._n}</span>`:""}${s.a.t}</div>${s.a.d?`<div class="dd">${s.a.d}</div>`:""}${near}<div class="dmeta">${stopChips(s,info)}${gq?`<a class="dchip dgm" href="${gq}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${ico("pin")} Ver sitios en Google Maps ↗</a>`:""}${hotelChip}${s.a.real?`<span class="ddetail">${ico("search")} detalles</span>`:""}</div>${acts}</div><div class="dth" id="${id}"></div>`;
      row.onclick=e=>{
        const b=e.target.closest(".dact");
        if(b){e.stopPropagation();editStop(i,s,b.dataset.act,b);return;}
        if(e.target.closest(".dedit"))return;
        if(typeof openModal==="function"&&s.a.real)openModal(id);
      };
      if(s._n){row.onmouseenter=()=>{if(dayM)dayM.highlight(id);};row.onmouseleave=()=>{if(dayM)dayM.highlight(null);};}
      tl.appendChild(row);
      if(s.a.real)pend.push({id,a:s.a,cat:s.cat,destino:ITIN.city});
      else{const th=$(id);if(th){th.classList.add("dth-gen");th.innerHTML=ico({desayuno:"coffee",comida:"utensils",cena:"utensils",copas:"wine",disco:"music",merienda:"icecream",familia:"smile"}[s.cat]||"pin");}}
    });
    hotelLegs(tl,stops);
    if(ITIN.trip&&ITIN.trip.days[i])tl.appendChild(addPanel(i));
    if(ITIN.msg&&ITIN.msg.day===i){const m=document.createElement("div");m.className="dmsg"+(ITIN.msg.bad?" bad":"");m.setAttribute("role","status");
      m.innerHTML=`${ico(ITIN.msg.bad?"alert":"check")}<span>${esc(ITIN.msg.txt)}</span>${ITIN.msg.undo&&ITIN.edits.length?`<button type="button">Deshacer</button>`:""}`;
      const ub=m.querySelector("button");if(ub)ub.onclick=()=>undoEdit();tl.prepend(m);}
    pend.forEach((p,idx)=>setTimeout(()=>{const el=$(p.id);if(el&&typeof loadThumb==="function")loadThumb(el,p.a,p.cat,p.destino,p.id);},idx*90));
    if(anok())anime({targets:"#itinTimeline .dstop",opacity:[0,1],translateX:[14,0],delay:anime.stagger(55),duration:480,easing:"easeOutCubic"});
    renderDayMap(stops);
    renderEvents();
  }
  // ===== Transporte real en el horario: los minutos de Transitous sustituyen a la estimación y el día se vuelve a revisar =====
  window.moodtripUseLegs=(map,txt)=>{
    if(!ITIN||!ITIN.trip)return;const T=ITIN.trip,i=ITIN.cur||0,D=T.days[i];
    T.legOv=Object.assign(T.legOv||{},map);
    const prevNotes=D.fixNotes||[];repairDay(T,D);const fresh=D.fixNotes||[];D.fixNotes=prevNotes.concat(fresh);
    ITIN.msg={day:i,txt:(txt||"Horario recalculado con el tiempo real del transporte.")+(fresh.length?" "+fresh.join(" "):"")};
    redrawDay(i);
  };
  async function updateDayTransit(btn){
    const T=ITIN.trip,i=ITIN.cur||0,D=T.days[i];const sch=runSchedule(D,T);const map={};let n=0,diff=0,tried=0;
    btn.disabled=true;
    for(let k=1;k<sch.length&&tried<8;k++){const a=sch[k-1],x=sch[k];
      if(!a.c||!x.c||x.km==null||x.km<=0.8||x.km>12||x.slot.cat==="pausa"||x.real)continue;
      tried++;btn.textContent=`Consultando ${tried}…`;
      const d=await fetchRoute(a.c,x.c,ITIN,i,hm(a.end));
      if(d&&d.ok&&d.routes[0]){const w=Math.round(walkMin(x.km,x.up||0,0)),m=Math.min(d.routes[0].min,w);map[legKey(a.c,x.c)]=m;n++;diff+=m-x.tr;}
    }
    if(!n){ITIN.msg={day:i,bad:true,txt:tried?"No hay datos de transporte público para los trayectos de hoy: el horario sigue con la estimación.":"Hoy no hay trayectos largos: todo se hace andando."};redrawDay(i);return;}
    window.moodtripUseLegs(map,`Horario recalculado con el transporte real: ${n} ${n===1?"trayecto":"trayectos"} (${diff>0?"+":""}${diff} min en total respecto a la estimación).`);
  }
  // tramos desde y hacia el hotel (si lo has dado): a qué hora salir y cuánto se tarda en volver
  function hotelLegs(tl,stops){
    const H=ITIN.hotelCoord;if(!H)return;const reals=stops.filter(x=>x.a&&x.a.real&&COORDS[x.a.t]);if(!reals.length)return;
    const HN="Tu hotel · "+ITIN.city;COORDS[HN]=H;
    const last=reals[reals.length-1];
    // la primera parada del día con sitio (aunque sea un «desayuna cerca de…», que tiene su zona)
    const f0=stops.find(x=>x.a&&!x.a.marker&&!x.a.libre&&((x.a.real&&COORDS[x.a.t])||(x.slot&&x.slot.at)));if(!f0)return;
    const c0=f0.a.real?COORDS[f0.a.t]:f0.slot.at,mw=ITIN.trip&&ITIN.trip.o.mayores?12:22;
    const kmA=hav(H,c0),trA=travelMin(kmA,0,0,mw),leave=hm(toMin(f0.time)-trA),walkA=walkMin(kmA,0,0)<=mw;
    const top=document.createElement("div");top.className="dhotel";
    top.innerHTML=`<div class="dh-t">${ico("bed")} <b>Sal del hotel a las ${leave}</b> <span class="dim">· ${trA} min ${walkA?"andando":"en transporte"} hasta ${f0.a.real?esc(shortNm(f0.a.t)):"la zona del "+esc(f0.lb.toLowerCase())} (${f0.time})</span></div>`
      +(f0.a.real?connector({a:{t:HN},time:leave,end:leave,hotel:true},f0,ITIN.city,ITIN.key,ITIN.trip&&ITIN.trip.o):"");
    const bot=document.createElement("div");bot.className="dhotel";
    bot.innerHTML=`<div class="dh-t">${ico("bed")} <b>Vuelta al hotel</b> <span class="dim">desde ${esc(shortNm(last.a.t))}${last.end?`, sobre las ${last.end}`:""}</span></div>`+connector(last,{a:{t:HN},time:last.end||last.time,hotel:true},ITIN.city,ITIN.key,ITIN.trip&&ITIN.trip.o);
    tl.prepend(top);tl.appendChild(bot);
  }
  // ===== Edición avanzada: cada cambio pasa por el validador del motor (applyEdit) y se puede deshacer =====
  function redrawAllDays(){const T=ITIN.trip;T.days.forEach((D,d)=>{const r=renderPlanDay(T,D);ITIN.plan[d]=r.row;ITIN.meta[d]=r.meta;});ITIN.guide=tripGuide(T,ITIN.plan);}
  function redrawDay(i,keepScroll){
    const T=ITIN.trip;const r=renderPlanDay(T,T.days[i]);ITIN.plan[i]=r.row;ITIN.meta[i]=r.meta;ITIN.guide=tripGuide(T,ITIN.plan);
    const mm=document.querySelector("#scrItin .itin-main"),y=mm?mm.scrollTop:0;paintDayList();renderItinDay(i);if(mm&&keepScroll!==false)mm.scrollTop=y;
  }
  // si el viaje ya está guardado, los cambios se guardan solos
  function syncSavedEdits(){try{const a=loadSaved();const k=a.findIndex(x=>x.city===ITIN.city&&x.days===ITIN.days);if(k>=0){a[k].edits=ITIN.edits.slice();persistSaved(a);}}catch(e){}}
  function runEdit(i,e,okMsg){
    if(!ITIN||!ITIN.trip)return false;
    const r=applyEdit(ITIN.trip,e);
    if(!r.ok){ITIN.msg={day:i,bad:true,txt:r.why||"No se puede hacer ese cambio."};redrawDay(i);return false;}
    ITIN.edits.push(e);syncSavedEdits();
    ITIN.msg={day:i,txt:okMsg+(r.dropped&&r.dropped.length?` Para que todo quepa he quitado ${r.dropped.join(" y ")}.`:"")+" Horario recalculado.",undo:true};
    redrawDay(i);return true;
  }
  function undoEdit(){
    if(!ITIN||!ITIN.edits.length)return;
    const ed=ITIN.edits.slice(0,-1),last=ITIN.edits[ITIN.edits.length-1];
    const ov=ITIN.trip&&ITIN.trip.legOv;const res=generar(...ITIN.genArgs);if(ov)res.trip.legOv=ov;ITIN.trip=res.trip;ITIN.plan=res.plan;ITIN.meta=res.meta;ITIN.edits=[];
    ed.forEach(e=>{if(applyEdit(res.trip,e).ok)ITIN.edits.push(e);});
    redrawAllDays();syncSavedEdits();
    ITIN.msg={day:ITIN.cur||0,txt:"Cambio deshecho."+(ITIN.edits.length?"":" Todo vuelve a estar como lo planificamos."),undo:ITIN.edits.length>0};
    redrawDay(ITIN.cur||0);
  }
  window.moodtripUndo=undoEdit;
  function slotIdx(i,s){return s&&s.slot?ITIN.trip.days[i].slots.indexOf(s.slot):-1;}
  function editStop(i,s,act,btn){
    const k=slotIdx(i,s);if(k<0)return;const ref=slotRef(ITIN.trip.days[i],s.slot);
    if(act==="swap")return runEdit(i,{d:i,op:"swap",i:k,ref},"Parada cambiada.");
    if(act==="del")return runEdit(i,{d:i,op:"del",i:k,ref},"Parada quitada.");
    if(act==="up"||act==="down")return runEdit(i,{d:i,op:"move",i:k,ref,dir:act==="up"?-1:1},act==="up"?"Parada adelantada.":"Parada retrasada.");
    if(act==="time"){
      const row=btn.closest(".dstop");const ex=row.querySelector(".dedit");if(ex){ex.remove();return;}
      const sl=s.slot,cur=toMin(s.time),durs=[15,30,45,60,75,90,105,120,150,180,210,240,300];
      if(!durs.includes(sl.dur))durs.push(sl.dur);durs.sort((a,b)=>a-b);
      const f=document.createElement("div");f.className="dedit";
      f.innerHTML=`<label>Empieza a las <input type="time" value="${s.time}" step="300"></label><label>Dura <select>${durs.map(d=>`<option value="${d}"${d===sl.dur?" selected":""}>${fmtDur(d)}</option>`).join("")}</select></label><button type="button" class="dok">Aplicar</button>${sl.userAt!=null?`<button type="button" class="dauto">Hora automática</button>`:""}<span class="dnote">Si no cabe, te digo por qué y no se cambia nada.</span>`;
      f.onclick=ev=>ev.stopPropagation();
      f.querySelector(".dok").onclick=()=>{
        const v=f.querySelector("input").value,dur=+f.querySelector("select").value;
        let at=v?tmin(v):null;if(at!=null&&at<360&&cur>=1080)at+=1440; // las 00:30 de una noche son de madrugada
        const e={d:i,op:"time",i:k,ref};if(dur!==sl.dur)e.dur=dur;if(at!=null&&v!==s.time)e.at=at;
        if(e.at===undefined&&e.dur===undefined){f.remove();return;}
        runEdit(i,e,"Hora cambiada.");};
      const au=f.querySelector(".dauto");if(au)au.onclick=()=>runEdit(i,{d:i,op:"time",i:k,ref,at:null},"Vuelve a su hora automática.");
      btn.closest(".dmid").appendChild(f);f.querySelector("input").focus();
    }
  }
  // bloque «Añadir al día»: sitios cercanos que caben de verdad, un sitio tuyo o tiempo libre
  function addPanel(i){
    const T=ITIN.trip,D=T.days[i];const box=document.createElement("section");box.className="dadd";
    const cands=addCandidates(T,i,5);
    const after=D.slots.map((sl,k)=>({k,sl})).filter(x=>x.sl.cat!=="disco");
    const durOpt=(def)=>[30,45,60,90,120].map(d=>`<option value="${d}"${d===def?" selected":""}>${fmtDur(d)}</option>`).join("");
    box.innerHTML=`<h3>${ico("plus")} Añadir al día</h3>
      <div class="dadd-sec"><b>Cerca de lo que ya tienes</b>${cands.length?`<ul class="dadd-l">${cands.map((c,n)=>`<li><span><b>${esc(shortNm(c.a.nm))}</b> · ${c.km<0.3?"al lado":c.km.toFixed(1).replace(".",",")+" km"} · ${fmtDur(c.a.dur||60)}${c.dropped.length?` <em>(para que quepa quitaría ${esc(c.dropped.join(" y "))})</em>`:""}</span><button type="button" data-n="${n}">Añadir</button></li>`).join("")}</ul>`:`<p class="dnote">Hoy no cabe nada más cerca: quita una parada o añade tiempo libre.</p>`}</div>
      <div class="dadd-sec"><b>Un sitio tuyo</b><div class="dadd-r"><input type="text" class="dadd-q" placeholder="Nombre del sitio: una tienda, un bar, un museo…" maxlength="80"><select class="dadd-dur">${durOpt(60)}</select><button type="button" class="dadd-own">Buscar y añadir</button></div><p class="dnote">Lo busco en OpenStreetMap dentro de ${esc(ITIN.city)} y lo coloco donde menos trayecto suma.</p></div>
      <div class="dadd-sec"><b>Tiempo libre</b><div class="dadd-r"><select class="dadd-pd">${durOpt(60)}</select><select class="dadd-after">${after.map(x=>`<option value="${x.k}">después de ${esc(slotName(x.sl))}</option>`).join("")}</select><button type="button" class="dadd-pause">Añadir</button></div></div>`;
    box.querySelectorAll(".dadd-l button").forEach(b=>b.onclick=()=>{const c=cands[+b.dataset.n];runEdit(i,{d:i,op:"add",nm:c.a.nm},`${shortNm(c.a.nm)} añadido.`);});
    box.querySelector(".dadd-pause").onclick=()=>{const af=+box.querySelector(".dadd-after").value;runEdit(i,{d:i,op:"pause",after:af,afterRef:slotRef(D,D.slots[af]),dur:+box.querySelector(".dadd-pd").value},"Tiempo libre añadido.");};
    const own=box.querySelector(".dadd-own"),qi=box.querySelector(".dadd-q");
    qi.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();own.click();}});
    own.onclick=async()=>{
      const q=qi.value.trim().replace(/[<>"`]/g,"");if(!q)return;own.disabled=true;own.textContent="Buscando…";
      const c=await geocode(q+", "+ITIN.city);own.disabled=false;own.textContent="Buscar y añadir";
      const cc=T.P.center;
      if(!c){ITIN.msg={day:i,bad:true,txt:`No encuentro «${q}» en ${ITIN.city}. Prueba con el nombre exacto o añade la calle.`};redrawDay(i);return;}
      if(cc&&hav(c,cc)>40){ITIN.msg={day:i,bad:true,txt:`«${q}» sale a ${Math.round(hav(c,cc))} km de ${ITIN.city}: no parece el sitio que buscas.`};redrawDay(i);return;}
      runEdit(i,{d:i,op:"own",nm:q,c:[+(+c[0]).toFixed(5),+(+c[1]).toFixed(5)],dur:+box.querySelector(".dadd-dur").value},`${q} añadido.`);};
    return box;
  }
  // ritmo y moods desde el propio itinerario (rehace el viaje; si hay cambios tuyos, se pide confirmar)
  let replanArm=null;
  function replanWith(fn,label){
    if(ITIN.edits.length&&replanArm!==label){replanArm=label;ITIN.msg={day:ITIN.cur||0,bad:true,txt:`Rehacer el viaje ${label} borra tus ${ITIN.edits.length} ${ITIN.edits.length===1?"cambio":"cambios"}. Pulsa otra vez para confirmar.`};redrawDay(ITIN.cur||0);return;}
    replanArm=null;fn();const cur=ITIN.cur||0;generateItin();if(ITIN.plan[cur])renderItinDay(cur);if(typeof flash==="function")flash("Viaje rehecho "+label);
  }
  // ===== Presupuesto: lo que cuesta el plan que tienes delante (por persona, grupo y día) =====
  const SRCNM={guia:"precio de la guía",tipo:"por tipo de sitio",estimado:"estimado",gratis:"gratis",tuyo:"confirmado: lo has puesto tú"};
  const bOpts=S=>({flightPP:S.flight!=null?S.flight:undefined,lodgeNight:S.lodge!=null?S.lodge:undefined});
  function defPeople(){return ({solo:1,pareja:2,amigos:4,familia:4,mayores:3})[(sel&&sel.compania)||"amigos"]||2;}
  function budgetState(){ITIN.budget=ITIN.budget||{people:defPeople(),cap:null};return ITIN.budget;}
  function renderBudget(msg){
    if(!ITIN||!ITIN.trip)return;
    const S=budgetState(),T=ITIN.trip,B=tripBudget(T,ITIN.plan,S.people,bOpts(S));
    $("scrItin").classList.add("guide-on");markDayList("budget");
    $("itinDayDate").textContent=`${ITIN.city} · ${ITIN.days} ${ITIN.days===1?"día":"días"} · ${S.people} ${S.people===1?"persona":"personas"}`;
    $("itinTitle").textContent="Presupuesto";
    $("itinSub").textContent="Lo que cuesta el plan que tienes delante";
    $("dayInfo").innerHTML="";
    const e=r=>(r[0]===r[1]?fmtMoney(r[0]):fmtMoney(r[0])+"–"+fmtMoney(r[1]))+" €";
    const mid=r=>Math.round((r[0]+r[1])/2);
    const maxHi=Math.max(1,...Object.values(B.cats).map(c=>c.hi));
    const cap=S.cap,over=cap?mid(B.group)-cap:null;
    let h="";
    if(msg)h+=`<div class="dmsg${msg.bad?" bad":""}">${ico(msg.bad?"alert":"check")}<span>${esc(msg.txt)}</span></div>`;
    h+=`<section class="gcard bud-top">
      <div class="bud-ctl"><label>Personas <span class="bud-n"><button type="button" data-p="-1" aria-label="Una persona menos">−</button><b>${S.people}</b><button type="button" data-p="1" aria-label="Una persona más">+</button></span></label>
        <label>Tope para todo el grupo <input type="number" min="0" step="50" inputmode="numeric" placeholder="sin tope" value="${cap||""}" class="bud-cap"> €</label></div>
      <div class="bud-ctl bud-known"><span class="dim">¿Ya lo tienes? Pon el precio real y deja de ser una estimación:</span>
        <label>Ida y vuelta por persona <input type="number" min="0" step="5" inputmode="numeric" placeholder="estimado" value="${S.flight!=null?S.flight:""}" class="bud-in" data-k="flight"> €</label>
        <label>Alojamiento por noche (todo el grupo) <input type="number" min="0" step="5" inputmode="numeric" placeholder="estimado" value="${S.lodge!=null?S.lodge:""}" class="bud-in" data-k="lodge"> €</label></div>
      <div class="bud-big"><div><small>Por persona</small><b>${e(B.pp)}</b></div><div><small>Todo el grupo</small><b>${e(B.group)}</b></div><div><small>En destino, por persona y día</small><b>${e(B.perDay)}</b></div></div>
      ${cap?`<p class="bud-cap-st ${over>0?"bad":"ok"}">${over>0?`Con el punto medio te pasas unos ${fmtMoney(over)} € de tu tope de ${fmtMoney(cap)} €. Abajo tienes cómo gastar menos sin perder el viaje.`:`Dentro de tu tope: te quedan unos ${fmtMoney(-over)} € de margen (con el punto medio).`}</p>`:""}
      <p class="gp dim">Son rangos orientativos, no precios confirmados: MoodTrip no reserva nada. Cada partida dice de dónde sale.</p></section>`;
    h+=`<section class="gcard"><h3>${ico("wallet")} Por partidas <small class="dim">(por persona)</small></h3><ul class="bud-cats">${Object.entries(B.cats).filter(([,c])=>c.hi>0||c.n).map(([k,c])=>`<li><span class="bc-n">${BUDGET_CATS[k]}</span><span class="bc-bar"><i style="width:${Math.max(2,c.hi/maxHi*100)}%"></i></span><b>${e([c.lo,c.hi])}</b><small>${c.src.map(x=>SRCNM[x]||x).join(" · ")}${k==="alojamiento"&&c.src.includes("estimado")?` · ${B.rooms} ${B.rooms===1?"habitación":"habitaciones"} doble${B.rooms===1?"":"s"}, ${B.nights} ${B.nights===1?"noche":"noches"}`:""}${k==="vuelos"&&c.src.includes("estimado")?` · vuelo desde España (${fmtMoney(B.flightKm)} km). ¿Vas en tren, en coche o vives allí? Pon arriba lo que te cuesta (0 si nada)`:""}</small></li>`).join("")}</ul></section>`;
    if(B.book.length)h+=`<section class="gcard"><h3>${ico("ticket")} Pendiente de reservar</h3><ul class="gl">${B.book.map(x=>`<li><b>${esc(x.nm)}</b> · día ${x.d+1}: ${e([x.lo,x.hi])} por persona</li>`).join("")}</ul><p class="gp dim">Lo tienes también en «Antes de ir», con la antelación que necesita cada uno.</p></section>`;
    if(B.noPrice.length)h+=`<section class="gcard"><h3>${ico("alert")} Sin precio propio</h3><p class="gp">De estos no tenemos el precio del sitio: se cuenta lo que suele costar algo así. Míralo en su web antes de ir.</p><ul class="gl">${B.noPrice.map(x=>`<li><b>${esc(x.nm)}</b> · día ${x.d+1}: ${e([x.lo,x.hi])}${x.own?" (lo añadiste tú)":x.auto?" (guía automática)":""}</li>`).join("")}</ul></section>`;
    h+=`<section class="gcard"><h3>${ico("calendar")} Día a día <small class="dim">(por persona, sin alojamiento ni vuelos)</small></h3>${B.days.map(x=>`<details class="bud-day"><summary><span>Día ${x.d+1} · ${esc(dayName(x.d,ITIN.plan.length,ITIN.city))}</span><b>${e([x.lo,x.hi])}</b></summary><ul>${x.items.map(it=>`<li><span>${esc(it.nm)}</span><span class="dim">${it.src==="gratis"?"Gratis":e([it.lo,it.hi])}${it.src==="tipo"?" · por tipo":""}${it.book?" · reservar":""}</span></li>`).join("")}</ul></details>`).join("")}</section>`;
    // gastar menos: alternativas equivalentes que caben en el día + alojamiento más sencillo
    const alts=cheaperAlternatives(T,ITIN.plan,5);
    const presup=T.o.presup||"mid";
    let lodgeTip="";if(presup!=="low"&&B.nights){const L0=LODGE[presup],L1=LODGE[presup==="high"?"mid":"low"],mlt=cityMult(T.key),sv=Math.round((L0[0]-L1[0])*mlt*B.nights*B.rooms/S.people);lodgeTip=`<li class="bud-alt"><span><b>Alojamiento más sencillo</b> (${presup==="high"?"medio":"mochilero"}): unos ${fmtMoney(sv)} € menos por persona en ${B.nights} ${B.nights===1?"noche":"noches"}. Cámbialo en «Ajustar el viaje» → Presupuesto.</span></li>`;}
    h+=`<section class="gcard"><h3>${ico("sparkles")} Para gastar menos</h3>${alts.length||lodgeTip?`<p class="gp">Cambios por algo equivalente y cerca que cuesta menos. Cada uno se comprueba antes: cabe en el día y no se cruza con horarios.</p><ul class="bud-alts">${alts.map((a,n)=>`<li class="bud-alt"><span>Día ${a.d+1}: <b>${esc(shortNm(a.from))}</b> → <b>${esc(shortNm(a.to))}</b> · ${a.km<0.3?"al lado":a.km.toFixed(1).replace(".",",")+" km"} · ahorras ${e(a.save)} por persona</span><button type="button" data-n="${n}">Cambiar</button></li>`).join("")}${lodgeTip}</ul>`:`<p class="gp">No vemos nada equivalente más barato cerca. Lo que más mueve el total suele ser el alojamiento y los vuelos.</p>`}</section>`;
    $("itinGuide").innerHTML=h;
    const G=$("itinGuide");
    G.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{S.people=Math.max(1,Math.min(20,S.people+ +b.dataset.p));syncSavedBudget();renderBudget();});
    G.querySelectorAll(".bud-in").forEach(x=>x.onchange=()=>{const v=x.value.trim();S[x.dataset.k]=v===""?null:Math.max(0,Math.round(+v));syncSavedBudget();renderBudget();});
    const ci=G.querySelector(".bud-cap");ci.onchange=()=>{const v=Math.round(+ci.value);S.cap=v>0?v:null;syncSavedBudget();renderBudget();};
    G.querySelectorAll(".bud-alts button").forEach(b=>b.onclick=()=>{const a=alts[+b.dataset.n];const D=T.days[a.d];const i=refIdx(D,a.ref,-1);
      const ed={d:a.d,op:"repl",i,ref:a.ref,nm:a.to};const r=applyEdit(T,ed);
      if(!r.ok){renderBudget({bad:true,txt:r.why||"No se ha podido cambiar."});return;}
      ITIN.edits.push(ed);redrawAllDays();syncSavedEdits();ITIN.msg={day:a.d,txt:`${shortNm(a.to)} en lugar de ${shortNm(a.from)} (para gastar menos). Horario recalculado.`,undo:true};paintDayList();renderBudget({txt:`Cambiado ${shortNm(a.from)} por ${shortNm(a.to)} el día ${a.d+1}. Horario recalculado; lo puedes deshacer desde ese día.`});});
    const nx=$("itinNextDay");if(nx)nx.innerHTML="Empezar el día 1 "+ico("arrow");
    const mm=document.querySelector("#scrItin .itin-main");if(mm&&!msg)mm.scrollTop=0;
  }
  function syncSavedBudget(){try{const a=loadSaved();const k=a.findIndex(x=>x.city===ITIN.city&&x.days===ITIN.days);if(k>=0){a[k].budget={...ITIN.budget};persistSaved(a);}}catch(e){}}
  // ===== Antes de ir: lo que hay que saber y reservar, explicado =====
  function guideChecks(){try{return JSON.parse(localStorage.getItem("em_chk_"+norm(ITIN.city))||"{}");}catch(e){return{};}}
  function renderGuide(){
    if(!ITIN)return;
    const G=ITIN.guide||{};
    $("scrItin").classList.add("guide-on");markDayList("guide");
    $("itinDayDate").textContent=`${ITIN.city} · ${ITIN.days} ${ITIN.days===1?"día":"días"}`;
    $("itinTitle").textContent="Antes de ir";
    $("itinSub").textContent="Lo que te contaría un amigo que vive allí";
    $("dayInfo").innerHTML="";
    const chk=guideChecks();
    const card=(ic,t,body)=>`<section class="gcard"><h3>${ico(ic)} ${t}</h3>${body}</section>`;
    let h="";
    if(G.books&&G.books.length){
      h+=card("ticket","Reserva ya",`<p class="gp">Sin estas entradas te puedes quedar fuera o hacer horas de cola. Márcalas cuando las tengas:</p><ul class="gchk">${G.books.map(b=>{const k=norm(b.n);return `<li><label><input type="checkbox" data-k="${k}"${chk[k]?" checked":""}><span><b>${b.n}</b> · día ${b.d+1}<small>Con ${b.adv} de antelación. ${b.note}</small></span></label><a href="https://www.google.com/search?q=${encodeURIComponent(b.n+" "+ITIN.city+" entradas oficiales")}" target="_blank" rel="noopener">Entradas oficiales ↗</a></li>`;}).join("")}</ul>`);
    }else h+=card("ticket","Reserva ya",`<p class="gp">Nada de tu plan necesita entrada con semanas de antelación. Las discotecas y algunos restaurantes sí agradecen reserva el mismo día.</p>`);
    if(G.closures&&G.closures.length)h+=card("alert","Días de cierre",`<ul class="gl">${G.closures.map(c=>`<li><b>${c.n}</b> cierra ${c.txt}${c.today?` · <span class="bad">¡y el día ${c.d+1} lo es! Cámbialo en ese día.</span>`:""}</li>`).join("")}</ul>${G.dated?"":`<p class="gp dim">Pon la fecha del viaje y te avisamos si algo cae en su día de cierre.</p>`}`);
    if(G.hours&&G.hours.length)h+=card("calendar","Horarios que mandan",`<p class="gp">Estos sitios cierran pronto: el plan ya los coloca para que llegues abiertos, pero no te entretengas antes.</p><ul class="gl">${G.hours.map(x=>`<li><b>${x.n}</b> · día ${x.d+1}: abre de ${x.o} a ${x.c}${x.late?` · <span class="bad">con tus cambios llegas tarde</span>`:` · vas a las ${x.time}`}</li>`).join("")}</ul>${G.dated?"":`<p class="gp dim">Sin fecha usamos el horario de invierno, que es el más corto. Con la fecha ajustamos al horario de esa época.</p>`}`);
    if(G.clubs&&G.clubs.length)h+=card("music","Discotecas: qué noches abren",`<ul class="gl">${G.clubs.map(c=>`<li><b>${c.n}</b> · día ${c.d+1}: suele abrir ${c.txt}${c.months?` (solo ${c.months})`:""}${c.open===false?` · <span class="bad">esa noche no abre</span>`:""}</li>`).join("")}</ul><p class="gp dim">${G.dated?"Cada discoteca va en una noche en que suele abrir.":"Pon la fecha del viaje y colocamos cada discoteca en una noche en que abra."} Aun así, mira su agenda antes: hay noches privadas, cierres por vacaciones y fiestas que cambian de sala.</p>`);
    h+=card("route","Cómo moverte",`<p class="gp">${G.transit||"Muévete en transporte público: busca la app oficial de transporte de la ciudad y paga con tarjeta contactless donde se pueda."}</p>${G.fare?`<p class="gp dim">Billete: ${G.fare}.</p>`:""}<p class="gp dim">Entre parada y parada el plan te dice si ir andando, en bici, en bus o en taxi, con el tiempo de cada opción${TRANSIT_ON?"; en los tramos largos, «Ver líneas y paradas» te da la línea, la dirección y dónde subir y bajar":""}.</p>${TRANSIT_ON?`<p class="gp dim">Rutas de transporte: <a href="https://transitous.org/sources/" target="_blank" rel="noopener">Transitous y sus fuentes</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> · <a href="https://github.com/asiernozalortega33-creator/moodtrip" target="_blank" rel="noopener">código abierto</a></p>`:""}`);
    if(G.meal||G.tip)h+=card("utensils",`Horarios y costumbres${G.country?" · "+G.country:""}`,`${G.meal?`<p class="gp"><b>A qué hora se come.</b> ${G.meal} El plan ya sigue estos horarios.</p>`:""}${G.tip?`<p class="gp"><b>Propinas.</b> ${G.tip}</p>`:""}`);
    h+=card("calendar","Cómo está montado tu viaje",`<p class="gp">${G.ritmo||""}</p><ul class="gl"><li><b>Llegada:</b> día corto, sin entradas a hora fija por si el vuelo se retrasa.</li><li><b>Días de barrio:</b> cada día en una zona, para no cruzar la ciudad. Lo más visitado, a primera hora.</li>${G.ritmo&&/excursi/.test(G.ritmo)?`<li><b>Excursión:</b> sales temprano y vuelves para cenar.</li>`:""}<li><b>Último día:</b> ligero y céntrico, para ir al aeropuerto sin prisas.</li></ul>${G.dated?"":`<p class="gp dim">Con la fecha del viaje, el atardecer va a la hora exacta de la puesta de sol.</p>`}`);
    if(G.auto)h+=card("sparkles","De dónde salen los sitios",`<p class="gp">${ITIN.city} aún no tiene guía hecha a mano: los sitios salen de Wikipedia/Wikidata y OpenStreetMap, ordenados por lo conocidos que son. Donde no hay un sitio fiable no te lo inventamos: te abrimos el mapa de esa zona.</p>`);
    $("itinGuide").innerHTML=h;
    $("itinGuide").querySelectorAll("input[type=checkbox]").forEach(x=>x.onchange=()=>{const c=guideChecks();c[x.dataset.k]=x.checked;try{localStorage.setItem("em_chk_"+norm(ITIN.city),JSON.stringify(c));}catch(e){}});
    const nx=$("itinNextDay");if(nx)nx.innerHTML="Empezar el día 1 "+ico("arrow");
    const mm=document.querySelector("#scrItin .itin-main");if(mm)mm.scrollTop=0;window.scrollTo({top:0});
  }
  // ===== Conciertos (Ticketmaster): los de esa noche si hay fechas; si no, los de los próximos días =====
  const WDS=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"],MOS=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const escH=t=>String(t||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function fmtEv(e){const x=new Date(e.date+"T12:00:00");return `${WDS[x.getDay()]} ${x.getDate()} ${MOS[x.getMonth()]}${e.time?" · "+e.time:""}`;}
  function renderEvents(){
    const el=$("itinEvents");if(!el)return;
    const ev=(ITIN&&ITIN.events)||[];
    if(!ev.length){el.innerHTML="";el.classList.remove("on");return;}
    let list=ev,title="Conciertos estos días";
    if(ITIN.inDate){const d=new Date(Date.parse(ITIN.inDate+"T12:00:00")+ITIN.cur*864e5).toISOString().slice(0,10);const hoy=ev.filter(e=>e.date===d);if(hoy.length){list=hoy;title="Conciertos esta noche";}}
    el.innerHTML=`<div class="map-label">${title}</div>`+list.slice(0,5).map(e=>`<a class="evc" href="${escH(e.url)}" target="_blank" rel="noopener">${e.img?`<span class="evi" style="background-image:url('${escH(e.img)}')"></span>`:""}<span class="evt"><small>${fmtEv(e)}${e.genre?" · "+escH(e.genre):""}</small><b>${escH(e.name)}</b><span>${escH(e.venue)}</span></span></a>`).join("")+`<div class="map-hint">Datos de Ticketmaster · toca para ver entradas</div>`;
    el.classList.add("on");
  }

  // ===== Mapas: MapLibre + OpenFreeMap (gratis y sin clave) · respaldo: Leaflet + OSM =====
  // CARTO empezó a exigir clave y los mapas salían en gris con "API KEY REQUIRED".
  const MAPSTYLE="https://tiles.openfreemap.org/styles/dark";
  // el estilo "dark" de serie es casi negro: se tiñe con la paleta de la app y se da contraste al agua, parques y calles
  const MAPTINT=[["background","background-color","#0d1219"],["water","fill-color","#10263b"],["waterway","line-color","#10263b"],["landuse_residential","fill-color","#111821"],["landcover_wood","fill-color","#10201a"],["landuse_park","fill-color","#11231b"],["building","fill-color","#161d28"],["highway_path","line-color","#1d2633"],["highway_minor","line-color","#232d3c"],["highway_major_casing","line-color","#1a212c"],["highway_major_inner","line-color","#2e394b"],["highway_major_subtle","line-color","#2e394b"],["highway_motorway_casing","line-color","#1a212c"],["highway_motorway_inner","line-color","#3a475e"],["highway_motorway_subtle","line-color","#2e394b"],["railway_transit","line-color","#202834"],["railway_minor","line-color","#202834"],["railway","line-color","#202834"]];
  function tintMap(m){
    MAPTINT.forEach(([id,p,v])=>{try{if(m.getLayer(id))m.setPaintProperty(id,p,v);}catch(e){}});
    try{m.getStyle().layers.forEach(l=>{if(l.type!=="symbol")return;
      const w=l.id.startsWith("water");
      try{m.setPaintProperty(l.id,"text-color",w?"#5d86ad":(l.id.startsWith("highway")?"#6f7a8c":"#9aa4b4"));m.setPaintProperty(l.id,"text-halo-color","#0d1219");m.setPaintProperty(l.id,"text-halo-width",1.3);}catch(e){}});}catch(e){}
  }
  function glOk(){try{const c=document.createElement("canvas");return !!(window.maplibregl&&(c.getContext("webgl2")||c.getContext("webgl")));}catch(e){return false;}}
  let leafletP=null;
  function loadLeaflet(){
    if(window.L)return Promise.resolve();if(leafletP)return leafletP;
    leafletP=new Promise((res,rej)=>{const l=document.createElement("link");l.rel="stylesheet";l.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(l);
      const s=document.createElement("script");s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";s.onload=()=>res();s.onerror=rej;document.head.appendChild(s);});
    return leafletP;
  }
  function waitLib(){return new Promise(res=>{let n=0;(function t(){if(window.maplibregl||n++>30)return res();setTimeout(t,120);})();});}
  function gmapsLink(c){return `https://www.google.com/maps/dir/?api=1&destination=${c[0]},${c[1]}&travelmode=walking`;}
  // Un mapa con pines numerados, rutas y una tarjeta propia (igual en MapLibre y en Leaflet)
  class EMap{
    constructor(el,o){this.el=el;this.o=o||{};this.mk=new Map();this.pts=[];this.sel=null;
      el.classList.add("emap");
      this.card=document.createElement("div");this.card.className="ecard";
      (el.parentElement||el).appendChild(this.card);
      this.ready=this._init();}
    async _init(){
      await waitLib();
      if(glOk()){
        try{
          const m=new maplibregl.Map({container:this.el,style:MAPSTYLE,center:[2.17,41.39],zoom:12,attributionControl:{compact:true},dragRotate:false,pitchWithRotate:false,fadeDuration:0});
          m.addControl(new maplibregl.NavigationControl({showCompass:false}),"bottom-right");
          m.touchZoomRotate.disableRotation();
          if(this.o.noWheel)m.scrollZoom.disable();
          const ok=await new Promise(r=>{m.once("load",()=>r(true));m.on("error",()=>{if(!m.isStyleLoaded())r(false);});setTimeout(()=>r(m.isStyleLoaded()),9000);});
          if(!ok)throw new Error("estilo");
          tintMap(m);
          // la atribución compacta arranca desplegada y tapa el pie del mapa: se pliega (sigue a un toque en la "i")
          const at=this.el.querySelector(".maplibregl-ctrl-attrib");if(at)at.classList.remove("maplibregl-compact-show");
          m.addSource("rt",{type:"geojson",data:{type:"FeatureCollection",features:[]}});
          m.addLayer({id:"rt-case",type:"line",source:"rt",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":"#070a0f","line-width":["+",["get","w"],3],"line-opacity":["get","o"]}});
          m.addLayer({id:"rt",type:"line",source:"rt",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":["get","col"],"line-width":["get","w"],"line-opacity":["get","o"]}});
          m.on("click",e=>{if(!e.originalEvent.target.closest(".epw"))this.select(null);});
          this.kind="gl";this.m=m;return;
        }catch(e){try{this.el.innerHTML="";}catch(_){}}
      }
      await loadLeaflet();
      this.kind="lf";this.el.classList.add("lf");
      const m=L.map(this.el,{zoomControl:false,scrollWheelZoom:!this.o.noWheel});
      L.control.zoom({position:"bottomright"}).addTo(m);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:19}).addTo(m);
      m.on("click",()=>this.select(null));
      this.lay=L.layerGroup().addTo(m);this.m=m;
    }
    _pinEl(p){
      const w=document.createElement("div");w.className="epw";
      const i=document.createElement("div");i.className="epin"+(p.hotel?" hotel":"")+(p.dim?" dim":"");
      if(p.col)i.style.setProperty("--c",p.col);
      i.innerHTML=p.hotel?ico("bed"):String(p.num||"");
      w.appendChild(i);
      w.addEventListener("click",ev=>{ev.stopPropagation();this.select(p.id);if(this.o.onPin)this.o.onPin(p.id);});
      w.addEventListener("mouseenter",()=>{if(this.o.onHover)this.o.onHover(p.id);});
      w.addEventListener("mouseleave",()=>{if(this.o.onHover)this.o.onHover(null);});
      return w;
    }
    setData(pts,routes){
      this.pts=pts;this.mk.forEach(x=>x.remove());this.mk.clear();
      const rs=(routes||[]).filter(r=>r.coords.length>1);
      // los pines atenuados primero, para que los del día elegido queden encima
      const ord=[...pts].sort((a,b)=>(b.dim?1:0)-(a.dim?1:0));
      if(this.kind==="gl"){
        this.m.getSource("rt").setData({type:"FeatureCollection",features:rs.map(r=>({type:"Feature",properties:{col:r.col,w:r.w||3,o:r.o==null?.9:r.o},geometry:{type:"LineString",coordinates:r.coords.map(c=>[c[1],c[0]])}}))});
        ord.forEach(p=>{const mk=new maplibregl.Marker({element:this._pinEl(p),anchor:"center"}).setLngLat([p.c[1],p.c[0]]).addTo(this.m);this.mk.set(p.id,mk);});
      }else{
        this.lay.clearLayers();
        rs.forEach(r=>{const o=r.o==null?.9:r.o;L.polyline(r.coords,{color:"#070a0f",weight:(r.w||3)+3,opacity:o}).addTo(this.lay);L.polyline(r.coords,{color:r.col,weight:r.w||3,opacity:o}).addTo(this.lay);});
        ord.forEach(p=>{const mk=L.marker(p.c,{icon:L.divIcon({className:"",html:this._pinEl(p),iconSize:[30,30],iconAnchor:[15,15]}),zIndexOffset:p.dim?0:500}).addTo(this.lay);this.mk.set(p.id,mk);});
      }
      if(this.sel&&this.mk.has(this.sel))this.select(this.sel,true);else this.select(null,true);
    }
    _inner(id){const mk=this.mk.get(id);if(!mk)return null;const el=mk.getElement&&mk.getElement();return el?el.querySelector(".epin"):null;}
    highlight(id){this.mk.forEach((_,k)=>{const e=this._inner(k);if(e)e.classList.toggle("hl",k===id);});}
    select(id,quiet){
      this.sel=id||null;this.mk.forEach((_,k)=>{const e=this._inner(k);if(e)e.classList.toggle("on",k===id);});
      const p=id&&this.pts.find(x=>x.id===id);
      if(!p||this.o.noCard){this.card.classList.remove("on");if(!quiet&&this.o.onSelect)this.o.onSelect(p?id:null);return;}
      const img=p.img||(typeof IMG!=="undefined"&&IMG[p.title])||"";
      this.card.innerHTML=`<div class="eph${img?"":" none"}" style="${img?`background-image:url('${img}')`:""}"></div><div class="etx"><small>${p.col&&!p.hotel?`<i style="background:${p.col}"></i>`:""}${p.sub||""}</small><b>${p.title||""}</b><a href="${gmapsLink(p.c)}" target="_blank" rel="noopener">${ico("nav")} Cómo llegar</a></div><button class="ex" aria-label="Cerrar">${ico("x")}</button>`;
      this.card.querySelector(".ex").onclick=ev=>{ev.stopPropagation();this.select(null);};
      this.card.classList.add("on");
      if(!quiet&&this.o.onSelect)this.o.onSelect(id);
    }
    // enfocar sin perder el contexto: si el punto ya se ve no se mueve nada; si no, se desplaza sin cambiar el zoom
    focus(id){const p=this.pts.find(x=>x.id===id);if(!p)return;this.select(id);
      if(this.kind==="gl"){const q=this.m.project([p.c[1],p.c[0]]),W=this.el.clientWidth,H=this.el.clientHeight;
        if(q.x<60||q.y<90||q.x>W-60||q.y>H-140)this.m.easeTo({center:[p.c[1],p.c[0]],duration:600});}
      else{if(!this.m.getBounds().pad(-.15).contains(p.c))this.m.panTo(p.c,{duration:.6});}}
    fit(coords,pad){
      if(!coords.length||!this.m)return;const P=pad||48;
      const pp=typeof P==="object"?P:{top:P,bottom:P,left:P,right:P};
      if(this.kind==="gl"){
        this.m.resize();
        if(coords.length===1){this.m.jumpTo({center:[coords[0][1],coords[0][0]],zoom:15});return;}
        const b=new maplibregl.LngLatBounds();coords.forEach(c=>b.extend([c[1],c[0]]));
        this.m.fitBounds(b,{padding:pp,maxZoom:16,duration:0});
      }else{
        this.m.invalidateSize();
        if(coords.length===1)this.m.setView(coords[0],15);
        else this.m.fitBounds(L.latLngBounds(coords),{paddingTopLeft:[pp.left,pp.top],paddingBottomRight:[pp.right,pp.bottom],maxZoom:16});
      }
    }
    resize(){if(!this.m)return;if(this.kind==="gl")this.m.resize();else this.m.invalidateSize();}
  }
  function stopCoord(s){return (s&&s.a&&!s.a.marker&&typeof COORDS!=="undefined"&&COORDS[s.a.t])||null;}

  // ===== Mapa del día (columna derecha del itinerario) =====
  let dayM=null,dayFit=null;
  function renderDayMap(stops){
    const wrap=$("itinMapWrap");if(!wrap)return;
    const pts=[];stops.forEach((s,j)=>{const c=stopCoord(s);if(c)pts.push({id:`di-${ITIN.cur}-${j}`,c,num:s._n,col:"#f5a623",title:s.a.t,sub:`${s.time} · ${s.lb}`});});
    if(pts.length<2){wrap.classList.remove("on");dayFit=null;return;}
    wrap.classList.add("on");
    const route=pts.map(p=>p.c);
    if(ITIN.hotelCoord)pts.push({id:"hotel",c:ITIN.hotelCoord,hotel:true,title:"Tu hotel",sub:"Alojamiento"});
    if(!dayM)dayM=new EMap($("itinMap"),{noWheel:true,noCard:true,
      onPin:id=>{const r=document.querySelector(`#itinTimeline .dstop[data-id="${id}"]`);if(r){r.scrollIntoView({behavior:"smooth",block:"center"});r.classList.add("flash");setTimeout(()=>r.classList.remove("flash"),1500);}},
      onHover:id=>{document.querySelectorAll("#itinTimeline .dstop").forEach(r=>r.classList.toggle("hl",r.dataset.id===id));}});
    dayFit=pts.map(p=>p.c);
    const cur=ITIN.cur;
    dayM.ready.then(()=>{if(ITIN.cur!==cur)return;dayM.setData(pts,[{coords:route,col:"#f5a623",w:3,o:.9}]);dayM.select(null,true);dayM.fit(dayFit,36);});
  }
  function refreshDayMap(){if(dayM&&dayFit)dayM.ready.then(()=>{dayM.resize();dayM.fit(dayFit,36);});}

  // ===== Pantalla 4 · generando itinerario (anillo de progreso) =====
  function showForming(){
    showScr("scrForm");
    // Si el destino no está curado, se buscan sus sitios reales mientras corre la animación.
    // El anillo avanza hasta el 90 % y espera a que lleguen; luego se genera el itinerario.
    const dest=(lastTrip&&lastTrip.dest)||$("destino").value;
    const curated=!!resolveKey(dest);
    const sub=$("formSub");
    if(sub)sub.textContent=curated?"Analizando destinos, vuelos, hoteles y experiencias…":`Buscando sitios reales en ${cap(dest)}: bares, salas, mercados y miradores…`;
    let done=false;const ready=ensureCity(dest).catch(()=>null).then(k=>{done=true;return k;});
    const finish=()=>ready.then(()=>{generateItin();afterForming();});
    const total=3200,C=553;
    const fg=$("ringFg"),pct=$("ringPct");
    const steps=[...document.querySelectorAll("#gSteps4 .gstep")];
    steps.forEach(s=>s.classList.remove("on"));
    if(!anok()){ // sin animación: salta directo (pero espera a los sitios)
      pct.textContent=done?"100%":"90%";fg.style.strokeDashoffset=done?"0":String(C*.1);steps.forEach(s=>s.classList.add("on"));
      setTimeout(finish,400);return;
    }
    const t0=performance.now();let slow=false;
    (function tick(t){
      const p=Math.min(1,((t||performance.now())-t0)/total);
      let e=1-Math.pow(1-p,2.4);
      if(!done)e=Math.min(e,.9); // no llegar al 100 % sin datos
      pct.textContent=Math.round(e*100)+"%";
      fg.style.strokeDashoffset=String(C*(1-e));
      steps.forEach((s,i)=>s.classList.toggle("on",e>=(i+1)/4.4));
      if(p>=1&&!done&&!slow&&sub){slow=true;sub.textContent=`Primera vez que alguien pide ${cap(dest)}: reuniendo sus sitios (tarda unos segundos, la próxima vez será al instante)…`;}
      if(p<1||!done)requestAnimationFrame(tick);else finish();
    })(t0);
  }
  function afterForming(){showTripSummary();}

  // ===== Pantalla 5 · resumen del viaje =====
  function estBudget(){
    if(ITIN&&ITIN.trip){try{const S0=budgetState();const B=tripBudget(ITIN.trip,ITIN.plan,S0.people,{flightPP:S0.flight!=null?S0.flight:undefined,lodgeNight:S0.lodge!=null?S0.lodge:undefined});const c=B.cats;
      const acts=ITIN.plan.reduce((t,day)=>t+day.filter(s=>s.a&&s.a.real&&(s.cat==="sight"||s.cat==="familia")).length,0);
      return {fl:[c.vuelos.lo,c.vuelos.hi],al:[c.alojamiento.lo,c.alojamiento.hi],ex:B.onTrip,acts,n:B.nights,total:B.pp,people:B.people};}catch(e){}}
    const key=ITIN&&ITIN.key,m=((key&&typeof CURR!=="undefined"&&CURR[key])||{}).mult||1;
    const d=ITIN.days,n=Math.max(1,d-1),r5=x=>Math.round(x/5)*5;
    const fl=[r5(70*m),r5(140*m)];
    const al=[r5(55*m)*n,r5(90*m)*n];
    const ex=[r5(25*m)*d,r5(45*m)*d];
    // visitas reales del plan (no "2 por día")
    const acts=ITIN.plan?ITIN.plan.reduce((t,day)=>t+day.filter(s=>s.a&&s.a.real&&(s.cat==="sight"||s.cat==="familia")).length,0):d*2;
    return {fl,al,ex,acts,n,total:[fl[0]+al[0]+ex[0],fl[1]+al[1]+ex[1]]};
  }
  let heroLoaded="";
  function showTripSummary(){
    if(!ITIN)return;
    $("sumTitle").textContent="Tu viaje a "+ITIN.city;
    const b=estBudget();
    $("sumMeta").textContent=`${ITIN.days} ${ITIN.days===1?"día":"días"} · ${b.n} ${b.n===1?"noche":"noches"}`;
    $("sumFrom").textContent=(lastTrip&&lastTrip.inNum)?("Vuelo "+String(lastTrip.inNum).toUpperCase()+" · ida y vuelta"):"Ida y vuelta (estimado)";
    $("sumNights").textContent=b.n+(b.n===1?" noche":" noches");
    $("sumActs").textContent=b.acts+(b.acts===1?" visita":" visitas")+" en el plan";
    paintSumPlan();
    const eur=r=>`${r[0]}€ - ${r[1]}€`;
    $("sumVuelos").textContent=eur(b.fl);$("sumAloj").textContent=eur(b.al);$("sumExp").textContent=eur(b.ex);
    $("sumTotal").textContent=eur(b.total);
    const bt=(typeof BEST!=="undefined"&&BEST[ITIN.key])||["Abr – Oct","15° – 25°"];
    $("sumBest").textContent=bt[0];$("sumTemp").textContent=bt[1];
    if(heroLoaded!==ITIN.city){heroLoaded=ITIN.city;$("sumHero").style.backgroundImage="";
      let hero=null;
      if(ITIN.key&&typeof DB!=="undefined"&&DB[ITIN.key]&&typeof IMG!=="undefined"){
        const s=DB[ITIN.key].find(x=>x.cat==="sight"&&IMG[x.nm]);if(s)hero=IMG[s.nm];
      }
      if(hero)$("sumHero").style.backgroundImage=`url('${hero}')`;
      else if(typeof bgImg==="function")bgImg(ITIN.city).then(u=>{if(u&&heroLoaded===ITIN.city)$("sumHero").style.backgroundImage=`url('${u}')`;});}
    showScr("scrSum");
    if(anok())anime({targets:"#scrSum .sum-top,#scrSum .sum-hero,#scrSum .sum-panel",opacity:[0,1],translateY:[16,0],delay:anime.stagger(90),duration:520,easing:"easeOutCubic"});
  }

  // esquema del viaje en el resumen: cada día con su tipo y su zona, y lo que hay que reservar
  function paintSumPlan(){
    let el=$("sumPlan");
    if(!el){el=document.createElement("div");el.id="sumPlan";el.className="sum-plan";const w=document.querySelector("#scrSum .sum-wrap");if(w)w.appendChild(el);else return;}
    const G=ITIN.guide||{},nb=(G.books||[]).length;
    el.innerHTML=`<div class="sp-head"><h3>Así está montado tu viaje</h3>${nb?`<button class="sp-book" id="spBook">${ico("ticket")} ${nb} ${nb===1?"cosa que reservar ya":"cosas que reservar ya"} ${ico("arrow")}</button>`:""}</div>
      <div class="sp-days">${ITIN.plan.map((_,i)=>{const m=ITIN.meta[i]||{};return `<button class="sp-day" data-d="${i}"><span class="sp-n">Día ${i+1}<em class="dk dk-${m.type}">${m.short||""}</em></span><b>${m.title||""}</b><small>${m.focus?m.focus.replace(/^Hoy: /,""):(m.sub||"")}${m.from?` · ${m.from}–${m.to}`:""}</small></button>`;}).join("")}</div>`;
    el.querySelectorAll(".sp-day").forEach(b=>b.onclick=()=>{showScr("scrItin");renderItinDay(+b.dataset.d);setTimeout(refreshDayMap,90);});
    const sb=$("spBook");if(sb)sb.onclick=()=>{showScr("scrItin");renderGuide();};
  }

  // ===== Pantalla 8 · mapa del viaje =====
  // Filtro por día (chips sobre el mapa), pines numerados en el orden de cada día, lista agrupada por día
  // y tarjeta del sitio al tocar. Con "Todo el viaje" cada día tiene su color.
  let tripM=null,tmDay=-1;
  const DAYPAL=["#f5a623","#34c759","#a78bfa","#4a90ff","#ff7ab8","#ffd60a","#5ac8fa","#ff9f0a"];
  function tmPoints(){
    const pts=[],routes=[];
    ITIN.plan.forEach((day,di)=>{
      const col=DAYPAL[di%DAYPAL.length],ll=[];let n=0;
      day.forEach((s,j)=>{const c=stopCoord(s);if(!c)return;n++;ll.push(c);
        pts.push({id:`tm-${di}-${j}`,c,num:n,col,day:di,time:s.time,lb:s.lb,title:s.a.t,sub:`Día ${di+1} · ${s.time} · ${s.lb}`,dim:tmDay>=0&&tmDay!==di});});
      // con "Todo el viaje" solo puntos (las rutas de varios días se cruzan y no se lee nada); la ruta sale al elegir un día
      if(tmDay===di)routes.push({coords:ll,col,day:di,w:4,o:.95});
    });
    if(ITIN.hotelCoord)pts.push({id:"tm-hotel",c:ITIN.hotelCoord,hotel:true,title:"Tu hotel",sub:"Alojamiento",day:-1});
    return {pts,routes};
  }
  function tmPad(){const mob=window.innerWidth<=860;return mob?{top:120,bottom:40,left:30,right:30}:{top:90,bottom:60,left:60,right:60};}
  function tmRender(refit){
    const {pts,routes}=tmPoints();
    // chips
    const ch=$("tmChips");ch.innerHTML="";
    const mk=(label,d,col)=>{const b=document.createElement("button");b.className="tm-chip"+(tmDay===d?" on":"");b.innerHTML=(col?`<i style="background:${col}"></i>`:"")+label;b.onclick=()=>{tmDay=d;tmRender(true);};ch.appendChild(b);};
    mk("Todo el viaje",-1,null);
    ITIN.plan.forEach((_,di)=>mk("Día "+(di+1),di,DAYPAL[di%DAYPAL.length]));
    // lista
    const list=$("tmList");list.innerHTML="";
    if(ITIN.hotelCoord){const h=document.createElement("div");h.className="tm-item";h.dataset.id="tm-hotel";h.innerHTML=`<span class="tm-n" style="--c:#fff">${ico("bed")}</span><div><b>Tu hotel</b><small>Alojamiento</small></div>`;h.onclick=()=>tripM&&tripM.focus("tm-hotel");list.appendChild(h);}
    ITIN.plan.forEach((_,di)=>{
      if(tmDay>=0&&tmDay!==di)return;
      const dp=pts.filter(p=>p.day===di);if(!dp.length)return;
      const col=DAYPAL[di%DAYPAL.length];
      const hd=document.createElement("div");hd.className="tm-dh";hd.innerHTML=`<i style="background:${col}"></i>Día ${di+1} · ${dayName(di,ITIN.plan.length,ITIN.city)}<span>${dp.length} sitios</span>`;
      hd.onclick=()=>{tmDay=tmDay===di?-1:di;tmRender(true);};list.appendChild(hd);
      dp.forEach(p=>{const it=document.createElement("div");it.className="tm-item";it.dataset.id=p.id;
        it.innerHTML=`<span class="tm-n" style="--c:${col}">${p.num}</span><div><b>${p.title}</b><small>${p.time} · ${p.lb}</small></div>`;
        it.onclick=()=>{if(tmDay>=0&&tmDay!==p.day){tmDay=p.day;tmRender(true);}if(tripM)tripM.focus(p.id);};
        it.onmouseenter=()=>tripM&&tripM.highlight(p.id);it.onmouseleave=()=>tripM&&tripM.highlight(null);
        list.appendChild(it);});
    });
    if(!pts.length){list.innerHTML=`<div class="tm-sub">Este destino aún no tiene sitios con ubicación exacta.</div>`;}
    if(!tripM)tripM=new EMap($("tripMapEl"),{
      onSelect:id=>{document.querySelectorAll("#tmList .tm-item").forEach(r=>r.classList.toggle("on",r.dataset.id===id));
        const r=id&&document.querySelector(`#tmList .tm-item[data-id="${id}"]`);if(r)r.scrollIntoView({block:"nearest",behavior:"smooth"});},
      onHover:id=>{document.querySelectorAll("#tmList .tm-item").forEach(r=>r.classList.toggle("hl",r.dataset.id===id));}});
    tripM.ready.then(()=>{
      tripM.setData(pts,routes);
      if(refit){const vis=pts.filter(p=>!p.dim&&(tmDay<0||!p.hotel));tripM.fit((vis.length?vis:pts).map(p=>p.c),tmPad());}
    });
  }
  function showTripMap(day){
    if(!ITIN)return;
    showScr("scrTripMap");
    tmDay=(typeof day==="number"&&day>=0&&day<ITIN.plan.length)?day:-1;
    const n=ITIN.plan.reduce((t,d)=>t+d.filter(s=>stopCoord(s)).length,0);
    $("tmMeta").textContent=`${ITIN.city} · ${ITIN.days} ${ITIN.days===1?"día":"días"} · ${n} sitios`;
    tmRender(true);
    setTimeout(()=>{if(tripM)tripM.ready.then(()=>{tripM.resize();const {pts}=tmPoints();const vis=pts.filter(p=>!p.dim&&(tmDay<0||!p.hotel));tripM.fit((vis.length?vis:pts).map(p=>p.c),tmPad());});},80);
  }
  $("tmBack").onclick=()=>{showScr("scrItin");setTimeout(refreshDayMap,80);};
  $("tmBackM").onclick=()=>{showScr("scrItin");setTimeout(refreshDayMap,80);};
  $("dayMapExpand").onclick=()=>{if(ITIN)showTripMap(ITIN.cur);};

  // ===== Pantalla 9 · resumen y reserva =====
  function showBooking(){
    if(!ITIN)return;
    const b=estBudget(),mid=r=>Math.round((r[0]+r[1])/2/10)*10;
    $("bookMeta").textContent=`${ITIN.city} · ${ITIN.days} ${ITIN.days===1?"día":"días"} · ${b.n} ${b.n===1?"noche":"noches"}`;
    $("bkVueloSub").textContent=(lastTrip&&lastTrip.inNum)?("Vuelo "+String(lastTrip.inNum).toUpperCase()+" · ida y vuelta"):"Ida y vuelta (estimado)";
    const hotel=$("pHotel")?$("pHotel").value.trim():"";
    $("bkAlojSub").textContent=(hotel?hotel+" · ":"")+b.n+(b.n===1?" noche":" noches");
    $("bkExpSub").textContent=b.acts+" actividades incluidas";
    $("bkVuelo").textContent=mid(b.fl)+"€";$("bkAloj").textContent=mid(b.al)+"€";$("bkExp").textContent=mid(b.ex)+"€";
    $("bkTotal").textContent=(mid(b.fl)+mid(b.al)+mid(b.ex))+"€";
    showScr("scrBook");
    if(anok())anime({targets:"#scrBook .book-panel,#scrBook .book-side",opacity:[0,1],translateY:[16,0],delay:anime.stagger(90),duration:500,easing:"easeOutCubic"});
  }
  $("bookBack").onclick=()=>{showScr("scrItin");setTimeout(refreshDayMap,80);};
  $("bookNow").onclick=()=>{if(ITIN)window.open("https://www.booking.com/searchresults.es.html?ss="+encodeURIComponent(ITIN.city),"_blank");};
  $("bookSave").onclick=()=>saveTrip();

  // ===== Viajes guardados (almacenamiento por usuario) =====
  function loadSaved(){try{return JSON.parse(localStorage.getItem("em_trips"+userSuffix())||"[]");}catch(e){return[];}}
  function persistSaved(a){localStorage.setItem("em_trips"+userSuffix(),JSON.stringify(a));if(window.cloudPush)window.cloudPush();}
  function saveTrip(){
    if(!ITIN){if(typeof flash==="function")flash("Genera un itinerario primero");return;}
    if(!sessionUser()&&!saveTrip._anon){
      openAuth("up",()=>{saveTrip._anon=!sessionUser();saveTrip();saveTrip._anon=false;},"Crea tu cuenta para que tus viajes queden guardados a tu nombre.");
      return;
    }
    const b=estBudget(),mid=r=>Math.round((r[0]+r[1])/2/10)*10;
    const t={city:ITIN.city,key:ITIN.key||null,days:ITIN.days,nights:b.n,total:mid(b.fl)+mid(b.al)+mid(b.ex),inDate:(lastTrip&&lastTrip.inDate)||"",moods:[...flowMoods],
      compania:(sel&&sel.compania)||"amigos",ritmo:(sel&&sel.ritmo)||"equi",presupuesto:(sel&&sel.presupuesto)||"mid",edits:(ITIN.edits||[]).slice(),budget:ITIN.budget?{...ITIN.budget}:null,saved:Date.now()};
    const a=loadSaved();const i=a.findIndex(x=>x.city===t.city&&x.days===t.days);
    if(i>=0)a[i]=t;else a.unshift(t);
    persistSaved(a);
    if(typeof flash==="function")flash("Viaje guardado ♥");
  }

  // ===== Pantalla 10 · mis viajes guardados =====
  let savedTab="all";
  function tripHero(t){if(t.key&&typeof DB!=="undefined"&&DB[t.key]&&typeof IMG!=="undefined"){const s=DB[t.key].find(x=>x.cat==="sight"&&IMG[x.nm]);if(s)return IMG[s.nm];}return null;}
  function agoTxt(ts){const d=Math.floor((Date.now()-ts)/864e5);if(d<1)return"Guardado hoy";if(d===1)return"Guardado hace 1 día";return`Guardado hace ${d} días`;}
  function renderSaved(){
    const list=$("savedList");list.innerHTML="";
    const today=new Date().toISOString().slice(0,10);
    let a=loadSaved();
    if(savedTab==="prox")a=a.filter(t=>t.inDate&&t.inDate>=today);
    if(savedTab==="done")a=a.filter(t=>t.inDate&&t.inDate<today);
    if(!a.length){list.innerHTML=`<div class="saved-empty">Aún no hay viajes aquí.<br>Genera un itinerario y pulsa "Guardar viaje".</div>`;return;}
    a.forEach(t=>{
      const el=document.createElement("div");el.className="trip-card";
      el.innerHTML=`<div class="tph"></div><div class="tmid"><b>${t.city}</b><span>${t.days} ${t.days===1?"día":"días"} · ${t.nights} ${t.nights===1?"noche":"noches"}</span><span>${agoTxt(t.saved)}</span></div><div class="tprice">${t.total}€</div><button class="theart" title="Quitar de guardados">${ico("heart")}</button>`;
      const hero=tripHero(t);if(hero)el.querySelector(".tph").style.backgroundImage=`url('${hero}')`;
      el.querySelector(".theart").onclick=e=>{e.stopPropagation();persistSaved(loadSaved().filter(x=>!(x.city===t.city&&x.days===t.days)));renderSaved();if(typeof flash==="function")flash("Viaje eliminado");};
      el.onclick=()=>{
        inDest.value=t.city;delete inDest.dataset.key;
        lastTrip={dest:t.city,days:t.days,inNum:"",inDate:t.inDate||"",inTime:"",outNum:"",outDate:"",outTime:"",edits:t.edits||[],budget:t.budget||null};
        flowMoods.clear();(t.moods||[]).forEach(m=>flowMoods.add(m));
        if(typeof sel!=="undefined"){if(t.compania)sel.compania=t.compania;if(t.ritmo)sel.ritmo=t.ritmo;if(t.presupuesto)sel.presupuesto=t.presupuesto;}
        ensureCity(t.city).catch(()=>null).then(()=>{generateItin();showScr("scrItin");window.scrollTo({top:0});setTimeout(refreshDayMap,120);});
      };
      list.appendChild(el);
    });
  }
  function showSaved(){renderSaved();showScr("scrSaved");}
  $("savedBack").onclick=()=>showScr("scrLand");
  $("savedNew").onclick=()=>showScr("scrLand");
  [...$("savedTabs").children].forEach(b=>b.onclick=()=>{[...$("savedTabs").children].forEach(x=>x.classList.remove("on"));b.classList.add("on");savedTab=b.dataset.t;renderSaved();});

  // ===== Pantallas 11-12 · perfil y ajustes =====
  function loadProfile(){try{return JSON.parse(localStorage.getItem("em_profile"+userSuffix())||"null")||{name:"Viajero de Explora",mail:""};}catch(e){return{name:"Viajero de Explora",mail:""};}}
  function showProfile(){
    const u=sessionUser();
    const p=u?{name:u.name,mail:u.email}:loadProfile();
    $("profLogin").style.display=u?"none":"";
    $("profLogout").style.display=u?"":"none";
    $("profName").textContent=p.name;$("profMail").textContent=p.mail||"Añade tu email";
    $("profAvatar").textContent=(p.name||"V").trim().charAt(0).toUpperCase();
    const a=loadSaved();
    $("stTrips").textContent=a.length;
    const countries=new Set();a.forEach(t=>{const d=(typeof DESTINOS!=="undefined")?DESTINOS.find(x=>norm(x.n)===norm(t.city)):null;countries.add(d?d.c:t.city);});
    $("stCountries").textContent=countries.size;
    $("stActs").textContent=a.reduce((s,t)=>s+t.days*6,0);
    $("stFavs").textContent=loadFavs().length;
    showScr("scrProfile");
  }
  $("profEdit").onclick=async()=>{
    const u=sessionUser();
    const p=u?{name:u.name,mail:u.email}:loadProfile();
    const name=prompt("Tu nombre:",p.name)||p.name;
    if(u&&u.cloud){const c=supa();try{if(c){const r=await c.auth.updateUser({data:{name:name}});if(r.data&&r.data.user)window._cloudUser=r.data.user;}}catch(e){}}
    else if(u){const users=loadUsers();users[u.email].name=name;localStorage.setItem("em_users",JSON.stringify(users));}
    else{const mail=prompt("Tu email:",p.mail||"")||p.mail;localStorage.setItem("em_profile"+userSuffix(),JSON.stringify({name:name,mail:mail}));}
    if(typeof paintNav==="function")paintNav();
    showProfile();
  };
  $("profLogin").onclick=()=>openAuth("in",()=>showProfile());
  $("profLogout").onclick=async()=>{
    if(window._cloudUser){const c=supa();try{if(c)await c.auth.signOut();}catch(e){}window._cloudUser=null;}
    else localStorage.removeItem("em_session");
    paintNav();showProfile();if(typeof flash==="function")flash("Sesión cerrada");
  };

  // ===== Sincronización con Supabase =====
  let _pushT=null;
  window.cloudPush=function(){
    const c=supa();if(!c||!window._cloudUser)return;
    clearTimeout(_pushT);
    _pushT=setTimeout(async()=>{
      try{await c.from("user_data").upsert({user_id:window._cloudUser.id,trips:loadSaved(),favs:loadFavs(),updated_at:new Date().toISOString()});}catch(e){}
    },600);
  };
  async function cloudPull(){
    const c=supa();if(!c||!window._cloudUser)return;
    try{
      const r=await c.from("user_data").select("trips,favs").eq("user_id",window._cloudUser.id).maybeSingle();
      if(r&&r.data){
        localStorage.setItem("em_trips"+userSuffix(),JSON.stringify(r.data.trips||[]));
        localStorage.setItem("em_favs"+userSuffix(),JSON.stringify(r.data.favs||[]));
      }
      if(document.querySelector("#scrSaved.active"))renderSaved();
      if(document.querySelector("#scrProfile.active"))showProfile();
    }catch(e){}
  }
  async function initCloud(){
    const c=supa();if(!c)return;
    try{const r=await c.auth.getSession();window._cloudUser=(r.data&&r.data.session&&r.data.session.user)||null;}catch(e){}
    paintNav();if(window._cloudUser)cloudPull();
    c.auth.onAuthStateChange((ev,session)=>{window._cloudUser=(session&&session.user)||null;paintNav();if(window._cloudUser)cloudPull();});
  }
  window.addEventListener("load",initCloud);

  // ===== Modal de login =====
  let authMode="in",authAfter=null;
  function openAuth(mode,after,subText){
    authMode=mode||"in";authAfter=after||null;
    paintAuth();
    if(subText)$("authSub").textContent=subText;
    $("authModal").classList.add("show");
    setTimeout(()=>{const f=authMode==="up"?$("authName"):$("authMail");if(f)f.focus();},80);
  }
  function paintAuth(){
    const up=authMode==="up";
    $("authTabIn").classList.toggle("on",!up);$("authTabUp").classList.toggle("on",up);
    $("authNameF").style.display=up?"":"none";
    $("authTitle").textContent=up?"Crea tu cuenta":"Bienvenido de nuevo";
    $("authSub").textContent=up?"Guarda tus viajes y favoritos con tu nombre.":"Entra para ver tus viajes guardados.";
    $("authGo").textContent=up?"Crear cuenta":"Entrar";
    $("authErr").textContent="";
    const note=document.querySelector(".auth-note");
    if(note)note.textContent=supa()?"Tu cuenta se sincroniza entre todos tus dispositivos.":"Tu cuenta y tus viajes se guardan de forma segura en este dispositivo.";
  }
  $("authTabIn").onclick=()=>{authMode="in";paintAuth();};
  $("authTabUp").onclick=()=>{authMode="up";paintAuth();};
  $("authSkip").onclick=()=>{$("authModal").classList.remove("show");const f=authAfter;authAfter=null;if(f)f();};
  $("authModal").addEventListener("click",e=>{if(e.target.id==="authModal"){$("authModal").classList.remove("show");authAfter=null;}});
  $("authPass").addEventListener("keydown",e=>{if(e.key==="Enter")$("authGo").click();});
  $("authGo").onclick=async()=>{
    const mail=$("authMail").value.trim().toLowerCase(),pass=$("authPass").value,err=$("authErr");
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)){err.textContent="Escribe un email válido.";return;}
    if(pass.length<6){err.textContent="La contraseña necesita al menos 6 caracteres.";return;}
    const c=supa();
    if(c){ // cuentas en la nube (Supabase): funcionan entre dispositivos
      const go=$("authGo");go.disabled=true;const prev=go.textContent;go.textContent="Un momento…";err.textContent="";
      try{
        if(authMode==="up"){
          const name=$("authName").value.trim()||mail.split("@")[0];
          const r=await c.auth.signUp({email:mail,password:pass,options:{data:{name:name}}});
          if(r.error)throw r.error;
          if(!r.data.session){ // requiere confirmar el correo
            authMode="in";paintAuth();
            $("authSub").textContent="Te hemos enviado un correo de confirmación. Confírmalo y entra aquí.";
            go.disabled=false;go.textContent="Entrar";return;
          }
          window._cloudUser=r.data.session.user;
        }else{
          const r=await c.auth.signInWithPassword({email:mail,password:pass});
          if(r.error)throw r.error;
          window._cloudUser=r.data.session.user;
        }
        $("authModal").classList.remove("show");$("authPass").value="";
        paintNav();cloudPull();
        if(typeof flash==="function")flash("¡Hola, "+sessionUser().name+"! 👋");
        const f=authAfter;authAfter=null;if(f)f();
      }catch(ex){
        const m=String((ex&&ex.message)||ex);
        err.textContent=/Invalid login/i.test(m)?"Email o contraseña incorrectos."
          :/already registered/i.test(m)?"Ya existe una cuenta con ese email. Prueba a entrar."
          :/not confirmed/i.test(m)?"Confirma tu correo antes de entrar (revisa el buzón)."
          :/rate/i.test(m)?"Demasiados intentos: espera un minuto."
          :"No se pudo conectar. Inténtalo de nuevo.";
      }
      go.disabled=false;go.textContent=authMode==="up"?"Crear cuenta":"Entrar";
      return;
    }
    const users=loadUsers();
    if(authMode==="up"){
      if(users[mail]){err.textContent="Ya existe una cuenta con ese email. Prueba a entrar.";return;}
      const name=$("authName").value.trim()||mail.split("@")[0];
      const salt=Math.random().toString(36).slice(2,12);
      users[mail]={name:name,salt:salt,hash:await pwHash(pass,salt),created:Date.now()};
      localStorage.setItem("em_users",JSON.stringify(users));
      localStorage.setItem("em_session",mail);
    }else{
      const u=users[mail];
      if(!u){err.textContent="No hay ninguna cuenta con ese email. Crea una.";return;}
      if(await pwHash(pass,u.salt)!==u.hash){err.textContent="Contraseña incorrecta.";return;}
      localStorage.setItem("em_session",mail);
    }
    $("authModal").classList.remove("show");$("authPass").value="";
    paintNav();
    if(typeof flash==="function")flash("¡Hola, "+users[mail].name+"! 👋");
    const f=authAfter;authAfter=null;if(f)f();
  };
  function paintNav(){const u=sessionUser();const b=$("navProfile");if(b)b.innerHTML=u?('<span style="font-weight:700;font-size:.92rem">'+(u.name||"?").trim().charAt(0).toUpperCase()+"</span>"):ico("user");}
  paintNav();
  function showSettings(){
    const th=localStorage.getItem("em_theme")||"oscuro";
    [...$("segTheme").children].forEach(b=>b.classList.toggle("on",b.dataset.th===th));
    let nf;try{nf=JSON.parse(localStorage.getItem("em_notifs")||'{"ofertas":true,"record":true,"news":false}');}catch(e){nf={ofertas:true,record:true,news:false};}
    document.querySelectorAll("#scrSettings .sw").forEach(s=>s.classList.toggle("on",!!nf[s.dataset.k]));
    showScr("scrSettings");
  }
  [...$("segTheme").children].forEach(b=>b.onclick=()=>{
    localStorage.setItem("em_theme",b.dataset.th);
    [...$("segTheme").children].forEach(x=>x.classList.remove("on"));b.classList.add("on");
    if(b.dataset.th!=="oscuro"&&typeof flash==="function")flash("El modo claro llegará muy pronto ✨");
  });
  document.querySelectorAll("#scrSettings .sw").forEach(s=>s.onclick=()=>{
    s.classList.toggle("on");
    let nf;try{nf=JSON.parse(localStorage.getItem("em_notifs")||"{}");}catch(e){nf={};}
    nf[s.dataset.k]=s.classList.contains("on");localStorage.setItem("em_notifs",JSON.stringify(nf));
  });
  document.querySelectorAll(".acc-side").forEach(side=>side.addEventListener("click",e=>{
    const b=e.target.closest(".acc-item");if(!b)return;
    const n=b.dataset.nav;
    if(n==="perfil")showProfile();else if(n==="viajes")showSaved();else if(n==="prefs")showScr("scrPrefs");
    else if(n==="pagos"){if(typeof flash==="function")flash("Pagos: disponible próximamente");}
    else if(n==="config")showSettings();else if(n==="inicio")showScr("scrLand");
  }));
  $("navSaved").onclick=()=>showSaved();
  $("navProfile").onclick=()=>showProfile();

  // ===== Pantalla 5 · preferencias (chips compañía/presupuesto/ritmo + hotel) =====
  function buildChips(containerId,data,key){const c=$(containerId);if(!c)return;data.forEach(o=>{const el=document.createElement("div");el.className="pchip";el.innerHTML=`${o.svg?ico(o.svg):""}<span>${o.nm}</span>`;el.onclick=()=>{[...c.children].forEach(x=>x.classList.remove("on"));el.classList.add("on");if(typeof sel!=="undefined")sel[key]=o.id;};c.appendChild(el);});}
  function presel(containerId,data,key,id){const c=$(containerId);const idx=data.findIndex(o=>o.id===id);if(idx>=0&&c.children[idx]){c.children[idx].classList.add("on");if(typeof sel!=="undefined")sel[key]=id;}}
  if(typeof COMPANIA!=="undefined"){buildChips("pCompania",COMPANIA,"compania");buildChips("pPresup",PRESUP,"presupuesto");buildChips("pRitmo",RITMO,"ritmo");
    presel("pCompania",COMPANIA,"compania","amigos");presel("pPresup",PRESUP,"presupuesto","mid");presel("pRitmo",RITMO,"ritmo","equi");}

  // Resumen rápido (tarjeta lateral de preferencias)
  function nmOf(data,id){const f=data.find(o=>o.id===id);return f?f.nm:"—";}
  function updatePrefSummary(){
    if(!$("psComp"))return;
    $("psComp").textContent=nmOf(COMPANIA,(sel&&sel.compania)||"amigos");
    $("psPres").textContent=nmOf(PRESUP,(sel&&sel.presupuesto)||"mid");
    $("psRitmo").textContent=nmOf(RITMO,(sel&&sel.ritmo)||"equi");
    const ms=[...flowMoods];
    const main=ms.length?MOODB.find(m=>m.id===ms[0]):null;
    $("psMood").textContent=main?main.nm:"—";
    const box=$("psMoods");box.innerHTML="";
    ms.slice(1).forEach(id=>{const m=MOODB.find(x=>x.id===id);if(m){const el=document.createElement("span");el.className="pm";el.innerHTML=ico(m.svg);box.appendChild(el);}});
    if(ms.length<2){const el=document.createElement("span");el.className="pm";el.style.opacity=".4";el.innerHTML=ico("dots");box.appendChild(el);}
  }
  // ===== Motor de moods en pantalla: cómo encaja lo elegido y qué te podrías estar perdiendo =====
  let advTok=0;
  function renderMoodAdvice(){
    const box=$("moodAdvice");if(!box||!lastTrip||!lastTrip.dest)return;
    const tok=++advTok,dest=lastTrip.dest;
    const draw=key=>{
      if(tok!==advTok)return;
      const A=key&&typeof moodAdvice==="function"?moodAdvice(key,{moods:[...flowMoods],compania:(sel&&sel.compania)||"amigos",presup:(sel&&sel.presupuesto)||"mid",ritmo:(sel&&sel.ritmo)||"equi",dias:lastTrip.days||3,date:lastTrip.inDate||""}):null;
      if(!A){box.hidden=true;return;}
      const bar=r=>`<div class="ma-row"><div class="ma-h"><b>${r.nm}</b><span class="ma-sc ${r.score>=75?"hi":r.score>=55?"mid":"lo"}">${r.score>=75?"Encaja muy bien":r.score>=55?"Encaja":"Encaja poco"} · ${r.score}/100</span></div><div class="ma-bar"><i style="width:${r.score}%"></i></div>${r.top.length?`<p class="ma-p">Aquí: ${r.top.join(", ")}.</p>`:""}${r.why.map(w=>`<p class="ma-p dim">${w}</p>`).join("")}</div>`;
      const full=flowMoods.size>=3;
      const low=[...A.sel].sort((a,b)=>a.score-b.score)[0];
      const sg=A.sugg.map(r=>`<div class="ma-sug"><div><b>${ico("sparkles")} ¿Y ${r.nm.toLowerCase()}?</b><p class="ma-p">${r.reason} Desbloquea: ${r.top.join(", ")}. ${r.when}</p></div><button type="button" class="ma-add" data-m="${r.id}" data-out="${full&&low?low.id:""}">${full&&low?`Cambiar ${low.nm.toLowerCase()} por ${r.nm.toLowerCase()}`:"Añadir"}</button></div>`).join("");
      box.innerHTML=`<h3>${ico("bulb")} Cómo encajan tus moods en ${cap(dest)}</h3><p class="ma-p dim">Es una recomendación orientativa a partir de los sitios que tenemos en la guía, con quién viajas, los días${lastTrip.inDate?" y la fecha":""}. Decides tú.</p>
        <div class="ma-grid">${A.sel.map(bar).join("")}</div>${A.notes.map(n=>`<p class="ma-note">${n}</p>`).join("")}${sg?`<div class="ma-sugs">${sg}</div>`:""}`;
      box.hidden=false;
      box.querySelectorAll(".ma-add").forEach(b=>b.onclick=e=>{e.stopPropagation();const m=b.dataset.m,out=b.dataset.out;
        if(out)flowMoods.delete(out);if(flowMoods.size<3)flowMoods.add(m);
        const bubs=[...$("bubbles").children];MOODB.forEach((x,i)=>{if(bubs[i])bubs[i].classList.toggle("on",flowMoods.has(x.id));});
        updatePrefSummary();renderMoodAdvice();});
    };
    const k0=resolveKey(dest);
    if(k0){draw(k0);if(!isAuto(k0))loadAux(k0).then(()=>draw(k0)).catch(()=>{});}
    else{box.hidden=false;box.innerHTML=`<p class="ma-p dim">${ico("sparkles")} Mirando qué hay en ${cap(dest)} para valorar tus moods…</p>`;ensureCity(dest).then(k=>draw(k)).catch(()=>draw(null));}
  }
  $("scrPrefs").addEventListener("click",()=>setTimeout(()=>{updatePrefSummary();renderMoodAdvice();},0));

  // ===== Sin vuelo: elegir destino =====
  let moodPrev="scrFound",manualDaysVal=4,manualNoDate=false;
  (function(){const di=$("manualDate"),sk=$("manualNoDate"),bx=$("manualDateBox");if(!di)return;
    const today=new Date();di.min=today.toISOString().slice(0,10);
    di.addEventListener("change",()=>{bx.classList.remove("nudge");bx.classList.toggle("has",!!di.value);sk.classList.remove("on");manualNoDate=false;$("manualMsg").textContent="";});
    sk.onclick=()=>{di.value="";bx.classList.remove("nudge","has");sk.classList.add("on");manualNoDate=true;$("manualMsg").textContent="";};
  })();
  (function(){ // datalist de destinos + chips de días
    if(typeof DESTINOS!=="undefined"){const dl=$("destList");if(dl)DESTINOS.forEach(d=>{const o=document.createElement("option");o.value=d.n+(d.c&&d.c!==d.n?" · "+d.c:"");dl.appendChild(o);});}
    const c=$("manualDays");if(c){[2,3,4,5,7].forEach(n=>{const b=document.createElement("button");b.className="mday"+(n===4?" on":"");b.textContent=n+" días";b.onclick=()=>{[...c.children].forEach(x=>x.classList.remove("on"));b.classList.add("on");manualDaysVal=n;};c.appendChild(b);});}
  })();
  function startManual(){
    const raw=$("manualDest").value.trim();const msg=$("manualMsg");
    if(!raw){msg.textContent="Escribe un destino.";return;}
    const dest=raw.split(" · ")[0].trim();
    // la fecha cambia mucho el plan (ocaso real, cierres, noches de discoteca): si no la pone, se le pide una vez
    const dv=($("manualDate")&&$("manualDate").value)||"";
    if(!dv&&!manualNoDate){const bx=$("manualDateBox");bx.classList.add("nudge");msg.textContent="¿Sabes ya la fecha? Con ella el plan acierta con el atardecer y no te manda a sitios cerrados. Si aún no la sabes, pulsa «Aún no lo sé».";$("manualDate").focus();manualNoDate=true;return;}
    inDest.value=dest;delete inDest.dataset.key; // resolveKey lo busca por nombre/ALIAS
    flowHotelCoord=null;
    lastTrip={dest:dest,days:manualDaysVal,inNum:"",inDate:($("manualDate")&&$("manualDate").value)||"",inTime:"",outNum:"",outDate:"",outTime:""};
    moodPrev="scrManual";
    showScr("scrMood");
    if(anok())anime({targets:"#scrMood .mood-head,#scrMood .bubbles .bub,#scrMood .mood-foot",opacity:[0,1],translateY:[16,0],delay:anime.stagger(40),duration:480,easing:"easeOutCubic"});
  }
  $("manualGo").onclick=startManual;
  $("manualDest").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();startManual();}});
  $("manualBackTop").onclick=()=>showScr("scrLand");

  // wiring landing
  $("landGo").onclick=()=>startTrip($("landFlight").value,$("landDate").value,$("landFlightR").value,$("landDateR").value);
  $("landFlight").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();$("landGo").click();}});
  $("retToggle").onclick=()=>{$("retRow").classList.toggle("hidden");};
  $("navManual").onclick=()=>{showScr("scrManual");if(anok())anime({targets:"#scrManual .land-nav,#scrManual .display,#scrManual .lead,#scrManual .land-form",opacity:[0,1],translateY:[16,0],delay:anime.stagger(70,{start:80}),duration:560,easing:"easeOutCubic"});setTimeout(()=>$("manualDest").focus(),200);};
  $("navStart").onclick=()=>{$("landFlight").focus();$("landFlight").scrollIntoView({behavior:"smooth",block:"center"});};
  $("fContinue").onclick=()=>{if(lastTrip&&lastTrip.dest)$("destino").value=lastTrip.dest;moodPrev="scrFound";showScr("scrMood");if(anok())anime({targets:"#scrMood .mood-head,#scrMood .bubbles .bub,#scrMood .mood-foot",opacity:[0,1],translateY:[16,0],delay:anime.stagger(40),duration:480,easing:"easeOutCubic"});};
  $("moodBack").onclick=()=>showScr(moodPrev||"scrLand");
  $("moodNext").onclick=()=>{if(!flowMoods.size)return;if(typeof updatePrefSummary==="function")updatePrefSummary();showScr("scrPrefs");renderMoodAdvice();if(anok())anime({targets:"#scrPrefs .mood-head,#scrPrefs .pblock,#scrPrefs .psum,#scrPrefs .mood-foot",opacity:[0,1],translateY:[16,0],delay:anime.stagger(50),duration:480,easing:"easeOutCubic"});};
  $("prefsBack").onclick=()=>showScr("scrMood");
  $("prefsGo").onclick=async function(){
    const hotel=$("pHotel").value.trim();flowHotelCoord=null;
    if(hotel&&typeof geocode==="function"){const btn=this;btn.disabled=true;const t=btn.innerHTML;btn.textContent="Localizando tu hotel…";const dest=(lastTrip&&lastTrip.dest)||$("destino").value;flowHotelCoord=await geocode(hotel+", "+(dest||""));btn.disabled=false;btn.innerHTML=t;}
    if(hotel){const hb=$("hotel");if(hb)hb.value=hotel;}
    showForming();
  };
  $("itinBack").onclick=()=>showTripSummary();
  // PDF premium: hero + días con timeline + página de resumen (mapa, tarjetas, info útil)
  const PVCAT={desayuno:"coffee",sight:"landmark",comida:"utensils",atardecer:"sunset",cena:"utensils",copas:"wine",disco:"music",compras:"bag",souvenir:"gift",foto:"camera",cultural:"landmark",relax:"leaf",aventura:"mountain",gastro:"utensils",fiesta:"music",romantico:"heart",familia:"family",familianoche:"moon"};
  const PVCOUNTRY={"Hungría":["Húngaro (inglés turístico)","Tipo C y F · 230V"],"Croacia":["Croata (inglés turístico)","Tipo C y F · 230V"],"Croacia (Split)":["Croata (inglés turístico)","Tipo C y F · 230V"],"Corea del Sur":["Coreano (inglés básico)","Tipo C y F · 220V"],"Japón":["Japonés (poco inglés fuera del centro)","Tipo A y B · 100V: lleva adaptador"],"Suiza":["Alemán en Interlaken (inglés muy extendido)","Tipo J (vale el C) · 230V: lleva adaptador"],"Chequia":["Checo (inglés turístico)","Tipo C y E · 230V"],"Italia":["Italiano","Tipo C, F y L · 230V"],"Francia":["Francés","Tipo C y E · 230V"],"España":["Español","Tipo C y F · 230V"],"Portugal":["Portugués","Tipo C y F · 230V"],"Reino Unido":["Inglés","Tipo G · 230V"],"Países Bajos":["Neerlandés (inglés fluido)","Tipo C y F · 230V"],"Alemania":["Alemán (inglés fluido)","Tipo C y F · 230V"],"Bélgica":["Francés y neerlandés","Tipo C y E · 230V"],"Austria":["Alemán (inglés fluido)","Tipo C y F · 230V"],"Grecia":["Griego (inglés turístico)","Tipo C y F · 230V"],"Dinamarca":["Danés (inglés fluido)","Tipo C y K · 230V"],"Suecia":["Sueco (inglés fluido)","Tipo C y F · 230V"],"Irlanda":["Inglés","Tipo G · 230V"],"Turquía":["Turco (inglés turístico)","Tipo C y F · 230V"],"Polonia":["Polaco (inglés turístico)","Tipo C y E · 230V"]};
  const PVCUR={budapest:"Florín húngaro (Ft)",seoul:"Won surcoreano (₩)",tokio:"Yen japonés (¥)",interlaken:"Franco suizo (CHF)",praga:"Corona checa (Kč)",londres:"Libra esterlina (£)",edimburgo:"Libra esterlina (£)",copenhague:"Corona danesa (kr)",estocolmo:"Corona sueca (kr)",estambul:"Lira turca (TL)",cracovia:"Złoty polaco (zł)"};
  const PVTIPS=["Reserva las visitas más famosas con antelación: te saltas las colas.","Lleva algo de efectivo: los puestos pequeños no siempre aceptan tarjeta.","Muchos museos cierran los lunes: comprueba horarios antes de salir.","Desayuna donde los locales: es más barato y empieza mejor el día.","Guarda el itinerario en el móvil y marca tus favoritos."];
  function pvImg(name){return (typeof IMG!=="undefined"&&IMG[name])||null;}
  function pvHero(){if(ITIN.key&&typeof DB!=="undefined"&&DB[ITIN.key]){const x=DB[ITIN.key].find(v=>v.cat==="sight"&&pvImg(v.nm));if(x)return pvImg(x.nm);}return null;}
  function buildPrintView(){
    if(!ITIN)return false;
    let pv=document.getElementById("printView");
    if(!pv){pv=document.createElement("div");pv.id="printView";document.body.appendChild(pv);}
    const nights=Math.max(1,ITIN.days-1);
    const dest=(typeof DESTINOS!=="undefined")?DESTINOS.find(x=>norm(x.n)===norm(ITIN.city)):null;
    const country=dest?dest.c:"";
    const moodNames=[...flowMoods].map(m=>{const x=MOODB.find(y=>y.id===m);return x?x.nm:m;});
    const estilo=moodNames.length?moodNames.join(", "):"A tu aire";
    const compName=(typeof COMPANIA!=="undefined"&&typeof sel!=="undefined")?((COMPANIA.find(c=>c.id===sel.compania)||{}).nm||"Amigos"):"Amigos";
    const b=estBudget(),mid=r=>Math.round((r[0]+r[1])/2/10)*10;
    const total=mid(b.fl)+mid(b.al)+mid(b.ex);
    const fechas=ITIN.inDate?(shortDate(ITIN.inDate)+((lastTrip&&lastTrip.outDate)?" – "+shortDate(lastTrip.outDate):"")):"Tú eliges";
    const hero=pvHero();
    const foot=`<div class="pv-foot"><span>Explora Mood</span><span>Tu viaje, a tu medida</span><span>explora-mood.vercel.app</span></div>`;
    let h=`<div class="pv-hero"><div class="pv-hero-l">
      <div class="pv-brand">${ico("plane")} Explora Mood</div>
      <div class="pre">Tu viaje a</div><h1>${ITIN.city}</h1>
      <span class="pv-chip">${ITIN.days} ${ITIN.days===1?"día":"días"} · ${nights} ${nights===1?"noche":"noches"}</span>
      <div class="pv-meta-row">
        <div class="pv-meta-it">${ico("calendar")}<div>Fechas del viaje<b>${fechas}</b></div></div>
        <div class="pv-meta-it">${ico("users")}<div>Viajeros<b>${compName}</b></div></div>
        <div class="pv-meta-it">${ico("sparkles")}<div>Estilo de viaje<b>${estilo}</b></div></div>
      </div></div>
      <div class="pv-hero-r">${hero?`<img src="${hero}" alt="">`:""}</div></div>`;
    ITIN.plan.forEach((day,i)=>{
      h+=`<section class="pv-day"><h2>Día ${i+1} · ${dayName(i,ITIN.plan.length,ITIN.city)}</h2><div class="pv-sub">${ITIN.inDate?longDay(ITIN.inDate,i)+" · ":""}${daySub(i)}</div>`;
      day.forEach(st=>{
        if(st.a&&st.a.libre){h+=`<div class="pv-row"><span class="t">${st.time}</span><span class="tic">${ico("coffee")}</span><div class="mid"><b>Rato libre</b><div>${st.a.d}</div></div><span class="pr"></span></div>`;return;}
        if(st.a&&st.a.marker){h+=`<div class="pv-row"><span class="t">${st.time}</span><span class="tic">${ico("plane")}</span><div class="mid"><b>${st.a.t}</b></div><span class="pr"></span></div>`;return;}
        const cat=st.a.vcat||st.cat;
        const info=(typeof getInfo==="function")?getInfo({cat:cat,name:st.a.t,destino:ITIN.city}):{};
        h+=`<div class="pv-row"><span class="t">${st.time}</span><span class="tic">${ico(PVCAT[cat]||"pin")}</span><div class="mid"><b>${st.a.t}</b>${st.a.d?`<div>${st.a.d}</div>`:""}</div><span class="pr">${st.a.price&&st.a.price.txt?st.a.price.txt:(st.a.real&&!st.a.auto&&info.price?info.price:"")}</span></div>`;
      });
      const mw=(ITIN.meta&&ITIN.meta[i]&&ITIN.meta[i].why)||[];
      const tip=mw.length?mw.slice(0,2).join(" "):((i===0&&typeof FARES!=="undefined"&&ITIN.key&&FARES[ITIN.key])?("Muévete en transporte público: el billete sencillo cuesta "+FARES[ITIN.key]+"."):PVTIPS[i%PVTIPS.length]);
      h+=`<div class="pv-tip">${ico("bulb")}<div><b>Consejo del día</b><span>${tip}</span></div>${i===ITIN.plan.length-1?'<span class="fin">¡Disfruta del viaje!</span>':""}</div></section>`;
    });
    h+=foot;
    h+=`<div class="pv-pagebreak"></div>`;
    h+=`<div class="pv-grid2"><div>
      <div class="pv-h3">Resumen del viaje</div>
      <div class="pv-cards">
        <div class="pv-card"><span class="cic">${ico("pin")}</span><div><small>Destino</small><b>${ITIN.city}${country?", "+country:""}</b></div></div>
        <div class="pv-card"><span class="cic">${ico("clock")}</span><div><small>Duración</small><b>${ITIN.days} ${ITIN.days===1?"día":"días"} · ${nights} ${nights===1?"noche":"noches"}</b></div></div>
        <div class="pv-card"><span class="cic">${ico("calendar")}</span><div><small>Fechas</small><b>${fechas}</b></div></div>
        <div class="pv-card"><span class="cic">${ico("users")}</span><div><small>Viajeros</small><b>${compName}</b></div></div>
        <div class="pv-card"><span class="cic">${ico("sparkles")}</span><div><small>Estilo de viaje</small><b>${estilo}</b></div></div>
        <div class="pv-card"><span class="cic">${ico("wallet")}</span><div><small>Presupuesto estimado</small><b>${total} € por persona</b></div></div>
      </div></div>`;
    const spots=[];const seenS=new Set();
    ITIN.plan.forEach(day=>{day.forEach(st=>{if(st.a&&!st.a.marker&&typeof COORDS!=="undefined"&&COORDS[st.a.t]&&!seenS.has(st.a.t)&&spots.length<8){seenS.add(st.a.t);spots.push({n:st.a.t,c:COORDS[st.a.t]});}});});
    let mapH="";
    if(spots.length>=3){
      const lats=spots.map(x=>x.c[0]),lons=spots.map(x=>x.c[1]);
      const mla=Math.min(...lats),Mla=Math.max(...lats),mlo=Math.min(...lons),Mlo=Math.max(...lons);
      const px=lo=>30+((lo-mlo)/((Mlo-mlo)||1))*340,py=la=>22+(1-(la-mla)/((Mla-mla)||1))*196;
      let svg=`<svg viewBox="0 0 400 240">`;
      svg+=`<polyline points="${spots.map(x=>px(x.c[1]).toFixed(1)+","+py(x.c[0]).toFixed(1)).join(" ")}" fill="none" stroke="#93b8f5" stroke-width="1.4" stroke-dasharray="4 5"/>`;
      spots.forEach((x,k)=>{const cx=px(x.c[1]).toFixed(1),cy=py(x.c[0]).toFixed(1);
        svg+=`<circle cx="${cx}" cy="${cy}" r="9" fill="#2563eb"/><text x="${cx}" y="${cy}" fill="#fff" font-size="9" font-weight="700" text-anchor="middle" dominant-baseline="central">${k+1}</text>`;});
      svg+=`</svg>`;
      mapH=`<div><div class="pv-h3">Mapa destacado</div><div class="pv-map">${svg}<div class="pv-legend">${spots.map((x,k)=>`<div class="pv-leg"><i>${k+1}</i> ${x.n}</div>`).join("")}</div></div></div>`;
    }else mapH="<div></div>";
    h+=mapH+`</div>`;
    h+=`<div class="pv-h3">Itinerario por días</div><div class="pv-daycards" style="grid-template-columns:repeat(${Math.min(4,ITIN.plan.length)},1fr)">`;
    ITIN.plan.slice(0,4).forEach((day,i)=>{
      const stops=day.filter(st=>st.a&&!st.a.marker);
      const ph=stops.map(st=>pvImg(st.a.t)).find(Boolean);
      h+=`<div class="pv-dc"><div class="h"><small>Día ${i+1}</small><b>${dayName(i,ITIN.plan.length,ITIN.city)}</b></div>${ph?`<img src="${ph}" alt="">`:""}<ul>${stops.slice(0,3).map(st=>`<li>${st.a.t}</li>`).join("")}</ul></div>`;
    });
    h+=`</div>`;
    const bt=(typeof BEST!=="undefined"&&BEST[ITIN.key])||["Abr – Oct","15° – 25°"];
    const ci=PVCOUNTRY[country]||["Inglés en zonas turísticas","Tipo C · 230V"];
    const cur=(ITIN.key&&PVCUR[ITIN.key])||"Euro (€)";
    h+=`<div class="pv-h3">Información útil</div><div class="pv-info">
      <div class="pv-inf">${ico("wallet")}<div><small>Moneda</small><b>${cur}</b></div></div>
      <div class="pv-inf">${ico("smile")}<div><small>Idioma</small><b>${ci[0]}</b></div></div>
      <div class="pv-inf">${ico("sunset")}<div><small>Clima habitual</small><b>${bt[1]} (${bt[0]})</b></div></div>
      <div class="pv-inf">${ico("zap")}<div><small>Enchufe</small><b>${ci[1]}</b></div></div>
      <div class="pv-inf">${ico("bus")}<div><small>Transporte</small><b>${(typeof FARES!=="undefined"&&ITIN.key&&FARES[ITIN.key])||"Metro, tranvía y bus"}</b></div></div>
    </div>`;
    h+=`<div class="pv-quote">${hero?`<img src="${hero}" alt="">`:""}<div class="q"><div class="qm">“</div><p>${ITIN.city} no es solo un destino, es una experiencia que se siente, se vive y se recuerda para siempre.</p><small>— Explora Mood</small></div></div>`;
    h+=foot;
    pv.innerHTML=h;return true;
  }
  $("itinPdf").onclick=()=>{if(buildPrintView())window.print();};
  $("sumGo").onclick=()=>{showScr("scrItin");window.scrollTo({top:0});setTimeout(refreshDayMap,90);};
  $("sumEdit").onclick=()=>showScr("scrPrefs");
  // compartir: enlace profundo que abre ESTE viaje directamente
  function shareTrip(){
    if(!ITIN){try{navigator.clipboard.writeText(location.origin+location.pathname);}catch(e){}return;}
    const url=location.origin+location.pathname+"#demo="+encodeURIComponent(ITIN.city)+"/"+ITIN.days+"/"+encodeURIComponent([...flowMoods].join(",")||"cultural")+"/itin";
    if(navigator.share){navigator.share({title:"Mi viaje a "+ITIN.city+" · Explora Mood",url:url}).catch(()=>{});return;}
    try{navigator.clipboard.writeText(url);if(typeof flash==="function")flash("Enlace del viaje copiado ✨");}catch(e){}
  }
  $("sumShare").onclick=shareTrip;
  $("itinShare").onclick=shareTrip;
  document.querySelectorAll(".book-note u").forEach(u=>u.onclick=()=>{if(typeof flash==="function")flash("Demo educativa: sin términos reales todavía");});
  $("sumFav").onclick=()=>{if(typeof saveTrip==="function")saveTrip();};
  $("itinFav").onclick=()=>{if(typeof saveTrip==="function")saveTrip();};
  $("itinPrevDay").onclick=()=>{if($("scrItin").classList.contains("guide-on")){showTripSummary();return;}if(ITIN&&ITIN.cur>0)renderItinDay(ITIN.cur-1);else if(ITIN)renderGuide();else showTripSummary();};
  $("itinNextDay").onclick=()=>{if(!ITIN)return;if($("scrItin").classList.contains("guide-on")){renderItinDay(0);window.scrollTo({top:0});return;}if(ITIN.cur<ITIN.plan.length-1){renderItinDay(ITIN.cur+1);window.scrollTo({top:0});}else if(typeof showBooking==="function")showBooking();};
  $("itinBook").onclick=()=>{if(typeof showBooking==="function")showBooking();};
  $("itinMapBtn").onclick=()=>{if(typeof showTripMap==="function")showTripMap(ITIN?ITIN.cur:-1);};

  // entrada del landing
  if(anok()){
    anime({targets:".land-nav,.display,.lead,.land-form,.land-foot",opacity:[0,1],translateY:[18,0],delay:anime.stagger(90,{start:120}),duration:650,easing:"easeOutCubic"});
    anime({targets:".land-plane",translateX:[-70,70],translateY:[0,-10],opacity:[0,.9],duration:9000,easing:"easeInOutSine",direction:"alternate",loop:true});
  }

  // hook de pruebas: #demo=Destino/dias/mood1,mood2/pantalla(itin|form|mood|prefs)
  (function(){
    const m=location.hash.match(/^#demo=([^/]+)\/(\d+)\/([^/]+)(?:\/(\w+))?(?:\/(\d{4}-\d\d-\d\d))?/);
    if(!m)return;
    const dest=decodeURIComponent(m[1]),days=+m[2],moods=decodeURIComponent(m[3]).split(","),target=m[4]||"itin";
    window.anime=undefined;
    inDest.value=dest;delete inDest.dataset.key;
    lastTrip={dest:dest,days:days,inNum:"",inDate:m[5]||"",inTime:"",outNum:"",outDate:"",outTime:""};
    moods.forEach(x=>flowMoods.add(x));
    if(target==="mood"){showScr("scrMood");return;}
    if(target==="prefs"){if(typeof updatePrefSummary==="function")updatePrefSummary();showScr("scrPrefs");return;}
    if(target==="form"){showForming();return;}
    ensureCity(dest).catch(()=>null).then(()=>demoGo(target));
  })();
  function demoGo(target){
    if(target==="print"){generateItin();buildPrintView();showScr("scrItin");return;}
    if(target==="saved"){showSaved();return;}
    if(target==="login"){openAuth("up");return;}
    if(target==="profile"){showProfile();return;}
    if(target==="settings"){showSettings();return;}
    if(target==="modal"){generateItin();showScr("scrItin");setTimeout(()=>{const el=document.querySelector("#itinTimeline .dstop");if(el)el.click();},1400);return;}
    if(target==="sum"||target==="resumen"){generateItin();showTripSummary();return;}
    if(target==="book"&&typeof showBooking==="function"){generateItin();showBooking();return;}
    if(target==="tripmap"&&typeof showTripMap==="function"){generateItin();showTripMap();return;}
    generateItin();showScr("scrItin");setTimeout(refreshDayMap,200);
  }
})();
