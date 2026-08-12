import { Router } from "express";
import { searchController } from "../controllers/SearchController";

export const searchRouter = Router();
searchRouter.get("/", searchController.search);
