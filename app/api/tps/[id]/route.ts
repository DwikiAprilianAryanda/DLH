import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserFromToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = getCurrentUserFromToken();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const body = await request.json();

    const data: any = {};
    if (body.nama !== undefined) data.nama = body.nama;
    if (body.kecamatan !== undefined) data.kecamatan = body.kecamatan;
    if (body.latitude !== undefined) data.latitude = Number(body.latitude);
    if (body.longitude !== undefined) data.longitude = Number(body.longitude);
    if (body.bangunan !== undefined) data.bangunan = body.bangunan || null;
    if (body.mobilitas !== undefined) data.mobilitas = body.mobilitas || null;
    if (body.jumlah_bak !== undefined) data.jumlah_bak = body.jumlah_bak ? Number(body.jumlah_bak) : null;
    if (body.jenis !== undefined) data.jenis = body.jenis || null;
    if (body.jam_buka !== undefined) data.jam_buka = body.jam_buka || null;
    if (body.jam_tutup !== undefined) data.jam_tutup = body.jam_tutup || null;

    const updated = await prisma.tps.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Gagal update TPS:', error);
    return NextResponse.json({ error: 'Gagal update TPS' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = getCurrentUserFromToken();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    await prisma.tps.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Gagal hapus TPS:', error);
    return NextResponse.json({ error: 'Gagal hapus TPS' }, { status: 500 });
  }
}