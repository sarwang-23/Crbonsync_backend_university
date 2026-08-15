import { Router } from "express";
import {
  createBuildingController,
  getBuildingsController,
  getBuildingByIdController,
  updateBuildingController,
} from "./buildings.controller";

const buildingsRouter = Router();

buildingsRouter.post("/", createBuildingController);
buildingsRouter.get("/", getBuildingsController);
buildingsRouter.get("/:id", getBuildingByIdController);
buildingsRouter.patch("/:id", updateBuildingController);

export { buildingsRouter };
