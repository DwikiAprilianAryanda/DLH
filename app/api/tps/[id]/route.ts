import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserFromToken } from '@/lib/auth';
import { KECAMATAN_SAMARINDA } from '@/lib/mock-data';

const prisma = new PrismaClient();
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

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

    if (body.kecamatan !== undefined) {
      if (!(KECAMATAN_SAMARINDA as readonly string[]).includes(body.kecamatan)) {
        return NextResponse.json({ error: 'Pilihan kecamatan TPS tidak valid' }, { status: 400 });
      }
    }

    if (body.latitude !== undefined || body.longitude !== undefined) {
      const lat = body.latitude !== undefined ? Number(body.latitude) : 0;
      const lng = body.longitude !== undefined ? Number(body.longitude) : 117;
      if (body.latitude !== undefined && (isNaN(lat) || lat < -2.5 || lat > 2.5)) {
        return NextResponse.json({ error: 'Latitude di luar batas wilayah Samarinda (-2.5 s/d 2.5)' }, { status: 400 });
      }
      if (body.longitude !== undefined && (isNaN(lng) || lng < 113.5 || lng > 119.0)) {
        return NextResponse.json({ error: 'Longitude di luar batas wilayah Samarinda (113.5 s/d 119.0)' }, { status: 400 });
      }
    }

    if (body.jam_buka && !TIME_REGEX.test(body.jam_buka)) {
      return NextResponse.json({ error: 'Format jam buka harus HH:mm (contoh: 06:00)' }, { status: 400 });
    }
    if (body.jam_tutup && !TIME_REGEX.test(body.jam_tutup)) {
      return NextResponse.json({ error: 'Format jam tutup harus HH:mm (contoh: 18:00)' }, { status: 400 });
    }

    if (body.jumlah_bak !== undefined && body.jumlah_bak !== null && body.jumlah_bak !== '') {
      const bak = Number(body.jumlah_bak);
      if (isNaN(bak) || bak < 1 || bak > 30) {
        return NextResponse.json({ error: 'Jumlah bak harus berupa angka wajar antara 1 hingga 30 unit' }, { status: 400 });
      }
    }

    if (body.jam_buka && body.jam_tutup && body.jam_buka === body.jam_tutup) {
      return NextResponse.json({ error: 'Jam buka dan jam tutup operasional TPS tidak boleh sama' }, { status: 400 });
    }

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