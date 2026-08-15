import { Request, Response, NextFunction } from "express";
import { register, login } from "./auth.service";

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await register(req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await login(req.body);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    if (error.message === "Invalid credentials" || error.message.includes("inactive")) {
      return res.status(401).json({ success: false, message: error.message });
    }
    next(error);
  }
};
