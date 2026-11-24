// Ejecuta las pruebas del motor dentro de la app real (Chrome sin ventana) y saca el resultado por consola.
//   cd tests && npm install && node run.js            → todas
//   node run.js perfiles-af.js                        → una
// Necesita Google Chrome instalado (o CHROME_PATH). En GitHub Actions (CI) arranca sin sandbox.
// Levanta el servidor local en el puerto 8799 (imita Vercel: sirve la app y ejecuta api/*.js).
// Las ciudades sin guía tiran de Wikidata: hace falta internet.
// Sale con código 1 si algo falla: errores de página, excepciones o una prueba que lo diga en su salida.
const { spawn } = require("child_process");
const path = require("path"), fs = require("fs");
const puppeteer = require("puppeteer-core");
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const files = process.argv.slice(2).length ? process.argv.slice(2) : ["humo-ciudades.js", "nombres-duplicados.js", "horarios-discotecas.js", "cuestas.js", "validacion.js", "edicion.js", "presupuesto.js", "perfiles-af.js"];
// una prueba falla si lo dice: líneas «>>» sin «todo bien»/«sin problemas», «MAL», errores o duplicados
function reportsFailure(txt) {
  return txt.split("\n").some(l => /^\s*>>/.test(l) && !/todo bien|sin problemas/.test(l))
    || /^MAL /m.test(txt) || /\b[1-9]\d* con error/.test(txt)
    || /duplicados: (?!ninguno)/.test(txt) || /sin coords: (?!ninguno)/.test(txt);
}
(async () => {
  const srv = spawn(process.execPath, [path.join(__dirname, "dev-server.js"), "8799"], { stdio: "ignore" });
  await new Promise(r => setTimeout(r, 800));
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", protocolTimeout: 900000, args: process.env.CI ? ["--no-sandbox", "--disable-dev-shm-usage"] : [] });
  let fail = 0;
  try {
    for (const f of files) {
      const p = await b.newPage(); const errs = [];
      p.on("pageerror", e => errs.push(e.message));
      await p.goto("http://127.0.0.1:8799/", { waitUntil: "domcontentloaded" }); await new Promise(r => setTimeout(r, 1200));
      const code = fs.readFileSync(path.join(__dirname, f), "utf8");
      const out = await p.evaluate(new Function("return (async()=>{" + code + "})()")).catch(e => (fail++, "ERROR: " + e.message));
      console.log(`\n======== ${f} ========\n${out}${errs.length ? "\nERRORES DE PÁGINA: " + errs.join(" | ") : ""}`);
      if (errs.length) fail++;
      if (reportsFailure(String(out))) { fail++; console.log("   ↑ FALLA"); }
      await p.close();
    }
  } finally { await b.close(); srv.kill(); }
  console.log(fail ? `\n${fail} prueba(s) con fallos` : "\nTodas las pruebas pasan");
  process.exit(fail ? 1 : 0);
})();
