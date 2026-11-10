import { getCurrentUserFromToken } from '@/lib/auth';

/**
 * Cek peran pemanggil di dalam route handler.
 * Mengembalikan { id, role } kalau cocok, null kalau belum login / peran tidak sesuai.
 * Contoh: const user = requireRole('admin'); if (!user) return 403.
 */
export function requireRole(...roles: string[]): { id: string; role: string } | null {
  const user = getCurrentUserFromToken();
  if (!user || !roles.includes(user.role)) return null;
  return user;
}
