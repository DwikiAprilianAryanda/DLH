'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  INITIAL_NOTIFIKASI,
  ReportItem,
  ArmadaItem,
  NotificationItem,
} from '@/lib/mock-data';

interface ReportContextType {
  reports: ReportItem[];
  armada: ArmadaItem[];
  notifications: NotificationItem[];
  loading: boolean;
  addReport: (
    newReportData: Omit<ReportItem, 'id' | 'created_at' | 'updated_at' | 'status'>
  ) => Promise<ReportItem | null>;
  updateReportStatus: (id: string, status: ReportItem['status'], notes?: string) => Promise<void>;
  getReportById: (id: string) => ReportItem | undefined;
  markAllNotificationsRead: () => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function ReportProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [armada, setArmada] = useState<ArmadaItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFIKASI);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/laporan');
      const data = await res.json();
      setReports(data);
    } catch (error) {
      console.error('Gagal ambil data laporan:', error);
    }
  };

  const fetchArmada = async () => {
    try {
      const res = await fetch('/api/armada');
      const data = await res.json();
      setArmada(data);
    } catch (error) {
      console.error('Gagal ambil data armada:', error);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchReports(), fetchArmada()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  const addReport = async (
    data: Omit<ReportItem, 'id' | 'created_at' | 'updated_at' | 'status'>
  ): Promise<ReportItem | null> => {
    try {
      const res = await fetch('/api/laporan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Gagal kirim laporan');

      const created = await res.json();
      setReports((prev) => [created, ...prev]);

      const now = new Date().toISOString();
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          user_id: 'user-current',
          judul: 'Laporan Berhasil Dibuat',
          pesan: `Laporan "${created.title}" di ${created.kecamatan} telah terdaftar dan menunggu verifikasi petugas DLH.`,
          dibaca: false,
          created_at: now,
          tipe: 'info',
        },
        ...prev,
      ]);

      return created;
    } catch (error) {
      console.error('Gagal kirim laporan:', error);
      return null;
    }
  };

  const updateReportStatus = async (
    id: string,
    status: ReportItem['status'],
    notes?: string
  ) => {
    try {
      const res = await fetch(`/api/laporan/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, catatan_petugas: notes }),
      });

      if (!res.ok) throw new Error('Gagal update status laporan');

      const updated = await res.json();
      setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));

      const notifTitle =
        status === 'Armada Dikirim'
          ? 'Armada Kebersihan Dikirim!'
          : status === 'Selesai/Dibersihkan'
          ? 'Laporan Sampah Selesai Dibersihkan'
          : 'Pembaruan Status Laporan';

      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          user_id: 'user-current',
          judul: notifTitle,
          pesan: notes || `Status laporan #${id} telah diperbarui menjadi "${status}".`,
          dibaca: false,
          created_at: new Date().toISOString(),
          tipe: 'status_update',
        },
        ...prev,
      ]);
    } catch (error) {
      console.error('Gagal update status laporan:', error);
    }
  };

  const getReportById = (id: string) => reports.find((r) => r.id === id);

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, dibaca: true })));
  };

  return (
    <ReportContext.Provider
      value={{
        reports,
        armada,
        notifications,
        loading,
        addReport,
        updateReportStatus,
        getReportById,
        markAllNotificationsRead,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
}

export function useReports() {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
}