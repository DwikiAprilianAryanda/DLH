import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updated = await prisma.laporanSampah.update({
      where: { id: params.id },
      data: {
        status: body.status,
        catatan_petugas: body.catatan_petugas,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Gagal update laporan:', error);
    return NextResponse.json({ error: 'Gagal update laporan' }, { status: 500 });
  }
}