'use client';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import { useReports } from '@/context/ReportContext';

const EcoMap = dynamic(() => import('@/components/map/EcoMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 bg-surface-container-low rounded-xl flex items-center justify-center text-xs text-on-surface-variant">
      Memuat peta...
    </div>
  ),
});

export default function DetailLaporanPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { getReportById, reports } = useReports();

  const report = getReportById(params.id) || reports[0];

  const formattedDate = new Date(report.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Timeline Steps logic
  const steps = [
    { label: 'Laporan Diterima', status: 'done', date: formattedDate },
    {
      label: 'Armada Dikirim',
      status: report.status === 'Armada Dikirim' || report.status === 'Selesai/Dibersihkan' ? 'done' : 'pending',
      date: report.status !== 'Menunggu' ? 'Status Diperbarui DLH' : '-',
    },
    {
      label: 'Selesai / Dibersihkan',
      status: report.status === 'Selesai/Dibersihkan' ? 'done' : 'pending',
      date: report.status === 'Selesai/Dibersihkan' ? 'Selesai Dilaksanakan' : '-',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="pt-20 px-4 max-w-lg mx-auto space-y-4">
        {/* Top Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-bold text-on-surface">Detail Laporan</h1>
            <p className="text-xs text-on-surface-variant">ID: #{report.id}</p>
          </div>
        </div>

        {/* Photo Container */}
        <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-outline-variant/30">
          <div className="relative h-64 w-full">
            <img
              src={report.foto_url}
              alt={report.title}
              className="w-full h-full object-cover"
            />
            <span
              className={`absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full font-bold shadow-md ${
                report.urgensi === 'Kritis'
                  ? 'bg-error text-on-error'
                  : report.urgensi === 'Sedang'
                  ? 'bg-tertiary-container text-on-tertiary-container'
                  : 'bg-primary text-on-primary'
              }`}
            >
              Urgensi: {report.urgensi}
            </span>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                  report.status === 'Selesai/Dibersihkan'
                    ? 'bg-primary-container text-on-primary-container'
                    : report.status === 'Armada Dikirim'
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'bg-error-container text-on-error-container'
                }`}
              >
                {report.status}
              </span>
              <span className="text-xs text-on-surface-variant">{formattedDate}</span>
            </div>

            <h2 className="text-base font-bold text-on-surface mb-2">
              {report.title}
            </h2>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
              {report.description}
            </p>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low text-xs text-on-surface">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <span className="font-semibold">
                {report.kecamatan}, {report.kelurahan}
              </span>
            </div>
          </div>
        </div>

        {/* Status Tracker Timeline */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3.5">
            Status Penanganan DLH
          </h3>
          <div className="space-y-4 relative pl-4 border-l-2 border-outline-variant/40 ml-2">
            {steps.map((step, idx) => (
              <div key={idx} className="relative pl-4">
                <div
                  className={`absolute -left-[25px] top-0.5 w-4 h-4 rounded-full border-2 border-surface ${
                    step.status === 'done'
                      ? 'bg-primary border-primary'
                      : 'bg-surface-container-high border-outline'
                  }`}
                ></div>
                <p
                  className={`text-xs font-bold ${
                    step.status === 'done' ? 'text-on-surface' : 'text-on-surface-variant'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[11px] text-on-surface-variant">{step.date}</p>
              </div>
            ))}
          </div>

          {report.catatan_petugas && (
            <div className="mt-4 p-3 rounded-xl bg-secondary-container/40 text-xs border border-secondary-container">
              <p className="font-bold text-on-secondary-container mb-0.5">
                Catatan Petugas Kebersihan:
              </p>
              <p className="text-on-surface">{report.catatan_petugas}</p>
            </div>
          )}
        </div>

        {/* Map Preview */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 space-y-2">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            Koordinat Peta
          </h3>
          <div className="h-44 rounded-xl overflow-hidden">
            <EcoMap reports={[report]} center={[report.latitude, report.longitude]} />
          </div>
          <div className="flex items-center justify-between text-xs text-on-surface-variant font-mono pt-1">
            <span>Lat: {report.latitude}</span>
            <span>Long: {report.longitude}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
