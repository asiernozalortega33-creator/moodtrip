// Ejecuta las pruebas del motor dentro de la app real (Chrome sin ventana) y saca el resultado por consola.
//   cd tests && npm install && node run.js            → todas
//   node run.js perfiles-af.js                        → una
// Necesita Google Chrome instalado (o CHROME_PATH). Levanta el servidor local en el puerto 8799
// (imita Vercel: sirve index.html y ejecuta api/*.js). Las ciudades sin guía tiran de Wikidata: hace falta internet.
const { spawn } = require("child_process");
const path = require("path"), fs = require("fs");
const puppeteer = require("puppeteer-core");
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const files = process.argv.slice(2).length ? process.argv.slice(2) : ["humo-ciudades.js", "nombres-duplicados.js", "horarios-discotecas.js", "cuestas.js", "perfiles-af.js"];
(async () => {
  const srv = spawn(process.execPath, [path.join(__dirname, "dev-server.js"), "8799"], { stdio: "ignore" });
  await new Promise(r => setTimeout(r, 800));
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", protocolTimeout: 900000 });
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
      await p.close();
    }
  } finally { await b.close(); srv.kill(); }
  process.exit(fail ? 1 : 0);
})();
