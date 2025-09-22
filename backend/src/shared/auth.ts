import jwt, { SignOptions, Secret } from "jsonwebtoken";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "dev-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";


export type TokenPayload = {
  clientId: string;
  name?: string;
  iat?: number;
  exp?: number;
};

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in environment variables");
}

export function signClientToken(payload: Record<string, unknown>) {
  const expiresIn: SignOptions["expiresIn"] = JWT_EXPIRES_IN as unknown as SignOptions["expiresIn"];
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload as string | object | Buffer, JWT_SECRET, options);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

// Extract bearer token from Authorization header
export function getBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const matches = authHeader.match(/^Bearer (.+)$/i);
  return matches ? matches[1] : null;
}