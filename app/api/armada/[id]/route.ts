import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api-auth';
import { validateArmada } from '@/lib/armada';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!requireRole('admin')) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Format data tidak valid.' }, { status: 400 });
    }

    const result = validateArmada(body, 'update');
    if (!result.ok) {
      return NextResponse.json(
        { error: 'Data armada belum valid.', fields: result.errors },
        { status: 400 }
      );
    }
    if (Object.keys(result.data).length === 0) {
      return NextResponse.json({ error: 'Tidak ada data yang diubah.' }, { status: 400 });
    }

    const ada = await prisma.armada.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!ada) {
      return NextResponse.json({ error: 'Armada tidak ditemukan' }, { status: 404 });
    }

    const updated = await prisma.armada.update({ where: { id: params.id }, data: result.data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Gagal update armada:', error);
    return NextResponse.json({ error: 'Gagal update armada' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    if (!requireRole('admin')) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const ada = await prisma.armada.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!ada) {
      return NextResponse.json({ error: 'Armada tidak ditemukan' }, { status: 404 });
    }

    // Ritase tidak punya relasi ke armada, jadi dibersihkan bersamaan di sini.
    await prisma.$transaction([
      prisma.ritaseArmada.deleteMany({ where: { armada_id: params.id } }),
      prisma.armada.delete({ where: { id: params.id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Gagal hapus armada:', error);
    return NextResponse.json({ error: 'Gagal menghapus armada' }, { status: 500 });
  }
}
