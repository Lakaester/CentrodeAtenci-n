import http from "http";

function post(path: string, body: any): Promise<{status: number; data: string; headers: any}> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({hostname:"localhost", port:4000, path, method:"POST",
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

function get(path: string, cookie?: string): Promise<{status: number; data: string}> {
  return new Promise((resolve, reject) => {
    const headers: any = {};
    if (cookie) headers.Cookie = cookie;
    const req = http.request({hostname:"localhost", port:4000, path, method:"GET", headers}, (res) => {
      let buf = "";
      res.on("data", (c: any) => buf += c);
      res.on("end", () => resolve({status: res.statusCode!, data: buf}));
    });
    req.on("error", reject);
    req.end();
  });
}

async function main() {
  // Login
  const login = await post("/api/auth/login", {email:"admin@restaurant.pe", password:"cambia-me-por-favor-123"});
  const lb = JSON.parse(login.data);
  if (!lb.ok) { console.error("Login failed:", lb.error); return; }
  const cookie = login.headers["set-cookie"]?.map((c: string) => c.split(";")[0]).join("; ");
  console.log("Login OK\n");

  // Get all agendas
  const agendas = await get("/api/gestion/agendas", cookie);
  console.log("=== /api/gestion/agendas STATUS:", agendas.status, "===");
  const agendasBody = JSON.parse(agendas.data);
  if (!agendasBody.ok) { console.error("Agendas failed:", agendasBody.error); return; }
  console.log("Total agendas:", agendasBody.data.length);

  // Find AGD-000016
  const ag16 = agendasBody.data.find((a: any) => a.ticket === "AGD-000016");
  if (!ag16) {
    console.log("\nAGD-000016 NOT FOUND in API response!");
    // Show all tickets
    console.log("Available tickets:", agendasBody.data.map((a: any) => a.ticket).sort().join(", "));
  } else {
    console.log("\n=== AGD-000016 FROM API ===");
    console.log("id:", ag16.id);
    console.log("ticket:", ag16.ticket);
    console.log("tipo:", ag16.tipo);
    console.log("asesor_nombre:", ag16.asesor_nombre);
    console.log("fecha:", ag16.fecha);
    console.log("hora_inicio:", ag16.hora_inicio);
    console.log("hora_fin:", ag16.hora_fin);
    console.log("estado:", ag16.estado);
    console.log("");
    console.log("--- CAMPOS GOOGLE CALENDAR (API) ---");
    console.log("calendar_event_id:", JSON.stringify(ag16.calendar_event_id));
    console.log("calendar_sync_status:", JSON.stringify(ag16.calendar_sync_status));
    console.log("calendar_sync_error:", JSON.stringify(ag16.calendar_sync_error));
    console.log("calendar_html_link:", JSON.stringify(ag16.calendar_html_link));
    console.log("calendar_meet_link:", JSON.stringify(ag16.calendar_meet_link));
    console.log("");
    console.log("ALL KEYS:", Object.keys(ag16).join(", "));
  }

  // Also check the detail endpoint
  if (ag16) {
    const detail = await get(`/api/gestion/agendas/${ag16.id}`, cookie);
    console.log("\n=== DETAIL ENDPOINT STATUS:", detail.status, "===");
    const detailBody = JSON.parse(detail.data);
    if (detailBody.ok) {
      const d = detailBody.data;
      console.log("calendar_event_id:", JSON.stringify(d.calendar_event_id));
      console.log("calendar_sync_status:", JSON.stringify(d.calendar_sync_status));
      console.log("calendar_html_link:", JSON.stringify(d.calendar_html_link));
      console.log("calendar_meet_link:", JSON.stringify(d.calendar_meet_link));
    }
  }
}
main().catch(e => console.error(e));
