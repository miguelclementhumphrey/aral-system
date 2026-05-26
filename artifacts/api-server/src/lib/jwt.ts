import jwt from "jsonwebtoken";
import { requireStrongSecret } from "./env";

const JWT_EXPIRES_IN = "7d";

export interface JwtPayload {
  id: string;
  role: "super_admin" | "school_head" | "teacher";
  schoolId?: string;
  teacherId?: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, requireStrongSecret("JWT_SECRET"), {
    algorithm: "HS256",
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, requireStrongSecret("JWT_SECRET"), {
    algorithms: ["HS256"],
  }) as JwtPayload;
}
