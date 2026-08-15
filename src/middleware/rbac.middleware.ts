import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { UserRole } from "../generated/prisma/client";

export const authorize = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as UserRole;
    if (!userRole) {
      return res.status(401).json({ success: false, message: "Unauthorized: Role missing" });
    }

    if (userRole === "SUPER_ADMIN") {
      return next(); // SUPER_ADMIN can bypass all role checks
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, message: "Forbidden: Insufficient permissions" });
    }

    next();
  };
};

export const requireSameUniversity = (targetUniversityIdGetter: (req: AuthRequest) => string | undefined) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as UserRole;
    if (userRole === "SUPER_ADMIN") {
      return next(); // SUPER_ADMIN can access any university data
    }

    const userUniversityId = req.user?.universityId;
    const targetUniversityId = targetUniversityIdGetter(req);

    if (!userUniversityId || !targetUniversityId || userUniversityId !== targetUniversityId) {
      return res.status(403).json({ success: false, message: "Forbidden: Cross-university access is not allowed" });
    }

    next();
  };
};
