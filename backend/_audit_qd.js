const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({ log: [] });
async function main() {
  const q1 = await prisma.$queryRaw`SELECT id, numero, ticket_id, dominio, moneda, monto_pagado::text as mp, porcentaje::text as pct, monto_devuelto::text as md, resultado, estado, asesor, fecha_solicitud, created_at::text as cat, origen FROM qd_casos WHERE tipo = 'devolucion' AND eliminado = FALSE AND consolidado_en IS NULL ORDER BY created_at DESC`;
  console.log("===QUERY1===" + JSON.stringify(q1));
  const q2 = await prisma.$queryRaw`SELECT resultado, COUNT(*)::int as cantidad, SUM(CASE WHEN moneda = 'PEN' THEN monto_pagado::numeric ELSE 0 END)::text as sol_pen, SUM(CASE WHEN moneda = 'USD' THEN monto_pagado::numeric ELSE 0 END)::text as sol_usd, SUM(CASE WHEN moneda = 'PEN' AND resultado IN ('Procede 100%','Procede parcialmente') THEN monto_devuelto::numeric ELSE 0 END)::text as dev_pen, SUM(CASE WHEN moneda = 'USD' AND resultado IN ('Procede 100%','Procede parcialmente') THEN monto_devuelto::numeric ELSE 0 END)::text as dev_usd, SUM(CASE WHEN moneda = 'PEN' AND resultado = 'Pendiente' THEN monto_devuelto::numeric ELSE 0 END)::text as pend_pen, SUM(CASE WHEN moneda = 'USD' AND resultado = 'Pendiente' THEN monto_devuelto::numeric ELSE 0 END)::text as pend_usd FROM qd_casos WHERE tipo = 'devolucion' AND eliminado = FALSE AND consolidado_en IS NULL GROUP BY resultado ORDER BY cantidad DESC`;
  console.log("===QUERY2===" + JSON.stringify(q2));
  const q3 = await prisma.$queryRaw`SELECT COUNT(*)::int as total, SUM(CASE WHEN resultado IS NULL OR TRIM(resultado) = '' THEN 1 ELSE 0 END)::int as sin_resultado, SUM(CASE WHEN moneda IS NULL OR TRIM(moneda) = '' THEN 1 ELSE 0 END)::int as sin_moneda, SUM(CASE WHEN monto_pagado IS NULL THEN 1 ELSE 0 END)::int as sin_mp, SUM(CASE WHEN monto_devuelto IS NULL THEN 1 ELSE 0 END)::int as sin_md FROM qd_casos WHERE tipo = 'devolucion' AND eliminado = FALSE AND consolidado_en IS NULL`;
  console.log("===QUERY3===" + JSON.stringify(q3));
  const q4 = await prisma.$queryRaw`SELECT ticket_id, COUNT(*)::int as dupes FROM qd_casos WHERE tipo = 'devolucion' AND eliminado = FALSE AND consolidado_en IS NULL AND ticket_id IS NOT NULL GROUP BY ticket_id HAVING COUNT(*) > 1`;
  console.log("===QUERY4===" + JSON.stringify(q4));
  const q5 = await prisma.$queryRaw`SELECT id, numero, resultado, moneda, monto_pagado::text as mp, monto_devuelto::text as md FROM qd_casos WHERE tipo = 'devolucion' AND eliminado = FALSE AND consolidado_en IS NULL AND (resultado IS NULL OR resultado NOT IN ('No procede','Procede 100%','Procede parcialmente','Pendiente'))`;
  console.log("===QUERY5===" + JSON.stringify(q5));
  const q6 = await prisma.$queryRaw`SELECT moneda, SUM(monto_pagado::numeric)::text as total_sol, SUM(CASE WHEN resultado = 'No procede' THEN monto_pagado::numeric ELSE 0 END)::text as no_procede, SUM(CASE WHEN resultado IN ('Procede 100%','Procede parcialmente') THEN monto_devuelto::numeric ELSE 0 END)::text as devuelto, SUM(CASE WHEN resultado = 'Pendiente' THEN monto_devuelto::numeric ELSE 0 END)::text as pendiente FROM qd_casos WHERE tipo = 'devolucion' AND eliminado = FALSE AND consolidado_en IS NULL GROUP BY moneda ORDER BY moneda`;
  console.log("===QUERY6===" + JSON.stringify(q6));
  const q7 = await prisma.$queryRaw`SELECT id, numero, resultado, moneda, monto_pagado::text as mp, monto_devuelto::text as md FROM qd_casos WHERE tipo = 'devolucion' AND eliminado = FALSE AND consolidado_en IS NULL AND (monto_pagado IS NULL OR monto_pagado::text = '0')`;
  console.log("===QUERY7===" + JSON.stringify(q7));
  const q8 = await prisma.$queryRaw`SELECT id, numero, resultado, moneda, monto_pagado::text as mp, monto_devuelto::text as md, porcentaje::text as pct FROM qd_casos WHERE tipo = 'devolucion' AND eliminado = FALSE AND consolidado_en IS NULL AND resultado IN ('Procede 100%','Procede parcialmente') AND (monto_devuelto IS NULL OR monto_devuelto::text = '0')`;
  console.log("===QUERY8===" + JSON.stringify(q8));
  await prisma.$disconnect();
}
main().catch(e => { console.error(e.message); prisma.$disconnect(); process.exit(1); });
