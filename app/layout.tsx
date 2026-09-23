import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import { ReportProvider } from '@/context/ReportContext';

export const metadata: Metadata = {
  title: 'EcoMap Samarinda - Sistem Pelaporan Sampah & Analitik DLH',
  description:
    'Platform Pelaporan Sampah Warga & Dashboard Analitik Dinas Lingkungan Hidup Kota Samarinda',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-surface antialiased min-h-screen selection:bg-primary-container selection:text-on-primary-container">
        <ReportProvider>
          {children}
          <BottomNav />
        </ReportProvider>
      </body>
    </html>
  );
}
