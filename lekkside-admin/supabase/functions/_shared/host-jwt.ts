import { SignJWT, jwtVerify } from "npm:jose@5.2.2";

const ISSUER = 'lekkside-admin';
const ROLE = 'host';
const TTL_SECONDS = 60 * 60 * 24; // 24 hours

export async function signHostJwt(roomName: string, secretString: string): Promise<string> {
  const secret = new TextEncoder().encode(secretString);
  const now = Math.floor(Date.now() / 1000);
  
  const jwt = await new SignJWT({
    role: ROLE,
    sub: roomName,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + TTL_SECONDS)
    .setIssuer(ISSUER)
    .sign(secret);
    
  return jwt;
}

export async function verifyHostJwt(token: string, roomName: string, secretString: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(secretString);
    const { payload } = await jwtVerify(token, secret, {
      issuer: ISSUER,
    });
    
    if (payload.role !== ROLE) return false;
    if (payload.sub !== roomName) return false;
    
    return true;
  } catch {
    return false;
  }
}
