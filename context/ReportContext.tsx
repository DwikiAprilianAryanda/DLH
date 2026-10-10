'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ReportItem, ArmadaItem, NotificationItem } from '@/lib/mock-data';
import { useAuth } from '@/context/AuthContext';

interface ReportContextType {
  reports: ReportItem[];
  armada: ArmadaItem[];
  notifications: NotificationItem[];
  loading: boolean;
  addReport: (
    newReportData: Omit<ReportItem, 'id' | 'created_at' | 'updated_at' | 'status'>
  ) => Promise<ReportItem | null>;
  updateReportStatus: (
    id: string,
    status: ReportItem['status'],
    notes?: string,
    fotoBukti?: string
  ) => Promise<boolean>;
  getReportById: (id: string) => ReportItem | undefined;
  markAllNotificationsRead: () => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function ReportProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [armada, setArmada] = useState<ArmadaItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
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

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    try {
      const res = await fetch('/api/notifikasi');
      const data = await res.json();
      setNotifications(data);
    } catch (error) {
      console.error('Gagal ambil notifikasi:', error);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchReports(), fetchArmada(), fetchNotifications()]);
      setLoading(false);
    };
    loadAll();
  }, [user]);

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
      fetchNotifications();

      return created;
    } catch (error) {
      console.error('Gagal kirim laporan:', error);
      return null;
    }
  };

  const updateReportStatus = async (
    id: string,
    status: ReportItem['status'],
    notes?: string,
    fotoBukti?: string
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/laporan/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          catatan_petugas: notes,
          foto_bukti_petugas: fotoBukti,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Gagal update status laporan');
      }

      const updated = await res.json();
      setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
      fetchNotifications();
      return true;
    } catch (error) {
      console.error('Gagal update status laporan:', error);
      return false;
    }
  };

  const getReportById = (id: string) => reports.find((r) => r.id === id);

  const markAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, dibaca: true })));
    try {
      await fetch('/api/notifikasi/mark-read', { method: 'PATCH' });
    } catch (error) {
      console.error('Gagal update status baca notifikasi:', error);
    }
  };

  return (
    <ReportContext.Provider
      value={{ reports, armada, notifications, loading, addReport, updateReportStatus, getReportById, markAllNotificationsRead }}
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