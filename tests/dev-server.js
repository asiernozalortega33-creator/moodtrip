// Servidor local que imita Vercel: sirve explora-mood y ejecuta api/*.js con req.query y res.status().json()
const http = require("http"), fs = require("fs"), path = require("path"), url = require("url");
const ROOT = require("path").resolve(__dirname, "..");
const PORT = +process.argv[2] || 8766;
http.createServer(async (req, res) => {
  const u = url.parse(req.url, true);
  if (u.pathname.startsWith("/api/")) {
    const f = path.join(ROOT, u.pathname + ".js");
    if (!fs.existsSync(f)) { res.statusCode = 404; return res.end("no"); }
    delete require.cache[require.resolve(f)];
    const fn = require(f);
    const r2 = {
      setHeader: (k, v) => res.setHeader(k, v),
      status(c) { res.statusCode = c; return r2; },
      json(o) { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); console.log(new Date().toISOString().slice(11, 19), u.path.slice(0, 80), res.statusCode, o.ok, o.ms || ""); },
    };
    try { await fn({ query: u.query, headers: req.headers }, r2); } catch (e) { res.statusCode = 500; res.end(String(e)); console.log("ERROR", e); }
    return;
  }
  const f = path.join(ROOT, u.pathname === "/" ? "index.html" : u.pathname);
  if (!f.startsWith(path.normalize(ROOT)) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end("not found"); }
  res.setHeader("Content-Type", f.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream");
  fs.createReadStream(f).pipe(res);
}).listen(PORT, "127.0.0.1", () => console.log("dev en http://127.0.0.1:" + PORT));
