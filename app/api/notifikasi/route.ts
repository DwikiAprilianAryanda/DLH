import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserFromToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const currentUser = getCurrentUserFromToken();
    if (!currentUser) {
      return NextResponse.json([]);
    }
    const notifikasi = await prisma.notifikasi.findMany({
      where: { user_id: currentUser.id },
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json(notifikasi);
  } catch (error) {
    console.error('Gagal ambil notifikasi:', error);
    return NextResponse.json({ error: 'Gagal ambil notifikasi' }, { status: 500 });
  }
}