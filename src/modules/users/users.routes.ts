import { Router } from "express";
import { listUsers, create, update, remove } from "./users.controller";
import { authorize } from "../../middleware/rbac.middleware";
import { validateRequest } from "../../middleware/validate.middleware";
import { createUserSchema, updateUserSchema } from "./users.validator";

const usersRouter = Router();

// Only Admins can manage users
usersRouter.use(authorize(["SUPER_ADMIN", "UNIVERSITY_ADMIN"]));

usersRouter.get("/", listUsers);
usersRouter.post("/", validateRequest(createUserSchema, "body"), create);
usersRouter.patch("/:id", validateRequest(updateUserSchema, "body"), update);
usersRouter.delete("/:id", remove);

export { usersRouter };
