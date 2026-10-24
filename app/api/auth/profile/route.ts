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

    const data: any = {};

    if (body.full_name !== undefined) {
      const trimmedName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
      if (!trimmedName || trimmedName.length < 3 || trimmedName.length > 50) {
        return NextResponse.json({ error: 'Nama lengkap harus antara 3 - 50 karakter' }, { status: 400 });
      }
      data.full_name = trimmedName;
    }

    if (body.phone !== undefined) {
      const cleanPhone = typeof body.phone === 'string' ? body.phone.trim() : '';
      if (cleanPhone && !/^[0-9]{10,15}$/.test(cleanPhone)) {
        return NextResponse.json({ error: 'Nomor telepon harus berupa 10-15 digit angka' }, { status: 400 });
      }
      data.phone = cleanPhone || null;
    }

    if (body.kecamatan !== undefined) {
      data.kecamatan = body.kecamatan;
    }

    const updated = await prisma.profile.update({
      where: { id: currentUser.id },
      data,
    });

    const { password: _, ...userWithoutPassword } = updated;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Gagal update profil:', error);
    return NextResponse.json({ error: 'Gagal update profil' }, { status: 500 });
  }
}