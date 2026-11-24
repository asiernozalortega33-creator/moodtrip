// Sitios reales con nombre propio para CUALQUIER ciudad, gratis y sin claves.
//  · Wikidata (estable): monumentos, museos, mercados, salas de conciertos, bares y cafés con historia,
//    ordenados por fama (en cuántas Wikipedias aparecen), con foto de Commons y barrio.
//  · OpenStreetMap / Overpass (complemento, si los servidores públicos responden): discotecas,
//    cafeterías, restaurantes y bares que Wikidata no tiene.
// La respuesta se guarda 30 días en la CDN de Vercel: cada ciudad se calcula una vez, no una por visitante.
// GET /api/places?city=Barcelona
const UA = "ExploraMood/1.0 (https://explora-mood.vercel.app)";
const WDQS = "https://query.wikidata.org/sparql";
const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.private.coffee/api/interpreter"];
const osmErr = [];

// Tipos de Wikidata (P31 directo, para que la consulta sea rápida) → categoría del itinerario
const GROUPS = {
  noche: { r: 1.0, min: 0, lim: 25, cls: ["Q622425", "Q8719053", "Q1060829", "Q1684522"] },          // discoteca, sala de música, sala de conciertos, club de jazz
  copas: { r: 0.7, min: 0, lim: 30, cls: ["Q187456", "Q212198", "Q1922416", "Q858012", "Q30748895", "Q141065094"] }, // bar, pub, bar de vinos, cervecería, coctelería, bar de tapas
  cafe: { r: 0.7, min: 0, lim: 25, cls: ["Q30022", "Q4236467", "Q274393", "Q861651"] },                // café, cafetería, panadería, pastelería
  comer: { r: 0.55, min: 0, lim: 30, cls: ["Q11707"] },                                                 // restaurante (la consulta más lenta: radio algo menor)
  mercado: { r: 1.0, min: 0, lim: 15, sub: true, cls: ["Q330284"] },                                     // mercado y sus subtipos (mercado cubierto, de abastos…)
  ver: { r: 1.2, min: 2, lim: 60, cls: ["Q33506", "Q207694", "Q570116", "Q16970", "Q2977", "Q163687", "Q16560", "Q174782", "Q23413", "Q12518", "Q4989906", "Q12280", "Q44539", "Q32815", "Q697295", "Q57821", "Q167346"] },
  vista: { r: 1.6, min: 1, lim: 25, cls: ["Q6017969", "Q54050", "Q40080", "Q22698", "Q1107656"] },     // mirador, colina, playa, parque, jardín
  // lo que es patrimonio protegido y famoso, sea del tipo que sea (Sagrada Família es "basílica menor", Casa Batlló "edificio"…)
  patrimonio: { r: 1.2, min: 12, lim: 40, heritage: true },
};
// tipo de sitio (para la duración, si es gratis, si se puede ver con lluvia…)
const KIND = { Q33506: "museo", Q207694: "museo", Q16970: "iglesia", Q2977: "iglesia", Q163687: "iglesia", Q32815: "iglesia", Q44539: "iglesia", Q697295: "iglesia", Q16560: "palacio", Q23413: "palacio", Q57821: "palacio", Q174782: "plaza", Q12518: "torre", Q12280: "puente", Q4989906: "monumento", Q167346: "parque", Q1107656: "parque", Q22698: "parque", Q40080: "playa", Q6017969: "mirador", Q54050: "mirador", Q330284: "mercado", Q622425: "disco", Q1060829: "sala", Q8719053: "sala", Q1684522: "sala" };
const PARQUE = new Set(["Q22698", "Q1107656", "Q167346"]), PLAYA = "Q40080";
const CLASICA = /auditor|palau|palacio|palais|palazzo|teatr|theat|ópera|opera|oper\b|filarm|philharm|sinf|symph|conservat|kultur|cultural|igles|church|kirche|basíl|basil|estadi|stadium|arena\b|pabell|pavell|teatre musical|\bhall\b|gimnas|gymnas|art space|kaikan|bunka|anfiteat|amphith|open-air|concertgebouw|musikverein|salle pleyel/i;
// cadenas: nadie viaja para desayunar en un Starbucks
const CADENA = /starbucks|mcdonald|burger king|\bkfc\b|subway|costa coffee|tim hortons|dunkin|pret a manger|five guys|telepizza|domino'?s|pizza hut|hard rock caf|tgi friday|wagamama|vips\b|foster'?s hollywood|100 montaditos|tommy mel|krispy|paul\b|tous les jours|doutor|tully'?s|komeda|excelsior caff/i;

// locales para adultos: fuera (nombre o descripción en inglés)
const ADULTO = /\bsod\b|\berot|\bsex|porn|strip ?club|striptease|hostess|fetish|burlesque|love hotel|brothel|prostitu|adult (entertainment|video|bar)/i;
// un parque solo vale para ver el atardecer si es un mirador o está en alto
const CONVISTA = /mirador|miradouro|belvedere|aussicht|turó|tur[oó] d|colina|\bhill|\bmont|monte |montju|tibidabo|bunker|castell|cerro|kalnas|tepe|\bberg|\bvista|panor/i;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const capFirst = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
function hav(a, b) { const R = 6371, dLat = (b[0] - a[0]) * Math.PI / 180, dLon = (b[1] - a[1]) * Math.PI / 180, x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLon / 2) ** 2; return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)); }

async function getJSON(url, opt, ms) {
  const r = await fetch(url, { ...opt, headers: { "User-Agent": UA, ...(opt && opt.headers) }, signal: AbortSignal.timeout(ms) });
  if (!r.ok) throw new Error("http " + r.status);
  return r.json();
}

async function geocode(city) {
  const u = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=1&accept-language=es&q=${encodeURIComponent(city)}`;
  const L = await getJSON(u, {}, 10000);
  const pick = L.find(x => /^(city|town|village|municipality|administrative|suburb|island)$/.test(x.addresstype || x.type)) || L[0];
  if (!pick) return null;
  const bb = (pick.boundingbox || []).map(Number); // [latS, latN, lonW, lonE]
  let km = 6;
  if (bb.length === 4) km = hav([bb[0], bb[2]], [bb[1], bb[3]]) / 2;
  const a = pick.address || {};
  return {
    name: a.city || a.town || a.village || a.municipality || pick.name || city,
    country: a.country || "", cc: (a.country_code || "").toUpperCase(),
    c: [+pick.lat, +pick.lon],
    radius: Math.max(3, Math.min(9, km * 0.6)), // radio base (km) según el tamaño de la ciudad
  };
}

// ---------- Wikidata ----------
function sparql(c, radius, cls, min, lim, sub, heritage, g) {
  const tipo = heritage
    ? `?it wdt:P1435 ?her . ?it wdt:P31 ?t .
  FILTER NOT EXISTS { ?it wdt:P31 ?no . VALUES ?no { wd:Q79007 wd:Q123705 wd:Q2983893 wd:Q55488 wd:Q928830 wd:Q3918 wd:Q16917 wd:Q3914 wd:Q1248784 } }` // ni calles, barrios, distritos, estaciones, metro, universidades, hospitales, colegios ni aeropuertos
    : `VALUES ?t { ${cls.map(q => "wd:" + q).join(" ")} }
  ?it wdt:P31${sub ? "/wdt:P279?" : ""} ?t .`;
  // datos extra solo donde hacen falta (cada OPTIONAL encarece la consulta)
  const extra = g === "comer" ? `OPTIONAL { ?it wdt:P166 ?aw . ?aw rdfs:label ?awl . FILTER(LANG(?awl) = "es" && CONTAINS(LCASE(?awl), "michelin")) }`
    : g === "vista" ? `OPTIONAL { ?it wdt:P2044 ?ele }`
    : (g === "ver" || g === "patrimonio") ? `OPTIONAL { ?it wdt:P361 ?part }`
    : (g === "noche" || g === "copas") ? `OPTIONAL { ?it schema:description ?dEn FILTER(LANG(?dEn) = "en") }` : "";
  return `SELECT ?it ?itLabel ?dEs ?coord ?links ?img ?t ?admLabel ?awl ?ele ?part ?dEn WHERE {
  SERVICE wikibase:around { ?it wdt:P625 ?coord . bd:serviceParam wikibase:center "Point(${c[1]} ${c[0]})"^^geo:wktLiteral ; wikibase:radius "${radius.toFixed(1)}" . }
  ${tipo}
  ?it wikibase:sitelinks ?links .
  FILTER(?links >= ${min})
  FILTER NOT EXISTS { ?it wdt:P576 ?a }
  FILTER NOT EXISTS { ?it wdt:P3999 ?b }
  OPTIONAL { ?it wdt:P18 ?img }
  OPTIONAL { ?it wdt:P131 ?adm }
  OPTIONAL { ?it schema:description ?dEs FILTER(LANG(?dEs) = "es") }
  ${extra}
  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en,ca,fr,it,de,pt,mul". }
} ORDER BY DESC(?links) LIMIT ${lim * 3}`;
}
async function wikidata(g, geo) {
  const G = GROUPS[g];
  const q = sparql(geo.c, geo.radius * G.r, G.cls || [], G.min, G.lim, G.sub, G.heritage, g);
  let j;const t0 = Date.now();
  for (let i = 0; i < 2; i++) {
    // tope de 20 s por consulta y un solo reintento si da tiempo: la función entera tiene 60 s en Vercel
    try { j = await getJSON(WDQS + "?format=json&query=" + encodeURIComponent(q), { headers: { Accept: "application/sparql-results+json" } }, 20000); break; }
    catch (e) { if (i || Date.now() - t0 > 12000) return []; await sleep(800); }
  }
  if (process.env.DEBUG) console.log("  wikidata", g, Date.now() - t0, "ms", j.results.bindings.length);
  const seen = new Map();
  for (const b of j.results.bindings) {
    const id = b.it.value.split("/").pop();
    const nm = b.itLabel && b.itLabel.value;
    // la misma ficha puede venir en varias filas (una por premio, por "parte de"…): se suman los datos
    if (seen.has(id)) { const o = seen.get(id); if (b.awl) o.lux = true; if (b.part) o.part.add(b.part.value.split("/").pop()); continue; }
    if (!nm || /^Q\d+$/.test(nm) || CADENA.test(nm)) continue;
    if (ADULTO.test(nm) || (b.dEn && ADULTO.test(b.dEn.value))) continue; // nada de locales para adultos
    if (/^(restauraci[oó]n|reforma|rehabilitaci[oó]n|proyecto|obras) de /i.test(nm)) continue; // obras, no sitios
    if (g === "patrimonio" && /^(distrito|district|barrio|quartier|bezirk|municipio|término|comarca|ensanche de|casco antiguo|centro hist)/i.test(nm)) continue; // zonas, no sitios
    if ([...seen.values()].some(o => norm(o.nm) === norm(nm))) continue; // mismo sitio con dos fichas (p.ej. "Alhambra" ×2)
    const m = /Point\(([-\d.]+) ([-\d.]+)\)/.exec(b.coord.value); if (!m) continue;
    seen.set(id, {
      id, nm, g, t: b.t.value.split("/").pop(), fame: +b.links.value,
      desc: b.dEs ? b.dEs.value : "",
      zona: b.admLabel && !/^Q\d+$/.test(b.admLabel.value) ? b.admLabel.value : "",
      c: [+(+m[2]).toFixed(6), +(+m[1]).toFixed(6)],
      img: b.img ? b.img.value.replace(/^http:/, "https:") + "?width=640" : "",
      src: "wikidata",
      lux: !!b.awl, ele: b.ele ? +b.ele.value : null, part: new Set(b.part ? [b.part.value.split("/").pop()] : []),
    });
  }
  return [...seen.values()].slice(0, G.lim);
}

// ---------- OpenStreetMap (complemento; si falla, se sigue sin él) ----------
async function overpass(geo) {
  const [la, lo] = geo.c, R = Math.round(geo.radius * 700);
  const A = `(around:${R},${la},${lo})`;
  const q = `[out:json][timeout:12][maxsize:20000000];(
    nwr["amenity"="nightclub"]["name"]${A};
    nwr["amenity"~"^(bar|pub)$"]["name"][!"brand"]${A};
    nwr["amenity"="cafe"]["name"][!"brand"]["opening_hours"]${A};
    nwr["amenity"="restaurant"]["name"][!"brand"]["website"]${A};
  );out center tags 600;`;
  for (const ep of OVERPASS) {
    const t0 = Date.now();
    try {
      const r = await fetch(ep, { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" }, signal: AbortSignal.timeout(9000) });
      if (!r.ok) { osmErr.push(`${ep.split("/")[2]} ${r.status} ${Date.now() - t0}ms`); continue; }
      const j = await r.json();
      return j.elements.filter(e => e.tags && e.tags.name && !CADENA.test(e.tags.name)).map(e => {
        const t = e.tags, c = e.center ? [e.center.lat, e.center.lon] : [e.lat, e.lon];
        const g = t.amenity === "nightclub" ? "noche" : t.amenity === "cafe" ? "cafe" : t.amenity === "restaurant" ? "comer" : "copas";
        return { id: "osm" + e.id, nm: t.name, g, t: t.amenity, c: [+(+c[0]).toFixed(6), +(+c[1]).toFixed(6)], cuisine: t.cuisine || "", web: !!(t.website || t["contact:website"]), hours: !!t.opening_hours, wd: t.wikidata || "", zona: t["addr:suburb"] || t["addr:district"] || "", src: "osm", fame: 0 };
      });
    } catch (e) { osmErr.push(`${ep.split("/")[2]} ${e.name} ${Date.now() - t0}ms`); }
  }
  return null;
}

// densidad: cuántos bares/discotecas hay a menos de 300 m (delata la zona de fiesta)
function vida(p, all) { let n = 0; for (const o of all) if (o !== p && hav(p.c, o.c) < 0.3) n++; return n; }

const TIPO = { // descripción corta cuando Wikidata no trae una en español
  noche: "Sala y club nocturno", patrimonio: "Monumento protegido", copas: "Bar", cafe: "Café", comer: "Restaurante", mercado: "Mercado", ver: "Lugar para visitar", vista: "Mirador",
};
const VISTA_TXT = { Q22698: "Parque", Q1107656: "Jardín", Q40080: "Playa", Q54050: "Colina con vistas", Q6017969: "Mirador" };
const COCINA = { spanish: "española", catalan: "catalana", tapas: "de tapas", italian: "italiana", pizza: "pizzería", japanese: "japonesa", sushi: "sushi", chinese: "china", mexican: "mexicana", indian: "india", french: "francesa", greek: "griega", turkish: "turca", lebanese: "libanesa", vietnamese: "vietnamita", thai: "tailandesa", korean: "coreana", seafood: "de marisco", regional: "local", portuguese: "portuguesa", german: "alemana", hungarian: "húngara", vegetarian: "vegetariana", vegan: "vegana", burger: "de hamburguesas", mediterranean: "mediterránea", basque: "vasca", galician: "gallega", argentinian: "argentina", peruvian: "peruana", american: "americana" };

function describe(p, city) {
  let d = p.desc ? capFirst(p.desc) : "";
  if (!d && p.cuisine) { const cs = p.cuisine.split(";").map(x => COCINA[x.trim()]).filter(Boolean); if (cs.length) d = `Cocina ${cs.slice(0, 2).join(" y ")}`; }
  if (!d) d = (p.g === "vista" && VISTA_TXT[p.t]) || TIPO[p.g] || "";
  if (p.zona && norm(p.zona) !== norm(city) && !/^(provincia|province|regi[oó]n|comunidad|condado|county|prefect|estado de)/i.test(p.zona) && !norm(d).includes(norm(p.zona))) d += ` · ${p.zona}`;
  if ((p.g === "copas" || p.g === "noche") && p.vida >= 6) d += `. Zona con mucha vida: ${p.vida} bares a menos de 300 m`;
  return d.length > 150 ? d.slice(0, 147) + "…" : d;
}

// categoría(s) del itinerario y moods de cada sitio
function toItems(p, city) {
  const base = { nm: p.nm, c: p.c, img: p.img || "", d: describe(p, city), q: p.nm, fame: p.fame || 0, src: p.src, kind: KIND[p.t] || "", zona: p.zona || "" };
  if (p.lux) base.lux = true;
  if (p.near && p.near.length) base.near = p.near.slice(0, 3);
  const out = [];
  const add = (cat, m) => out.push({ ...base, cat, m });
  switch (p.g) {
    case "noche":
      // los auditorios y salas de clásica no son para salir de fiesta: van a "visitar"
      if (CLASICA.test(p.nm + " " + (p.desc || "")) || (p.t === "Q1060829" && p.fame >= 12)) add("sight", ["cultural"]);
      else add("disco", ["fiesta"]);
      break;
    case "copas": add("copas", p.t === "Q30748895" || p.t === "Q1922416" ? ["fiesta", "romantico"] : ["fiesta", "gastro"]); break;
    case "cafe": add("desayuno", ["gastro", "relax"]); break;
    case "comer": add("comida", ["gastro"]); add("cena", ["gastro", "romantico"]); break;
    case "mercado": add("comida", ["gastro", "compras"]); add("compras", ["compras", "souvenir"]); add("souvenir", ["souvenir", "compras"]); break;
    case "ver": case "patrimonio": add("sight", ["cultural", "foto"]); if (p.t === "Q174782" || p.t === "Q12280" || p.t === "Q12518") add("foto", ["foto"]); break;
    case "vista":
      if (PARQUE.has(p.t)) { add("sight", ["relax", "aventura"]); if (CONVISTA.test(p.nm) || (p.ele != null && p.ele >= 60)) add("atardecer", ["relax", "romantico"]); }
      else if (p.t === "Q54050" && p.ele != null && p.ele < 50) add("sight", ["relax"]); // "colina" de 17 m en pleno casco antiguo: sin vistas
      else if (p.t === PLAYA) { add("sight", ["relax", "aventura"]); add("atardecer", ["romantico", "relax"]); }
      else { add("atardecer", ["romantico", "foto"]); add("foto", ["foto"]); }
      break;
  }
  return out;
}

// altitud en metros (ea) de cada sitio; si Open-Meteo no responde, los sitios se quedan sin ella (el plan no suma cuestas)
async function addElevation(items) {
  const uniq = new Map();
  items.forEach(i => { if (i.c) { const k = i.c[0].toFixed(4) + "," + i.c[1].toFixed(4); (uniq.get(k) || uniq.set(k, []).get(k)).push(i); } });
  const keys = [...uniq.keys()];
  let ok = true;
  for (let s = 0; s < keys.length; s += 100) {
    const B = keys.slice(s, s + 100).map(k => k.split(","));
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${B.map(x => x[0]).join(",")}&longitude=${B.map(x => x[1]).join(",")}`, { signal: AbortSignal.timeout(6000) });
      const j = await r.json();
      if (!j || !Array.isArray(j.elevation)) { ok = false; continue; }
      j.elevation.forEach((e, t) => { if (e != null && isFinite(e)) uniq.get(keys[s + t]).forEach(i => { i.ea = Math.round(e); }); });
    } catch (e) { ok = false; }
  }
  return ok;
}

module.exports = async (req, res) => {
  const city = String((req.query && req.query.city) || "").trim().slice(0, 80);
  if (!city) return res.status(400).json({ ok: false, reason: "no_city" });
  const t0 = Date.now();
  let geo;
  try { geo = await geocode(city); } catch (e) { return res.status(200).json({ ok: false, reason: "geocode" }); }
  if (!geo) { res.setHeader("Cache-Control", "public, s-maxage=86400"); return res.status(200).json({ ok: false, reason: "not_found" }); }

  // Wikidata con 4 consultas a la vez como máximo (su servidor admite 5 por IP), la lenta primero; OSM en paralelo
  // Overpass (OpenStreetMap) responde 406 o no responde desde hace meses: esperar sus 3 intentos costaba ~27 s
  // en cada ciudad. Queda desactivado salvo que se pida con OSM_OVERPASS=1.
  const osmP = process.env.OSM_OVERPASS === "1" ? overpass(geo) : Promise.resolve(null);
  const queue = ["comer", "patrimonio", "ver", "noche", "copas", "vista", "cafe", "mercado"], wd = [];
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (queue.length) { const g = queue.shift(); wd.push(...await wikidata(g, geo).catch(() => [])); }
  }));
  const osm = await osmP;
  // un mismo sitio puede salir en varios grupos (Park Güell: parque, museo y patrimonio): manda el grupo más concreto
  { const ids = new Set(wd.filter(p => p.g !== "patrimonio").map(p => p.id));
    for (let i = wd.length - 1; i >= 0; i--) if (wd[i].g === "patrimonio" && ids.has(wd[i].id)) wd.splice(i, 1); }

  // partes de un conjunto (el Partal y el Palacio de Carlos V están dentro de la Alhambra) y monumentos menores
  // pegados a uno mucho más famoso: no son otra parada, se ven de paso → se citan como "al lado"
  { const vis = wd.filter(p => p.g === "ver" || p.g === "patrimonio"); const byIdV = new Map(vis.map(p => [p.id, p]));
    const drop = new Set();
    for (const p of vis) {
      let host = [...(p.part || [])].map(id => byIdV.get(id)).find(h => h && h !== p && h.fame >= p.fame);
      if (!host) host = vis.find(h => h !== p && h.fame >= 40 && h.fame >= p.fame * 3 && hav(h.c, p.c) < 0.25);
      if (host && !drop.has(host.id)) { drop.add(p.id); (host.near = host.near || []).push(p.nm); }
    }
    for (let i = wd.length - 1; i >= 0; i--) if (drop.has(wd[i].id)) wd.splice(i, 1); }

  // fusión: OSM solo añade lo que Wikidata no tiene (mismo nombre o mismo wikidata)
  const byName = new Set(wd.map(p => norm(p.nm))), byId = new Set(wd.map(p => p.id));
  const extra = (osm || []).filter(p => !byName.has(norm(p.nm)) && !(p.wd && byId.has(p.wd)));
  const night = [...wd, ...extra].filter(p => p.g === "copas" || p.g === "noche");
  [...wd, ...extra].forEach(p => { if (p.g === "copas" || p.g === "noche") p.vida = vida(p, night); });
  // OSM sin fama: se ordena por señales (web, horario, cocina, vida alrededor)
  extra.forEach(p => { p.score = (p.web ? 1 : 0) + (p.hours ? .5 : 0) + (p.cuisine ? .3 : 0) + Math.min(p.vida || 0, 12) / 6; });
  const LIM = { noche: 14, copas: 16, cafe: 14, comer: 20 };
  const pickOsm = g => extra.filter(p => p.g === g).sort((a, b) => b.score - a.score).slice(0, LIM[g] || 0);
  const all = [...wd, ...["noche", "copas", "cafe", "comer"].flatMap(pickOsm)];
  // la zona de fiesta pesa en el orden de bares/clubes
  // para el atardecer pesan más un mirador, una colina o una playa que una plaza con árboles
  const VISTA = { Q6017969: 12, Q54050: 8, Q40080: 5 };
  all.forEach(p => { p.rank = (p.fame || 0) + (p.score || 0) + ((p.g === "copas" || p.g === "noche") ? Math.min(p.vida || 0, 15) / 5 : 0) + (p.g === "vista" ? (VISTA[p.t] || 0) : 0); });
  all.sort((a, b) => b.rank - a.rank);

  const items = all.flatMap(p => toItems(p, geo.name));
  // altitud de cada sitio (Open-Meteo, gratis y sin clave): para que el plan sepa qué trayectos son cuesta arriba
  const elevOk = await addElevation(items);
  const counts = {}; items.forEach(i => counts[i.cat] = (counts[i.cat] || 0) + 1);
  const good = (counts.sight || 0) >= 4 && elevOk;
  // ciudad con monumentos suficientes → 30 días en la CDN; si Wikidata falló, solo 6 h para reintentar pronto
  res.setHeader("Cache-Control", good ? "public, s-maxage=2592000, stale-while-revalidate=604800" : "public, s-maxage=21600, stale-while-revalidate=3600");
  return res.status(200).json({
    ok: items.length > 0, city: geo.name, country: geo.country, cc: geo.cc, c: geo.c,
    sources: { wikidata: wd.length, osm: osm ? extra.length : "sin respuesta", osmErr: osmErr.splice(0) }, counts, ms: Date.now() - t0,
    items,
  });
};
