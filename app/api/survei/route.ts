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
    const surveiList = await prisma.surveiKepuasan.findMany({
      where: { user_id: currentUser.id },
    });
    return NextResponse.json(surveiList);
  } catch (error) {
    console.error('Gagal ambil data survei:', error);
    return NextResponse.json({ error: 'Gagal ambil data survei' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = getCurrentUserFromToken();
    if (!currentUser) {
      return NextResponse.json({ error: 'Belum login' }, { status: 401 });
    }

    const body = await request.json();
    const { laporan_id, rating, komentar } = body;

    if (!laporan_id || !rating) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const laporan = await prisma.laporanSampah.findUnique({ where: { id: laporan_id } });
    if (!laporan) {
      return NextResponse.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });
    }
    if (laporan.user_id !== currentUser.id) {
      return NextResponse.json({ error: 'Bukan laporan Anda' }, { status: 403 });
    }
    if (laporan.status !== 'Selesai/Dibersihkan') {
      return NextResponse.json({ error: 'Laporan belum selesai' }, { status: 400 });
    }

    const existing = await prisma.surveiKepuasan.findUnique({ where: { laporan_id } });
    if (existing) {
      return NextResponse.json({ error: 'Laporan ini sudah direview' }, { status: 400 });
    }

    const survei = await prisma.surveiKepuasan.create({
      data: {
        laporan_id,
        user_id: currentUser.id,
        rating,
        komentar: komentar || null,
      },
    });

    return NextResponse.json(survei);
  } catch (error) {
    console.error('Gagal kirim survei:', error);
    return NextResponse.json({ error: 'Gagal kirim survei' }, { status: 500 });
  }
}