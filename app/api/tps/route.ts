import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserFromToken } from '@/lib/auth';
import { TPS_SEED_DATA } from '@/lib/tps-seed-data';
import { KECAMATAN_SAMARINDA } from '@/lib/mock-data';

const prisma = new PrismaClient();
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const FALLBACK_TPS = TPS_SEED_DATA.map((t, idx) => ({
  id: `tps-${idx + 1}`,
  nama: t.nama,
  kecamatan: t.kecamatan,
  latitude: t.latitude,
  longitude: t.longitude,
  bangunan: t.bangunan,
  mobilitas: t.mobilitas,
  jumlah_bak: t.jumlah_bak,
  jenis: t.jenis,
  jam_buka: '06:00',
  jam_tutup: '18:00',
  created_at: new Date().toISOString(),
}));

const globalForTps = globalThis as unknown as { customTpsList?: any[] };
const customTpsList: any[] = globalForTps.customTpsList ?? [];
if (process.env.NODE_ENV !== 'production') {
  globalForTps.customTpsList = customTpsList;
}

export async function GET() {
  try {
    const tps = await prisma.tps.findMany({
      orderBy: { nama: 'asc' },
    });
    const baseList = tps && tps.length > 0 ? tps : FALLBACK_TPS;
    const combined = [
      ...customTpsList.filter((c) => !baseList.some((b) => b.id === c.id)),
      ...baseList,
    ];
    return NextResponse.json(combined);
  } catch (error) {
    console.error('Gagal ambil data TPS (database offline), fallback ke seed data:', error);
    const combined = [
      ...customTpsList.filter((c) => !FALLBACK_TPS.some((b) => b.id === c.id)),
      ...FALLBACK_TPS,
    ];
    return NextResponse.json(combined);
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = getCurrentUserFromToken();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.nama || !body.kecamatan || body.latitude === undefined || body.longitude === undefined || body.latitude === '' || body.longitude === '') {
      return NextResponse.json({ error: 'Nama, kecamatan, latitude, dan longitude wajib diisi' }, { status: 400 });
    }

    if (!(KECAMATAN_SAMARINDA as readonly string[]).includes(body.kecamatan)) {
      return NextResponse.json({ error: 'Pilihan kecamatan TPS tidak valid' }, { status: 400 });
    }

    const lat = Number(body.latitude);
    const lng = Number(body.longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -2.5 || lat > 2.5 || lng < 113.5 || lng > 119.0) {
      return NextResponse.json(
        { error: 'Koordinat di luar batas wilayah Samarinda/Kaltim (lat: -2.5 s/d 2.5, lng: 113.5 s/d 119.0)' },
        { status: 400 }
      );
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

    const newTpsObj = {
      id: `tps-custom-${Date.now()}`,
      nama: body.nama,
      kecamatan: body.kecamatan,
      latitude: lat,
      longitude: lng,
      bangunan: body.bangunan || null,
      mobilitas: body.mobilitas || null,
      jumlah_bak: body.jumlah_bak ? Number(body.jumlah_bak) : null,
      jenis: body.jenis || null,
      jam_buka: body.jam_buka || null,
      jam_tutup: body.jam_tutup || null,
      created_at: new Date().toISOString(),
    };

    try {
      const tps = await prisma.tps.create({
        data: {
          id: newTpsObj.id,
          nama: newTpsObj.nama,
          kecamatan: newTpsObj.kecamatan,
          latitude: lat,
          longitude: lng,
          bangunan: newTpsObj.bangunan,
          mobilitas: newTpsObj.mobilitas,
          jumlah_bak: newTpsObj.jumlah_bak,
          jenis: newTpsObj.jenis,
          jam_buka: newTpsObj.jam_buka,
          jam_tutup: newTpsObj.jam_tutup,
        },
      });
      customTpsList.unshift(tps);
      return NextResponse.json(tps, { status: 201 });
    } catch (dbErr) {
      console.warn('Database offline / tabel tps belum termigrasi, simpan di memori fallback:', dbErr);
      customTpsList.unshift(newTpsObj);
      return NextResponse.json(newTpsObj, { status: 201 });
    }
  } catch (error) {
    console.error('Gagal tambah TPS:', error);
    return NextResponse.json({ error: 'Gagal tambah TPS' }, { status: 500 });
  }
}