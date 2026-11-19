'use client';

import { useMemo, useState } from 'react';
import type { ArmadaItem } from '@/lib/mock-data';
import { useReports } from '@/context/ReportContext';
import {
  ARMADA_LIMITS,
  armadaBelumLengkap,
  DUMMY_KECAMATAN_TUGAS,
  JENIS_ARMADA,
  KOSONG,
  STATUS_ARMADA,
  validateArmadaForm,
} from '@/lib/armada';

const emptyForm = {
  nama_armada: '',
  jenis_armada: '',
  bagian_pekerjaan: '',
  plat_nomor: '',
  tahun: '',
  kecamatan_tugas: '',
  nama_petugas: '',
  telepon: '',
  status: 'Tersedia' as string,
};

type FormState = typeof emptyForm;

const inputClass =
  'w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30';
const labelClass = 'block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5';

export default function ArmadaManager() {
  const { armada, refreshArmada } = useReports();

  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('semua');
  const [filterData, setFilterData] = useState<'semua' | 'belum'>('semua');

  // Modal create/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Modal hapus
  const [deleteTarget, setDeleteTarget] = useState<ArmadaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const jenisOptions = useMemo(() => {
    const hitung = new Map<string, number>();
    for (const a of armada) {
      const j = a.jenis_armada ?? KOSONG;
      hitung.set(j, (hitung.get(j) ?? 0) + 1);
    }
    return Array.from(hitung.entries()).sort((x, y) => y[1] - x[1]);
  }, [armada]);

  const jumlahTersedia = useMemo(
    () => armada.filter((a) => a.status === 'Tersedia').length,
    [armada]
  );
  const jumlahBertugas = useMemo(
    () => armada.filter((a) => a.status === 'Bertugas').length,
    [armada]
  );
  const jumlahPerawatan = useMemo(
    () => armada.filter((a) => a.status === 'Perawatan').length,
    [armada]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return armada.filter((a) => {
      if (filterJenis !== 'semua' && (a.jenis_armada ?? KOSONG) !== filterJenis) return false;
      if (filterData === 'belum' && !armadaBelumLengkap(a)) return false;
      if (!q) return true;
      const haystack = [
        a.nama_armada,
        a.jenis_armada,
        a.bagian_pekerjaan,
        a.plat_nomor,
        a.kecamatan_tugas,
        a.nama_petugas,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [armada, search, filterJenis, filterData]);

  // ---------- Form Create / Edit ----------
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFieldErrors({});
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (a: ArmadaItem) => {
    setEditingId(a.id);
    setForm({
      nama_armada: a.nama_armada,
      jenis_armada: a.jenis_armada && a.jenis_armada !== KOSONG ? a.jenis_armada : '',
      bagian_pekerjaan: a.bagian_pekerjaan && a.bagian_pekerjaan !== KOSONG ? a.bagian_pekerjaan : '',
      plat_nomor: a.plat_nomor && a.plat_nomor !== KOSONG ? a.plat_nomor : '',
      tahun: a.tahun && a.tahun !== KOSONG ? a.tahun : '',
      kecamatan_tugas: a.kecamatan_tugas && a.kecamatan_tugas !== KOSONG ? a.kecamatan_tugas : '',
      nama_petugas: a.nama_petugas && a.nama_petugas !== KOSONG ? a.nama_petugas : '',
      telepon: a.telepon && a.telepon !== KOSONG ? a.telepon : '',
      status: a.status,
    });
    setFieldErrors({});
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const validation = validateArmadaForm(form);
    if (!validation.ok) {
      setFieldErrors(validation.errors);
      return;
    }
    setFieldErrors({});
    setIsSaving(true);

    try {
      const url = editingId ? `/api/armada/${editingId}` : '/api/armada';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.fields) setFieldErrors(data.fields);
        setFormError(data.error || 'Gagal menyimpan armada.');
        return;
      }

      setModalOpen(false);
      await refreshArmada();
    } catch (error) {
      console.error('Gagal simpan armada:', error);
      setFormError('Tidak dapat terhubung ke server. Periksa koneksi.');
    } finally {
      setIsSaving(false);
    }
  };

  // ---------- Hapus ----------
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/armada/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Gagal menghapus armada.');
        return;
      }
      setDeleteTarget(null);
      await refreshArmada();
    } catch (error) {
      console.error('Gagal hapus armada:', error);
      alert('Tidak dapat terhubung ke server.');
    } finally {
      setIsDeleting(false);
    }
  };

  const statusClass = (status: string) =>
    status === 'Bertugas'
      ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
      : status === 'Tersedia'
      ? 'bg-blue-500/10 text-blue-700 border border-blue-500/20'
      : 'bg-amber-500/10 text-amber-700 border border-amber-500/20';

  return (
    <div className="space-y-5">
      {/* Ringkasan Status Armada DLH */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Total Armada</span>
          <span className="text-2xl font-bold text-on-surface">{armada.length}</span>
          <span className="text-xs text-on-surface-variant"> unit armada DLH</span>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-blue-500/30 shadow-xs">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Tersedia (Siaga)</span>
          <span className="text-2xl font-bold text-blue-700">{jumlahTersedia}</span>
          <span className="text-xs text-on-surface-variant"> unit siap kirim</span>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-emerald-500/30 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Sedang Bertugas</span>
          <span className="text-2xl font-bold text-emerald-700">{jumlahBertugas}</span>
          <span className="text-xs text-on-surface-variant"> unit di lapangan</span>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-amber-500/30 shadow-xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Dalam Perawatan</span>
          <span className="text-2xl font-bold text-amber-700">{jumlahPerawatan}</span>
          <span className="text-xs text-on-surface-variant"> unit perbaikan teknis</span>
        </div>
      </div>

      {/* Kontrol */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Cari unit, jenis, plat, petugas..."
          value={search}
          maxLength={60}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3.5 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 w-64"
        />
        <select
          value={filterJenis}
          onChange={(e) => setFilterJenis(e.target.value)}
          className="px-3.5 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="semua">Semua Jenis</option>
          {jenisOptions.map(([jenis, jumlah]) => (
            <option key={jenis} value={jenis}>
              {jenis === KOSONG ? 'Jenis belum diisi' : jenis} ({jumlah})
            </option>
          ))}
        </select>
        <select
          value={filterData}
          onChange={(e) => setFilterData(e.target.value as 'semua' | 'belum')}
          className="px-3.5 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="semua">Semua data</option>
          <option value="belum">Hanya yang belum lengkap</option>
        </select>
        <span className="text-[11px] text-on-surface-variant font-medium">
          {filtered.length} dari {armada.length} unit
        </span>
        <button
          onClick={openCreate}
          className="ml-auto px-4 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Tambah Armada
        </button>
      </div>

      {/* Tabel Armada (8 Kolom Tanpa Ritase) */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant uppercase tracking-wider font-bold border-b border-outline-variant/30 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-4">Unit</th>
                <th className="py-3.5 px-4">Jenis</th>
                <th className="py-3.5 px-4">Plat KT</th>
                <th className="py-3.5 px-4">Tahun</th>
                <th className="py-3.5 px-4">Wilayah Kerja</th>
                <th className="py-3.5 px-4">Petugas</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-medium text-on-surface">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-on-surface-variant">
                    {armada.length === 0
                      ? 'Belum ada armada. Klik Tambah Armada.'
                      : 'Tidak ada armada dengan filter tersebut.'}
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-container-low/50 transition-colors align-top">
                    <td className="py-3 px-4 min-w-[200px]">
                      <span className="font-bold block">{a.nama_armada}</span>
                      <span className="text-[10px] text-on-surface-variant block">
                        {a.bagian_pekerjaan && a.bagian_pekerjaan !== KOSONG ? a.bagian_pekerjaan : <Nilai v={a.bagian_pekerjaan} />}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap"><Nilai v={a.jenis_armada} /></td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono"><Nilai v={a.plat_nomor} /></td>
                    <td className="py-3 px-4 whitespace-nowrap"><Nilai v={a.tahun} /></td>
                    <td className="py-3 px-4 whitespace-nowrap"><Nilai v={a.kecamatan_tugas} /></td>
                    <td className="py-3 px-4 min-w-[120px]">
                      <Nilai v={a.nama_petugas} />
                      {a.telepon && a.telepon !== KOSONG && (
                        <span className="text-[10px] text-on-surface-variant block">{a.telepon}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap shadow-xs ${statusClass(a.status)}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(a)}
                          className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center hover:bg-primary/90 transition-all"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(a)}
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

      {/* Modal Tambah / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 border border-outline-variant/30 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface">
                {editingId ? 'Edit Data Armada' : 'Tambah Armada Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
                aria-label="Tutup"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {formError && (
              <p className="text-xs text-error font-semibold bg-error-container/30 p-2.5 rounded-xl flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {formError}
              </p>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className={labelClass}>Nama / Unit Armada *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dump Truck 01 (DLH-01)"
                  maxLength={ARMADA_LIMITS.nama.max}
                  value={form.nama_armada}
                  onChange={(e) => setForm({ ...form, nama_armada: e.target.value })}
                  className={inputClass}
                />
                <FieldError message={fieldErrors.nama_armada} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Jenis Armada</label>
                  <input
                    type="text"
                    list="jenis-armada-list"
                    placeholder="Pilih atau ketik jenis"
                    maxLength={ARMADA_LIMITS.jenis.max}
                    value={form.jenis_armada}
                    onChange={(e) => setForm({ ...form, jenis_armada: e.target.value })}
                    className={inputClass}
                  />
                  <datalist id="jenis-armada-list">
                    {JENIS_ARMADA.map((j) => (
                      <option key={j} value={j} />
                    ))}
                  </datalist>
                  <FieldError message={fieldErrors.jenis_armada} />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className={inputClass}
                  >
                    {STATUS_ARMADA.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <FieldError message={fieldErrors.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Plat Nomor KT</label>
                  <input
                    type="text"
                    placeholder="Contoh: KT 8123 B"
                    maxLength={ARMADA_LIMITS.plat.max}
                    value={form.plat_nomor}
                    onChange={(e) => setForm({ ...form, plat_nomor: e.target.value.toUpperCase() })}
                    className={inputClass}
                  />
                  <FieldError message={fieldErrors.plat_nomor} />
                </div>
                <div>
                  <label className={labelClass}>Tahun Pembuatan</label>
                  <input
                    type="text"
                    placeholder="Contoh: 2018"
                    maxLength={4}
                    value={form.tahun}
                    onChange={(e) => setForm({ ...form, tahun: e.target.value })}
                    className={inputClass}
                  />
                  <FieldError message={fieldErrors.tahun} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Bagian Pekerjaan</label>
                <input
                  type="text"
                  placeholder="Contoh: Pengangkutan Sampah Pasar / Jalur Protokol"
                  maxLength={ARMADA_LIMITS.bagianPekerjaan.max}
                  value={form.bagian_pekerjaan}
                  onChange={(e) => setForm({ ...form, bagian_pekerjaan: e.target.value })}
                  className={inputClass}
                />
                <FieldError message={fieldErrors.bagian_pekerjaan} />
              </div>

              <div>
                <label className={labelClass}>Wilayah Kecamatan Tugas</label>
                <select
                  value={form.kecamatan_tugas}
                  onChange={(e) => setForm({ ...form, kecamatan_tugas: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Belum ditentukan</option>
                  {DUMMY_KECAMATAN_TUGAS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <FieldError message={fieldErrors.kecamatan_tugas} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Nama Petugas / Sopir</label>
                  <input
                    type="text"
                    placeholder="Nama lengkap petugas"
                    maxLength={ARMADA_LIMITS.petugas.max}
                    value={form.nama_petugas}
                    onChange={(e) => setForm({ ...form, nama_petugas: e.target.value })}
                    className={inputClass}
                  />
                  <FieldError message={fieldErrors.nama_petugas} />
                </div>
                <div>
                  <label className={labelClass}>No. Telepon</label>
                  <input
                    type="tel"
                    placeholder="Contoh: 08123456789"
                    maxLength={ARMADA_LIMITS.telepon.max}
                    value={form.telepon}
                    onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                    className={inputClass}
                  />
                  <FieldError message={fieldErrors.telepon} />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 bg-surface-container text-on-surface-variant font-bold text-xs rounded-xl hover:bg-surface-container-high"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary/90 shadow-md disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Armada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-container-lowest rounded-3xl p-6 shadow-2xl space-y-4 border border-outline-variant/30 text-center">
            <div className="w-14 h-14 rounded-full bg-error-container text-on-error-container mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">delete</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">Hapus Armada Ini?</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                <span className="font-bold">{deleteTarget.nama_armada}</span> akan dihapus permanen dari daftar armada dinas.
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
    </div>
  );
}

function Nilai({ v }: { v: string | undefined }) {
  if (!v || v === KOSONG) {
    return <span className="text-on-surface-variant/40 italic">-</span>;
  }
  return <span>{v}</span>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11px] text-error mt-1">{message}</p>;
}
