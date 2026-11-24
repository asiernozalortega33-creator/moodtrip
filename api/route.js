// Ruta en transporte público entre dos paradas del plan, con línea, dirección, paradas y transbordos.
// Fuente: Transitous (planificador MOTIS con los horarios oficiales GTFS de cada operador).
//
// IMPORTANTE: Transitous solo admite proyectos de código abierto y no comerciales, con poco tráfico
// (menos de ~720 rutas al día), User-Agent con contacto y atribución visible a sus fuentes y a OpenStreetMap.
// Por eso está APAGADO salvo que se active con la variable de entorno TRANSIT_ROUTING=transitous.
// Sin ella responde {ok:false, reason:"disabled"} y la app sigue enlazando a Google Maps.
//   GET /api/route?flat=41.38&flon=2.18&tlat=41.40&tlon=2.17&t=2026-11-26T09:00Z  (hora en UTC)
// Nada se inventa: si Transitous no tiene datos de esa ciudad, se dice (reason:"no_route").

const MODE = { WALK: "andando", BUS: "bus", COACH: "autobús interurbano", TRAM: "tranvía", SUBWAY: "metro", METRO: "metro", RAIL: "tren", REGIONAL_RAIL: "tren regional", REGIONAL_FAST_RAIL: "tren regional", SUBURBAN: "cercanías", HIGHSPEED_RAIL: "tren de alta velocidad", LONG_DISTANCE: "tren", NIGHT_RAIL: "tren nocturno", FERRY: "ferry", FUNICULAR: "funicular", CABLE_CAR: "teleférico", AERIAL_LIFT: "teleférico", ODM: "transporte a demanda", OTHER: "transporte" };

function coord(a, b) { const la = +a, lo = +b; return isFinite(la) && isFinite(lo) && Math.abs(la) <= 90 && Math.abs(lo) <= 180 ? [la, lo] : null; }

module.exports = async (req, res) => {
  if (process.env.TRANSIT_ROUTING !== "transitous") return res.status(200).json({ ok: false, reason: "disabled" });
  const q = req.query || {};
  if (q.ping) return res.status(200).json({ ok: true });
  const f = coord(q.flat, q.flon), t = coord(q.tlat, q.tlon);
  if (!f || !t) return res.status(400).json({ ok: false, reason: "bad_coords" });
  // hora de salida en UTC (la calcula el navegador con el huso del país); se redondea a la hora para cachear
  let time = String(q.t || "").match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?Z$/) ? q.t : null;
  if (!time) { const d = new Date(Date.now() + 864e5); time = d.toISOString().slice(0, 11) + "09:00Z"; }
  const r4 = x => x.toFixed(4);
  const url = `https://api.transitous.org/api/v5/plan?fromPlace=${r4(f[0])},${r4(f[1])}&toPlace=${r4(t[0])},${r4(t[1])}&time=${encodeURIComponent(time.slice(0, 13) + ":00:00Z")}&numItineraries=3`;
  let j;
  try {
    const r = await fetch(url, { headers: { "User-Agent": `explora-mood/1.0 (${process.env.TRANSIT_CONTACT || "https://explora-mood.vercel.app"})` }, signal: AbortSignal.timeout(12000) });
    if (!r.ok) return res.status(200).json({ ok: false, reason: "upstream_" + r.status });
    j = await r.json();
  } catch (e) { return res.status(200).json({ ok: false, reason: "upstream_error" }); }
  const its = (j.itineraries || []).filter(it => (it.legs || []).some(l => l.mode !== "WALK"));
  const direct = (j.direct || [])[0];
  res.setHeader("Cache-Control", "public, s-maxage=604800, stale-while-revalidate=86400");
  if (!its.length) return res.status(200).json({ ok: false, reason: "no_route", walkMin: direct ? Math.round(direct.duration / 60) : null });
  const min = s => Math.max(1, Math.round((s || 0) / 60));
  // mejor la ruta con menos transbordos aunque tarde un poco más (4 min por transbordo)
  const out = its.sort((a, b) => (a.duration + 240 * (a.transfers || 0)) - (b.duration + 240 * (b.transfers || 0))).slice(0, 2).map(it => ({
    min: min(it.duration), transfers: it.transfers || 0,
    legs: it.legs.map(l => l.mode === "WALK"
      ? { walk: true, min: min(l.duration), to: l.to && l.to.name !== "END" ? l.to.name : null, m: Math.round(l.distance || 0) }
      : { mode: l.mode, modo: /metro|subway|u-bahn/i.test(l.agencyName || "") && /RAIL|SUBURBAN/.test(l.mode) ? "metro" : (MODE[l.mode] || "transporte"), line: l.routeShortName || l.routeLongName || "", head: l.headsign || "", from: l.from && l.from.name, to: l.to && l.to.name,
          stops: (l.intermediateStops || []).length + 1, min: min(l.duration), color: l.routeColor || "", agency: l.agencyName || "", realTime: !!l.realTime,
          dep: l.scheduledStartTime || l.startTime || null }),
  }));
  return res.status(200).json({ ok: true, time, walkMin: direct ? min(direct.duration) : null, routes: out, source: "Transitous (horarios GTFS oficiales)" });
};
