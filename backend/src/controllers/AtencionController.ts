import { Request, Response, NextFunction } from "express";
import { InMemoryAtencionRepository } from "../repositories/InMemoryAtencionRepository";
import { CreateAtencionUseCase } from "../application/atencion/CreateAtencionUseCase";
import { GetAtencionUseCase } from "../application/atencion/GetAtencionUseCase";
import { ListAtencionesUseCase } from "../application/atencion/ListAtencionesUseCase";
import { AddActividadUseCase } from "../application/atencion/AddActividadUseCase";
import { FinalizarAtencionUseCase } from "../application/atencion/FinalizarAtencionUseCase";
import {
  createAtencionSchema,
  addActividadSchema,
  addHipotesisSchema,
  finalizarAtencionSchema,
} from "../dto/AtencionDTOs";
import { Atencion } from "../domain/atencion/Atencion";
import { Hipotesis } from "../domain/atencion/Hipotesis";
import { AtencionMapper } from "../mappers/AtencionMapper";

const repo = new InMemoryAtencionRepository();

const list = new ListAtencionesUseCase(repo);
const get = new GetAtencionUseCase(repo);
const create = new CreateAtencionUseCase(repo);
const addActividad = new AddActividadUseCase(repo);
const finalizar = new FinalizarAtencionUseCase(repo);

export const atencionController = {
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const { ticketOriginalStatus, canal, asesorId, clienteId, categoria, search, pagina, limite } = req.query;
      const result = await list.execute({
        ticketOriginalStatus: ticketOriginalStatus as string,
        canal: canal as string,
        asesorId: asesorId as string,
        clienteId: clienteId as string,
        categoria: categoria as string,
        search: search as string,
        pagina: pagina ? Number(pagina) : undefined,
        limite: limite ? Number(limite) : undefined,
      });
      res.json({ ok: true, data: result.items, total: result.total });
    } catch (err) {
      next(err);
    }
  },

  async obtener(req: Request, res: Response, next: NextFunction) {
    try {
      const atencion = await get.execute(req.params.id);
      if (!atencion) return res.status(404).json({ ok: false, error: "Atencion no encontrada" });
      res.json({ ok: true, data: atencion });
    } catch (err) {
      next(err);
    }
  },

  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createAtencionSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });
      const atencion = await create.execute(parsed.data);
      res.status(201).json({ ok: true, data: atencion });
    } catch (err) {
      next(err);
    }
  },

  async agregarActividad(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = addActividadSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });
      const atencion = await addActividad.execute(req.params.id, parsed.data);
      if (!atencion) return res.status(404).json({ ok: false, error: "Atencion no encontrada" });
      res.json({ ok: true, data: atencion });
    } catch (err) {
      next(err);
    }
  },

  async agregarHipotesis(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = addHipotesisSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });
      const data = await repo.findById(req.params.id);
      if (!data) return res.status(404).json({ ok: false, error: "Atencion no encontrada" });
      const atencion = new Atencion(data);
      const hipotesis = new Hipotesis({
        id: `hip_${Date.now()}`,
        titulo: parsed.data.titulo,
        descripcion: parsed.data.descripcion,
        nivelConfianza: parsed.data.nivelConfianza,
        confianza: parsed.data.confianza,
        causas: parsed.data.causas,
        recomendaciones: parsed.data.recomendaciones,
        autor: req.body.autor ?? "Sistema",
        fecha: new Date().toISOString(),
      });
      atencion.agregarHipotesis(hipotesis);
      await repo.save(atencion.toJSON());
      res.json({ ok: true, data: AtencionMapper.toResponse(atencion.toJSON()) });
    } catch (err) {
      next(err);
    }
  },

  async finalizar(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = finalizarAtencionSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });
      const atencion = await finalizar.execute(req.params.id, parsed.data);
      if (!atencion) return res.status(404).json({ ok: false, error: "Atencion no encontrada" });
      res.json({ ok: true, data: atencion });
    } catch (err) {
      next(err);
    }
  },
};
