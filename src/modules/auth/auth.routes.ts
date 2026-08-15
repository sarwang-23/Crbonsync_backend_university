import { Router } from "express";
import { registerUser, loginUser } from "./auth.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { loginSchema, registerSchema } from "./auth.validator";

const authRouter = Router();

authRouter.post("/login", validate(loginSchema), loginUser);

// Require SUPER_ADMIN or UNIVERSITY_ADMIN to register new users
authRouter.post(
  "/register",
  authenticate,
  authorize(["SUPER_ADMIN", "UNIVERSITY_ADMIN"]),
  validate(registerSchema),
  registerUser
);

export { authRouter };
