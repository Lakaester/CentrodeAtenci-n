/*
  actualizar2.js - Solo paginas del frontend (Sla y ResumenEjecutivo).
  Guarda este archivo como  actualizar2.js  en la carpeta restaurant-bi
  y ejecuta en CMD:   node actualizar2.js
*/
var fs = require("fs");
var path = require("path");
var zlib = require("zlib");

var FILES = {};

FILES["frontend/src/pages/Sla.tsx"] = [
"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",
].join("");

FILES["frontend/src/pages/ResumenEjecutivo.tsx"] = [
"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",
].join("");

var n = 0;
for (var rel in FILES) {
  var buf = zlib.gunzipSync(Buffer.from(FILES[rel], "base64"));
  var full = path.join(process.cwd(), rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, buf);
  console.log("OK: " + rel);
  n++;
}
console.log("");
console.log("LISTO. Se actualizaron " + n + " archivos del frontend.");
console.log("Recarga el navegador y abre las pestanas Resumen y SLA.");