import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserFromToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PATCH() {
  try {
    const currentUser = getCurrentUserFromToken();
    if (!currentUser) {
      return NextResponse.json({ error: 'Belum login' }, { status: 401 });
    }
    await prisma.notifikasi.updateMany({
      where: { user_id: currentUser.id, dibaca: false },
      data: { dibaca: true },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Gagal update notifikasi:', error);
    return NextResponse.json({ error: 'Gagal update notifikasi' }, { status: 500 });
  }
}