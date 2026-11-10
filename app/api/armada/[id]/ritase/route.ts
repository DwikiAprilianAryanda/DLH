import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api-auth';
import { validateRitase } from '@/lib/armada';
import { hariIniWita, parseTanggal, rentangBulan } from '@/lib/waktu';

export const dynamic = 'force-dynamic';

/** Riwayat ritase satu armada dalam satu bulan. ?bulan=YYYY-MM (default: bulan ini WITA). */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!requireRole('admin')) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const bulanParam = new URL(request.url).searchParams.get('bulan');
    const acuan = bulanParam && /^\d{4}-\d{2}$/.test(bulanParam) ? `${bulanParam}-01` : hariIniWita();
    if (!parseTanggal(acuan)) {
      return NextResponse.json({ error: 'Format bulan harus YYYY-MM' }, { status: 400 });
    }
    const { gte, lt } = rentangBulan(acuan);

    const rows = await prisma.ritaseArmada.findMany({
      where: { armada_id: params.id, tanggal: { gte, lt } },
      orderBy: { tanggal: 'desc' },
      select: { id: true, tanggal: true, jumlah_trip: true, catatan: true },
    });

    return NextResponse.json({
      bulan: acuan.slice(0, 7),
      total: rows.reduce((sum, r) => sum + r.jumlah_trip, 0),
      items: rows.map((r) => ({
        id: r.id,
        tanggal: r.tanggal.toISOString().slice(0, 10),
        jumlah_trip: r.jumlah_trip,
        catatan: r.catatan,
      })),
    });
  } catch (error) {
    console.error('Gagal ambil ritase armada:', error);
    return NextResponse.json({ error: 'Gagal mengambil data ritase' }, { status: 500 });
  }
}

/** Catat / koreksi ritase satu hari. Satu armada satu baris per hari (kirim lagi = timpa). */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireRole('admin');
    if (!user) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Format data tidak valid.' }, { status: 400 });
    }

    const result = validateRitase(body);
    if (!result.ok) {
      return NextResponse.json(
        { error: 'Data ritase belum valid.', fields: result.errors },
        { status: 400 }
      );
    }

    const armada = await prisma.armada.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!armada) {
      return NextResponse.json({ error: 'Armada tidak ditemukan' }, { status: 404 });
    }

    const tanggal = parseTanggal(result.data.tanggal) as Date;
    const saved = await prisma.ritaseArmada.upsert({
      where: { armada_id_tanggal: { armada_id: params.id, tanggal } },
      create: {
        armada_id: params.id,
        tanggal,
        jumlah_trip: result.data.jumlah_trip,
        catatan: result.data.catatan,
        dicatat_oleh: user.id,
      },
      update: {
        jumlah_trip: result.data.jumlah_trip,
        catatan: result.data.catatan,
        dicatat_oleh: user.id,
      },
    });

    return NextResponse.json({
      id: saved.id,
      tanggal: saved.tanggal.toISOString().slice(0, 10),
      jumlah_trip: saved.jumlah_trip,
      catatan: saved.catatan,
    });
  } catch (error) {
    console.error('Gagal simpan ritase armada:', error);
    return NextResponse.json({ error: 'Gagal menyimpan ritase' }, { status: 500 });
  }
}
