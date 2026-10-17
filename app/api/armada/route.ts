import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { INITIAL_ARMADA } from '@/lib/mock-data';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const armada = await prisma.armada.findMany();
    return NextResponse.json(armada && armada.length > 0 ? armada : INITIAL_ARMADA);
  } catch (error) {
    console.error('Gagal ambil data armada (database offline), fallback ke INITIAL_ARMADA:', error);
    return NextResponse.json(INITIAL_ARMADA);
  }
}