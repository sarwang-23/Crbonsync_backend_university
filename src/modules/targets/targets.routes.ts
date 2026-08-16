import { Router } from "express";
import * as targetsController from "./targets.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", targetsController.getTargets);
router.post("/", targetsController.createTarget);
router.get("/:id/progress", targetsController.getTargetProgress);

const targetsRouter = router;
export { targetsRouter };
