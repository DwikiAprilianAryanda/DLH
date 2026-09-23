import AdminSidebar from '@/components/layout/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <div className="pl-[260px] flex-1 min-w-0">
        <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">
              shield_person
            </span>
            <span className="font-bold text-sm text-on-surface">
              Dashboard Analitik DLH Kota Samarinda
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-primary-container text-on-primary-container text-xs font-bold">
              Sistem Aktif Realtime
            </span>
          </div>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
