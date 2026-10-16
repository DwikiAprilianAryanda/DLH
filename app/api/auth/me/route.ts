import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

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

    const user = await prisma.profile.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return NextResponse.json({ user: null });
    }

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Gagal cek sesi:', error);
    return NextResponse.json({ user: null });
  }
}