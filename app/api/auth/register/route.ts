import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { full_name, email, password, phone } = await request.json();

    if (!full_name || !email || !password) {
      return NextResponse.json({ error: 'Nama, email, dan password wajib diisi' }, { status: 400 });
    }

    const existing = await prisma.profile.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 });
    }

    const hashed = await hashPassword(password);

    const user = await prisma.profile.create({
      data: {
        full_name,
        email,
        password: hashed,
        phone,
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