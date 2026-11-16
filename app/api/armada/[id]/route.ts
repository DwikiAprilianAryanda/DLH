import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api-auth';
import { validateArmada, customArmadas } from '@/lib/armada';
import { INITIAL_ARMADA } from '@/lib/mock-data';

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

    let updatedDb = null;
    try {
      const ada = await prisma.armada.findUnique({ where: { id: params.id }, select: { id: true } });
      if (ada) {
        updatedDb = await prisma.armada.update({ where: { id: params.id }, data: result.data });
      } else {
        const seedItem = INITIAL_ARMADA.find((a) => a.id === params.id);
        if (seedItem) {
          updatedDb = await prisma.armada.create({
            data: {
              id: seedItem.id,
              nama_armada: result.data.nama_armada ?? seedItem.nama_armada,
              jenis_armada: result.data.jenis_armada ?? seedItem.jenis_armada,
              bagian_pekerjaan: result.data.bagian_pekerjaan ?? seedItem.bagian_pekerjaan,
              plat_nomor: result.data.plat_nomor ?? seedItem.plat_nomor,
              tahun: result.data.tahun ?? seedItem.tahun,
              kecamatan_tugas: result.data.kecamatan_tugas ?? seedItem.kecamatan_tugas,
              nama_petugas: result.data.nama_petugas ?? seedItem.nama_petugas,
              telepon: result.data.telepon ?? seedItem.telepon,
              status: result.data.status ?? seedItem.status,
            },
          });
        }
      }
    } catch (dbErr) {
      console.warn('Database offline / error saat update armada:', dbErr);
    }

    // Perbarui di memori customArmadas
    const customIdx = customArmadas.findIndex((a) => a.id === params.id);
    if (customIdx >= 0) {
      customArmadas[customIdx] = { ...customArmadas[customIdx], ...result.data };
      return NextResponse.json(customArmadas[customIdx]);
    }

    const seedItem = INITIAL_ARMADA.find((a) => a.id === params.id);
    if (seedItem) {
      const merged = { ...seedItem, ...result.data };
      customArmadas.unshift(merged);
      return NextResponse.json(updatedDb ? { ...updatedDb, ...result.data } : merged);
    }

    if (updatedDb) {
      return NextResponse.json(updatedDb);
    }

    return NextResponse.json({ error: 'Armada tidak ditemukan' }, { status: 404 });
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

    // Bersihkan dari memori custom
    const customIdx = customArmadas.findIndex((a) => a.id === params.id);
    if (customIdx >= 0) {
      customArmadas.splice(customIdx, 1);
    }

    try {
      const ada = await prisma.armada.findUnique({ where: { id: params.id }, select: { id: true } });
      if (ada) {
        await prisma.$transaction([
          prisma.ritaseArmada.deleteMany({ where: { armada_id: params.id } }),
          prisma.armada.delete({ where: { id: params.id } }),
        ]);
      }
    } catch (dbErr) {
      console.warn('Database offline saat hapus armada:', dbErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Gagal hapus armada:', error);
    return NextResponse.json({ error: 'Gagal menghapus armada' }, { status: 500 });
  }
}
