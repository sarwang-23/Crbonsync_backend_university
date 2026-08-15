import { Router } from "express";
import { getStatisticsController, createStatisticController, updateStatisticController, deleteStatisticController } from "./universityStatistics.controller";

const universityStatisticsRouter = Router();

universityStatisticsRouter.get("/", getStatisticsController);
universityStatisticsRouter.post("/", createStatisticController);
universityStatisticsRouter.patch("/:id", updateStatisticController);
universityStatisticsRouter.delete("/:id", deleteStatisticController);

export { universityStatisticsRouter };
