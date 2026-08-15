import { Request } from "express";

/**
 * Ensures that the currently authenticated user has the right to access 
 * data for the specified university.
 * 
 * @param req The Express Request object (containing req.user attached by authenticate middleware)
 * @param universityId The university ID the request is trying to access
 * @throws Error if access is denied
 */
export const checkIsolation = (req: Request, universityId: string) => {
  const user = (req as any).user;
  
  if (!user) {
    throw new Error("Unauthorized: User not authenticated");
  }

  // SUPER_ADMIN has access to all universities
  if (user.role === "SUPER_ADMIN") {
    return;
  }

  // Other users can only access their own university's data
  if (user.universityId !== universityId) {
    throw new Error("Forbidden: Access restricted to your own university");
  }
};
