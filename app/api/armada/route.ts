import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api-auth';
import { INITIAL_ARMADA } from '@/lib/mock-data';
import { validateArmada } from '@/lib/armada';
import { hariIniWita, parseTanggal, rentangBulan } from '@/lib/waktu';

// Data berubah terus (CRUD + ritase harian); jangan sampai di-cache saat build.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const armada = await prisma.armada.findMany({
      orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
    });

    const hariIni = hariIniWita();
    const { gte, lt } = rentangBulan(hariIni);
    const [bulanan, harian] = await Promise.all([
      prisma.ritaseArmada.groupBy({
        by: ['armada_id'],
        where: { tanggal: { gte, lt } },
        _sum: { jumlah_trip: true },
      }),
      prisma.ritaseArmada.findMany({
        where: { tanggal: parseTanggal(hariIni) as Date },
        select: { armada_id: true, jumlah_trip: true },
      }),
    ]);

    const perBulan = new Map(bulanan.map((r) => [r.armada_id, r._sum.jumlah_trip ?? 0]));
    const perHari = new Map(harian.map((r) => [r.armada_id, r.jumlah_trip]));

    return NextResponse.json(
      armada.map((a) => ({
        ...a,
        ritase_hari_ini: perHari.get(a.id) ?? 0,
        ritase_bulan_ini: perBulan.get(a.id) ?? 0,
      }))
    );
  } catch (error) {
    // Database tidak bisa dihubungi (mis. demo offline): tampilkan data cadangan dari PDF.
    console.error('Gagal ambil data armada (database offline), fallback ke INITIAL_ARMADA:', error);
    return NextResponse.json(
      INITIAL_ARMADA.map((a) => ({ ...a, ritase_hari_ini: 0, ritase_bulan_ini: 0 }))
    );
  }
}

export async function POST(request: Request) {
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

    const result = validateArmada(body, 'create');
    if (!result.ok) {
      return NextResponse.json(
        { error: 'Data armada belum valid.', fields: result.errors },
        { status: 400 }
      );
    }

    const d = result.data;
    const armada = await prisma.armada.create({
      data: {
        nama_armada: d.nama_armada!,
        jenis_armada: d.jenis_armada!,
        bagian_pekerjaan: d.bagian_pekerjaan!,
        plat_nomor: d.plat_nomor!,
        tahun: d.tahun!,
        kecamatan_tugas: d.kecamatan_tugas!,
        nama_petugas: d.nama_petugas!,
        telepon: d.telepon!,
        status: d.status!,
      },
    });

    return NextResponse.json(
      { ...armada, ritase_hari_ini: 0, ritase_bulan_ini: 0 },
      { status: 201 }
    );
  } catch (error) {
    console.error('Gagal tambah armada:', error);
    return NextResponse.json({ error: 'Gagal menambah armada' }, { status: 500 });
  }
}
