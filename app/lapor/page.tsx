'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { KECAMATAN_SAMARINDA } from '@/lib/mock-data';
import { useReports } from '@/context/ReportContext';
import { useAuth } from '@/context/AuthContext';

export default function LaporSampahPage() {
  const router = useRouter();
  const { addReport } = useReports();
  const { user, loading: authLoading } = useAuth();

  const [jenisLaporan, setJenisLaporan] = useState<'Pengaduan' | 'Gotong Royong'>('Pengaduan');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [kecamatan, setKecamatan] = useState(KECAMATAN_SAMARINDA[0]);
  const [kelurahan, setKelurahan] = useState('');
  const [urgensi, setUrgensi] = useState<'Kritis' | 'Sedang' | 'Normal'>('Sedang');
  const [latitude, setLatitude] = useState<number | ''>(-0.5021);
  const [longitude, setLongitude] = useState<number | ''>(117.1536);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  const [tanggalRencana, setTanggalRencana] = useState('');
  const [jumlahPeserta, setJumlahPeserta] = useState<number | ''>('');
  const [namaPemohon, setNamaPemohon] = useState('');
  const [institusi, setInstitusi] = useState('');
  const [suratPermohonan, setSuratPermohonan] = useState<string | null>(null);
  const [suratPermohonanName, setSuratPermohonanName] = useState<string | null>(null);
  const [suratError, setSuratError] = useState<string | null>(null);

  const handleGetLocation = () => {
    setIsDetectingGps(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(parseFloat(pos.coords.latitude.toFixed(6)));
          setLongitude(parseFloat(pos.coords.longitude.toFixed(6)));
          setIsDetectingGps(false);
        },
        () => {
          setLatitude(-0.4912);
          setLongitude(117.1365);
          setIsDetectingGps(false);
        }
      );
    } else {
      setIsDetectingGps(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSuratUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSuratError(null);
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setSuratError('File harus berformat PDF.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSuratError('Ukuran file maksimal 5MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSuratPermohonan(reader.result as string);
      setSuratPermohonanName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (jenisLaporan === 'Gotong Royong' && (!namaPemohon || !institusi || !suratPermohonan)) {
      setSuratError(!suratPermohonan ? 'Surat Permohonan (PDF) wajib diupload.' : null);
      alert('Nama Pemohon, Institusi/Lembaga, dan Surat Permohonan wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    const defaultPhoto =
      photoPreview ||
      'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80';

    const created = await addReport({
      user_id: user.id,
      user_name: user.full_name,
      jenis_laporan: jenisLaporan,
      title,
      description,
      latitude: Number(latitude) || -0.5021,
      longitude: Number(longitude) || 117.1536,
      kecamatan,
      kelurahan: kelurahan || 'Samarinda',
      foto_url: defaultPhoto,
      urgensi: jenisLaporan === 'Gotong Royong' ? 'Normal' : urgensi,
      tanggal_rencana: jenisLaporan === 'Gotong Royong' ? tanggalRencana || null : null,
      jumlah_peserta: jenisLaporan === 'Gotong Royong' ? Number(jumlahPeserta) || null : null,
      nama_pemohon: jenisLaporan === 'Gotong Royong' ? namaPemohon || null : null,
      institusi: jenisLaporan === 'Gotong Royong' ? institusi || null : null,
      surat_permohonan_url: jenisLaporan === 'Gotong Royong' ? suratPermohonan || null : null,
    });

    setIsSubmitting(false);

    if (!created) {
      alert('Gagal mengirim laporan, coba lagi.');
      return;
    }

    setSuccessMessage(true);
    setTimeout(() => {
      router.push(`/laporan/${created.id}`);
    }, 1000);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header />
        <main className="pt-20 px-4 max-w-lg mx-auto">
          <p className="text-xs text-on-surface-variant text-center">Memuat...</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header />
        <main className="pt-20 px-4 max-w-lg mx-auto">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-on-surface">Login Diperlukan</h1>
              <p className="text-xs text-on-surface-variant mt-1">
                Untuk membuat laporan sampah, silakan login atau daftar akun terlebih dahulu.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => router.push('/login')}
                className="w-full py-3 bg-primary text-on-primary font-bold text-sm rounded-2xl shadow-md hover:bg-primary/90 transition-all"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/daftar')}
                className="w-full py-3 bg-surface-container text-on-surface font-bold text-sm rounded-2xl hover:bg-surface-container-high transition-all"
              >
                Daftar Akun Baru
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="pt-20 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-on-surface">
              {jenisLaporan === 'Gotong Royong' ? 'Permohonan Gotong Royong' : 'Formulir Lapor Sampah'}
            </h1>
            <p className="text-xs text-on-surface-variant">
              Dinas Lingkungan Hidup Kota Samarinda
            </p>
          </div>
        </div>

        {/* Type Selector */}
        <div className="grid grid-cols-2 gap-2 mb-5 bg-surface-container-low p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setJenisLaporan('Pengaduan')}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              jenisLaporan === 'Pengaduan'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">report</span>
            Laporan Pengaduan
          </button>
          <button
            type="button"
            onClick={() => setJenisLaporan('Gotong Royong')}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              jenisLaporan === 'Gotong Royong'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">groups</span>
            Gotong Royong
          </button>
        </div>

        {jenisLaporan === 'Gotong Royong' && (
          <div className="mb-5 p-3.5 rounded-2xl bg-tertiary-container/40 border border-tertiary/20 flex gap-2.5">
            <span className="material-symbols-outlined text-tertiary text-[20px] shrink-0">info</span>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Permohonan ini akan direview dulu oleh petugas DLH sebelum disetujui dan dijadwalkan.
            </p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-primary-container text-on-primary-container flex items-center gap-3 shadow-md animate-fade-in">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
            <div>
              <p className="font-bold text-sm">
                {jenisLaporan === 'Gotong Royong' ? 'Permohonan Berhasil Diajukan!' : 'Laporan Berhasil Terkirim!'}
              </p>
              <p className="text-xs">
                {jenisLaporan === 'Gotong Royong'
                  ? 'Petugas DLH akan segera meninjau permohonan Anda.'
                  : 'Petugas DLH akan segera meninjau dan menindaklanjuti laporan Anda.'}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30">
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Foto {jenisLaporan === 'Gotong Royong' ? '(Opsional)' : 'Bukti Sampah *'}
            </label>
            {photoPreview ? (
              <div className="relative w-full h-48 rounded-xl overflow-hidden group">
                <img src={photoPreview} alt="Foto" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-error text-on-error flex items-center justify-center shadow-md"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ) : (
              <label className="w-full h-44 rounded-xl border-2 border-dashed border-primary/40 bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">photo_camera</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-primary">Ambil Foto / Upload Gambar</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">Dukung format JPG, PNG (Maks 5MB)</p>
                </div>
                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
              </label>
            )}
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Lokasi Presisi GPS *</label>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isDetectingGps}
                className="px-3 py-1.5 bg-secondary-container text-on-secondary-container text-xs font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1"
              >
                <span className={`material-symbols-outlined text-[16px] ${isDetectingGps ? 'animate-spin' : ''}`}>
                  {isDetectingGps ? 'progress_activity' : 'my_location'}
                </span>
                {isDetectingGps ? 'Mendeteksi...' : 'Ambil GPS'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] font-medium text-on-surface-variant">Latitude</span>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
                  required
                  className="w-full mt-1 px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <span className="text-[11px] font-medium text-on-surface-variant">Longitude</span>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  required
                  className="w-full mt-1 px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-medium text-on-surface-variant mb-1">Kecamatan *</label>
                <select
                  value={kecamatan}
                  onChange={(e) => setKecamatan(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium"
                >
                  {KECAMATAN_SAMARINDA.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-on-surface-variant mb-1">Kelurahan / RT</label>
                <input
                  type="text"
                  placeholder="Contoh: Air Putih RT 12"
                  value={kelurahan}
                  onChange={(e) => setKelurahan(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>

          {jenisLaporan === 'Gotong Royong' && (
            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 space-y-3">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Detail Kegiatan
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-on-surface-variant mb-1">Tanggal Rencana *</label>
                  <input
                    type="date"
                    value={tanggalRencana}
                    onChange={(e) => setTanggalRencana(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-on-surface-variant mb-1">Perkiraan Jumlah Peserta *</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Contoh: 25"
                    value={jumlahPeserta}
                    onChange={(e) => setJumlahPeserta(e.target.value === '' ? '' : parseInt(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-on-surface-variant mb-1">Nama Pemohon *</label>
                  <input
                    type="text"
                    placeholder="Nama lengkap penanggung jawab"
                    value={namaPemohon}
                    onChange={(e) => setNamaPemohon(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-on-surface-variant mb-1">Institusi / Lembaga / Organisasi *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Karang Taruna RT 12"
                    value={institusi}
                    onChange={(e) => setInstitusi(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="block text-[11px] font-medium text-on-surface-variant mb-1">Surat Permohonan (PDF) *</label>
                {suratPermohonanName ? (
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-primary text-[18px] shrink-0">picture_as_pdf</span>
                      <span className="text-xs font-medium text-on-surface truncate">{suratPermohonanName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSuratPermohonan(null);
                        setSuratPermohonanName(null);
                      }}
                      className="w-7 h-7 rounded-full bg-error/10 text-error flex items-center justify-center shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ) : (
                  <label className="w-full py-4 rounded-xl border-2 border-dashed border-primary/40 bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center">
                    <span className="material-symbols-outlined text-primary text-xl">upload_file</span>
                    <p className="text-xs font-bold text-primary">Upload Surat Permohonan</p>
                    <p className="text-[10px] text-on-surface-variant">Format PDF, maks 5MB</p>
                    <input type="file" accept="application/pdf" onChange={handleSuratUpload} className="hidden" />
                  </label>
                )}
                {suratError && (
                  <p className="text-[11px] text-error mt-1.5">{suratError}</p>
                )}
              </div>
            </div>
          )}

          {jenisLaporan === 'Pengaduan' && (
            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2.5">
                Tingkat Urgensi Sampah *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Normal', 'Sedang', 'Kritis'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setUrgensi(level)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border text-center ${
                      urgensi === level
                        ? level === 'Kritis'
                          ? 'bg-error text-on-error border-error shadow-sm'
                          : level === 'Sedang'
                          ? 'bg-tertiary-container text-on-tertiary-container border-tertiary-container shadow-sm'
                          : 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 space-y-3">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                {jenisLaporan === 'Gotong Royong' ? 'Judul Kegiatan *' : 'Judul Laporan *'}
              </label>
              <input
                type="text"
                placeholder={
                  jenisLaporan === 'Gotong Royong'
                    ? 'Contoh: Kerja Bakti Bersih Sungai RT 12'
                    : 'Contoh: Tumpukan Sampah Plastik di Pinggir Jalan'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                {jenisLaporan === 'Gotong Royong' ? 'Alasan / Tujuan Kegiatan *' : 'Deskripsi Detail *'}
              </label>
              <textarea
                rows={3}
                placeholder={
                  jenisLaporan === 'Gotong Royong'
                    ? 'Jelaskan latar belakang kegiatan dan bantuan yang dibutuhkan dari DLH...'
                    : 'Jelaskan kondisi lokasi, jenis sampah, dan dampak bagi warga...'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-primary text-on-primary font-bold text-sm rounded-2xl shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                Mengirim...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">send</span>
                {jenisLaporan === 'Gotong Royong' ? 'Ajukan Permohonan' : 'Kirim Laporan Sampah'}
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}