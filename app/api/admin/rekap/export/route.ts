import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api-auth';
import { KECAMATAN_SAMARINDA } from '@/lib/mock-data';
import { awalHariWitaDari, formatWaktuWita, hariIniWita, parseTanggal } from '@/lib/waktu';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const WITA_MS = 8 * 60 * 60 * 1000;
const NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const STATUS_LAPORAN = ['Menunggu Persetujuan', 'Belum Ditangani', 'Proses', 'Ditangani', 'Ditolak'] as const;

/** 'YYYY-MM' (bulan di WITA) dari sebuah waktu. */
function kunciBulan(d: Date): string {
  return new Date(d.getTime() + WITA_MS).toISOString().slice(0, 7);
}

function labelBulan(kunci: string): string {
  const [y, m] = kunci.split('-').map(Number);
  return `${NAMA_BULAN[m - 1]} ${y}`;
}

type Kolom = { header: string; key: string; width: number; wrap?: boolean };

function tambahSheet(wb: ExcelJS.Workbook, nama: string, kolom: Kolom[], baris: Record<string, unknown>[]) {
  const ws = wb.addWorksheet(nama, { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = kolom.map((k) => ({ header: k.header, key: k.key, width: k.width }));
  for (const b of baris) ws.addRow(b);

  const head = ws.getRow(1);
  head.font = { bold: true };
  head.alignment = { vertical: 'middle', wrapText: true };
  head.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8E6C9' } };
    cell.border = { bottom: { style: 'thin' } };
  });

  kolom.forEach((k, i) => {
    if (k.wrap) ws.getColumn(i + 1).alignment = { vertical: 'top', wrapText: true };
  });

  if (kolom.length > 0) {
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: kolom.length } };
  }
  return ws;
}

/**
 * Unduh rekap ke Excel (notulensi DLH poin 6). Khusus admin.
 * Query opsional: kecamatan, dari=YYYY-MM-DD, sampai=YYYY-MM-DD (tanggal WITA).
 * Foto/PDF base64 sengaja TIDAK dimasukkan.
 */
export async function GET(request: Request) {
  try {
    if (!requireRole('admin')) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const sp = new URL(request.url).searchParams;

    let kecamatan: string | null = sp.get('kecamatan');
    if (!kecamatan || kecamatan === 'Semua' || kecamatan === 'Semua Kecamatan') {
      kecamatan = null;
    } else if (!(KECAMATAN_SAMARINDA as readonly string[]).includes(kecamatan)) {
      return NextResponse.json({ error: 'Kecamatan tidak valid' }, { status: 400 });
    }

    const dari = sp.get('dari') || '';
    const sampai = sp.get('sampai') || '';
    const awal = dari ? awalHariWitaDari(dari) : null;
    const akhir = sampai ? awalHariWitaDari(sampai, 1) : null; // batas atas eksklusif
    if (dari && !awal) return NextResponse.json({ error: 'Format tanggal "dari" harus YYYY-MM-DD' }, { status: 400 });
    if (sampai && !akhir) return NextResponse.json({ error: 'Format tanggal "sampai" harus YYYY-MM-DD' }, { status: 400 });
    if (awal && akhir && awal >= akhir) {
      return NextResponse.json({ error: 'Tanggal "dari" harus sebelum atau sama dengan "sampai".' }, { status: 400 });
    }

    const rentangWaktu = awal || akhir ? { created_at: { ...(awal ? { gte: awal } : {}), ...(akhir ? { lt: akhir } : {}) } } : {};
    const rentangTanggal =
      awal || akhir
        ? {
            tanggal: {
              ...(dari ? { gte: parseTanggal(dari) as Date } : {}),
              ...(sampai ? { lte: parseTanggal(sampai) as Date } : {}),
            },
          }
        : {};
    const filterKec = kecamatan ? { kecamatan } : {};

    const [laporan, pembersihan, armada, ritase] = await Promise.all([
      prisma.laporanSampah.findMany({
        where: { ...filterKec, ...rentangWaktu },
        orderBy: { created_at: 'asc' },
        select: {
          id: true,
          created_at: true,
          updated_at: true,
          jenis_laporan: true,
          title: true,
          description: true,
          kecamatan: true,
          kelurahan: true,
          status: true,
          urgensi: true,
          user_name: true,
          catatan_petugas: true,
          tanggal_rencana: true,
          jumlah_peserta: true,
          nama_pemohon: true,
          institusi: true,
        },
      }),
      prisma.laporanPembersihanTps.findMany({
        where: { ...filterKec, ...rentangWaktu },
        orderBy: { created_at: 'asc' },
        select: {
          created_at: true,
          tps_nama: true,
          kecamatan: true,
          pengawas_nama: true,
          jarak_meter: true,
          catatan: true,
          laporan_id: true,
        },
      }),
      prisma.armada.findMany({ orderBy: [{ created_at: 'asc' }, { id: 'asc' }] }),
      prisma.ritaseArmada.findMany({
        where: rentangTanggal,
        orderBy: [{ tanggal: 'asc' }],
        select: { armada_id: true, tanggal: true, jumlah_trip: true, catatan: true },
      }),
    ]);

    // Survei: ikut filter lewat laporan asalnya (survei sendiri tidak menyimpan kecamatan)
    const survei = await prisma.surveiKepuasan.findMany({
      where: rentangWaktu,
      orderBy: { created_at: 'asc' },
      select: { laporan_id: true, rating: true, komentar: true, created_at: true },
    });
    const laporanSurvei = await prisma.laporanSampah.findMany({
      where: { id: { in: Array.from(new Set(survei.map((s) => s.laporan_id))) } },
      select: { id: true, kecamatan: true, title: true },
    });
    const infoLaporan = new Map(laporanSurvei.map((l) => [l.id, l]));
    // Judul laporan warga yang ditindaklanjuti pengawas (kolom "Tindak Lanjut Laporan")
    const idTertaut = Array.from(new Set(pembersihan.map((p) => p.laporan_id).filter((v): v is string => !!v)));
    const judulTertaut = new Map<string, string>();
    if (idTertaut.length > 0) {
      const lap = await prisma.laporanSampah.findMany({
        where: { id: { in: idTertaut } },
        select: { id: true, title: true },
      });
      for (const l of lap) judulTertaut.set(l.id, l.title);
    }

    const surveiTersaring = kecamatan
      ? survei.filter((s) => infoLaporan.get(s.laporan_id)?.kecamatan === kecamatan)
      : survei;

    const wb = new ExcelJS.Workbook();
    wb.creator = 'TROPIS DLH Kota Samarinda';
    wb.created = new Date();

    // ---- Sheet 1: Ringkasan per bulan ----
    const ringkas = wb.addWorksheet('Ringkasan');
    ringkas.addRow(['Rekap TROPIS - DLH Kota Samarinda']).font = { bold: true, size: 14 };
    ringkas.addRow(['Kecamatan', kecamatan ?? 'Semua kecamatan']);
    ringkas.addRow(['Periode', dari || sampai ? `${dari || 'awal'} s/d ${sampai || 'sekarang'}` : 'Semua data']);
    ringkas.addRow(['Diunduh', formatWaktuWita(new Date())]);
    ringkas.addRow([]);

    const perBulan = new Map<
      string,
      { total: number; pengaduan: number; gotong: number; status: Record<string, number>; survei: number; rating: number }
    >();
    const ambil = (k: string) => {
      let b = perBulan.get(k);
      if (!b) {
        b = { total: 0, pengaduan: 0, gotong: 0, status: {}, survei: 0, rating: 0 };
        perBulan.set(k, b);
      }
      return b;
    };
    for (const l of laporan) {
      const b = ambil(kunciBulan(l.created_at));
      b.total += 1;
      if (l.jenis_laporan === 'Gotong Royong') b.gotong += 1;
      else b.pengaduan += 1;
      b.status[l.status] = (b.status[l.status] ?? 0) + 1;
    }
    for (const s of surveiTersaring) {
      const b = ambil(kunciBulan(s.created_at));
      b.survei += 1;
      b.rating += s.rating;
    }

    const headRingkas = [
      'Bulan',
      'Total Laporan',
      'Pengaduan',
      'Gotong Royong',
      ...STATUS_LAPORAN,
      'Jumlah Survei',
      'Rata-rata Rating',
    ];
    const barisHead = ringkas.addRow(headRingkas);
    barisHead.font = { bold: true };
    barisHead.eachCell((c) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8E6C9' } };
      c.alignment = { wrapText: true, vertical: 'middle' };
    });

    const total = { total: 0, pengaduan: 0, gotong: 0, status: {} as Record<string, number>, survei: 0, rating: 0 };
    for (const kunci of Array.from(perBulan.keys()).sort()) {
      const b = perBulan.get(kunci)!;
      ringkas.addRow([
        labelBulan(kunci),
        b.total,
        b.pengaduan,
        b.gotong,
        ...STATUS_LAPORAN.map((s) => b.status[s] ?? 0),
        b.survei,
        b.survei > 0 ? Math.round((b.rating / b.survei) * 100) / 100 : '-',
      ]);
      total.total += b.total;
      total.pengaduan += b.pengaduan;
      total.gotong += b.gotong;
      total.survei += b.survei;
      total.rating += b.rating;
      for (const s of STATUS_LAPORAN) total.status[s] = (total.status[s] ?? 0) + (b.status[s] ?? 0);
    }
    const barisTotal = ringkas.addRow([
      'TOTAL',
      total.total,
      total.pengaduan,
      total.gotong,
      ...STATUS_LAPORAN.map((s) => total.status[s] ?? 0),
      total.survei,
      total.survei > 0 ? Math.round((total.rating / total.survei) * 100) / 100 : '-',
    ]);
    barisTotal.font = { bold: true };
    ringkas.addRow([]);
    ringkas.addRow([`Laporan pembersihan TPS oleh pengawas: ${pembersihan.length}`]);
    ringkas.getColumn(1).width = 24;
    for (let i = 2; i <= headRingkas.length; i++) ringkas.getColumn(i).width = 16;

    // ---- Sheet 2: Daftar laporan warga ----
    tambahSheet(
      wb,
      'Laporan',
      [
        { header: 'Tanggal Lapor (WITA)', key: 'tgl', width: 24 },
        { header: 'Jenis', key: 'jenis', width: 15 },
        { header: 'Judul', key: 'judul', width: 36, wrap: true },
        { header: 'Deskripsi', key: 'deskripsi', width: 50, wrap: true },
        { header: 'Kecamatan', key: 'kec', width: 20 },
        { header: 'Kelurahan/RT', key: 'kel', width: 20 },
        { header: 'Status', key: 'status', width: 20 },
        { header: 'Urgensi', key: 'urgensi', width: 10 },
        { header: 'Pelapor', key: 'pelapor', width: 22 },
        { header: 'Catatan Petugas', key: 'catatan', width: 40, wrap: true },
        { header: 'Update Terakhir (WITA)', key: 'update', width: 24 },
        { header: 'Tanggal Rencana (Gotong Royong)', key: 'rencana', width: 24 },
        { header: 'Jumlah Peserta', key: 'peserta', width: 12 },
        { header: 'Nama Pemohon', key: 'pemohon', width: 24 },
        { header: 'Institusi', key: 'institusi', width: 28 },
      ],
      laporan.map((l) => ({
        tgl: formatWaktuWita(l.created_at),
        jenis: l.jenis_laporan,
        judul: l.title,
        deskripsi: l.description,
        kec: l.kecamatan,
        kel: l.kelurahan ?? '-',
        status: l.status,
        urgensi: l.urgensi,
        pelapor: l.user_name,
        catatan: l.catatan_petugas ?? '-',
        update: formatWaktuWita(l.updated_at),
        rencana: l.tanggal_rencana ? formatWaktuWita(l.tanggal_rencana) : '-',
        peserta: l.jumlah_peserta ?? '-',
        pemohon: l.nama_pemohon ?? '-',
        institusi: l.institusi ?? '-',
      }))
    );

    // ---- Sheet 3: Survei kepuasan ----
    tambahSheet(
      wb,
      'Survei Kepuasan',
      [
        { header: 'Tanggal (WITA)', key: 'tgl', width: 24 },
        { header: 'Rating (1-5)', key: 'rating', width: 12 },
        { header: 'Komentar', key: 'komentar', width: 50, wrap: true },
        { header: 'Laporan', key: 'laporan', width: 36, wrap: true },
        { header: 'Kecamatan', key: 'kec', width: 20 },
      ],
      surveiTersaring.map((s) => ({
        tgl: formatWaktuWita(s.created_at),
        rating: s.rating,
        komentar: s.komentar ?? '-',
        laporan: infoLaporan.get(s.laporan_id)?.title ?? '-',
        kec: infoLaporan.get(s.laporan_id)?.kecamatan ?? '-',
      }))
    );

    // ---- Sheet 4: Pembersihan TPS (laporan pengawas) ----
    tambahSheet(
      wb,
      'Pembersihan TPS',
      [
        { header: 'Waktu Dibersihkan (WITA)', key: 'waktu', width: 26 },
        { header: 'TPS', key: 'tps', width: 34, wrap: true },
        { header: 'Kecamatan', key: 'kec', width: 20 },
        { header: 'Pengawas', key: 'pengawas', width: 26 },
        { header: 'Jarak Pengawas ke TPS (m)', key: 'jarak', width: 16 },
        { header: 'Catatan', key: 'catatan', width: 40, wrap: true },
        { header: 'Tindak Lanjut Laporan Warga', key: 'tertaut', width: 40, wrap: true },
      ],
      pembersihan.map((p) => ({
        waktu: formatWaktuWita(p.created_at),
        tps: p.tps_nama,
        kec: p.kecamatan,
        pengawas: p.pengawas_nama,
        jarak: p.jarak_meter === null ? '-' : Math.round(p.jarak_meter),
        catatan: p.catatan ?? '-',
        tertaut: p.laporan_id ? judulTertaut.get(p.laporan_id) ?? '(laporan sudah dihapus)' : '-',
      }))
    );

    // ---- Sheet 5 & 6: Armada + ritase ----
    const infoArmada = new Map(armada.map((a) => [a.id, a]));
    const totalRitase = new Map<string, number>();
    for (const r of ritase) totalRitase.set(r.armada_id, (totalRitase.get(r.armada_id) ?? 0) + r.jumlah_trip);

    tambahSheet(
      wb,
      'Armada',
      [
        { header: 'No', key: 'no', width: 6 },
        { header: 'Nama Armada', key: 'nama', width: 26 },
        { header: 'Jenis Armada', key: 'jenis', width: 16 },
        { header: 'Bagian Pekerjaan', key: 'bagian', width: 44, wrap: true },
        { header: 'Plat Nomor (KT)', key: 'plat', width: 16 },
        { header: 'Tahun', key: 'tahun', width: 8 },
        { header: 'Wilayah Kerja', key: 'wilayah', width: 20 },
        { header: 'Petugas', key: 'petugas', width: 22 },
        { header: 'Telepon', key: 'telp', width: 16 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Total Ritase (periode)', key: 'ritase', width: 18 },
      ],
      armada.map((a, i) => ({
        no: i + 1,
        nama: a.nama_armada,
        jenis: a.jenis_armada,
        bagian: a.bagian_pekerjaan,
        plat: a.plat_nomor,
        tahun: a.tahun,
        wilayah: a.kecamatan_tugas,
        petugas: a.nama_petugas,
        telp: a.telepon,
        status: a.status,
        ritase: totalRitase.get(a.id) ?? 0,
      }))
    );

    tambahSheet(
      wb,
      'Ritase Harian',
      [
        { header: 'Tanggal', key: 'tgl', width: 14 },
        { header: 'Armada', key: 'nama', width: 26 },
        { header: 'Jenis', key: 'jenis', width: 16 },
        { header: 'Plat Nomor (KT)', key: 'plat', width: 16 },
        { header: 'Jumlah Ritase (pulang-pergi)', key: 'trip', width: 18 },
        { header: 'Catatan', key: 'catatan', width: 40, wrap: true },
      ],
      ritase.map((r) => {
        const a = infoArmada.get(r.armada_id);
        return {
          tgl: r.tanggal.toISOString().slice(0, 10),
          nama: a?.nama_armada ?? '(armada sudah dihapus)',
          jenis: a?.jenis_armada ?? '-',
          plat: a?.plat_nomor ?? '-',
          trip: r.jumlah_trip,
          catatan: r.catatan ?? '-',
        };
      })
    );

    const buffer = await wb.xlsx.writeBuffer();
    return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="rekap-tropis-${hariIniWita()}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Gagal membuat ekspor Excel:', error);
    return NextResponse.json({ error: 'Gagal membuat file Excel' }, { status: 500 });
  }
}
