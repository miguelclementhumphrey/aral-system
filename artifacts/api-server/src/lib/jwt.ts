import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "aral_system_secret_key_2024";
const JWT_EXPIRES_IN = "7d";

export interface JwtPayload {
  id: string;
  role: "super_admin" | "school_head" | "teacher";
  schoolId?: string;
  teacherId?: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
