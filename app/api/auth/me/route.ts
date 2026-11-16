import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { getPengawasById } from '@/lib/pengawas';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const token = cookies().get('session_token')?.value;
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ user: null });
    }

    let user = null;
    try {
      user = await prisma.profile.findUnique({ where: { id: decoded.id } });
    } catch (dbErr) {
      console.warn('Database offline saat cek sesi:', dbErr);
    }

    if (!user) {
      const pengawas = getPengawasById(decoded.id);
      if (pengawas) {
        return NextResponse.json({
          user: {
            id: pengawas.id,
            full_name: pengawas.full_name,
            email: pengawas.email,
            kecamatan: pengawas.kecamatan,
            role: 'pengawas',
          },
        });
      }
      return NextResponse.json({ user: null });
    }

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Gagal cek sesi:', error);
    return NextResponse.json({ user: null });
  }
}