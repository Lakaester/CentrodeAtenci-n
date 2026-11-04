import { describe, it, expect } from "vitest";
import {
  agregarConteos,
  calcularResumen,
  calcularVariaciones,
  etiquetaPeriodo,
  finPeriodo,
  generarPeriodos,
  porcentaje,
  redondear1,
  siguientePeriodo,
  variacionPp,
  variacionRel,
  type ConteosCalidad,
} from "../utils/calidadRegistro";

const base: ConteosCalidad = {
  total: 100,
  catReg: 80,
  catHom: 70,
  domInf: 60,
  domVal: 50,
  ambas: 40,
  soloCat: 30,
  soloDom: 10,
  ninguna: 20,
};

describe("porcentajes y variaciones", () => {
  it("porcentaje devuelve null cuando el total es cero", () => {
    expect(porcentaje(0, 0)).toBeNull();
    expect(porcentaje(10, 0)).toBeNull();
  });

  it("porcentaje redondea a un decimal", () => {
    expect(porcentaje(1, 3)).toBe(33.3);
    expect(porcentaje(2, 3)).toBe(66.7);
  });

  it("variación en puntos porcentuales", () => {
    expect(variacionPp(90, 70)).toBe(20);
    expect(variacionPp(70, 90)).toBe(-20);
    expect(variacionPp(null, 90)).toBeNull();
  });

  it("variación relativa evita división por cero", () => {
    expect(variacionRel(90, 80)).toBe(12.5);
    expect(variacionRel(90, 0)).toBeNull();
    expect(variacionRel(null, 80)).toBeNull();
  });

  it("redondeo a un decimal", () => {
    expect(redondear1(12.345)).toBe(12.3);
    expect(redondear1(12.35)).toBe(12.4);
  });
});

describe("calcularResumen", () => {
  it("calcula todos los niveles e invariantes", () => {
    const r = calcularResumen(base);
    expect(r.total).toBe(100);
    expect(r.categorizacion.registradas).toBe(80);
    expect(r.categorizacion.homologadas).toBe(70);
    expect(r.categorizacion.registradasNoHomologadas).toBe(10);
    expect(r.categorizacion.noHomologadasTotal).toBe(30);
    expect(r.categorizacion.pctRegistrada).toBe(80);
    expect(r.categorizacion.pctHomologada).toBe(70);
    expect(r.categorizacion.brechaHomologacionPp).toBe(10);
    expect(r.dominio.informados).toBe(60);
    expect(r.dominio.validos).toBe(50);
    expect(r.dominio.informadosNoValidos).toBe(10);
    expect(r.dominio.noValidosTotal).toBe(50);
    expect(r.integral.cumpleAmbas).toBe(40);
    expect(r.integral.pctCumplimientoIntegral).toBe(40);
  });

  it("acepta total cero con porcentajes null", () => {
    const r = calcularResumen({
      total: 0,
      catReg: 0,
      catHom: 0,
      domInf: 0,
      domVal: 0,
      ambas: 0,
      soloCat: 0,
      soloDom: 0,
      ninguna: 0,
    });
    expect(r.categorizacion.pctRegistrada).toBeNull();
    expect(r.categorizacion.pctHomologada).toBeNull();
    expect(r.integral.pctCumplimientoIntegral).toBeNull();
  });

  it("rechaza catHomologadas > catRegistradas", () => {
    expect(() =>
      calcularResumen({ ...base, catHom: 81, soloCat: 41, soloDom: 10, ambas: 40 }),
    ).toThrow(/catHomologadas/);
  });

  it("rechaza domValidos > domInformados", () => {
    expect(() =>
      calcularResumen({ ...base, domVal: 61, soloDom: 21 }),
    ).toThrow(/domValidos/);
  });

  it("rechaza escenarios que no suman total", () => {
    expect(() =>
      calcularResumen({ ...base, total: 101 }),
    ).toThrow(/escenarios/);
  });
});

describe("calcularVariaciones", () => {
  it("calcula pp y relativas", () => {
    const actual = calcularResumen(base);
    const anterior = calcularResumen({
      total: 80,
      catReg: 60,
      catHom: 50,
      domInf: 40,
      domVal: 30,
      ambas: 20,
      soloCat: 30,
      soloDom: 10,
      ninguna: 20,
    });
    const v = calcularVariaciones(actual, anterior);
    expect(v.totalPct).toBe(25);
    expect(v.catRegistradaPp).toBe(5);
    expect(v.catHomologadaPp).toBe(7.5);
    expect(v.integralPp).toBe(15);
  });

  it("devuelve nulls sin periodo anterior", () => {
    const v = calcularVariaciones(calcularResumen(base), null);
    expect(v.totalPct).toBeNull();
    expect(v.catRegistradaPp).toBeNull();
    expect(v.integralPp).toBeNull();
  });
});

describe("periodos", () => {
  it("etiqueta semanal ISO en cambio de año", () => {
    expect(etiquetaPeriodo("2025-12-29", "semana")).toBe("2026-W01");
    expect(etiquetaPeriodo("2026-01-01", "semana")).toBe("2026-W01");
    expect(etiquetaPeriodo("2026-11-02", "semana")).toBe("2026-W45");
  });

  it("etiqueta mensual y trimestral", () => {
    expect(etiquetaPeriodo("2026-02-01", "mes")).toBe("2026-02");
    expect(etiquetaPeriodo("2026-02-01", "trimestre")).toBe("2026-T1");
    expect(etiquetaPeriodo("2026-11-02", "trimestre")).toBe("2026-T4");
  });

  it("fin de periodo", () => {
    expect(finPeriodo("2026-02-01", "semana")).toBe("2026-02-07");
    expect(finPeriodo("2026-02-01", "mes")).toBe("2026-02-28");
    expect(finPeriodo("2024-02-01", "mes")).toBe("2024-02-29");
    expect(finPeriodo("2026-04-01", "trimestre")).toBe("2026-06-30");
  });

  it("siguiente periodo", () => {
    expect(siguientePeriodo("2025-12-29", "semana")).toBe("2026-01-05");
    expect(siguientePeriodo("2025-12-01", "mes")).toBe("2026-01-01");
    expect(siguientePeriodo("2025-10-01", "trimestre")).toBe("2026-01-01");
  });

  it("genera periodos completos", () => {
    expect(generarPeriodos("2026-01-01", "2026-03-01", "mes")).toEqual([
      "2026-01-01",
      "2026-02-01",
      "2026-03-01",
    ]);
    expect(generarPeriodos("2026-01-05", "2026-01-19", "semana")).toEqual([
      "2026-01-05",
      "2026-01-12",
      "2026-01-19",
    ]);
    expect(generarPeriodos("2026-01-01", "2026-07-01", "trimestre")).toEqual([
      "2026-01-01",
      "2026-04-01",
      "2026-07-01",
    ]);
  });
});

describe("agregarConteos", () => {
  it("suma filas y conserva invariantes", () => {
    const a = agregarConteos([base, base]);
    expect(a.total).toBe(200);
    expect(a.ambas).toBe(80);
    const r = calcularResumen(a);
    expect(r.total).toBe(200);
    expect(r.integral.cumpleAmbas).toBe(80);
  });
});
