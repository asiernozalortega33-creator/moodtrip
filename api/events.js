// Conciertos y eventos reales en la ciudad y fechas del viaje (Ticketmaster Discovery API, gratis: 5.000 consultas/día).
// Necesita la variable de entorno TICKETMASTER_KEY en Vercel. Sin clave responde {ok:false, reason:"no_key"}
// y el front no muestra la sección.
// GET /api/events?lat=41.38&lon=2.17&from=2026-11-20&to=2026-11-23
module.exports = async (req, res) => {
  const q = req.query || {};
  const key = process.env.TICKETMASTER_KEY;
  if (!key) return res.status(200).json({ ok: false, reason: "no_key" });
  const lat = +q.lat, lon = +q.lon;
  if (!isFinite(lat) || !isFinite(lon)) return res.status(400).json({ ok: false, reason: "no_coords" });
  const day = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || "")) ? String(s) : null;
  const today = new Date().toISOString().slice(0, 10);
  let from = day(q.from) || today;
  if (from < today) from = today;
  let to = day(q.to) || new Date(Date.parse(from) + 6 * 864e5).toISOString().slice(0, 10);
  if (to < from) to = from;
  const p = new URLSearchParams({
    apikey: key, latlong: `${lat.toFixed(4)},${lon.toFixed(4)}`, radius: "20", unit: "km",
    startDateTime: `${from}T00:00:00Z`, endDateTime: `${to}T23:59:59Z`,
    classificationName: q.kind === "all" ? "" : "music", sort: "date,asc", size: "60", locale: "*",
  });
  if (!p.get("classificationName")) p.delete("classificationName");
  try {
    const r = await fetch("https://app.ticketmaster.com/discovery/v2/events.json?" + p, { signal: AbortSignal.timeout(12000) });
    if (!r.ok) return res.status(200).json({ ok: false, reason: "api_" + r.status });
    const j = await r.json();
    const seen = new Set();
    const events = ((j._embedded && j._embedded.events) || []).map(e => {
      const v = (e._embedded && e._embedded.venues && e._embedded.venues[0]) || {};
      const cl = (e.classifications && e.classifications[0]) || {};
      const img = (e.images || []).filter(i => i.ratio === "16_9" && i.width >= 400).sort((a, b) => a.width - b.width)[0];
      const loc = v.location ? [+v.location.latitude, +v.location.longitude] : null;
      return {
        name: e.name, date: e.dates && e.dates.start && e.dates.start.localDate,
        time: e.dates && e.dates.start && e.dates.start.localTime ? e.dates.start.localTime.slice(0, 5) : "",
        venue: v.name || "", c: loc && isFinite(loc[0]) ? loc : null,
        genre: (cl.genre && cl.genre.name !== "Undefined" && cl.genre.name) || (cl.segment && cl.segment.name) || "",
        url: e.url || "", img: img ? img.url : "",
        price: e.priceRanges && e.priceRanges[0] ? { min: e.priceRanges[0].min, max: e.priceRanges[0].max, cur: e.priceRanges[0].currency } : null,
      };
    }).filter(e => {
      // Ticketmaster repite el mismo concierto por tipo de entrada: uno por nombre+fecha+sala
      const k = `${e.name}|${e.date}|${e.venue}`;
      if (!e.date || seen.has(k)) return false;
      seen.add(k); return true;
    });
    res.setHeader("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=3600"); // 6 h: las fechas cambian poco
    return res.status(200).json({ ok: true, from, to, events });
  } catch (e) {
    return res.status(200).json({ ok: false, reason: "error" });
  }
};
