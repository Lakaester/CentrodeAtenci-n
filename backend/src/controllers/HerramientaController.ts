import { Request, Response, NextFunction } from "express";
import type { Herramienta } from "../domain/herramientas/types";
import { CreateHerramientaUseCase } from "../application/herramientas/CreateHerramientaUseCase";
import { GetHerramientaUseCase } from "../application/herramientas/GetHerramientaUseCase";
import { ListHerramientasUseCase } from "../application/herramientas/ListHerramientasUseCase";
import { UpdateHerramientaUseCase } from "../application/herramientas/UpdateHerramientaUseCase";
import { DeleteHerramientaUseCase } from "../application/herramientas/DeleteHerramientaUseCase";
import { createHerramientaSchema, updateHerramientaSchema } from "../dto/HerramientaDTOs";
import { herramientasStore } from "../data/HerramientasStore";

const map = herramientasStore.getMap();
const create = new CreateHerramientaUseCase(map);
const get = new GetHerramientaUseCase(map);
const list = new ListHerramientasUseCase(map);
const update = new UpdateHerramientaUseCase(map);
const del = new DeleteHerramientaUseCase(map);

export const herramientaController = {
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const { tipo, estado, categoria, tipoAtencion, search, visible } = req.query;
      let resultado = list.execute({ tipo: tipo as string, estado: estado as string, categoria: categoria as string, tipoAtencion: tipoAtencion as string, search: search as string });
      if (visible === "true") resultado = resultado.filter((h) => h.visible);
      res.json({ ok: true, data: resultado });
    } catch (err) { next(err); }
  },

  async obtener(req: Request, res: Response, next: NextFunction) {
    try {
      const h = get.execute(req.params.id);
      if (!h) return res.status(404).json({ ok: false, error: "Herramienta no encontrada" });
      res.json({ ok: true, data: h });
    } catch (err) { next(err); }
  },

  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createHerramientaSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });
      const h = create.execute(parsed.data);
      res.status(201).json({ ok: true, data: h });
    } catch (err) { next(err); }
  },

  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateHerramientaSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });
      const h = update.execute(req.params.id, parsed.data);
      if (!h) return res.status(404).json({ ok: false, error: "Herramienta no encontrada" });
      res.json({ ok: true, data: h });
    } catch (err) { next(err); }
  },

  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      del.execute(req.params.id);
      res.json({ ok: true });
    } catch (err) { next(err); }
  },
};
