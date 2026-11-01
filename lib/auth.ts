import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: Variabel lingkungan JWT_SECRET wajib dikonfigurasi di lingkungan produksi.');
    }
    return 'dlh-samarinda-dev-secret-local-only';
  }
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

export function signToken(payload: { id: string; role: string }): string {
  return jwt.sign(payload, getJwtSecret(), { algorithm: 'HS256', expiresIn: '7d' });
}

export function verifyToken(token: string): { id: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as any;
    if (!decoded || typeof decoded.id !== 'string' || typeof decoded.role !== 'string') {
      return null;
    }
    return { id: decoded.id, role: decoded.role };
  } catch {
    return null;
  }
}

export function getCurrentUserFromToken(): { id: string; role: string } | null {
  const token = cookies().get('session_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}