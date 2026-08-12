import { describe, it, expect } from "vitest";
import {
  resolveCountryFromPhone,
  resolveCountryFromDomain,
  resolveCountry,
  normalizeCountryName,
  CANONICAL_RD,
} from "../CountryResolver";

/* ================================================================
   resolveCountryFromPhone — 24 validaciones
   ================================================================ */

describe("resolveCountryFromPhone", () => {
  const cases: [string, string | null, string?][] = [
    // Prefijos estandar
    ["+51987654321", "PERU"],
    ["+525512345678", "MEXICO"],
    ["+56912345678", "CHILE"],
    ["+573001112233", "COLOMBIA"],
    ["+50255555555", "GUATEMALA"],
    ["+50377777777", "EL SALVADOR"],
    ["+50499999999", "HONDURAS"],
    ["+50588888888", "NICARAGUA"],
    ["+50688888888", "COSTA RICA"],
    ["+50760000000", "PANAMA"],
    ["+50930000000", "HAITI"],
    ["+59399999999", "ECUADOR"],
    ["+595981111111", "PARAGUAY"],
    ["+59894111111", "URUGUAY"],
    ["+59170000000", "BOLIVIA"],
    ["+5491111111111", "ARGENTINA"],
    ["+584121111111", "VENEZUELA"],

    // NANP overrides (Republica Dominicana)
    ["+18095551234", "REPUBLICA DOMINICANA", "+1809 → RD"],
    ["+18295551234", "REPUBLICA DOMINICANA", "+1829 → RD"],
    ["+18495551234", "REPUBLICA DOMINICANA", "+1849 → RD"],

    // NANP fallback → United States
    ["+13055551234", "UNITED STATES", "+1305 → USA"],
    ["+12125551234", "UNITED STATES", "+1212 → USA"],
    ["+17025551234", "UNITED STATES", "+1702 → USA"],

    // Casos borde
    ["+44012345678", null, "UK no esta en la tabla"],
    ["abc", null, "sin prefijo"],
    ["", null, "vacio"],
    ["  +51987654321  ", "PERU", "con espacios → trim"],
  ];

  for (const [phone, expected, label] of cases) {
    const desc = label ?? `"${phone}" → ${expected ?? "null"}`;
    it(desc, () => {
      const result = resolveCountryFromPhone(phone as string);
      if (expected === null) {
        expect(result).toBeNull();
      } else {
        expect(result).not.toBeNull();
        expect(result!.country).toBe(expected);
        expect(result!.source).toBe("PHONE_PREFIX");
      }
    });
  }
});

/* ================================================================
   resolveCountryFromDomain — 8 validaciones
   ================================================================ */

describe("resolveCountryFromDomain", () => {
  const cases: [string, string | null, string?][] = [
    ["restaurant.pe", "PERU"],
    ["cliente.com.do", "REPUBLICA DOMINICANA"],
    ["negocio.do", "REPUBLICA DOMINICANA"],
    ["empresa.com.mx", "MEXICO"],
    ["tienda.com.co", "COLOMBIA"],
    ["unknown.io", null, "TLD no conocido"],
    ["", null, "vacio"],
  ];

  for (const [domain, expected, label] of cases) {
    const desc = label ?? `"${domain}" → ${expected ?? "null"}`;
    it(desc, () => {
      const result = resolveCountryFromDomain(domain);
      if (expected === null) {
        expect(result).toBeNull();
      } else {
        expect(result).not.toBeNull();
        expect(result!.country).toBe(expected);
        expect(result!.source).toBe("DOMAIN");
      }
    });
  }
});

/* ================================================================
   resolveCountry — Cadena de prioridad
   ================================================================ */

describe("resolveCountry (priority chain)", () => {
  it("P1: customerCountry gana sobre todo", () => {
    const r = resolveCountry({
      customerCountry: "PERU",
      organizationCountry: "COLOMBIA",
      domain: "restaurant.com.mx",
      phone: "+56912345678",
    });
    expect(r!.country).toBe("PERU");
    expect(r!.source).toBe("CLIENT");
  });

  it("P2: organizationCountry si no hay customerCountry", () => {
    const r = resolveCountry({
      customerCountry: null,
      organizationCountry: "COLOMBIA",
      phone: "+51987654321",
    });
    expect(r!.country).toBe("COLOMBIA");
    expect(r!.source).toBe("ORGANIZATION");
  });

  it("P3: licenseCountry si no hay los anteriores", () => {
    const r = resolveCountry({
      licenseCountry: "MEXICO",
      phone: "+51987654321",
    });
    expect(r!.country).toBe("MEXICO");
    expect(r!.source).toBe("LICENSE");
  });

  it("P4: dominio si no hay datos de cliente/org/licencia", () => {
    const r = resolveCountry({
      domain: "restaurant.com.do",
      phone: "+51987654321",
    });
    expect(r!.country).toBe("REPUBLICA DOMINICANA");
    expect(r!.source).toBe("DOMAIN");
  });

  it("P5: integrationCountry si no hay dominio", () => {
    const r = resolveCountry({
      integrationCountry: "GUATEMALA",
      phone: "+51987654321",
    });
    expect(r!.country).toBe("GUATEMALA");
    expect(r!.source).toBe("INTEGRATION");
  });

  it("P5: integrationCountry rechaza UNITED STATES", () => {
    const r = resolveCountry({
      integrationCountry: "United States",
      domain: "restaurant.com.do",
    });
    // UNITED STATES es rechazado, cae a DOMAIN
    expect(r!.country).toBe("REPUBLICA DOMINICANA");
    expect(r!.source).toBe("DOMAIN");
  });

  it("P6: phone prefix como ultimo recurso", () => {
    const r = resolveCountry({
      phone: "+51987654321",
    });
    expect(r!.country).toBe("PERU");
    expect(r!.source).toBe("PHONE_PREFIX");
  });

  it("P6: phone prefix NANP override (+1809 → RD)", () => {
    const r = resolveCountry({
      phone: "+18095551234",
    });
    expect(r!.country).toBe("REPUBLICA DOMINICANA");
    expect(r!.source).toBe("PHONE_PREFIX");
  });

  it("P6: phone prefix NANP fallback (+1305 → USA)", () => {
    const r = resolveCountry({
      phone: "+13055551234",
    });
    expect(r!.country).toBe("UNITED STATES");
    expect(r!.source).toBe("PHONE_PREFIX");
  });

  it("devuelve null si no hay datos", () => {
    const r = resolveCountry({});
    expect(r).toBeNull();
  });

  it("devuelve null si todos los campos son null/vacios", () => {
    const r = resolveCountry({
      customerCountry: null,
      domain: "",
      phone: "",
    });
    expect(r).toBeNull();
  });
});

/* ================================================================
   CountrySource — todos los valores posibles
   ================================================================ */

describe("countrySource coverage", () => {
  const sourcesSeen = new Set<string>();

  afterAll(() => {
    const expected = ["CLIENT", "ORGANIZATION", "LICENSE", "DOMAIN", "INTEGRATION", "PHONE_PREFIX"];
    for (const s of expected) {
      if (!sourcesSeen.has(s)) {
        console.warn(`countrySource "${s}" no fue verificado en ningun test`);
      }
    }
  });

  it("Source CLIENT", () => {
    const r = resolveCountry({ customerCountry: "PERU" });
    expect(r!.source).toBe("CLIENT");
    sourcesSeen.add("CLIENT");
  });

  it("Source ORGANIZATION", () => {
    const r = resolveCountry({ organizationCountry: "COLOMBIA" });
    expect(r!.source).toBe("ORGANIZATION");
    sourcesSeen.add("ORGANIZATION");
  });

  it("Source LICENSE", () => {
    const r = resolveCountry({ licenseCountry: "CHILE" });
    expect(r!.source).toBe("LICENSE");
    sourcesSeen.add("LICENSE");
  });

  it("Source DOMAIN", () => {
    const r = resolveCountry({ domain: "restaurant.pe" });
    expect(r!.source).toBe("DOMAIN");
    sourcesSeen.add("DOMAIN");
  });

  it("Source INTEGRATION", () => {
    const r = resolveCountry({ integrationCountry: "ECUADOR" });
    expect(r!.source).toBe("INTEGRATION");
    sourcesSeen.add("INTEGRATION");
  });

  it("Source PHONE_PREFIX", () => {
    const r = resolveCountry({ phone: "+51987654321" });
    expect(r!.source).toBe("PHONE_PREFIX");
    sourcesSeen.add("PHONE_PREFIX");
  });
});

/* ================================================================
   normalizeCountryName — 13 variantes de RD + casos borde
   ================================================================ */

describe("normalizeCountryName", () => {
  const rd = CANONICAL_RD;

  const cases: [string | null, string | null, string?][] = [
    // 13 variantes de RD → todas a REPUBLICA DOMINICANA
    ["Dominican Republic", rd],
    ["DOMINICAN REPUBLIC", rd],
    ["dominican republic", rd],
    ["Dominican_Republic", rd],
    ["DOMINICAN_REPUBLIC", rd],
    ["Republica Dominicana", rd],
    ["REPUBLICA DOMINICANA", rd],
    ["República Dominicana", rd],
    ["REPÚBLICA DOMINICANA", rd],
    ["Republica_Dominicana", rd],
    ["RepublicaDominicana", rd, "sin espacios → RD"],
    ["Dominicana Republic", rd],
    ["Dominican Rep.", rd],

    // Casos borde
    [null, null],
    [undefined, null],
    ["", null],
    ["   ", null],
    ["Peru", "PERU", "pais no RD se devuelve en uppercase"],
    ["Colombia", "COLOMBIA"],
    ["Dominican Republic.", rd, "con punto final"],
  ];

  for (const [input, expected, label] of cases) {
    const desc = label ?? `"${input}" → ${expected ?? "null"}`;
    it(desc, () => {
      const result = normalizeCountryName(input as string | null | undefined);
      expect(result).toBe(expected);
    });
  }
});
