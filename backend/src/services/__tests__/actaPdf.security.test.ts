import { describe, it, expect } from "vitest";
import path from "path";
import { actaPdfService } from "../actaPdf.service";

const shellChars = /[;`$&|\n\\]/;

describe("O5-B — O5-F1: PDF sin shell y sin path traversal", () => {
  it("PDF-SEC-01 ticket normal → nombre de archivo seguro", () => {
    expect(actaPdfService.nombreArchivoActa("12345")).toBe("ACTA-12345.pdf");
  });

  it("PDF-SEC-02/03/04: tickets con metacaracteres se sanean (sin shell, sin traversal)", () => {
    const malos = [
      "; echo INOCUO",
      "$(echo INOCUO)",
      "`id`",
      "a && b",
      "x || y",
      "a\nb",
      "a\\b",
      "../../etc/passwd",
      "..\\..\\win.ini",
      "/etc/passwd",
      "C:\\Windows\\x",
    ];
    for (const t of malos) {
      const nombre = actaPdfService.nombreArchivoActa(t);
      expect(nombre).not.toMatch(shellChars);
      expect(nombre.endsWith(".pdf")).toBe(true);
      const fp = actaPdfService.getFilePath(t);
      expect(path.dirname(fp)).toBe(actaPdfService.getStorageDir());
      expect(path.basename(fp)).not.toMatch(/[\/\\]|^\.\./);
    }
  });

  it("generarAsync existe (ruta en memoria, sin shell)", () => {
    expect(typeof actaPdfService.generarAsync).toBe("function");
  });

  it("el mecanismo execSync (generarSync) fue eliminado", () => {
    expect((actaPdfService as any).generarSync).toBeUndefined();
  });
});