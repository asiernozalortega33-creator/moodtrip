// Estado de vuelo en vivo via AeroDataBox (RapidAPI).
// Necesita la variable de entorno AERODATABOX_KEY (o FLIGHT_API_KEY) en Vercel.
// Sin clave responde {ok:false, reason:"no_key"} y el front lo gestiona (horas a mano).
module.exports = async (req, res) => {
  const q = req.query || {};
  const n = String(q.n || "").replace(/\s+/g, "").toUpperCase();
  const date = String(q.date || "");
  const key = process.env.AERODATABOX_KEY || process.env.FLIGHT_API_KEY;

  if (!key) return res.status(200).json({ ok: false, reason: "no_key" });
  if (!n) return res.status(400).json({ ok: false, reason: "no_flight" });

  try {
    const path = date
      ? `/flights/number/${encodeURIComponent(n)}/${encodeURIComponent(date)}`
      : `/flights/number/${encodeURIComponent(n)}`;
    const r = await fetch(`https://aerodatabox.p.rapidapi.com${path}`, {
      headers: {
        "X-RapidAPI-Key": key,
        "X-RapidAPI-Host": "aerodatabox.p.rapidapi.com",
      },
    });
    if (!r.ok) return res.status(200).json({ ok: false, reason: "api_" + r.status });

    const data = await r.json();
    const arr = Array.isArray(data) ? data : (data.departures || data.arrivals || []);
    if (!arr || !arr.length) return res.status(200).json({ ok: false, reason: "not_found" });

    let flights = arr.map((f) => ({
      number: f.number || n,
      status: f.status || null,
      dep: legInfo(f.departure),
      arr: legInfo(f.arrival),
    }));

    // los nº de vuelo se repiten a diario (y a veces en rutas distintas): si hay fecha, quédate con la de ese día
    if (date) {
      const match = flights.filter((f) => (f.dep && f.dep.date === date) || (f.arr && f.arr.date === date));
      if (match.length) flights = match;
    }

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ ok: true, flights, hadDate: !!date });
  } catch (e) {
    return res.status(200).json({ ok: false, reason: "error" });
  }
};

function legInfo(leg) {
  if (!leg) return { airport: null, iata: null, time: null, date: null, terminal: null };
  const ap = leg.airport || {};
  const st =
    (leg.scheduledTime && (leg.scheduledTime.local || leg.scheduledTime.utc)) ||
    (leg.revisedTime && (leg.revisedTime.local || leg.revisedTime.utc)) ||
    "";
  let time = null, date = null;
  const m = String(st).match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
  if (m) { date = m[1]; time = m[2]; }
  const loc = ap.location || {};
  return {
    airport: ap.name || ap.shortName || null,
    iata: ap.iata || ap.icao || null,
    city: ap.municipalityName || ap.shortName || null,
    country: ap.countryCode || null,
    lat: typeof loc.lat === "number" ? loc.lat : null,
    lon: typeof loc.lon === "number" ? loc.lon : null,
    time, date,
    terminal: leg.terminal || null,
  };
}
