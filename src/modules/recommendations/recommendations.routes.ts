import { Router } from "express";
import * as recommendationsController from "./recommendations.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", recommendationsController.getRecommendations);
router.post("/generate", recommendationsController.generateRecommendations);

const recommendationsRouter = router;
export { recommendationsRouter };
