import { Router } from "express";
import { getStatisticsController, createStatisticController, updateStatisticController, deleteStatisticController } from "./universityStatistics.controller";
import { validateRequest } from "../../middleware/validate.middleware";
import { getStatisticsSchema, createStatisticSchema, updateStatisticSchema, statisticIdParamSchema } from "./universityStatistics.validator";

const universityStatisticsRouter = Router();

universityStatisticsRouter.get("/", validateRequest(getStatisticsSchema, "query"), getStatisticsController);
universityStatisticsRouter.post("/", validateRequest(createStatisticSchema, "body"), createStatisticController);
universityStatisticsRouter.patch("/:id", validateRequest(statisticIdParamSchema, "params"), validateRequest(updateStatisticSchema, "body"), updateStatisticController);
universityStatisticsRouter.delete("/:id", validateRequest(statisticIdParamSchema, "params"), deleteStatisticController);

export { universityStatisticsRouter };
