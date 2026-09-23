import http from "http";

function post(path: string, body: any, port = 5173): Promise<{status: number; data: string; headers: any}> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({hostname:"localhost", port, path, method:"POST",
      headers:{"Content-Type":"application/json","Content-Length":Buffer.byteLength(data)}}, (res) => {
      let buf = "";
      res.on("data", (c: any) => buf += c);
      res.on("end", () => resolve({status: res.statusCode!, data: buf, headers: res.headers}));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function get(path: string, cookie?: string, port = 5173): Promise<{status: number; data: string}> {
  return new Promise((resolve, reject) => {
    const headers: any = {};
    if (cookie) headers.Cookie = cookie;
    const req = http.request({hostname:"localhost", port, path, method:"GET", headers}, (res) => {
      let buf = "";
      res.on("data", (c: any) => buf += c);
      res.on("end", () => resolve({status: res.statusCode!, data: buf}));
    });
    req.on("error", reject);
    req.end();
  });
}

async function main() {
  console.log("=== PROXY TEST (port 5173) ===\n");
  
  const h = await get("/api/health");
  console.log("/api/health:", h.status, h.data.substring(0, 80));

  const login = await post("/api/auth/login", {email:"admin@restaurant.pe", password:"cambia-me-por-favor-123"});
  const lb = JSON.parse(login.data);
  console.log("/api/auth/login:", login.status, lb.ok ? "OK" : lb.error);

  if (lb.ok) {
    const cookie = login.headers["set-cookie"]?.map((c: string) => c.split(";")[0]).join("; ");
    const me = await get("/api/auth/me", cookie);
    console.log("/api/auth/me:", me.status, JSON.parse(me.data).ok ? "OK" : "FAIL");

    const dev = await get("/api/quejas-devoluciones/devoluciones", cookie);
    console.log("/api/qd/devoluciones:", dev.status, "casos:", JSON.parse(dev.data).data?.length);

    const qj = await get("/api/quejas-devoluciones/quejas", cookie);
    console.log("/api/qd/quejas:", qj.status, "casos:", JSON.parse(qj.data).data?.length);

    const est = await get("/api/quejas-devoluciones/catalogo/estados", cookie);
    console.log("/api/qd/catalogo/estados:", est.status);
    const res = await get("/api/quejas-devoluciones/catalogo/resultados", cookie);
    console.log("/api/qd/catalogo/resultados:", res.status);
    const ar = await get("/api/quejas-devoluciones/catalogo/areas", cookie);
    console.log("/api/qd/catalogo/areas:", ar.status);
    const pr = await get("/api/quejas-devoluciones/catalogo/productos", cookie);
    console.log("/api/qd/catalogo/productos:", pr.status);
    const tq = await get("/api/quejas-devoluciones/catalogo/tipos-queja", cookie);
    console.log("/api/qd/catalogo/tipos-queja:", tq.status);
    const dm = await get("/api/quejas-devoluciones/catalogo/dominios", cookie);
    console.log("/api/qd/catalogo/dominios:", dm.status);
  }

  console.log("\n=== TODOS LOS ENDPOINTS VERIFICADOS ===");
}
main().catch(e => console.error(e));
