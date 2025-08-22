import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "../storage";
import type { User, LoginData } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "24h";

export interface AuthResult {
  user: Omit<User, "passwordHash">;
  token: string;
}

export async function login(credentials: LoginData): Promise<AuthResult | null> {
  const user = await storage.getUserByEmail(credentials.email);
  
  if (!user) {
    return null;
  }
  
  const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
  
  if (!isPasswordValid) {
    return null;
  }
  
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  
  const { passwordHash, ...userWithoutPassword } = user;
  
  return {
    user: userWithoutPassword,
    token,
  };
}

export function verifyToken(token: string): { userId: string; email: string; role: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch (error) {
    return null;
  }
}

export async function getUserFromToken(token: string): Promise<Omit<User, "passwordHash"> | null> {
  const payload = verifyToken(token);
  
  if (!payload) {
    return null;
  }
  
  const user = await storage.getUser(payload.userId);
  
  if (!user) {
    return null;
  }
  
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
