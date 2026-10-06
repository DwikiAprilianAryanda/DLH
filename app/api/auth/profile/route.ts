import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserFromToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PATCH(request: Request) {
  try {
    const currentUser = getCurrentUserFromToken();
    if (!currentUser) {
      return NextResponse.json({ error: 'Belum login' }, { status: 401 });
    }

    const body = await request.json();

    const updated = await prisma.profile.update({
      where: { id: currentUser.id },
      data: {
        full_name: body.full_name,
        phone: body.phone,
        kecamatan: body.kecamatan,
      },
    });

    const { password: _, ...userWithoutPassword } = updated;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Gagal update profil:', error);
    return NextResponse.json({ error: 'Gagal update profil' }, { status: 500 });
  }
}