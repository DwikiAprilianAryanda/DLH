import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const tps = await prisma.tps.findMany({
      orderBy: { nama: 'asc' },
    });
    return NextResponse.json(tps);
  } catch (error) {
    console.error('Gagal ambil data TPS:', error);
    return NextResponse.json({ error: 'Gagal ambil data TPS' }, { status: 500 });
  }
}