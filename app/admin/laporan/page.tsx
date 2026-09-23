'use client';

import { useState } from 'react';
import { KECAMATAN_SAMARINDA, ReportItem } from '@/lib/mock-data';
import { useReports } from '@/context/ReportContext';

export default function ManajemenLaporanAdminPage() {
  const { reports, armada, updateReportStatus } = useReports();
  const [selectedKecamatan, setSelectedKecamatan] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');

  // Dispatch Modal state
  const [activeReport, setActiveReport] = useState<ReportItem | null>(null);
  const [selectedArmadaId, setSelectedArmadaId] = useState(armada[0]?.id || 'arm-01');
  const [catatan, setCatatan] = useState('');

  const filteredReports = reports.filter((r) => {
    if (selectedKecamatan !== 'Semua' && r.kecamatan !== selectedKecamatan) return false;
    if (selectedStatus !== 'Semua' && r.status !== selectedStatus) return false;
    return true;
  });

  const handleUpdate = (
    reportId: string,
    newStatus: ReportItem['status'],
    notes?: string
  ) => {
    updateReportStatus(reportId, newStatus, notes);
    setActiveReport(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-on-surface">Manajemen Laporan Sampah</h1>
          <p className="text-xs text-on-surface-variant">
            Verifikasi, disposisi armada kebersihan, dan pembaruan status laporan warga
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-3">
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
            <option value="Menunggu">Menunggu</option>
            <option value="Armada Dikirim">Armada Dikirim</option>
            <option value="Selesai/Dibersihkan">Selesai/Dibersihkan</option>
          </select>
        </div>
      </div>

      {/* Reports Table / Cards Grid */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant uppercase tracking-wider font-bold border-b border-outline-variant/30">
              <tr>
                <th className="py-3.5 px-4">Detail Laporan</th>
                <th className="py-3.5 px-4">Wilayah & GPS</th>
                <th className="py-3.5 px-4">Urgensi</th>
                <th className="py-3.5 px-4">Status Currently</th>
                <th className="py-3.5 px-4 text-right">Aksi Disposisi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-medium text-on-surface">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-4 px-4 max-w-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={report.foto_url}
                        alt={report.title}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 bg-surface-container"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-on-surface line-clamp-1">
                          {report.title}
                        </p>
                        <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">
                          Pelapor: {report.user_name}
                        </p>
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
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        report.status === 'Selesai/Dibersihkan'
                          ? 'bg-primary-container text-on-primary-container'
                          : report.status === 'Armada Dikirim'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-error-container text-on-error-container'
                      }`}
                    >
                      {report.status}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-right">
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

                      {report.status !== 'Selesai/Dibersihkan' && (
                        <button
                          onClick={() =>
                            handleUpdate(
                              report.id,
                              'Selesai/Dibersihkan',
                              'Pembersihan telah selesai dilaksanakan oleh tim DLH.'
                            )
                          }
                          className="px-3 py-1.5 bg-primary-container text-on-primary-container font-bold text-xs rounded-xl hover:opacity-90 transition-opacity"
                        >
                          Selesaikan
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
                Catatan Petugas Disposisi
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Armada Truk DLH-04 dikirim menuju lokasi RT 12 Antasari."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              ></textarea>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setActiveReport(null)}
                className="flex-1 py-2.5 bg-surface-container text-on-surface-variant font-bold text-xs rounded-xl hover:bg-surface-container-high"
              >
                Batal
              </button>
              <button
                onClick={() =>
                  handleUpdate(
                    activeReport.id,
                    'Armada Dikirim',
                    catatan || 'Armada truk kebersihan telah dikirimkan ke lokasi.'
                  )
                }
                className="flex-1 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary/90 shadow-md"
              >
                Kirim Armada
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
