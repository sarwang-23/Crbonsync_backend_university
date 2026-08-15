import { Router } from "express";

import {
  createUniversityController,
  getUniversitiesController,
  getUniversityByIdController,
  updateUniversityController,
} from "./universities.controller";

const universitiesRouter = Router();

universitiesRouter.post(
  "/",
  createUniversityController
);

universitiesRouter.get(
  "/",
  getUniversitiesController
);

universitiesRouter.get(
  "/:id",
  getUniversityByIdController
);

universitiesRouter.patch(
  "/:id",
  updateUniversityController
);

export { universitiesRouter };
