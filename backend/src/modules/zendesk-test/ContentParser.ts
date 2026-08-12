/** ContentParser: normalized content from Zendesk without HTML/Markdown in frontend */

const HTML_RE = /<[a-z][\s\S]*?>/i;
const IMG_MD_RE = /!\[([^\]]*)\]\(([^)]+)\)/g;
const LINK_MD_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

interface InlineAttachment {
  id: string;
  nombre: string;
  url: string;
}

export interface ParsedComment {
  id: string;
  contenido: string;
  emisor: string;
  tipo: "cliente" | "agente" | "bot" | "sistema";
  timestamp: string;
  adjuntos: InlineAttachment[];
  bloques?: ContentBlock[];
}

export type ContentBlock =
  | { type: "text"; content: string }
  | { type: "image"; url: string; alt: string }
  | { type: "link"; url: string; text: string }
  | { type: "code"; content: string }
  | { type: "signature"; content: string }
  | { type: "disclaimer"; content: string }
  | { type: "history"; content: string; lineas: number };

function stripHTML(texto: string): string {
  if (!HTML_RE.test(texto)) return texto;
  const sinScript = texto.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  const sinStyle = sinScript.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  const sinTags = sinStyle.replace(/<[^>]+>/g, "");
  const sinEntidades = sinTags
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#\d+;/g, " ");
  return sinEntidades.replace(/\s+/g, " ").trim();
}

function extractInlineAttachments(texto: string): { textoLimpio: string; adjuntos: InlineAttachment[] } {
  const adjuntos: InlineAttachment[] = [];
  let idx = 0;
  const textoLimpio = texto.replace(IMG_MD_RE, (_match, alt, url) => {
    idx++;
    adjuntos.push({ id: `inline-${idx}`, nombre: alt || `imagen-${idx}`, url });
    return "";
  });
  return { textoLimpio: textoLimpio.trim(), adjuntos };
}

const DISCLAIMER_MARKERS = [
  /aviso\s*(legal|de\s*confidencialidad)/i,
  /confidencialidad/i, /privilegi[ae]d/i,
  /legal\s*(notice|disclaimer)/i,
  /this\s*(e-?mail|message).*(confidential|privileged)/i,
  /la\s*informaci[oó]n\s*(contenida|incluida).*(confidencial|privilegiada)/i,
  /nota\s*legal/i, /legales/i,
];

const HISTORY_MARKERS = [
  /^On\s+.+\s+wrote:/im, /^El\s+.+\s+escribi[oó]:/im,
  /^De:/im, /^Enviado:/im, /^Para:/im, /^Cc:/im,
  /^Sent:/im, /^From:/im, /^To:/im, /^Subject:/im,
  /^________________________________________/,
  /^------+\s*Original\s*Message\s*------+/im,
  /^------+\s*Mensaje\s*original\s*------+/im,
];

const SIGNATURE_MARKERS = [
  /^--\s*$/m, /^__\s*$/m, /^—+\s*$/m,
  /^Saludos[,\s]*$/im, /^Cordialmente[,\s]*$/im,
  /^Atentamente[,\s]*$/im, /^Best\s*regards[,\s]*$/im,
  /^Regards[,\s]*$/im, /^Quedo\s*atenta[,\s]*$/im,
  /^Muchas\s*gracias[,\s]*$/im, /^Gracias[,\s]*$/im,
];

function detectarDisclaimer(texto: string): { antes: string; disclaimer: string } | null {
  const lineas = texto.split("\n");
  for (let i = 0; i < lineas.length; i++) {
    for (const m of DISCLAIMER_MARKERS) { if (m.test(lineas[i])) return { antes: lineas.slice(0, i).join("\n"), disclaimer: lineas.slice(i).join("\n") }; }
  }
  return null;
}

function detectarHistorial(texto: string): { antes: string; historial: string; lineas: number } | null {
  const lineas = texto.split("\n");
  for (let i = 0; i < lineas.length; i++) {
    for (const m of HISTORY_MARKERS) { if (m.test(lineas[i])) return { antes: lineas.slice(0, i).join("\n"), historial: lineas.slice(i).join("\n"), lineas: lineas.length - i }; }
  }
  return null;
}

function detectarFirma(texto: string): { contenido: string; firma: string } | null {
  const lineas = texto.split("\n");
  for (let i = lineas.length - 1; i >= 0; i--) {
    for (const m of SIGNATURE_MARKERS) { if (m.test(lineas[i])) return { contenido: lineas.slice(0, i).join("\n"), firma: lineas.slice(i).join("\n") }; }
  }
  return null;
}

export function parseContent(raw: string): ContentBlock[] {
  let texto = stripHTML(raw);
  if (!texto.trim()) return [{ type: "text", content: raw || "" }];

  const disclaimer = detectarDisclaimer(texto);
  if (disclaimer) {
    const blocks = parsearTextoPlano(disclaimer.antes);
    blocks.push({ type: "disclaimer", content: disclaimer.disclaimer });
    return blocks;
  }

  return parsearTextoPlano(texto);
}

function parsearTextoPlano(texto: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const historia = detectarHistorial(texto);
  if (historia) {
    const firma = detectarFirma(historia.antes);
    if (firma) {
      if (firma.contenido.trim()) blocks.push(...parsearBloquesSimples(firma.contenido.trim()));
      blocks.push({ type: "signature", content: firma.firma });
    } else {
      if (historia.antes.trim()) blocks.push(...parsearBloquesSimples(historia.antes.trim()));
    }
    blocks.push({ type: "history", content: historia.historial, lineas: historia.lineas });
    return blocks;
  }
  const firma = detectarFirma(texto);
  if (firma) {
    if (firma.contenido.trim()) blocks.push(...parsearBloquesSimples(firma.contenido.trim()));
    blocks.push({ type: "signature", content: firma.firma });
    return blocks;
  }
  blocks.push(...parsearBloquesSimples(texto.trim()));
  return blocks;
}

function parsearBloquesSimples(texto: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const codeBlockRe = /```(\w*)\n([\s\S]*?)```/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  const items: { idx: number; end: number; block: ContentBlock }[] = [];

  while ((match = codeBlockRe.exec(texto)) !== null) {
    items.push({ idx: match.index, end: match.index + match[0].length, block: { type: "code", content: match[2] } });
  }
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  while ((match = linkRe.exec(texto)) !== null) {
    items.push({ idx: match.index, end: match.index + match[0].length, block: { type: "link", url: match[2], text: match[1] } });
  }
  items.sort((a, b) => a.idx - b.idx);

  for (const item of items) {
    if (item.idx > lastIdx) {
      const raw = texto.slice(lastIdx, item.idx);
      if (raw.trim()) blocks.push({ type: "text", content: raw });
    }
    blocks.push(item.block);
    lastIdx = item.end;
  }
  if (lastIdx < texto.length) {
    const rest = texto.slice(lastIdx).trim();
    if (rest) blocks.push({ type: "text", content: rest });
  }
  return blocks.length > 0 ? blocks : [{ type: "text", content: texto }];
}

/** Resolve CID references in HTML body using actual attachment URLs */
export function resolveCidImages(htmlBody: string, attachments: InlineAttachment[]): string {
  let result = htmlBody;
  for (const adj of attachments) {
    // Handle cid: references
    const cidPattern = new RegExp(`cid:${adj.nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, "gi");
    if (cidPattern.test(result)) {
      result = result.replace(cidPattern, adj.url);
    }
    // Handle Content-ID without cid: prefix
    const nameOnly = new RegExp(`src=["']${adj.nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, "gi");
    if (nameOnly.test(result)) {
      result = result.replace(nameOnly, `src="${adj.url}"`);
    }
  }
  return result;
}

/** Sanitize HTML — remove scripts/iframes but preserve tables, styles, images */
export function sanitizarHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[^>]*>[\s\S]*?<\/embed>/gi, "");
}

export function parseComment(body: string, adjuntosOriginales: InlineAttachment[], htmlBody?: string): { contenido: string; bloques: ContentBlock[]; adjuntos: InlineAttachment[]; html: string | null } {
  const { textoLimpio, adjuntos } = extractInlineAttachments(body);
  const todosAdjuntos = [...adjuntos, ...adjuntosOriginales];
  // Remove duplicate attachment names
  const seen = new Set<string>();
  const adjuntosUnicos = todosAdjuntos.filter((a) => { const k = a.url; if (seen.has(k)) return false; seen.add(k); return true; });

  const bloques = textoLimpio ? parseContent(textoLimpio) : [];

  // Process HTML body if present
  let html: string | null = null;
  if (htmlBody && htmlBody.trim()) {
    html = sanitizarHtml(resolveCidImages(htmlBody, adjuntosOriginales));
  }

  return { contenido: textoLimpio, bloques, adjuntos: adjuntosUnicos, html };
}
