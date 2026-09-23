'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@dlh.samarindakota.go.id');
  const [password, setPassword] = useState('admin123');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      router.push('/admin');
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-8 shadow-2xl border border-outline-variant/30 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-primary text-on-primary mx-auto flex items-center justify-center font-bold text-3xl shadow-lg">
          <span className="material-symbols-outlined text-[36px]">
            admin_panel_settings
          </span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-on-surface">Portal Admin DLH</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Dinas Lingkungan Hidup Kota Samarinda
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Email Kedinasan *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
              Kata Sandi *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-primary text-on-primary font-bold text-sm rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">
                  progress_activity
                </span>
                Memverifikasi Login...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">login</span>
                Masuk Dashboard Admin
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-outline-variant/30">
          <Link
            href="/"
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
          >
            &larr; Kembali ke Portal Warga
          </Link>
        </div>
      </div>
    </div>
  );
}
