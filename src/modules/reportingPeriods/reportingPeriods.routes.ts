import { Router } from "express";
import {
  create,
  getAll,
  getById,
  baseline,
  open,
  lock,
} from "./reportingPeriods.controller";

const reportingPeriodsRouter = Router();

reportingPeriodsRouter.post("/", create);
reportingPeriodsRouter.get("/", getAll);
reportingPeriodsRouter.get("/:id", getById);
reportingPeriodsRouter.post("/:id/set-baseline", baseline);
reportingPeriodsRouter.post("/:id/open", open);
reportingPeriodsRouter.post("/:id/lock", lock);

export { reportingPeriodsRouter };
