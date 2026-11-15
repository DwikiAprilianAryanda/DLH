'use client';

import { useReports } from '@/context/ReportContext';
import ArmadaManager from '@/components/admin/ArmadaManager';

export default function AdminArmadaPage() {
  const { armada } = useReports();

  return (
    <div className="space-y-6">
      {/* Page Title & Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">local_shipping</span>
            <h1 className="text-xl font-bold text-on-surface">
              Armada Kebersihan Kota Samarinda
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant">
            {armada.length} unit armada DLH Samarinda. Kelola spesifikasi armada, perbarui data teknis, dan catat ritase harian per unit.
          </p>
        </div>
      </div>

      <ArmadaManager />
    </div>
  );
}
