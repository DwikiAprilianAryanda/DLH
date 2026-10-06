'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useReports } from '@/context/ReportContext';
import { useAuth } from '@/context/AuthContext';

interface SurveiItem {
  id: string;
  laporan_id: string;
  rating: number;
  komentar: string | null;
}

export default function RiwayatLaporanPage() {
  const { user, loading: authLoading } = useAuth();
  const { reports } = useReports();
  const [activeTab, setActiveTab] = useState<'Semua' | 'Menunggu' | 'Armada Dikirim' | 'Selesai/Dibersihkan'>('Semua');

  const [surveiList, setSurveiList] = useState<SurveiItem[]>([]);
  const [reviewTarget, setReviewTarget] = useState<{ id: string; title: string } | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [komentar, setKomentar] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fetchSurvei = async () => {
    try {
      const res = await fetch('/api/survei');
      const data = await res.json();
      setSurveiList(data);
    } catch (error) {
      console.error('Gagal ambil data survei:', error);
    }
  };

  useEffect(() => {
    if (user) fetchSurvei();
  }, [user]);

  const myReports = reports.filter((r) => r.user_id === user?.id);
  const filteredReports = myReports.filter((r) => {
    if (activeTab === 'Semua') return true;
    return r.status === activeTab;
  });

  const getSurveiFor = (laporanId: string) => surveiList.find((s) => s.laporan_id === laporanId);

  const openReviewModal = (report: { id: string; title: string }) => {
    setReviewTarget(report);
    setRating(0);
    setHoverRating(0);
    setKomentar('');
    setSubmitError('');
  };

  const handleSubmitReview = async () => {
    if (!reviewTarget || rating === 0) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/survei', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ laporan_id: reviewTarget.id, rating, komentar }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal kirim review');

      setSurveiList((prev) => [...prev, data]);
      setReviewTarget(null);
    } catch (err: any) {
      setSubmitError(err.message || 'Gagal kirim review');
    } finally {
      setIsSubmitting(false);
    }
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
                Login untuk melihat riwayat laporan sampah yang pernah kamu kirim.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-xs"
            >
              Login
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="pt-20 px-4 max-w-lg mx-auto">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-on-surface">Riwayat Laporan Saya</h1>
          <p className="text-xs text-on-surface-variant">
            Daftar seluruh laporan sampah yang Anda kirimkan ke DLH Samarinda
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {(['Semua', 'Menunggu', 'Armada Dikirim', 'Selesai/Dibersihkan'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-xs font-bold'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {filteredReports.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center border border-outline-variant/30 my-8">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">inbox</span>
            <p className="text-sm font-bold text-on-surface">Tidak Ada Laporan</p>
            <p className="text-xs text-on-surface-variant mt-1 mb-4">
              Belum ada laporan dengan kategori status &quot;{activeTab}&quot;.
            </p>
            <Link
              href="/lapor"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">add_a_photo</span>
              Buat Laporan Baru
            </Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredReports.map((report) => {
              const formattedDate = new Date(report.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
              const survei = getSurveiFor(report.id);
              const isSelesai = report.status === 'Selesai/Dibersihkan';

              return (
                <div
                  key={report.id}
                  className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-outline-variant/30"
                >
                  <Link href={`/laporan/${report.id}`} className="block group">
                    <div className="flex gap-3">
                      <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-surface-container-low relative">
                        <img
                          src={report.foto_url}
                          alt={report.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span
                          className={`absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                            report.urgensi === 'Kritis'
                              ? 'bg-error text-on-error'
                              : report.urgensi === 'Sedang'
                              ? 'bg-tertiary-container text-on-tertiary-container'
                              : 'bg-primary text-on-primary'
                          }`}
                        >
                          {report.urgensi}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[11px] font-medium text-on-surface-variant">
                              {formattedDate}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                report.status === 'Selesai/Dibersihkan'
                                  ? 'bg-primary-container text-on-primary-container'
                                  : report.status === 'Armada Dikirim'
                                  ? 'bg-secondary-container text-on-secondary-container'
                                  : 'bg-error-container text-on-error-container'
                              }`}
                            >
                              {report.status}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                            {report.title}
                          </h3>
                          <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">
                            {report.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-on-surface-variant font-medium mt-2 pt-2 border-t border-outline-variant/20">
                          <span className="material-symbols-outlined text-[14px] text-primary">
                            location_on
                          </span>
                          <span className="truncate">{report.kecamatan}, Samarinda</span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {isSelesai && (
                    <div className="mt-3 pt-3 border-t border-outline-variant/20">
                      {survei ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <span
                                key={n}
                                className="material-symbols-outlined text-[18px] text-[#F5B700]"
                                style={{ fontVariationSettings: n <= survei.rating ? "'FILL' 1" : "'FILL' 0" }}
                              >
                                star
                              </span>
                            ))}
                          </div>
                          <span className="text-[11px] text-on-surface-variant font-medium line-clamp-1">
                            {survei.komentar || 'Tidak ada komentar'}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => openReviewModal({ id: report.id, title: report.title })}
                          className="w-full py-2 bg-primary/10 text-primary text-xs font-bold rounded-xl hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">rate_review</span>
                          Tulis Review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal Review */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-container-lowest rounded-3xl p-6 shadow-2xl space-y-4 border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface">Beri Review</h3>
              <button
                onClick={() => setReviewTarget(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant line-clamp-1">
              Laporan: <span className="font-semibold text-on-surface">{reviewTarget.title}</span>
            </p>

            <div className="flex items-center justify-center gap-1.5 py-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1"
                >
                  <span
                    className="material-symbols-outlined text-[44px] text-[#F5B700]"
                    style={{ fontVariationSettings: n <= (hoverRating || rating) ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Komentar (Opsional)
              </label>
              <textarea
                rows={3}
                placeholder="Ceritakan pengalaman kamu dengan pelayanan DLH..."
                value={komentar}
                onChange={(e) => setKomentar(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              ></textarea>
            </div>

            {submitError && (
              <p className="text-xs text-error font-semibold">{submitError}</p>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setReviewTarget(null)}
                className="flex-1 py-2.5 bg-surface-container text-on-surface-variant font-bold text-xs rounded-xl hover:bg-surface-container-high"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={rating === 0 || isSubmitting}
                className="flex-1 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary/90 shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}