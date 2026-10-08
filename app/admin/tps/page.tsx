'use client';

import { useEffect, useState } from 'react';
import { KECAMATAN_SAMARINDA } from '@/lib/mock-data';
import type { TpsItem } from '@/components/map/TpsMap';

const emptyForm = {
  nama: '',
  kecamatan: KECAMATAN_SAMARINDA[0],
  latitude: '',
  longitude: '',
  bangunan: '',
  mobilitas: '',
  jumlah_bak: '',
  jenis: '',
  jam_buka: '',
  jam_tutup: '',
};

export default function AdminTpsPage() {
  const [tpsList, setTpsList] = useState<TpsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedKecamatan, setSelectedKecamatan] = useState('Semua');

  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<TpsItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkJamBuka, setBulkJamBuka] = useState('06:00');
  const [bulkJamTutup, setBulkJamTutup] = useState('18:00');
  const [bulkOnlyEmpty, setBulkOnlyEmpty] = useState(true);
  const [bulkScope, setBulkScope] = useState<'semua' | 'filter'>('semua');
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const fetchTps = async () => {
    try {
      const res = await fetch('/api/tps');
      const data = await res.json();
      setTpsList(data);
    } catch (error) {
      console.error('Gagal ambil data TPS:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTps();
  }, []);

  const kecamatanList = [
    'Semua',
    ...Array.from(new Set(tpsList.map((t) => t.kecamatan))).sort(),
  ];

  const filteredTps = tpsList.filter((t) => {
    if (selectedKecamatan !== 'Semua' && t.kecamatan !== selectedKecamatan) return false;
    if (search && !t.nama.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openCreate = () => {
    setFormMode('create');
    setEditId(null);
    setForm(emptyForm);
    setFormError('');
  };

  const openEdit = (tps: TpsItem) => {
    setFormMode('edit');
    setEditId(tps.id);
    setForm({
      nama: tps.nama,
      kecamatan: tps.kecamatan,
      latitude: String(tps.latitude),
      longitude: String(tps.longitude),
      bangunan: tps.bangunan || '',
      mobilitas: tps.mobilitas || '',
      jumlah_bak: tps.jumlah_bak ? String(tps.jumlah_bak) : '',
      jenis: tps.jenis || '',
      jam_buka: tps.jam_buka || '',
      jam_tutup: tps.jam_tutup || '',
    });
    setFormError('');
  };

  const handleSaveForm = async () => {
    if (!form.nama || !form.kecamatan || !form.latitude || !form.longitude) {
      setFormError('Nama, kecamatan, latitude, dan longitude wajib diisi.');
      return;
    }

    setIsSaving(true);
    setFormError('');

    const payload = {
      nama: form.nama,
      kecamatan: form.kecamatan,
      latitude: form.latitude,
      longitude: form.longitude,
      bangunan: form.bangunan,
      mobilitas: form.mobilitas,
      jumlah_bak: form.jumlah_bak,
      jenis: form.jenis,
      jam_buka: form.jam_buka,
      jam_tutup: form.jam_tutup,
    };

    try {
      const res =
        formMode === 'create'
          ? await fetch('/api/tps', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/tps/${editId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');

      if (formMode === 'create') {
        setTpsList((prev) => [...prev, data]);
      } else {
        setTpsList((prev) => prev.map((t) => (t.id === data.id ? data : t)));
      }

      setFormMode(null);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tps/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal hapus');
      setTpsList((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      console.error('Gagal hapus TPS:', error);
      alert('Gagal menghapus, coba lagi.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkSave = async () => {
    setIsBulkSaving(true);
    try {
      const res = await fetch('/api/tps/bulk-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jam_buka: bulkJamBuka,
          jam_tutup: bulkJamTutup,
          kecamatan: bulkScope === 'filter' ? selectedKecamatan : undefined,
          onlyEmpty: bulkOnlyEmpty,
        }),
      });
      if (!res.ok) throw new Error('Gagal update massal');
      const result = await res.json();
      alert(`${result.count} TPS berhasil diperbarui.`);
      setShowBulkModal(false);
      fetchTps();
    } catch (error) {
      console.error('Gagal update massal:', error);
      alert('Gagal menyimpan, coba lagi.');
    } finally {
      setIsBulkSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-on-surface">Kelola Data TPS</h1>
          <p className="text-xs text-on-surface-variant">
            Total <span className="font-bold text-primary">{tpsList.length}</span> titik TPS
            terdaftar se-Kota Samarinda
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">add_location_alt</span>
          Tambah TPS
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Cari nama TPS..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3.5 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 w-56"
        />
        <select
          value={selectedKecamatan}
          onChange={(e) => setSelectedKecamatan(e.target.value)}
          className="px-3.5 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {kecamatanList.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <span className="text-[11px] text-on-surface-variant font-medium">
          {filteredTps.length} dari {tpsList.length} titik
        </span>
        <button
          onClick={() => setShowBulkModal(true)}
          className="ml-auto px-3.5 py-2 bg-surface-container-lowest border border-outline-variant/40 text-on-surface text-xs font-bold rounded-xl hover:bg-surface-container transition-all flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">schedule</span>
          Set Jam Massal
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant uppercase tracking-wider font-bold border-b border-outline-variant/30 sticky top-0">
              <tr>
                <th className="py-3.5 px-4">Nama TPS</th>
                <th className="py-3.5 px-4">Kecamatan</th>
                <th className="py-3.5 px-4">Detail</th>
                <th className="py-3.5 px-4">Jam Operasional</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-medium text-on-surface">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-on-surface-variant">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredTps.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-on-surface-variant">
                    Tidak ada TPS ditemukan.
                  </td>
                </tr>
              ) : (
                filteredTps.map((tps) => (
                  <tr key={tps.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-4 font-bold">{tps.nama}</td>
                    <td className="py-3 px-4 text-on-surface-variant">{tps.kecamatan}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {tps.bangunan && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-semibold">
                            {tps.bangunan}
                          </span>
                        )}
                        {tps.mobilitas && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-semibold">
                            {tps.mobilitas}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {tps.jam_buka || tps.jam_tutup ? (
                        <span className="px-2.5 py-1 rounded-full bg-primary-container text-on-primary-container text-[11px] font-bold">
                          {tps.jam_buka || '-'} - {tps.jam_tutup || '-'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-bold">
                          Belum diatur
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(tps)}
                          className="px-3 py-1.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary/90 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(tps)}
                          className="w-8 h-8 rounded-xl bg-error-container text-on-error-container flex items-center justify-center hover:opacity-80 transition-opacity"
                          title="Hapus"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {formMode && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl space-y-4 border border-outline-variant/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface">
                {formMode === 'create' ? 'Tambah TPS Baru' : 'Edit Data TPS'}
              </h3>
              <button
                onClick={() => setFormMode(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {formError && (
              <p className="text-xs text-error font-semibold bg-error-container/30 p-2.5 rounded-xl">
                {formError}
              </p>
            )}

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Nama TPS *
              </label>
              <input
                type="text"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Kecamatan *
              </label>
              <select
                value={form.kecamatan}
                onChange={(e) => setForm({ ...form, kecamatan: e.target.value })}
                className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {KECAMATAN_SAMARINDA.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Latitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Longitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Bangunan
                </label>
                <select
                  value={form.bangunan}
                  onChange={(e) => setForm({ ...form, bangunan: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">-</option>
                  <option value="Terbuka">Terbuka</option>
                  <option value="Tertutup">Tertutup</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Mobilitas
                </label>
                <select
                  value={form.mobilitas}
                  onChange={(e) => setForm({ ...form, mobilitas: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">-</option>
                  <option value="Statis">Statis</option>
                  <option value="Dinamis">Dinamis</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Jumlah Bak
                </label>
                <input
                  type="number"
                  value={form.jumlah_bak}
                  onChange={(e) => setForm({ ...form, jumlah_bak: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Jenis
                </label>
                <input
                  type="text"
                  placeholder="Contoh: BETON"
                  value={form.jenis}
                  onChange={(e) => setForm({ ...form, jenis: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Jam Buka
                </label>
                <input
                  type="time"
                  value={form.jam_buka}
                  onChange={(e) => setForm({ ...form, jam_buka: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Jam Tutup
                </label>
                <input
                  type="time"
                  value={form.jam_tutup}
                  onChange={(e) => setForm({ ...form, jam_tutup: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setFormMode(null)}
                className="flex-1 py-2.5 bg-surface-container text-on-surface-variant font-bold text-xs rounded-xl hover:bg-surface-container-high"
              >
                Batal
              </button>
              <button
                onClick={handleSaveForm}
                disabled={isSaving}
                className="flex-1 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary/90 shadow-md disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan...' : formMode === 'create' ? 'Tambah TPS' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-container-lowest rounded-3xl p-6 shadow-2xl space-y-4 border border-outline-variant/30 text-center">
            <div className="w-14 h-14 rounded-full bg-error-container text-on-error-container mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">delete</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">Hapus TPS Ini?</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                <span className="font-bold">{deleteTarget.nama}</span> akan dihapus permanen dari
                sistem dan peta.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 bg-surface-container text-on-surface-variant font-bold text-xs rounded-xl hover:bg-surface-container-high"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-error text-on-error font-bold text-xs rounded-xl hover:opacity-90 shadow-md disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Set Jam Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-container-lowest rounded-3xl p-6 shadow-2xl space-y-4 border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface">Set Jam Operasional Massal</h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Jam Buka
                </label>
                <input
                  type="time"
                  value={bulkJamBuka}
                  onChange={(e) => setBulkJamBuka(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Jam Tutup
                </label>
                <input
                  type="time"
                  value={bulkJamTutup}
                  onChange={(e) => setBulkJamTutup(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Terapkan ke
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs text-on-surface font-medium cursor-pointer">
                  <input
                    type="radio"
                    checked={bulkScope === 'semua'}
                    onChange={() => setBulkScope('semua')}
                  />
                  Semua TPS ({tpsList.length} titik)
                </label>
                <label className="flex items-center gap-2 text-xs text-on-surface font-medium cursor-pointer">
                  <input
                    type="radio"
                    checked={bulkScope === 'filter'}
                    onChange={() => setBulkScope('filter')}
                  />
                  Hanya Kecamatan {selectedKecamatan} ({filteredTps.length} titik)
                </label>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-on-surface font-medium cursor-pointer p-3 bg-surface-container-low rounded-xl">
              <input
                type="checkbox"
                checked={bulkOnlyEmpty}
                onChange={(e) => setBulkOnlyEmpty(e.target.checked)}
              />
              Hanya isi TPS yang jamnya masih kosong
            </label>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowBulkModal(false)}
                className="flex-1 py-2.5 bg-surface-container text-on-surface-variant font-bold text-xs rounded-xl hover:bg-surface-container-high"
              >
                Batal
              </button>
              <button
                onClick={handleBulkSave}
                disabled={isBulkSaving}
                className="flex-1 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary/90 shadow-md disabled:opacity-50"
              >
                {isBulkSaving ? 'Menyimpan...' : 'Terapkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}