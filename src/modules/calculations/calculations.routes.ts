import { Router } from "express";
import { calculate } from "./calculations.controller";

const calculationsRouter = Router();

calculationsRouter.post("/activity/:activityId", calculate);

export { calculationsRouter };
