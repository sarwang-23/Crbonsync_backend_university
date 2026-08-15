import { Router } from "express";
import {
  createAssetController,
  getAssetsController,
  getAssetByIdController,
  updateAssetController,
} from "./assets.controller";

const assetsRouter = Router();

assetsRouter.post("/", createAssetController);
assetsRouter.get("/", getAssetsController);
assetsRouter.get("/:id", getAssetByIdController);
assetsRouter.patch("/:id", updateAssetController);

export { assetsRouter };
