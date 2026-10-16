'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { KECAMATAN_SAMARINDA } from '@/lib/mock-data';
import { useAuth } from '@/context/AuthContext';

export default function EditProfilPage() {
  const router = useRouter();
  const { user, loading: authLoading, updateProfile } = useAuth();

  const [name, setName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [kecamatan, setKecamatan] = useState(user?.kecamatan || KECAMATAN_SAMARINDA[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header />
        <main className="pt-20 px-4 max-w-lg mx-auto">
          <p className="text-xs text-on-surface-variant text-center">Memuat...</p>
        </main>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      await updateProfile({ full_name: name, phone, kecamatan });
      setIsSaved(true);
      setTimeout(() => {
        router.push('/profil');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan profil');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="pt-20 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-on-surface">Edit Profil</h1>
            <p className="text-xs text-on-surface-variant">
              Perbarui informasi identitas & kontak warga
            </p>
          </div>
        </div>

        {isSaved && (
          <div className="mb-4 p-3.5 rounded-2xl bg-primary-container text-on-primary-container text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            Profil berhasil disimpan!
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 space-y-3">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Alamat Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2.5 bg-surface-container-high border border-outline-variant/40 rounded-xl text-xs text-on-surface-variant cursor-not-allowed"
              />
              <p className="text-[10px] text-on-surface-variant mt-1">Email tidak bisa diubah.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Domisili Kecamatan *
              </label>
              <select
                value={kecamatan}
                onChange={(e) => setKecamatan(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium"
              >
                {KECAMATAN_SAMARINDA.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3.5 bg-primary text-on-primary font-bold text-sm rounded-2xl shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </main>
    </div>
  );
}