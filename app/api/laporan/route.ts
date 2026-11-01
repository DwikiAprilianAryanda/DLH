import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { INITIAL_REPORTS } from '@/lib/mock-data';
import { getCurrentUserFromToken } from '@/lib/auth';
import { validateLaporan } from '@/lib/laporan-validation';

const prisma = new PrismaClient();

// Proteksi Anti-Spam & Anti-Duplikasi: Lacak pengiriman laporan per user
const reportRateLimits = new Map<string, { count: number; resetTime: number }>();
const recentSubmissions = new Map<string, { title: string; timestamp: number }>();

function checkReportRateLimit(userId: string, maxAttempts = 5, windowMs = 60 * 1000): boolean {
  const now = Date.now();
  const record = reportRateLimits.get(userId);
  if (!record || now > record.resetTime) {
    reportRateLimits.set(userId, { count: 1, resetTime: now + windowMs });
    return false;
  }
  if (record.count >= maxAttempts) {
    return true;
  }
  record.count += 1;
  return false;
}

export async function GET() {
  try {
    const currentUser = getCurrentUserFromToken();
    const laporan = await prisma.laporanSampah.findMany({
      orderBy: { created_at: 'desc' },
    });
    const data = laporan && laporan.length > 0 ? laporan : INITIAL_REPORTS;
    const sanitized = data.map((item) => {
      const isOwner = currentUser && item.user_id === currentUser.id;
      const isAdmin = currentUser && currentUser.role === 'admin';
      // Minimalkan data publik: sembunyikan lampiran surat resmi (PDF base64) jika bukan admin atau pemilik laporan
      if (!isAdmin && !isOwner && item.surat_permohonan_url) {
        return { ...item, surat_permohonan_url: null };
      }
      return item;
    });
    return NextResponse.json(sanitized);
  } catch (error) {
    console.error('Gagal ambil data laporan (database offline), fallback ke INITIAL_REPORTS:', error);
    return NextResponse.json(INITIAL_REPORTS);
  }
}

export async function POST(request: Request) {
  try {
    // 1. Harus login — identitas pelapor diambil dari token, BUKAN dari body
    const currentUser = getCurrentUserFromToken();
    if (!currentUser) {
      return NextResponse.json({ error: 'Silakan login terlebih dahulu untuk mengirim laporan.' }, { status: 401 });
    }

    // 2. Body harus JSON valid
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Format data tidak valid.' }, { status: 400 });
    }

    // 3. Validasi + batas panjang/rentang semua field
    const result = validateLaporan(body);
    if (!result.ok) {
      const first = Object.values(result.errors)[0];
      return NextResponse.json({ error: first, fields: result.errors }, { status: 400 });
    }
    const d = result.data;
    const isGotongRoyong = d.jenis_laporan === 'Gotong Royong';

    // 4. Proteksi Rate Limiting & Anti-Duplikasi per user
    if (checkReportRateLimit(currentUser.id)) {
      return NextResponse.json(
        { error: 'Terlalu banyak laporan dikirim dalam waktu singkat. Mohon tunggu 1 menit.' },
        { status: 429 }
      );
    }

    const lastSub = recentSubmissions.get(currentUser.id);
    const now = Date.now();
    if (lastSub && lastSub.title === d.title && now - lastSub.timestamp < 15_000) {
      return NextResponse.json(
        { error: 'Laporan serupa baru saja Anda kirim. Mohon tunggu beberapa saat untuk mencegah duplikasi.' },
        { status: 409 }
      );
    }
    recentSubmissions.set(currentUser.id, { title: d.title, timestamp: now });

    const profile = await prisma.profile.findUnique({
      where: { id: currentUser.id },
      select: { id: true, full_name: true },
    });
    if (!profile) {
      return NextResponse.json({ error: 'Akun tidak ditemukan, silakan login ulang.' }, { status: 401 });
    }

    const laporan = await prisma.laporanSampah.create({
      data: {
        user_id: profile.id,
        user_name: profile.full_name,
        jenis_laporan: d.jenis_laporan,
        title: d.title,
        description: d.description,
        latitude: d.latitude,
        longitude: d.longitude,
        kecamatan: d.kecamatan,
        kelurahan: d.kelurahan,
        foto_url: d.foto_url,
        urgensi: d.urgensi,
        tanggal_rencana: d.tanggal_rencana,
        jumlah_peserta: d.jumlah_peserta,
        nama_pemohon: d.nama_pemohon,
        institusi: d.institusi,
        surat_permohonan_url: d.surat_permohonan_url,
        status: isGotongRoyong ? 'Menunggu Persetujuan' : 'Belum Ditangani',
      },
    });

    const notifPesan = isGotongRoyong
      ? `Permohonan gotong royong "${laporan.title}" telah diajukan dan menunggu persetujuan DLH.`
      : `Laporan "${laporan.title}" di ${laporan.kecamatan} telah terdaftar dan menunggu verifikasi petugas DLH.`;

    await prisma.notifikasi.create({
      data: {
        user_id: profile.id,
        judul: isGotongRoyong ? 'Permohonan Gotong Royong Terkirim' : 'Laporan Berhasil Dibuat',
        pesan: notifPesan,
      },
    });

    return NextResponse.json(laporan);
  } catch (error) {
    // Detail error hanya di log server, user cukup dapat pesan umum
    console.error('Gagal kirim laporan:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan di server saat menyimpan laporan. Coba lagi beberapa saat.' },
      { status: 500 }
    );
  }
}