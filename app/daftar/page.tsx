'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';

export default function DaftarPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak sama');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setIsSubmitting(true);
    const result = await register({ full_name: fullName, email, password, phone });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Gagal mendaftar');
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/login'), 1500);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <main className="pt-20 px-4 max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-on-surface">Daftar Akun</h1>
          <p className="text-xs text-on-surface-variant">
            Buat akun untuk melapor sampah dan memantau status laporan Anda
          </p>
        </div>

        {success && (
          <div className="mb-4 p-4 rounded-2xl bg-primary-container text-on-primary-container flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
            <p className="text-sm font-bold">Pendaftaran berhasil! Mengarahkan ke login...</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Nama Lengkap *</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
              className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">No. HP</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Password *</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Konfirmasi Password *</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
              className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <button type="submit" disabled={isSubmitting}
            className="w-full py-3 bg-primary text-on-primary font-bold text-sm rounded-2xl shadow-md hover:bg-primary/90 transition-all disabled:opacity-50">
            {isSubmitting ? 'Mendaftar...' : 'Daftar'}
          </button>

          <p className="text-center text-xs text-on-surface-variant">
            Sudah punya akun?{' '}
            <a href="/login" className="text-primary font-bold hover:underline">Login di sini</a>
          </p>
        </form>
      </main>
    </div>
  );
}