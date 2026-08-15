import { Router } from "express";
import * as recommendationsController from "./recommendations.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validate.middleware";
import { getRecommendationsSchema, generateRecommendationsSchema } from "./recommendations.validator";

const router = Router();

router.use(authenticate);

router.get("/", validateRequest(getRecommendationsSchema, "query"), recommendationsController.getRecommendations);
router.post("/generate", validateRequest(generateRecommendationsSchema, "body"), recommendationsController.generateRecommendations);

const recommendationsRouter = router;
export { recommendationsRouter };
