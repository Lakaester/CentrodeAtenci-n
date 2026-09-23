import http from "http";

function post(path: string, body: any): Promise<{ status: number; data: string; headers: any }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: "localhost", port: 4000, path, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
    }, (res) => {
      let buf = "";
      res.on("data", (chunk) => buf += chunk);
      res.on("end", () => resolve({ status: res.statusCode!, data: buf, headers: res.headers }));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function get(path: string, cookie?: string): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const headers: any = {};
    if (cookie) headers.Cookie = cookie;
    const req = http.request({ hostname: "localhost", port: 4000, path, method: "GET", headers }, (res) => {
      let buf = "";
      res.on("data", (chunk) => buf += chunk);
      res.on("end", () => resolve({ status: res.statusCode!, data: buf }));
    });
    req.on("error", reject);
    req.end();
  });
}

async function main() {
  console.log("=== TEST 1: /api/health ===");
  const health = await get("/api/health");
  console.log(`  Status: ${health.status} | ${health.data}`);

  console.log("\n=== TEST 2: Login admin ===");
  const login = await post("/api/auth/login", { email: "admin@restaurant.pe", password: "cambia-me-por-favor-123" });
  console.log(`  Status: ${login.status}`);
  const loginBody = JSON.parse(login.data);
  if (loginBody.ok) {
    console.log(`  OK: ${loginBody.data.nombre} (${loginBody.data.correo})`);
    const setCookie = login.headers["set-cookie"];
    if (setCookie) {
      const cookieStr = setCookie.map((c: string) => c.split(";")[0]).join("; ");
      console.log(`  Cookie: ${cookieStr.substring(0, 60)}...`);

      console.log("\n=== TEST 3: /api/auth/me ===");
      const me = await get("/api/auth/me", cookieStr);
      console.log(`  Status: ${me.status}`);
      const meBody = JSON.parse(me.data);
      if (meBody.ok) console.log(`  User: ${meBody.data.nombre} (${meBody.data.correo})`);
      else console.log(`  Error: ${meBody.error}`);

      console.log("\n=== TEST 4: /api/quejas-devoluciones/devoluciones ===");
      const qd = await get("/api/quejas-devoluciones/devoluciones", cookieStr);
      console.log(`  Status: ${qd.status}`);
      const qdBody = JSON.parse(qd.data);
      if (qdBody.ok) console.log(`  Casos: ${qdBody.data.length}`);
      else console.log(`  Error: ${qdBody.error}`);

      console.log("\n=== TEST 5: /api/quejas-devoluciones/quejas ===");
      const qj = await get("/api/quejas-devoluciones/quejas", cookieStr);
      console.log(`  Status: ${qj.status}`);
      const qjBody = JSON.parse(qj.data);
      if (qjBody.ok) console.log(`  Casos: ${qjBody.data.length}`);
      else console.log(`  Error: ${qjBody.error}`);

      console.log("\n=== TEST 6: /api/quejas-devoluciones/catalogo/estados ===");
      const est = await get("/api/quejas-devoluciones/catalogo/estados", cookieStr);
      console.log(`  Status: ${est.status}`);
      const estBody = JSON.parse(est.data);
      if (estBody.ok) console.log(`  Estados: ${estBody.data.length}`);
      else console.log(`  Error: ${estBody.error}`);

      console.log("\n=== TEST 7: /api/quejas-devoluciones/catalogo/resultados ===");
      const res = await get("/api/quejas-devoluciones/catalogo/resultados", cookieStr);
      console.log(`  Status: ${res.status}`);

      console.log("\n=== TEST 8: /api/quejas-devoluciones/catalogo/areas ===");
      const ar = await get("/api/quejas-devoluciones/catalogo/areas", cookieStr);
      console.log(`  Status: ${ar.status}`);

      console.log("\n=== TEST 9: /api/quejas-devoluciones/catalogo/productos ===");
      const pr = await get("/api/quejas-devoluciones/catalogo/productos", cookieStr);
      console.log(`  Status: ${pr.status}`);

      console.log("\n=== TEST 10: /api/quejas-devoluciones/catalogo/tipos-queja ===");
      const tq = await get("/api/quejas-devoluciones/catalogo/tipos-queja", cookieStr);
      console.log(`  Status: ${tq.status}`);

      console.log("\n=== TEST 11: /api/quejas-devoluciones/catalogo/dominios ===");
      const dm = await get("/api/quejas-devoluciones/catalogo/dominios", cookieStr);
      console.log(`  Status: ${dm.status}`);
    }
  } else {
    console.log(`  Error: ${loginBody.error}`);
  }
}
main().catch(e => console.error("FATAL:", e.message));
