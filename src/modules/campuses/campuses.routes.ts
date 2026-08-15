import { Router } from "express";

import {
  createCampusController,
  getCampusesController,
  getCampusByIdController,
  updateCampusController,
} from "./campuses.controller";

const campusesRouter = Router();

campusesRouter.post(
  "/",
  createCampusController
);

campusesRouter.get(
  "/",
  getCampusesController
);

campusesRouter.get("/:id", getCampusByIdController);
campusesRouter.patch("/:id", updateCampusController);

export { campusesRouter };
