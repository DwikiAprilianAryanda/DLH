import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const armada = await prisma.armada.findMany();
    return NextResponse.json(armada);
  } catch (error) {
    console.error('Gagal ambil data armada:', error);
    return NextResponse.json({ error: 'Gagal ambil data armada' }, { status: 500 });
  }
}