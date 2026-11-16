import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api-auth';
import { INITIAL_ARMADA, type ArmadaItem } from '@/lib/mock-data';
import { validateArmada, customArmadas } from '@/lib/armada';
import { hariIniWita, parseTanggal, rentangBulan } from '@/lib/waktu';

// Data berubah terus (CRUD + ritase harian); jangan sampai di-cache saat build.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbArmada = await prisma.armada.findMany({
      orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
    });

    const baseList = dbArmada && dbArmada.length > 0 ? dbArmada : INITIAL_ARMADA;
    const combined = [
      ...customArmadas.filter((c) => !baseList.some((b) => b.id === c.id)),
      ...baseList,
    ];

    const hariIni = hariIniWita();
    const { gte, lt } = rentangBulan(hariIni);
    let bulanan: { armada_id: string; _sum: { jumlah_trip: number | null } }[] = [];
    let harian: { armada_id: string; jumlah_trip: number }[] = [];

    try {
      [bulanan, harian] = await Promise.all([
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
    } catch {
      // Abaikan jika tabel ritase belum termigrasi
    }

    const perBulan = new Map(bulanan.map((r) => [r.armada_id, r._sum.jumlah_trip ?? 0]));
    const perHari = new Map(harian.map((r) => [r.armada_id, r.jumlah_trip]));

    return NextResponse.json(
      combined.map((a) => ({
        ...a,
        ritase_hari_ini: perHari.get(a.id) ?? (a as any).ritase_hari_ini ?? 0,
        ritase_bulan_ini: perBulan.get(a.id) ?? (a as any).ritase_bulan_ini ?? 0,
      }))
    );
  } catch (error) {
    console.error('Gagal ambil data armada (database offline), fallback ke INITIAL_ARMADA:', error);
    const combined = [
      ...customArmadas.filter((c) => !INITIAL_ARMADA.some((b) => b.id === c.id)),
      ...INITIAL_ARMADA,
    ];
    return NextResponse.json(
      combined.map((a) => ({ ...a, ritase_hari_ini: 0, ritase_bulan_ini: 0 }))
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
    const newArmadaObj: ArmadaItem = {
      id: `arm-new-${Date.now()}`,
      nama_armada: d.nama_armada!,
      jenis_armada: d.jenis_armada!,
      bagian_pekerjaan: d.bagian_pekerjaan || '-',
      plat_nomor: d.plat_nomor || '-',
      tahun: d.tahun || '-',
      kecamatan_tugas: d.kecamatan_tugas || '-',
      nama_petugas: d.nama_petugas || '-',
      telepon: d.telepon || '-',
      status: d.status || 'Tersedia',
      ritase_hari_ini: 0,
      ritase_bulan_ini: 0,
    };

    try {
      const armada = await prisma.armada.create({
        data: {
          id: newArmadaObj.id,
          nama_armada: newArmadaObj.nama_armada,
          jenis_armada: newArmadaObj.jenis_armada,
          bagian_pekerjaan: newArmadaObj.bagian_pekerjaan,
          plat_nomor: newArmadaObj.plat_nomor,
          tahun: newArmadaObj.tahun,
          kecamatan_tugas: newArmadaObj.kecamatan_tugas,
          nama_petugas: newArmadaObj.nama_petugas,
          telepon: newArmadaObj.telepon,
          status: newArmadaObj.status,
        },
      });
      customArmadas.unshift({
        ...armada,
        status: armada.status as any,
        ritase_hari_ini: 0,
        ritase_bulan_ini: 0,
      });
      return NextResponse.json(
        { ...armada, ritase_hari_ini: 0, ritase_bulan_ini: 0 },
        { status: 201 }
      );
    } catch (dbErr) {
      console.warn('Database offline / tabel armada belum termigrasi, simpan di memori fallback:', dbErr);
      customArmadas.unshift(newArmadaObj);
      return NextResponse.json(newArmadaObj, { status: 201 });
    }
  } catch (error) {
    console.error('Gagal tambah armada:', error);
    return NextResponse.json({ error: 'Gagal menambah armada' }, { status: 500 });
  }
}
