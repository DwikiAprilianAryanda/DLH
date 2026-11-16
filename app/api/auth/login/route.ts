import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyPassword, signToken, hashPassword } from '@/lib/auth';
import { getPengawasByEmail } from '@/lib/pengawas';

const prisma = new PrismaClient();

// Proteksi Brute Force: Lacak kegagalan login per email / IP
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, maxAttempts = 5, windowMs = 60 * 1000): boolean {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || now > record.resetTime) {
    loginAttempts.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (record.count >= maxAttempts) {
    return true;
  }

  record.count += 1;
  return false;
}

function clearRateLimit(key: string) {
  loginAttempts.delete(key);
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!cleanEmail || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 });
    }

    // Ambil IP address atau gunakan email sebagai kunci pembatasan
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'local';
    const rateLimitKey = `${clientIp}:${cleanEmail}`;

    if (checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan login gagal. Mohon tunggu 1 menit sebelum mencoba lagi.' },
        { status: 429 }
      );
    }

    // 1. Cek kredensial resmi Akun Pengawas Kecamatan (10 Akun DLH)
    const pengawasData = getPengawasByEmail(cleanEmail);
    if (pengawasData && password === pengawasData.password) {
      clearRateLimit(rateLimitKey);
      let userObj: { id: string; role: string; email: string; full_name: string; kecamatan: string } = {
        id: pengawasData.id,
        role: 'pengawas',
        email: pengawasData.email,
        full_name: pengawasData.full_name,
        kecamatan: pengawasData.kecamatan,
      };

      try {
        let dbUser = await prisma.profile.findUnique({ where: { email: cleanEmail } });
        if (!dbUser) {
          const hashed = await hashPassword(pengawasData.password);
          dbUser = await prisma.profile.create({
            data: {
              id: pengawasData.id,
              full_name: pengawasData.full_name,
              email: pengawasData.email,
              password: hashed,
              kecamatan: pengawasData.kecamatan,
              role: 'pengawas',
            },
          });
        }
        if (dbUser) {
          userObj = {
            id: dbUser.id,
            role: dbUser.role,
            email: dbUser.email,
            full_name: dbUser.full_name,
            kecamatan: dbUser.kecamatan || pengawasData.kecamatan,
          };
        }
      } catch (dbErr) {
        console.warn('Database offline / tidak dapat dihubungi saat login pengawas, menggunakan session pengawas lokal:', dbErr);
      }

      const token = signToken({ id: userObj.id, role: userObj.role });
      const response = NextResponse.json(userObj);
      response.cookies.set('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      return response;
    }

    // 2. Cek akun dari database (Admin atau Warga)
    let user = null;
    try {
      user = await prisma.profile.findUnique({ where: { email: cleanEmail } });
    } catch (dbErr) {
      console.warn('Database offline saat mencari akun user:', dbErr);
    }

    if (!user) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
    }

    // Login sukses: Reset batasan percobaan
    clearRateLimit(rateLimitKey);

    const token = signToken({ id: user.id, role: user.role });

    const { password: _, ...userWithoutPassword } = user;
    const response = NextResponse.json(userWithoutPassword);

    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Gagal login:', error);
    return NextResponse.json({ error: 'Gagal login' }, { status: 500 });
  }
}