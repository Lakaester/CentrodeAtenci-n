import bcrypt from "bcryptjs";

const ROUNDS = 12;

/** Hashea una contraseña en texto plano. Nunca almacenar el texto plano. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

/** Verifica una contraseña contra un hash. */
export async function verifyPassword(plain: string, hash: string | null): Promise<boolean> {
  if (!hash) return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}
