'use client';

import { useState } from 'react';
import { KECAMATAN_SAMARINDA, ReportItem } from '@/lib/mock-data';
import { useReports } from '@/context/ReportContext';

export default function ManajemenLaporanAdminPage() {
  const { reports, armada, updateReportStatus } = useReports();
  const [selectedKecamatan, setSelectedKecamatan] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [selectedJenis, setSelectedJenis] = useState('Semua');

  const [activeReport, setActiveReport] = useState<ReportItem | null>(null);
  const [selectedArmadaId, setSelectedArmadaId] = useState(armada[0]?.id || 'arm-01');
  const [catatan, setCatatan] = useState('');
  const [buktiFoto, setBuktiFoto] = useState<string | null>(null);
  const [buktiError, setBuktiError] = useState<string | null>(null);

  const [completingReport, setCompletingReport] = useState<ReportItem | null>(null);
  const [selesaiCatatan, setSelesaiCatatan] = useState('');
  const [selesaiFoto, setSelesaiFoto] = useState<string | null>(null);
  const [selesaiError, setSelesaiError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [rejectTarget, setRejectTarget] = useState<ReportItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleFotoBuktiUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFoto: (v: string | null) => void,
    setError: (v: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG/PNG).');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setFoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const filteredReports = reports.filter((r) => {
    if (selectedKecamatan !== 'Semua' && r.kecamatan !== selectedKecamatan) return false;
    if (selectedStatus !== 'Semua' && r.status !== selectedStatus) return false;
    if (selectedJenis !== 'Semua' && r.jenis_laporan !== selectedJenis) return false;
    return true;
  });

  const handleKirimArmada = async () => {
    if (!activeReport) return;
    if (!catatan.trim() || !buktiFoto) {
      setBuktiError(!buktiFoto ? 'Foto bukti wajib diupload.' : null);
      if (!catatan.trim()) alert('Catatan petugas wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    const ok = await updateReportStatus(activeReport.id, 'Proses', catatan, buktiFoto);
    setIsSubmitting(false);

    if (!ok) {
      alert('Gagal mengirim armada, coba lagi.');
      return;
    }

    setActiveReport(null);
    setCatatan('');
    setBuktiFoto(null);
  };

  const handleSelesaikan = async () => {
    if (!completingReport) return;
    if (!selesaiCatatan.trim() || !selesaiFoto) {
      setSelesaiError(!selesaiFoto ? 'Foto bukti wajib diupload.' : null);
      if (!selesaiCatatan.trim()) alert('Deskripsi penyelesaian wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    const ok = await updateReportStatus(completingReport.id, 'Ditangani', selesaiCatatan, selesaiFoto);
    setIsSubmitting(false);

    if (!ok) {
      alert('Gagal menyelesaikan laporan, coba lagi.');
      return;
    }

    setCompletingReport(null);
    setSelesaiCatatan('');
    setSelesaiFoto(null);
  };

  const handleApprove = (report: ReportItem) => {
    updateReportStatus(
      report.id,
      'Belum Ditangani',
      'Permohonan gotong royong disetujui dan akan dijadwalkan oleh petugas DLH.'
    );
  };

  const handleReject = () => {
    if (!rejectTarget) return;
    updateReportStatus(rejectTarget.id, 'Ditolak', rejectReason || undefined);
    setRejectTarget(null);
    setRejectReason('');
  };

  const statusBadgeClass = (status: ReportItem['status']) => {
    if (status === 'Ditangani') return 'bg-primary-container text-on-primary-container';
    if (status === 'Proses') return 'bg-secondary-container text-on-secondary-container';
    if (status === 'Menunggu Persetujuan') return 'bg-tertiary-container text-on-tertiary-container';
    if (status === 'Ditolak') return 'bg-surface-container-high text-on-surface-variant';
    return 'bg-error-container text-on-error-container';
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-on-surface">Laporan Pengaduan</h1>
          <p className="text-xs text-on-surface-variant">
            Verifikasi, disposisi armada kebersihan, dan pembaruan status laporan warga
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedJenis}
            onChange={(e) => setSelectedJenis(e.target.value)}
            className="px-3.5 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="Semua">Semua Jenis</option>
            <option value="Pengaduan">Pengaduan</option>
            <option value="Gotong Royong">Gotong Royong</option>
          </select>

          <select
            value={selectedKecamatan}
            onChange={(e) => setSelectedKecamatan(e.target.value)}
            className="px-3.5 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="Semua">Semua Kecamatan</option>
            {KECAMATAN_SAMARINDA.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3.5 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="Semua">Semua Status</option>
            <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
            <option value="Belum Ditangani">Belum Ditangani</option>
            <option value="Proses">Proses</option>
            <option value="Ditangani">Ditangani</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant uppercase tracking-wider font-bold border-b border-outline-variant/30">
              <tr>
                <th className="py-3.5 px-4">Detail Laporan</th>
                <th className="py-3.5 px-4">Wilayah & GPS</th>
                <th className="py-3.5 px-4">Urgensi</th>
                <th className="py-3.5 px-4">Status Saat Ini</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-medium text-on-surface">
              {filteredReports.map((report) => {
                const isGotongRoyong = report.jenis_laporan === 'Gotong Royong';
                const isPending = report.status === 'Menunggu Persetujuan';

                return (
                  <tr key={report.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-4 px-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={report.foto_url}
                          alt={report.title}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 bg-surface-container"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                                isGotongRoyong
                                  ? 'bg-secondary-container text-on-secondary-container'
                                  : 'bg-surface-container-high text-on-surface-variant'
                              }`}
                            >
                              {report.jenis_laporan}
                            </span>
                          </div>
                          <p className="font-bold text-on-surface line-clamp-1">
                            {report.title}
                          </p>
                          <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">
                            Pelapor: {report.user_name}
                          </p>
                          {isGotongRoyong && (
                            <>
                              <p className="text-[10px] text-on-surface-variant mt-0.5">
                                {report.tanggal_rencana
                                  ? new Date(report.tanggal_rencana).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : '-'}{' '}
                                &middot; {report.jumlah_peserta || '-'} peserta
                              </p>
                              {(report.nama_pemohon || report.institusi) && (
                                <p className="text-[10px] text-on-surface-variant mt-0.5 line-clamp-1">
                                  {report.nama_pemohon || '-'}
                                  {report.institusi ? ` · ${report.institusi}` : ''}
                                </p>
                              )}
                              {report.surat_permohonan_url && (
                                <a
                                  href={report.surat_permohonan_url}
                                  download={`Surat-Permohonan-${report.title}.pdf`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-primary hover:underline"
                                >
                                  <span className="material-symbols-outlined text-[13px]">picture_as_pdf</span>
                                  Lihat Surat Permohonan
                                </a>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-bold text-on-surface">{report.kecamatan}</p>
                      <p className="text-[11px] text-on-surface-variant">{report.kelurahan}</p>
                      <p className="text-[10px] text-on-surface-variant font-mono">
                        {report.latitude}, {report.longitude}
                      </p>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          report.urgensi === 'Kritis'
                            ? 'bg-error text-on-error'
                            : report.urgensi === 'Sedang'
                            ? 'bg-tertiary-container text-on-tertiary-container'
                            : 'bg-primary text-on-primary'
                        }`}
                      >
                        {report.urgensi}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(
                          report.status
                        )}`}
                      >
                        {report.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setRejectTarget(report)}
                            className="px-3 py-1.5 bg-surface-container text-on-surface-variant font-bold text-xs rounded-xl hover:bg-surface-container-high transition-all"
                          >
                            Tolak
                          </button>
                          <button
                            onClick={() => handleApprove(report)}
                            className="px-3 py-1.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary/90 transition-all shadow-xs"
                          >
                            Setujui
                          </button>
                        </div>
                      ) : report.status === 'Ditolak' ? (
                        <span className="text-[11px] text-on-surface-variant italic">Ditolak</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setActiveReport(report)}
                            className="px-3 py-1.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1 shadow-xs"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              local_shipping
                            </span>
                            Disposisi Armada
                          </button>

                          {report.status !== 'Ditangani' && (
                            <button
                              onClick={() => setCompletingReport(report)}
                              className="px-3 py-1.5 bg-primary-container text-on-primary-container font-bold text-xs rounded-xl hover:opacity-90 transition-opacity"
                            >
                              Selesaikan
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch Fleet Truck Modal */}
      {activeReport && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl space-y-4 border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface">
                Disposisi Armada Kebersihan
              </h3>
              <button
                onClick={() => setActiveReport(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low text-xs">
              <p className="font-bold text-on-surface">{activeReport.title}</p>
              <p className="text-on-surface-variant">
                Wilayah: {activeReport.kecamatan} ({activeReport.kelurahan})
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Pilih Armada Siaga DLH
              </label>
              <select
                value={selectedArmadaId}
                onChange={(e) => setSelectedArmadaId(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {armada.map((arm) => (
                  <option key={arm.id} value={arm.id}>
                    {arm.nama_armada} - {arm.nama_petugas} ({arm.kecamatan_tugas})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Catatan Petugas Disposisi *
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Armada Truk DLH-04 dikirim menuju lokasi RT 12 Antasari."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                required
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Foto Bukti Lapangan *
              </label>
              {buktiFoto ? (
                <div className="relative w-full h-36 rounded-xl overflow-hidden">
                  <img src={buktiFoto} alt="Bukti" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setBuktiFoto(null)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-error text-on-error flex items-center justify-center shadow-md"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ) : (
                <label className="w-full h-28 rounded-xl border-2 border-dashed border-primary/40 bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer">
                  <span className="material-symbols-outlined text-primary text-xl">add_a_photo</span>
                  <p className="text-[11px] font-bold text-primary">Upload Foto Bukti</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFotoBuktiUpload(e, setBuktiFoto, setBuktiError)}
                    className="hidden"
                  />
                </label>
              )}
              {buktiError && <p className="text-[11px] text-error mt-1.5">{buktiError}</p>}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setActiveReport(null);
                  setCatatan('');
                  setBuktiFoto(null);
                  setBuktiError(null);
                }}
                className="flex-1 py-2.5 bg-surface-container text-on-surface-variant font-bold text-xs rounded-xl hover:bg-surface-container-high"
              >
                Batal
              </button>
              <button
                onClick={handleKirimArmada}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary/90 shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Armada'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl space-y-4 border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface">Tolak Permohonan</h3>
              <button
                onClick={() => setRejectTarget(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low text-xs">
              <p className="font-bold text-on-surface">{rejectTarget.title}</p>
              <p className="text-on-surface-variant">Pemohon: {rejectTarget.user_name}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Alasan Penolakan
              </label>
              <textarea
                rows={3}
                placeholder="Jelaskan alasan permohonan ini ditolak..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              ></textarea>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setRejectTarget(null)}
                className="flex-1 py-2.5 bg-surface-container text-on-surface-variant font-bold text-xs rounded-xl hover:bg-surface-container-high"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-2.5 bg-error text-on-error font-bold text-xs rounded-xl hover:opacity-90 shadow-md"
              >
                Tolak Permohonan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Report Modal */}
      {completingReport && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl space-y-4 border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface">Selesaikan Laporan</h3>
              <button
                onClick={() => {
                  setCompletingReport(null);
                  setSelesaiCatatan('');
                  setSelesaiFoto(null);
                  setSelesaiError(null);
                }}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low text-xs">
              <p className="font-bold text-on-surface">{completingReport.title}</p>
              <p className="text-on-surface-variant">
                Wilayah: {completingReport.kecamatan} ({completingReport.kelurahan})
              </p>
            </div>

            <div className="p-3 rounded-xl bg-tertiary-container/30 border border-tertiary/20 flex gap-2">
              <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0">info</span>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Foto bukti & deskripsi wajib diisi sebagai dokumentasi pengawasan bahwa pembersihan sudah dilaksanakan.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Deskripsi Penyelesaian *
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Sampah di lokasi telah diangkut dan area sudah bersih."
                value={selesaiCatatan}
                onChange={(e) => setSelesaiCatatan(e.target.value)}
                required
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Foto Bukti Hasil Pembersihan *
              </label>
              {selesaiFoto ? (
                <div className="relative w-full h-36 rounded-xl overflow-hidden">
                  <img src={selesaiFoto} alt="Bukti selesai" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setSelesaiFoto(null)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-error text-on-error flex items-center justify-center shadow-md"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ) : (
                <label className="w-full h-28 rounded-xl border-2 border-dashed border-primary/40 bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer">
                  <span className="material-symbols-outlined text-primary text-xl">add_a_photo</span>
                  <p className="text-[11px] font-bold text-primary">Upload Foto Bukti</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFotoBuktiUpload(e, setSelesaiFoto, setSelesaiError)}
                    className="hidden"
                  />
                </label>
              )}
              {selesaiError && <p className="text-[11px] text-error mt-1.5">{selesaiError}</p>}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setCompletingReport(null);
                  setSelesaiCatatan('');
                  setSelesaiFoto(null);
                  setSelesaiError(null);
                }}
                className="flex-1 py-2.5 bg-surface-container text-on-surface-variant font-bold text-xs rounded-xl hover:bg-surface-container-high"
              >
                Batal
              </button>
              <button
                onClick={handleSelesaikan}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-primary-container text-on-primary-container font-bold text-xs rounded-xl hover:opacity-90 shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Tandai Selesai'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}