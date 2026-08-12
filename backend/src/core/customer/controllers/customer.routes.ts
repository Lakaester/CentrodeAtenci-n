import { Router } from "express";
import { customerController } from "./CustomerController";

export const customerRouter = Router();

customerRouter.post("/resolve", customerController.resolve);
