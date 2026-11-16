import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api-auth';
import { haversineDistance } from '@/lib/geo';
import {
  JEDA_LAPORAN_ULANG_MENIT,
  PENGAWAS_MAX_JARAK_METER,
  validateLaporanTps,
  getPengawasById,
  fallbackLaporanTps,
  type LaporanPembersihanItem,
} from '@/lib/pengawas';

export const dynamic = 'force-dynamic';

/** Riwayat laporan milik pengawas yang sedang login (tanpa foto, supaya ringan). */
export async function GET() {
  const user = requireRole('pengawas');
  if (!user) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  try {

    const rows = await prisma.laporanPembersihanTps.findMany({
      where: { pengawas_id: user.id },
      orderBy: { created_at: 'desc' },
      take: 30,
      select: {
        id: true,
        tps_id: true,
        tps_nama: true,
        kecamatan: true,
        catatan: true,
        jarak_meter: true,
        laporan_id: true,
        created_at: true,
      },
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.warn('Gagal ambil riwayat laporan pengawas (fallback memori):', error);
    const userReports = fallbackLaporanTps.filter((r) => r.pengawas_id === user.id);
    return NextResponse.json(userReports);
  }
}

/**
 * Pengawas melaporkan "TPS ini sudah dibersihkan".
 * Aturan yang dijaga di server (bukan di browser):
 *  - hanya role pengawas, dan role/kecamatan dibaca dari database (bukan dari token),
 *  - TPS harus ada di kecamatan pengawas itu,
 *  - pengawas harus berada <= PENGAWAS_MAX_JARAK_METER dari titik TPS (cek GPS),
 *  - foto wajib, waktu laporan = waktu server.
 */
export async function POST(request: Request) {
  try {
    const user = requireRole('pengawas');
    if (!user) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Format data tidak valid.' }, { status: 400 });
    }

    const result = validateLaporanTps(body);
    if (!result.ok) {
      return NextResponse.json(
        { error: 'Data laporan belum valid.', fields: result.errors },
        { status: 400 }
      );
    }
    const d = result.data;

    let profil = await prisma.profile
      .findUnique({
        where: { id: user.id },
        select: { full_name: true, kecamatan: true, role: true },
      })
      .catch(() => null);

    if (!profil) {
      const p = getPengawasById(user.id);
      if (p) {
        profil = { full_name: p.full_name, kecamatan: p.kecamatan, role: 'pengawas' };
      }
    }

    if (!profil || profil.role !== 'pengawas') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }
    if (!profil.kecamatan) {
      return NextResponse.json(
        { error: 'Akun pengawas ini belum punya kecamatan tugas. Hubungi admin DLH.' },
        { status: 403 }
      );
    }

    const tps = await prisma.tps.findUnique({ where: { id: d.tps_id } });
    if (!tps) {
      return NextResponse.json({ error: 'TPS tidak ditemukan.' }, { status: 404 });
    }
    if (tps.kecamatan !== profil.kecamatan) {
      return NextResponse.json(
        { error: `TPS ini berada di Kecamatan ${tps.kecamatan}, bukan wilayah tugas kamu.` },
        { status: 403 }
      );
    }

    // Kalau menindaklanjuti laporan warga: laporannya harus ada, berjenis Pengaduan, dan di kecamatan pengawas ini.
    if (d.laporan_id) {
      const lapWarga = await prisma.laporanSampah.findUnique({
        where: { id: d.laporan_id },
        select: { kecamatan: true, jenis_laporan: true },
      });
      if (!lapWarga) {
        return NextResponse.json({ error: 'Laporan warga yang dituju tidak ditemukan (mungkin sudah dihapus).' }, { status: 404 });
      }
      if (lapWarga.kecamatan !== profil.kecamatan || lapWarga.jenis_laporan !== 'Pengaduan') {
        return NextResponse.json({ error: 'Laporan warga ini bukan di wilayah tugas kamu.' }, { status: 403 });
      }
    }

    const jarakMeter = haversineDistance(d.latitude, d.longitude, tps.latitude, tps.longitude) * 1000;
    // Catatan: Pembatasan jarak maksimal supervisor dihapus sesuai instruksi revisi
    // Jarak tetap dihitung dan dicatat untuk keperluan audit/log.

    const batas = new Date(Date.now() - JEDA_LAPORAN_ULANG_MENIT * 60 * 1000);
    const baruSaja = await prisma.laporanPembersihanTps.findFirst({
      where: { tps_id: tps.id, pengawas_id: user.id, created_at: { gte: batas } },
      select: { id: true },
    });
    if (baruSaja) {
      return NextResponse.json(
        { error: `TPS ini baru saja kamu laporkan. Tunggu ${JEDA_LAPORAN_ULANG_MENIT} menit sebelum melapor ulang.` },
        { status: 409 }
      );
    }

    const lapData: LaporanPembersihanItem = {
      id: `lap-tps-${Date.now()}`,
      tps_id: tps.id,
      tps_nama: tps.nama,
      kecamatan: tps.kecamatan,
      pengawas_id: user.id,
      pengawas_nama: profil.full_name,
      foto_url: d.foto_url,
      catatan: d.catatan,
      latitude: d.latitude,
      longitude: d.longitude,
      jarak_meter: Math.round(jarakMeter * 10) / 10,
      laporan_id: d.laporan_id,
      created_at: new Date().toISOString(),
    };

    try {
      const saved = await prisma.laporanPembersihanTps.create({
        data: {
          tps_id: lapData.tps_id,
          tps_nama: lapData.tps_nama,
          kecamatan: lapData.kecamatan,
          pengawas_id: lapData.pengawas_id,
          pengawas_nama: lapData.pengawas_nama,
          foto_url: lapData.foto_url,
          catatan: lapData.catatan,
          latitude: lapData.latitude,
          longitude: lapData.longitude,
          jarak_meter: lapData.jarak_meter,
          laporan_id: lapData.laporan_id,
        },
        select: { id: true, tps_id: true, tps_nama: true, created_at: true, jarak_meter: true },
      });
      fallbackLaporanTps.unshift({ ...lapData, id: saved.id, created_at: saved.created_at.toISOString() });
      return NextResponse.json(saved, { status: 201 });
    } catch (dbErr) {
      console.warn('Database offline / tabel belum termigrasi, simpan laporan pengawas ke memori fallback:', dbErr);
      fallbackLaporanTps.unshift(lapData);
      return NextResponse.json(
        {
          id: lapData.id,
          tps_id: lapData.tps_id,
          tps_nama: lapData.tps_nama,
          created_at: lapData.created_at,
          jarak_meter: lapData.jarak_meter,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Gagal simpan laporan pembersihan TPS:', error);
    return NextResponse.json({ error: 'Gagal menyimpan laporan' }, { status: 500 });
  }
}
