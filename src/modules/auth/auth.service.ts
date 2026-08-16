import { prisma } from "../../config/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RegisterInput, LoginInput } from "./auth.types";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";
const JWT_EXPIRES_IN = "24h";

export const register = async (data: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  // Generate a random password if none provided (e.g., when an admin provisions an account)
  const plainPassword = data.password || Math.random().toString(36).slice(-10);
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  // Automatically assign to the first university for testing purposes if none provided
  let uId = data.universityId;
  if (!uId) {
    const firstUni = await prisma.university.findFirst();
    if (firstUni) uId = firstUni.id;
  }

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordHash,
      role: data.role,
      universityId: uId
    }
  });

  // In a real app, if plainPassword was auto-generated, we would email it to the user here.
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    universityId: user.universityId,
    // Provide the generated password back in development so we can log in
    provisionedPassword: data.password ? undefined : plainPassword 
  };
};

export const login = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (!user || user.status !== "ACTIVE") {
    throw new Error("Invalid credentials or inactive account");
  }

  // Development bypass: if no password provided, try to bypass (only if mock setup allows it)
  // But for STEP 30, we must enforce real checks.
  if (!data.password) {
    throw new Error("Password is required");
  }

  const isValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
      universityId: user.universityId
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  return {
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      universityId: user.universityId
    }
  };
};
