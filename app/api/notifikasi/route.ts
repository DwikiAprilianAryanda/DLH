import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserFromToken } from '@/lib/auth';
import { INITIAL_NOTIFIKASI } from '@/lib/mock-data';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const currentUser = getCurrentUserFromToken();
    if (!currentUser) {
      return NextResponse.json(INITIAL_NOTIFIKASI);
    }
    const notifikasi = await prisma.notifikasi.findMany({
      where: { user_id: currentUser.id },
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json(notifikasi && notifikasi.length > 0 ? notifikasi : INITIAL_NOTIFIKASI);
  } catch (error) {
    console.error('Gagal ambil notifikasi (database offline), fallback ke INITIAL_NOTIFIKASI:', error);
    return NextResponse.json(INITIAL_NOTIFIKASI);
  }
}