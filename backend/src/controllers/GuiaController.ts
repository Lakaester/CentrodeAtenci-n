import { Request, Response, NextFunction } from "express";
import type { GuiaResolucion } from "../domain/guias/types";
import { CreateGuiaUseCase } from "../application/guias/CreateGuiaUseCase";
import { GetGuiaUseCase } from "../application/guias/GetGuiaUseCase";
import { ListGuiasUseCase } from "../application/guias/ListGuiasUseCase";
import { UpdateGuiaUseCase } from "../application/guias/UpdateGuiaUseCase";
import { DeleteGuiaUseCase } from "../application/guias/DeleteGuiaUseCase";
import { createGuiaSchema, updateGuiaSchema } from "../dto/GuiaDTOs";

const guias = new Map<string, GuiaResolucion>();
const create = new CreateGuiaUseCase(guias);
const get = new GetGuiaUseCase(guias);
const list = new ListGuiasUseCase(guias);
const update = new UpdateGuiaUseCase(guias);
const del = new DeleteGuiaUseCase(guias);

export const guiaController = {
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const { tipoAtencion, estado, responsable, search } = req.query;
      const resultado = list.execute({ tipoAtencion: tipoAtencion as string, estado: estado as string, responsable: responsable as string, search: search as string });
      res.json({ ok: true, data: resultado });
    } catch (err) { next(err); }
  },

  async obtener(req: Request, res: Response, next: NextFunction) {
    try {
      const guia = get.execute(req.params.id);
      if (!guia) return res.status(404).json({ ok: false, error: "Guía no encontrada" });
      res.json({ ok: true, data: guia });
    } catch (err) { next(err); }
  },

  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createGuiaSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });
      const guia = create.execute(parsed.data);
      res.status(201).json({ ok: true, data: guia });
    } catch (err) { next(err); }
  },

  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateGuiaSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });
      const guia = update.execute(req.params.id, parsed.data);
      if (!guia) return res.status(404).json({ ok: false, error: "Guía no encontrada" });
      res.json({ ok: true, data: guia });
    } catch (err) { next(err); }
  },

  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      const ok = del.execute(req.params.id);
      if (!ok) return res.status(400).json({ ok: false, error: "No se puede eliminar. Solo borradores pueden eliminarse." });
      res.json({ ok: true });
    } catch (err) { next(err); }
  },
};
