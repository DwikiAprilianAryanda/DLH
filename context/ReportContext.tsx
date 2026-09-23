'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  INITIAL_REPORTS,
  INITIAL_ARMADA,
  INITIAL_NOTIFIKASI,
  ReportItem,
  ArmadaItem,
  NotificationItem,
} from '@/lib/mock-data';

interface ReportContextType {
  reports: ReportItem[];
  armada: ArmadaItem[];
  notifications: NotificationItem[];
  addReport: (
    newReportData: Omit<ReportItem, 'id' | 'created_at' | 'updated_at' | 'status'>
  ) => ReportItem;
  updateReportStatus: (id: string, status: ReportItem['status'], notes?: string) => void;
  getReportById: (id: string) => ReportItem | undefined;
  markAllNotificationsRead: () => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

const LOCAL_STORAGE_REPORTS_KEY = 'ecomap_samarinda_reports_v1';
const LOCAL_STORAGE_NOTIFS_KEY = 'ecomap_samarinda_notifs_v1';

export function ReportProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS);
  const [armada] = useState<ArmadaItem[]>(INITIAL_ARMADA);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFIKASI);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted state from localStorage on mount
  useEffect(() => {
    try {
      const savedReports = localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY);
      if (savedReports) {
        setReports(JSON.parse(savedReports));
      }
      const savedNotifs = localStorage.getItem(LOCAL_STORAGE_NOTIFS_KEY);
      if (savedNotifs) {
        setNotifications(JSON.parse(savedNotifs));
      }
    } catch (e) {
      console.error('Failed to load from localStorage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync reports to localStorage when updated
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(reports));
    }
  }, [reports, isLoaded]);

  // Sync notifications to localStorage when updated
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(LOCAL_STORAGE_NOTIFS_KEY, JSON.stringify(notifications));
    }
  }, [notifications, isLoaded]);

  const addReport = (
    data: Omit<ReportItem, 'id' | 'created_at' | 'updated_at' | 'status'>
  ): ReportItem => {
    const now = new Date().toISOString();
    const newId = `rep-${String(reports.length + 1).padStart(3, '0')}`;

    const createdReport: ReportItem = {
      ...data,
      id: newId,
      status: 'Menunggu',
      created_at: now,
      updated_at: now,
    };

    setReports((prev) => [createdReport, ...prev]);

    // Add automatic system notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: 'user-current',
      judul: 'Laporan Berhasil Dibuat',
      pesan: `Laporan "${createdReport.title}" di ${createdReport.kecamatan} telah terdaftar dan menunggu verifikasi petugas DLH.`,
      dibaca: false,
      created_at: now,
      tipe: 'info',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return createdReport;
  };

  const updateReportStatus = (id: string, status: ReportItem['status'], notes?: string) => {
    const now = new Date().toISOString();

    setReports((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = {
            ...r,
            status,
            catatan_petugas: notes || r.catatan_petugas,
            updated_at: now,
          };

          // Generate real-time update notification for user
          const notifTitle =
            status === 'Armada Dikirim'
              ? 'Armada Kebersihan Dikirim!'
              : status === 'Selesai/Dibersihkan'
              ? 'Laporan Sampah Selesai Dibersihkan'
              : 'Pembaruan Status Laporan';

          const notifPesan =
            notes ||
            `Status laporan #${r.id} (${r.title}) telah diperbarui menjadi "${status}".`;

          setNotifications((nPrev) => [
            {
              id: `notif-${Date.now()}`,
              user_id: 'user-current',
              judul: notifTitle,
              pesan: notifPesan,
              dibaca: false,
              created_at: now,
              tipe: 'status_update',
            },
            ...nPrev,
          ]);

          return updated;
        }
        return r;
      })
    );
  };

  const getReportById = (id: string) => {
    return reports.find((r) => r.id === id);
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, dibaca: true })));
  };

  return (
    <ReportContext.Provider
      value={{
        reports,
        armada,
        notifications,
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
