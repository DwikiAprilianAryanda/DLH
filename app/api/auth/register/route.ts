import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { full_name, email, password, phone } = await request.json();

    const trimmedName = typeof full_name === 'string' ? full_name.trim() : '';
    if (!trimmedName || !email || !password) {
      return NextResponse.json({ error: 'Nama, email, dan password wajib diisi' }, { status: 400 });
    }

    if (trimmedName.length < 3 || trimmedName.length > 50) {
      return NextResponse.json({ error: 'Nama lengkap harus antara 3 - 50 karakter' }, { status: 400 });
    }

    const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
    if (cleanPhone && !/^[0-9]{10,15}$/.test(cleanPhone)) {
      return NextResponse.json({ error: 'Nomor HP harus berupa 10-15 digit angka' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    const existing = await prisma.profile.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 });
    }

    const hashed = await hashPassword(password);

    const user = await prisma.profile.create({
      data: {
        full_name: trimmedName,
        email: email.trim().toLowerCase(),
        password: hashed,
        phone: cleanPhone || null,
        role: 'warga',
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Gagal daftar:', error);
    return NextResponse.json({ error: 'Gagal mendaftar' }, { status: 500 });
  }
}