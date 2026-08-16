import { Router } from "express";
import * as recommendationsController from "./recommendations.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validate.middleware";
import { getRecommendationsSchema, generateRecommendationsSchema } from "./recommendations.validator";

const router = Router();

router.use(authenticate);

router.get("/", validateRequest(getRecommendationsSchema, "query"), recommendationsController.getRecommendations);
router.post("/generate", validateRequest(generateRecommendationsSchema, "body"), recommendationsController.generateRecommendations);
router.get("/:id", recommendationsController.getRecommendationById);
router.patch("/:id/status", recommendationsController.updateRecommendationStatus);

const recommendationsRouter = router;
export { recommendationsRouter };
