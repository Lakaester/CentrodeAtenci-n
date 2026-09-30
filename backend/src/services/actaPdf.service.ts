// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfMake = require("pdfmake/build/pdfmake");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfFonts = require("pdfmake/build/vfs_fonts");
import * as fs from "fs";
import * as path from "path";
import type { TDocumentDefinitions, Content, TableCell, Column, DynamicContent } from "pdfmake/interfaces.js";
import type { AgendaRow } from "../repositories/agendas.repository";

// ── Register fonts via VFS ──
pdfMake.vfs = pdfFonts;

const LOGO_PATH = path.join(__dirname, "logo-restaurantpe.png");

// ── Logo as base64 ──
let LOGO_BASE64 = "";
try {
  const logoBuf = fs.readFileSync(LOGO_PATH);
  LOGO_BASE64 = `data:image/png;base64,${logoBuf.toString("base64")}`;
} catch { /* logo not found, use text fallback */ }

// ── Brand colors ──
const C = {
  blue: "#1A5276",
  blueDark: "#154360",
  blueLight: "#D4E6F1",
  bluePale: "#EBF5FB",
  orange: "#E67E22",
  orangeLight: "#FDEBD0",
  text: "#2C3E50",
  textLight: "#5D6D7E",
  muted: "#7F8C8D",
  border: "#BDC3C7",
  borderLight: "#E8E8E8",
  white: "#FFFFFF",
  bg: "#FAFBFC",
};

// ── Helpers ──
function fmtHora(v: string | null | undefined): string {
  if (!v) return "—";
  return v.substring(0, 5);
}

function fmtFecha(v: string | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v + "T00:00:00");
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtFechaCorta(v: string | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v + "T00:00:00");
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtDuracion(min: number | null | undefined): string {
  if (min == null) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}min` : `${m} min`;
}

function sectionHeader(text: string, num: number): Content {
  return {
    columns: [
      {
        text: `${num}.`,
        bold: true,
        fontSize: 10,
        color: C.white,
        width: 24,
        alignment: "center" as const,
      },
      {
        text: text.toUpperCase(),
        bold: true,
        fontSize: 10,
        color: C.white,
        width: "*",
      },
    ],
    columnGap: 0,
    margin: [0, 10, 0, 0] as [number, number, number, number],
    table: {
      widths: ["*"],
      body: [[{ text: "", border: [false, false, false, false] }]],
    },
    layout: {
      fillColor: () => C.blue,
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingTop: () => 4,
      paddingBottom: () => 4,
      paddingLeft: () => 8,
      paddingRight: () => 8,
    },
  } as any;
}

function fieldRow(label: string, value: string): Content {
  return [
    { text: `${label}`, bold: true, fontSize: 8, color: C.muted, width: 130 } as any,
    { text: value || "—", fontSize: 9, color: C.text, width: "*" } as any,
  ];
}

function bodyText(text: string): Content {
  return {
    text: text || "Sin información registrada",
    fontSize: 9,
    color: text ? C.text : C.muted,
    italics: !text,
    margin: [0, 2, 0, 6] as [number, number, number, number],
  };
}

// ── First-page header (institutional with wave) ──
function buildFirstPageHeader(_actaNumero: string): Content {
  const pageW = 595.28;
  const headerH = 90;
  const waveH = 20;

  // Canvas: blue background + darker top + white wave cutout at bottom
  // This is returned directly (not in a stack) to avoid pdfmake header bug
  return {
    canvas: [
      { type: "rect", x: 0, y: 0, w: pageW, h: headerH, color: C.blue },
      { type: "rect", x: 0, y: 0, w: pageW, h: headerH * 0.3, color: C.blueDark },
      {
        type: "polyline",
        lineWidth: 0,
        color: C.white,
        lineColor: C.white,
        points: [
          { x: 0, y: headerH },
          { x: 0, y: headerH - waveH + 6 },
          { x: pageW * 0.10, y: headerH - waveH },
          { x: pageW * 0.22, y: headerH - waveH + 14 },
          { x: pageW * 0.38, y: headerH - waveH - 2 },
          { x: pageW * 0.52, y: headerH - waveH + 10 },
          { x: pageW * 0.68, y: headerH - waveH + 3 },
          { x: pageW * 0.82, y: headerH - waveH + 8 },
          { x: pageW, y: headerH - waveH + 5 },
          { x: pageW, y: headerH },
          { x: 0, y: headerH },
        ],
      },
    ],
    margin: [0, 0, 0, 0] as [number, number, number, number],
  };
}

// ── Subsequent pages header (discreet) ──
function buildPageHeader(actaNumero: string): Content {
  return {
    margin: [0, 0, 0, 8] as [number, number, number, number],
    columns: [
      {
        text: "RESTAURANT.PE",
        fontSize: 7,
        bold: true,
        color: C.blue,
        width: "auto",
      },
      {
        text: `|  ${actaNumero}`,
        fontSize: 7,
        color: C.muted,
        width: "*",
      },
      {
        text: "ACTA DE ATENCIÓN",
        fontSize: 7,
        bold: true,
        color: C.blue,
        width: "auto",
        alignment: "right" as const,
      },
    ],
    columnGap: 6,
  };
}

// ── Footer ──
function buildFooter(agenda: AgendaRow, actaNumero: string, fechaGen: string) {
  return (currentPage: number, pageCount: number) => ({
    margin: [40, 8, 40, 16] as [number, number, number, number],
    columns: [
      {
        width: "*",
        stack: [
          {
            canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: C.border }],
            margin: [0, 0, 0, 4] as [number, number, number, number],
          },
          {
            columns: [
              {
                text: [
                  { text: `${agenda.ticket}`, fontSize: 7, bold: true, color: C.blue },
                  { text: `  |  ${actaNumero}  |  ${fechaGen}`, fontSize: 7, color: C.muted },
                ],
                width: "*",
              },
              {
                text: `Página ${currentPage} de ${pageCount}`,
                fontSize: 7,
                color: C.muted,
                width: "auto",
                alignment: "right" as const,
              },
            ],
            columnGap: 8,
          },
        ],
      },
    ],
  });
}

// ── Table layouts ──
const tableLayoutBlue = {
  fillColor: (rowIndex: number) => (rowIndex === 0 ? C.blue : rowIndex % 2 === 0 ? C.bluePale : C.white),
  hLineWidth: (i: number, node: any) => (i === 0 || i === 1 ? 1 : 0.5),
  vLineWidth: () => 0.5,
  hLineColor: () => C.border,
  vLineColor: () => C.borderLight,
  paddingTop: () => 4,
  paddingBottom: () => 4,
  paddingLeft: () => 6,
  paddingRight: () => 6,
};

const tableLayoutClean = {
  fillColor: () => C.white,
  hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length ? 1 : 0.5),
  vLineWidth: () => 0.5,
  hLineColor: () => C.border,
  vLineColor: () => C.borderLight,
  paddingTop: () => 4,
  paddingBottom: () => 4,
  paddingLeft: () => 6,
  paddingRight: () => 6,
};

const tableHeaderStyle = {
  fontSize: 8,
  bold: true,
  color: C.white,
  fillColor: C.blue,
};

// ── Main builder ──
export const actaPdfService = {
  async generarAsync(agenda: AgendaRow, contenido: any): Promise<Buffer> {
    const docDefinition = this._buildDocDef(agenda, contenido);
    const pdfDoc = pdfMake.createPdf(docDefinition);
    const buf = await pdfDoc.getBuffer();
    return Buffer.from(buf);
  },

  /** Sanitiza el identificador para uso en nombre de archivo (O5-B, O5-F1). */
  sanitizarNombre(valor: string): string {
    const limpio = String(valor ?? "").replace(/[^A-Za-z0-9._-]/g, "_");
    return limpio.slice(0, 64) || "acta";
  },

  /** Nombre de archivo del acta, derivado de un identificador saneado (no texto libre). */
  nombreArchivoActa(ticket: string): string {
    return `ACTA-${this.sanitizarNombre(ticket)}.pdf`;
  },

  _buildDocDef(agenda: AgendaRow, contenido: any): TDocumentDefinitions {
    const actaNumero = `ACTA-${agenda.ticket}`;
    const fechaGeneracion = new Date().toLocaleDateString("es-PE", {
      day: "2-digit", month: "long", year: "numeric",
    });
    const fechaCorta = new Date().toLocaleDateString("es-PE", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });

    const participantes = contenido?.participantes ?? [];
    const acuerdos = contenido?.acuerdos ?? [];
    const grabacionNum = agenda.grabacion_url ? 1 : 0;
    const sec = (n: number) => n + grabacionNum;

    // ── Build content sections ──
    const contentSections: Content[] = [];

    // Title block (after first-page header)
    contentSections.push(
      // Logo: absolute-positioned over the blue header area
      ...(LOGO_BASE64
        ? [{
            image: LOGO_BASE64,
            width: 130,
            height: 42,
            fit: [130, 42],
            absolutePosition: { x: 40, y: 18 },
          } as Content]
        : []),
      { text: "ACTA DE ATENCIÓN", fontSize: 18, bold: true, color: C.blueDark, alignment: "center", margin: [0, 16, 0, 4] as [number, number, number, number] },
      { text: actaNumero, fontSize: 13, color: C.orange, bold: true, alignment: "center", margin: [0, 0, 0, 14] as [number, number, number, number] },
    );

    // ── 1. DATOS DE LA ATENCIÓN ──
    contentSections.push(
      sectionHeader("DATOS DE LA ATENCIÓN", sec(1)),
      {
        table: {
          widths: [130, "*"],
          body: [
            [fieldRow("Ticket", agenda.ticket), fieldRow("Fecha", fmtFecha(String(agenda.fecha)))],
            [fieldRow("Tipo", agenda.tipo === "REUNION" ? "Reunión" : "Capacitación"), fieldRow("Asesor responsable", agenda.asesor_nombre)],
            [fieldRow("Cliente", agenda.cliente_nombre || "—"), fieldRow("Dominio", agenda.dominio || "—")],
            [fieldRow("Horario programado", `${fmtHora(agenda.hora_inicio)} – ${fmtHora(agenda.hora_fin)}`), fieldRow("Hora real de atención", agenda.hora_inicio_real ? `${fmtHora(agenda.hora_inicio_real)} – ${fmtHora(agenda.hora_fin_real)}` : "—")],
            [fieldRow("Duración real", fmtDuracion(agenda.duracion_real_min)), fieldRow("Resultado", agenda.resultado || "—")],
          ],
        },
        layout: tableLayoutClean,
        margin: [0, 4, 0, 6] as [number, number, number, number],
      },
    );

    // ── 2. GRABACIÓN (solo si existe) ──
    if (agenda.grabacion_url) {
      contentSections.push(
        sectionHeader("GRABACIÓN DE LA ATENCIÓN", sec(2)),
        {
          margin: [0, 4, 0, 6] as [number, number, number, number],
          columns: [
            { text: "URL de grabación: ", fontSize: 8, bold: true, color: C.muted, width: "auto" },
            { text: agenda.grabacion_url, fontSize: 9, color: C.blue, link: agenda.grabacion_url, decoration: "underline", width: "*" },
          ],
          columnGap: 4,
        },
      );
    }

    // ── PARTICIPANTES ──
    contentSections.push(
      sectionHeader("PARTICIPANTES", sec(2)),
      participantes.length > 0
        ? {
            table: {
              widths: ["25%", "25%", "25%", "25%"],
              headerRows: 1,
              body: [
                [
                  { text: "Nombre", ...tableHeaderStyle } as TableCell,
                  { text: "Empresa / Área", ...tableHeaderStyle } as TableCell,
                  { text: "Cargo / Rol", ...tableHeaderStyle } as TableCell,
                  { text: "Participación", ...tableHeaderStyle } as TableCell,
                ],
                ...participantes.map((p: any) => [
                  { text: p.nombre || "—", fontSize: 9 } as TableCell,
                  { text: p.empresa || "—", fontSize: 9 } as TableCell,
                  { text: p.cargo || "—", fontSize: 9 } as TableCell,
                  { text: p.participacion || "—", fontSize: 9 } as TableCell,
                ]),
              ],
            },
            layout: tableLayoutBlue,
            margin: [0, 4, 0, 6] as [number, number, number, number],
          }
        : { text: "Sin participantes registrados", fontSize: 9, color: C.muted, italics: true, margin: [0, 4, 0, 6] as [number, number, number, number] },
    );

    // ── MOTIVO DE LA ATENCIÓN ──
    contentSections.push(
      sectionHeader("MOTIVO DE LA ATENCIÓN", sec(3)),
      {
        margin: [0, 4, 0, 4] as [number, number, number, number],
        table: {
          widths: [130, "*"],
          body: [
            [fieldRow("Tipo de caso", contenido?.tipo_caso || "—"), fieldRow("Motivo", contenido?.motivo || "—")],
          ],
        },
        layout: tableLayoutClean,
      },
      spacer(6),
    );

    // ── DESARROLLO DE LA ATENCIÓN ──
    contentSections.push(
      sectionHeader("DESARROLLO DE LA ATENCIÓN", sec(4)),
      bodyText(contenido?.desarrollo),
    );

    // ── DIAGNÓSTICO Y GESTIÓN ──
    contentSections.push(
      sectionHeader("DIAGNÓSTICO Y GESTIÓN", sec(5)),
      {
        margin: [0, 4, 0, 4] as [number, number, number, number],
        table: {
          widths: [130, "*"],
          body: [
            [fieldRow("Diagnóstico / análisis", contenido?.diagnostico || "—"), fieldRow("Gestión realizada", contenido?.gestion || "—")],
            [fieldRow("Solución brindada", contenido?.solucion || "—"), { text: "", border: [false, false, false, false] } as TableCell],
          ],
        },
        layout: tableLayoutClean,
      },
      spacer(6),
    );

    // ── ACUERDOS Y COMPROMISOS ──
    contentSections.push(
      sectionHeader("ACUERDOS Y COMPROMISOS", sec(6)),
      acuerdos.length > 0
        ? {
            table: {
              widths: [24, "*", 100, 70, 70],
              headerRows: 1,
              body: [
                [
                  { text: "#", ...tableHeaderStyle, alignment: "center" as const } as TableCell,
                  { text: "Compromiso / acuerdo", ...tableHeaderStyle } as TableCell,
                  { text: "Responsable", ...tableHeaderStyle } as TableCell,
                  { text: "Fecha límite", ...tableHeaderStyle } as TableCell,
                  { text: "Estado", ...tableHeaderStyle } as TableCell,
                ],
                ...acuerdos.map((a: any, idx: number) => [
                  { text: String(idx + 1), fontSize: 9, alignment: "center" as const } as TableCell,
                  { text: a.descripcion || "—", fontSize: 9 } as TableCell,
                  { text: a.responsable || "—", fontSize: 9 } as TableCell,
                  { text: a.fecha_limite ? fmtFechaCorta(a.fecha_limite) : "—", fontSize: 9 } as TableCell,
                  { text: a.estado || "—", fontSize: 9 } as TableCell,
                ]),
              ],
            },
            layout: tableLayoutBlue,
            margin: [0, 4, 0, 6] as [number, number, number, number],
          }
        : { text: "Sin acuerdos registrados", fontSize: 9, color: C.muted, italics: true, margin: [0, 4, 0, 6] as [number, number, number, number] },
    );

    // ── RESULTADO Y SEGUIMIENTO ──
    contentSections.push(
      sectionHeader("RESULTADO Y SEGUIMIENTO", sec(7)),
      {
        margin: [0, 4, 0, 4] as [number, number, number, number],
        table: {
          widths: [130, "*"],
          body: [
            [fieldRow("Resultado", contenido?.resultado_acta || "—"), fieldRow("Requiere seguimiento", contenido?.requiere_seguimiento ? "Sí" : "No")],
            ...(contenido?.requiere_seguimiento
              ? [
                  [fieldRow("Fecha estimada", contenido?.seguimiento_fecha ? fmtFechaCorta(contenido.seguimiento_fecha) : "—"), { text: "", border: [false, false, false, false] } as TableCell],
                  [fieldRow("Detalle del seguimiento", contenido?.seguimiento_detalle || "—"), { text: "", border: [false, false, false, false] } as TableCell],
                ]
              : []),
          ],
        },
        layout: tableLayoutClean,
      },
      spacer(6),
    );

    // ── OBSERVACIONES FINALES ──
    contentSections.push(
      sectionHeader("OBSERVACIONES FINALES", sec(8)),
      bodyText(contenido?.observaciones),
    );

    // ── Build document ──
    return {
      defaultStyle: {
        font: "Roboto",
        fontSize: 9,
        color: C.text,
      },
      pageMargins: [40, 80, 40, 70] as [number, number, number, number],

      // First-page header (big blue bar)
      header: (currentPage: number) => {
        if (currentPage === 1) {
          return buildFirstPageHeader(actaNumero);
        }
        return {
          margin: [40, 16, 40, 0] as [number, number, number, number],
          stack: [
            buildPageHeader(actaNumero),
            {
              canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: C.blue }],
            },
          ],
        };
      },

      // Footer on all pages
      footer: buildFooter(agenda, actaNumero, fechaCorta) as DynamicContent,

      content: contentSections,

      styles: {
        default: {
          fontSize: 9,
          color: C.text,
        },
      },
    };
  },

  getStorageDir(): string {
    const dir = process.env.ACTA_STORAGE_PATH || path.join(__dirname, "../../storage/actas");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  },

  getFilePath(ticket: string): string {
    return path.join(this.getStorageDir(), this.nombreArchivoActa(ticket));
  },

  guardarPdf(ticket: string, buffer: Buffer): { filePath: string; tamano: number } {
    const filePath = this.getFilePath(ticket);
    fs.writeFileSync(filePath, buffer);
    return { filePath, tamano: buffer.length };
  },

  existeActa(ticket: string): boolean {
    return fs.existsSync(this.getFilePath(ticket));
  },

  /** Elimina el PDF del acta (compensación ante fallo de persistencia DB). Devuelve resultado. */
  eliminarPdf(ticket: string): { ok: boolean; error?: string } {
    const filePath = this.getFilePath(ticket);
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  },

  getBuffer(ticket: string): Buffer | null {
    const filePath = this.getFilePath(ticket);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath);
  },
};

function spacer(height = 6): Content {
  return { text: "", margin: [0, height, 0, 0] as [number, number, number, number] };
}
