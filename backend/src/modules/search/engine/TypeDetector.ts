import type { SearchType, SearchQuery } from "../types";

const DOMAIN_RE = /^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d{7,15}$/;
const RUC_RE = /^\d{11}$/;
const TICKET_RE = /^#?\d+$/;
const LOCAL_ID_RE = /^LOC-/i;
const DEVICE_ID_RE = /^DEV-/i;

export class TypeDetector {
  detect(raw: string): SearchQuery {
    const s = raw.trim();
    let detectedType: SearchType = "unknown";

    if (DOMAIN_RE.test(s)) detectedType = "domain";
    else if (EMAIL_RE.test(s)) detectedType = "email";
    else if (RUC_RE.test(s)) detectedType = "ruc";
    else if (PHONE_RE.test(s)) detectedType = "phone";
    else if (TICKET_RE.test(s)) detectedType = "ticket";
    else if (LOCAL_ID_RE.test(s)) detectedType = "local_id";
    else if (DEVICE_ID_RE.test(s)) detectedType = "device_id";

    return { raw: s, detectedType, normalized: s.toLowerCase() };
  }
}
