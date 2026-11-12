import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CategoryModal } from "../CategoryModal";

function seleccionarDevolucion() {
  fireEvent.click(screen.getByText("DEVOLUCIÓN"));
  fireEvent.click(screen.getByText("Solicitud de devolución"));
}

describe("CategoryModal — Fase 1", () => {
  it("guarda y cierra cuando onSave devuelve true", async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();
    render(<CategoryModal open onClose={onClose} onSave={onSave} />);

    seleccionarDevolucion();
    fireEvent.click(screen.getByText("Guardar"));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith("DEVOLUCIÓN", "solicitud_de_devolución");
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("no cierra cuando onSave devuelve false", async () => {
    const onSave = vi.fn().mockResolvedValue(false);
    const onClose = vi.fn();
    render(<CategoryModal open onClose={onClose} onSave={onSave} />);

    seleccionarDevolucion();
    fireEvent.click(screen.getByText("Guardar"));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });

  it("muestra Guardando... mientras espera", async () => {
    let resolver: (value: boolean) => void = () => {};
    const onSave = vi.fn(() => new Promise<boolean>((resolve) => { resolver = resolve; }));
    const onClose = vi.fn();
    render(<CategoryModal open onClose={onClose} onSave={onSave} />);

    seleccionarDevolucion();
    fireEvent.click(screen.getByText("Guardar"));

    expect(await screen.findByText("Guardando...")).toBeTruthy();
    resolver(true);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("muestra el error del backend", () => {
    render(
      <CategoryModal
        open
        onClose={vi.fn()}
        onSave={vi.fn()}
        errorMessage="La categoría se guardó, pero no se pudo persistir en COPE."
      />,
    );
    expect(screen.getByText("La categoría se guardó, pero no se pudo persistir en COPE.")).toBeTruthy();
  });
});
