import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/auth';

const prisma = new PrismaClient();

// Proteksi Anti-Spam: Batasi registrasi per IP (maksimal 3 registrasi per menit)
const registerAttempts = new Map<string, { count: number; resetTime: number }>();

function checkRegisterRateLimit(ip: string, maxAttempts = 3, windowMs = 60 * 1000): boolean {
  const now = Date.now();
  const record = registerAttempts.get(ip);
  if (!record || now > record.resetTime) {
    registerAttempts.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }
  if (record.count >= maxAttempts) {
    return true;
  }
  record.count += 1;
  return false;
}

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'local';

    if (checkRegisterRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan pendaftaran dari jaringan Anda. Mohon tunggu 1 menit.' },
        { status: 429 }
      );
    }

    const { full_name, email, password, phone } = await request.json();

    const trimmedName = typeof full_name === 'string' ? full_name.trim() : '';
    if (!trimmedName || !email || !password) {
      return NextResponse.json({ error: 'Nama, email, dan password wajib diisi' }, { status: 400 });
    }

    if (trimmedName.length < 3 || trimmedName.length > 50) {
      return NextResponse.json({ error: 'Nama lengkap harus antara 3 - 50 karakter' }, { status: 400 });
    }

    const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
    if (cleanPhone && !/^[0-9]{10,15}$/.test(cleanPhone)) {
      return NextResponse.json({ error: 'Nomor HP harus berupa 10-15 digit angka' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    const existing = await prisma.profile.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 });
    }

    const hashed = await hashPassword(password);

    const user = await prisma.profile.create({
      data: {
        full_name: trimmedName,
        email: email.trim().toLowerCase(),
        password: hashed,
        phone: cleanPhone || null,
        role: 'warga',
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Gagal daftar:', error);
    return NextResponse.json({ error: 'Gagal mendaftar' }, { status: 500 });
  }
}