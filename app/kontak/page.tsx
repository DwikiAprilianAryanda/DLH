'use client';

import Header from '@/components/layout/Header';
import { INITIAL_ARMADA } from '@/lib/mock-data';

export default function KontakPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="pt-20 px-4 max-w-lg mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold text-on-surface">
            Kontak Petugas Kebersihan
          </h1>
          <p className="text-xs text-on-surface-variant">
            Daftar penanggung jawab wilayah & layanan darurat DLH Samarinda
          </p>
        </div>

        {/* Emergency Call Box */}
        <div className="bg-primary text-on-primary rounded-2xl p-4 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold opacity-80 block">
              Layanan Darurat Sampah Samarinda
            </span>
            <p className="text-lg font-bold">Call Center DLH: 112 / (0541) 741234</p>
          </div>
          <a
            href="tel:0541741234"
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-on-primary transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">call</span>
          </a>
        </div>

        {/* District Officers List */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            Petugas Armada Per Kecamatan
          </h2>

          {INITIAL_ARMADA.map((arm) => (
            <div
              key={arm.id}
              className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm">
                  {arm.nama_petugas.split(' ')[1]?.[0] || 'P'}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-on-surface">{arm.nama_petugas}</h3>
                  <p className="text-[11px] text-primary font-medium">{arm.nama_armada}</p>
                  <p className="text-[11px] text-on-surface-variant">
                    Wilayah: {arm.kecamatan_tugas} ({arm.plat_nomor})
                  </p>
                </div>
              </div>

              <a
                href={`tel:${arm.telepon}`}
                className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">call</span>
              </a>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
