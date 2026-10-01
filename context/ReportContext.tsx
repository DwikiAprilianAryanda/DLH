'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
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
  // Notifikasi masih sementara pakai mock, karena butuh sistem login dulu
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFIKASI);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('laporan_sampah')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Gagal ambil data laporan:', error.message);
    } else {
      setReports(data || []);
    }
  };

  const fetchArmada = async () => {
    const { data, error } = await supabase.from('armada').select('*');
    if (error) {
      console.error('Gagal ambil data armada:', error.message);
    } else {
      setArmada(data || []);
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
    const { data: inserted, error } = await supabase
      .from('laporan_sampah')
      .insert([{ ...data, status: 'Menunggu' }])
      .select()
      .single();

    if (error) {
      console.error('Gagal kirim laporan:', error.message);
      return null;
    }

    setReports((prev) => [inserted, ...prev]);

    const now = new Date().toISOString();
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        user_id: 'user-current',
        judul: 'Laporan Berhasil Dibuat',
        pesan: `Laporan "${inserted.title}" di ${inserted.kecamatan} telah terdaftar dan menunggu verifikasi petugas DLH.`,
        dibaca: false,
        created_at: now,
        tipe: 'info',
      },
      ...prev,
    ]);

    return inserted;
  };

  const updateReportStatus = async (
    id: string,
    status: ReportItem['status'],
    notes?: string
  ) => {
    const { data: updated, error } = await supabase
      .from('laporan_sampah')
      .update({
        status,
        catatan_petugas: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Gagal update status laporan:', error.message);
      return;
    }

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