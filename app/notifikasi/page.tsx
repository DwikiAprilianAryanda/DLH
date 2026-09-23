'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { INITIAL_NOTIFIKASI, NotificationItem } from '@/lib/mock-data';

export default function NotifikasiPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFIKASI);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, dibaca: true })));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="pt-20 px-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-on-surface">Notifikasi</h1>
            <p className="text-xs text-on-surface-variant">
              Pembaruan status laporan & pengumuman DLH Samarinda
            </p>
          </div>
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Tandai Dibaca
          </button>
        </div>

        <div className="space-y-3">
          {notifications.map((n) => {
            const formattedDate = new Date(n.created_at).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-all ${
                  n.dibaca
                    ? 'bg-surface-container-lowest border-outline-variant/30 opacity-75'
                    : 'bg-primary-container/10 border-primary/30 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      n.tipe === 'status_update'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-tertiary/10 text-tertiary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {n.tipe === 'status_update' ? 'local_shipping' : 'info'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xs font-bold text-on-surface">{n.judul}</h3>
                      <span className="text-[10px] text-on-surface-variant">{formattedDate}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {n.pesan}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
