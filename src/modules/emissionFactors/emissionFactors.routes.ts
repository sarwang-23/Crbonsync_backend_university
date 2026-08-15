import { Router } from "express";
import { 
  createController, 
  getAllController, 
  getByIdController, 
  updateController, 
  deactivateController,
  getPendingActivitiesController
} from "./emissionFactors.controller";

const emissionFactorsRouter = Router();

emissionFactorsRouter.post("/", createController);
emissionFactorsRouter.get("/", getAllController);
emissionFactorsRouter.get("/pending", getPendingActivitiesController);
emissionFactorsRouter.get("/:id", getByIdController);
emissionFactorsRouter.patch("/:id", updateController);
emissionFactorsRouter.delete("/:id", deactivateController);

export { emissionFactorsRouter };
