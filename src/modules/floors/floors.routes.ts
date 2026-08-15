import { Router } from "express";
import {
  createFloorController,
  getFloorsController,
  getFloorByIdController,
  updateFloorController,
} from "./floors.controller";

const floorsRouter = Router();

floorsRouter.post("/", createFloorController);
floorsRouter.get("/", getFloorsController);
floorsRouter.get("/:id", getFloorByIdController);
floorsRouter.patch("/:id", updateFloorController);

export { floorsRouter };
