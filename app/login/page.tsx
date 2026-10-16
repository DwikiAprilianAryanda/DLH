'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Gagal login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <main className="pt-20 px-4 max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-on-surface">Login</h1>
          <p className="text-xs text-on-surface-variant">
            Masuk untuk melapor sampah dan memantau status laporan Anda
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Password *</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <button type="submit" disabled={isSubmitting}
            className="w-full py-3 bg-primary text-on-primary font-bold text-sm rounded-2xl shadow-md hover:bg-primary/90 transition-all disabled:opacity-50">
            {isSubmitting ? 'Masuk...' : 'Login'}
          </button>

          <p className="text-center text-xs text-on-surface-variant">
            Belum punya akun?{' '}
            <a href="/daftar" className="text-primary font-bold hover:underline">Daftar di sini</a>
          </p>
        </form>
      </main>
    </div>
  );
}