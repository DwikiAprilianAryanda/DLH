'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useReports } from '@/context/ReportContext';
import { KECAMATAN_SAMARINDA, type ArmadaItem } from '@/lib/mock-data';
import {
  ARMADA_LIMITS,
  JENIS_ARMADA,
  KOSONG,
  STATUS_ARMADA,
  armadaBelumLengkap,
} from '@/lib/armada';

const emptyForm = {
  nama_armada: '',
  jenis_armada: JENIS_ARMADA[0] as string,
  bagian_pekerjaan: '',
  plat_nomor: '',
  tahun: '',
  kecamatan_tugas: '',
  nama_petugas: '',
  telepon: '',
  status: 'Tersedia' as string,
};

type FormState = typeof emptyForm;

interface RitaseItem {
  id: string;
  tanggal: string;
  jumlah_trip: number;
  catatan: string | null;
}

const inputClass =
  'w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30';
const labelClass = 'block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5';

function hariIniWitaClient(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' });
}

/** Nilai '-' ditandai kuning supaya kelihatan masih butuh data dari DLH. */
function Nilai({ v }: { v?: string | null }) {
  if (!v || v === KOSONG) {
    return (
      <span
        className="inline-block px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 text-[10px] font-bold"
        title="Belum ada data (menunggu dari DLH)"
      >
        -
      </span>
    );
  }
  return <span>{v}</span>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11px] text-error font-semibold mt-1">{message}</p>;
}

export default function ArmadaManager() {
  const { armada, refreshArmada } = useReports();

  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('semua');
  const [filterData, setFilterData] = useState<'semua' | 'belum'>('semua');

  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ArmadaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [ritaseTarget, setRitaseTarget] = useState<ArmadaItem | null>(null);
  const [ritaseBulan, setRitaseBulan] = useState(hariIniWitaClient().slice(0, 7));
  const [ritaseTanggal, setRitaseTanggal] = useState(hariIniWitaClient());
  const [ritaseTrip, setRitaseTrip] = useState('');
  const [ritaseCatatan, setRitaseCatatan] = useState('');
  const [ritaseItems, setRitaseItems] = useState<RitaseItem[]>([]);
  const [ritaseTotal, setRitaseTotal] = useState(0);
  const [ritaseError, setRitaseError] = useState('');
  const [ritaseLoading, setRitaseLoading] = useState(false);
  const [ritaseSaving, setRitaseSaving] = useState(false);

  const jenisOptions = useMemo(() => {
    const hitung = new Map<string, number>();
    for (const a of armada) {
      const j = a.jenis_armada ?? KOSONG;
      hitung.set(j, (hitung.get(j) ?? 0) + 1);
    }
    return Array.from(hitung.entries()).sort((x, y) => y[1] - x[1]);
  }, [armada]);

  const belumLengkap = useMemo(
    () => armada.filter((a) => armadaBelumLengkap(a)).length,
    [armada]
  );
  const ritaseHariIni = useMemo(
    () => armada.reduce((sum, a) => sum + (a.ritase_hari_ini ?? 0), 0),
    [armada]
  );
  const ritaseBulanIni = useMemo(
    () => armada.reduce((sum, a) => sum + (a.ritase_bulan_ini ?? 0), 0),
    [armada]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return armada.filter((a) => {
      if (filterJenis !== 'semua' && (a.jenis_armada ?? KOSONG) !== filterJenis) return false;
      if (filterData === 'belum' && !armadaBelumLengkap(a)) return false;
      if (q) {
        const haystack = [a.nama_armada, a.jenis_armada, a.bagian_pekerjaan, a.plat_nomor, a.nama_petugas, a.kecamatan_tugas]
          .map((x) => (x ?? '').toLowerCase())
          .join(' | ');
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [armada, search, filterJenis, filterData]);

  // ---------- Tambah / Edit ----------
  const openCreate = () => {
    setFormMode('create');
    setEditId(null);
    setForm(emptyForm);
    setFieldErrors({});
    setFormError('');
  };

  const openEdit = (a: ArmadaItem) => {
    const kosongJadiStrip = (v?: string) => (!v || v === KOSONG ? '' : v);
    setFormMode('edit');
    setEditId(a.id);
    setForm({
      nama_armada: a.nama_armada,
      jenis_armada: a.jenis_armada && a.jenis_armada !== KOSONG ? a.jenis_armada : JENIS_ARMADA[0],
      bagian_pekerjaan: kosongJadiStrip(a.bagian_pekerjaan),
      plat_nomor: kosongJadiStrip(a.plat_nomor),
      tahun: kosongJadiStrip(a.tahun),
      kecamatan_tugas: kosongJadiStrip(a.kecamatan_tugas),
      nama_petugas: kosongJadiStrip(a.nama_petugas),
      telepon: kosongJadiStrip(a.telepon),
      status: a.status,
    });
    setFieldErrors({});
    setFormError('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFieldErrors({});
    setFormError('');
    try {
      const res = await fetch(formMode === 'create' ? '/api/armada' : `/api/armada/${editId}`, {
        method: formMode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFieldErrors(data.fields ?? {});
        setFormError(data.error || 'Gagal menyimpan armada.');
        return;
      }
      await refreshArmada();
      setFormMode(null);
    } catch (error) {
      console.error('Gagal simpan armada:', error);
      setFormError('Tidak dapat terhubung ke server.');
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
      if (!res.ok) throw new Error('Gagal hapus');
      await refreshArmada();
      setDeleteTarget(null);
    } catch (error) {
      console.error('Gagal hapus armada:', error);
      alert('Gagal menghapus armada, coba lagi.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ---------- Ritase ----------
  const loadRitase = useCallback(async (armadaId: string, bulan: string) => {
    setRitaseLoading(true);
    try {
      const res = await fetch(`/api/armada/${armadaId}/ritase?bulan=${bulan}`);
      const data = await res.json();
      if (res.ok) {
        setRitaseItems(data.items ?? []);
        setRitaseTotal(data.total ?? 0);
      } else {
        setRitaseItems([]);
        setRitaseTotal(0);
      }
    } catch (error) {
      console.error('Gagal ambil ritase:', error);
    } finally {
      setRitaseLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ritaseTarget) loadRitase(ritaseTarget.id, ritaseBulan);
  }, [ritaseTarget, ritaseBulan, loadRitase]);

  const openRitase = (a: ArmadaItem) => {
    const hariIni = hariIniWitaClient();
    setRitaseTarget(a);
    setRitaseBulan(hariIni.slice(0, 7));
    setRitaseTanggal(hariIni);
    setRitaseTrip('');
    setRitaseCatatan('');
    setRitaseError('');
  };

  const handleSaveRitase = async () => {
    if (!ritaseTarget) return;
    setRitaseError('');
    if (ritaseTrip === '' || !Number.isInteger(Number(ritaseTrip))) {
      setRitaseError('Isi jumlah ritase dengan bilangan bulat.');
      return;
    }
    setRitaseSaving(true);
    try {
      const res = await fetch(`/api/armada/${ritaseTarget.id}/ritase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal: ritaseTanggal,
          jumlah_trip: Number(ritaseTrip),
          catatan: ritaseCatatan,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const first = data.fields ? Object.values(data.fields as Record<string, string>)[0] : null;
        setRitaseError(first || data.error || 'Gagal menyimpan ritase.');
        return;
      }
      setRitaseTrip('');
      setRitaseCatatan('');
      setRitaseBulan(ritaseTanggal.slice(0, 7));
      await Promise.all([loadRitase(ritaseTarget.id, ritaseTanggal.slice(0, 7)), refreshArmada()]);
    } catch (error) {
      console.error('Gagal simpan ritase:', error);
      setRitaseError('Tidak dapat terhubung ke server.');
    } finally {
      setRitaseSaving(false);
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
      {/* Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Total Armada</span>
          <span className="text-2xl font-bold text-on-surface">{armada.length}</span>
          <span className="text-xs text-on-surface-variant"> unit</span>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-amber-500/30 shadow-xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Data Belum Lengkap</span>
          <span className="text-2xl font-bold text-amber-700">{belumLengkap}</span>
          <span className="text-xs text-on-surface-variant"> unit (ada kolom &quot;-&quot;)</span>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Ritase Hari Ini</span>
          <span className="text-2xl font-bold text-primary">{ritaseHariIni}</span>
          <span className="text-xs text-on-surface-variant"> perjalanan</span>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Ritase Bulan Ini</span>
          <span className="text-2xl font-bold text-primary">{ritaseBulanIni}</span>
          <span className="text-xs text-on-surface-variant"> perjalanan</span>
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

      {/* Tabel */}
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
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Ritase (hari ini / bulan ini)</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-medium text-on-surface">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-on-surface-variant">
                    {armada.length === 0
                      ? 'Belum ada armada. Jalankan seed armada atau klik Tambah Armada.'
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
                    <td className="py-3 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusClass(a.status)}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="font-bold text-primary">{a.ritase_hari_ini ?? 0}</span>
                      <span className="text-on-surface-variant"> / </span>
                      <span className="font-bold">{a.ritase_bulan_ini ?? 0}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openRitase(a)}
                          className="w-8 h-8 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center hover:opacity-80 transition-opacity"
                          title="Catat ritase"
                        >
                          <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                        </button>
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

      {/* Modal Tambah/Edit */}
      {formMode && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-xl bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 border border-outline-variant/30 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-on-surface">
                  {formMode === 'create' ? 'Tambah Armada Baru' : 'Edit Data Armada'}
                </h3>
                <p className="text-[11px] text-on-surface-variant">
                  Kolom yang dikosongkan disimpan sebagai &quot;-&quot; (menunggu data dari DLH)
                </p>
              </div>
              <button
                onClick={() => setFormMode(null)}
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

            <div>
              <label className={labelClass}>Nama Unit *</label>
              <input
                type="text"
                value={form.nama_armada}
                maxLength={ARMADA_LIMITS.nama.max}
                placeholder="Contoh: Dump Truck 07"
                onChange={(e) => setForm({ ...form, nama_armada: e.target.value })}
                className={inputClass}
              />
              <FieldError message={fieldErrors.nama_armada} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Jenis Armada *</label>
                <select
                  value={form.jenis_armada}
                  onChange={(e) => setForm({ ...form, jenis_armada: e.target.value })}
                  className={inputClass}
                >
                  {JENIS_ARMADA.map((j) => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
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
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <FieldError message={fieldErrors.status} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Bagian Pekerjaan</label>
              <input
                type="text"
                value={form.bagian_pekerjaan}
                maxLength={ARMADA_LIMITS.bagian.max}
                placeholder="Contoh: Angkutan Sampah (Dump Truck)"
                onChange={(e) => setForm({ ...form, bagian_pekerjaan: e.target.value })}
                className={inputClass}
              />
              <FieldError message={fieldErrors.bagian_pekerjaan} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Plat Nomor (KT)</label>
                <input
                  type="text"
                  value={form.plat_nomor}
                  maxLength={ARMADA_LIMITS.plat.max}
                  placeholder="KT 1234 AB"
                  onChange={(e) => setForm({ ...form, plat_nomor: e.target.value })}
                  className={`${inputClass} font-mono uppercase`}
                />
                <FieldError message={fieldErrors.plat_nomor} />
              </div>
              <div>
                <label className={labelClass}>Tahun</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.tahun}
                  maxLength={4}
                  placeholder="2020"
                  onChange={(e) => setForm({ ...form, tahun: e.target.value.replace(/\D/g, '') })}
                  className={inputClass}
                />
                <FieldError message={fieldErrors.tahun} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Wilayah Kerja</label>
              <select
                value={form.kecamatan_tugas}
                onChange={(e) => setForm({ ...form, kecamatan_tugas: e.target.value })}
                className={inputClass}
              >
                <option value="">Belum diisi (-)</option>
                {KECAMATAN_SAMARINDA.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              <FieldError message={fieldErrors.kecamatan_tugas} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Nama Petugas</label>
                <input
                  type="text"
                  value={form.nama_petugas}
                  maxLength={ARMADA_LIMITS.petugas.max}
                  onChange={(e) => setForm({ ...form, nama_petugas: e.target.value })}
                  className={inputClass}
                />
                <FieldError message={fieldErrors.nama_petugas} />
              </div>
              <div>
                <label className={labelClass}>Telepon</label>
                <input
                  type="tel"
                  value={form.telepon}
                  maxLength={ARMADA_LIMITS.telepon.max}
                  placeholder="0812-0000-0000"
                  onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                  className={inputClass}
                />
                <FieldError message={fieldErrors.telepon} />
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
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary/90 shadow-md disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan...' : formMode === 'create' ? 'Tambah Armada' : 'Simpan Perubahan'}
              </button>
            </div>
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
                <span className="font-bold">{deleteTarget.nama_armada}</span> beserta seluruh catatan
                ritasenya akan dihapus permanen.
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

      {/* Modal Ritase */}
      {ritaseTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 border border-outline-variant/30 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-on-surface">Catat Ritase</h3>
                <p className="text-[11px] text-on-surface-variant">
                  {ritaseTarget.nama_armada} &middot; ritase = jumlah perjalanan pulang-pergi
                </p>
              </div>
              <button
                onClick={() => setRitaseTarget(null)}
                className="w-8 h-8 shrink-0 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
                aria-label="Tutup"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {ritaseError && (
              <p className="text-xs text-error font-semibold bg-error-container/30 p-2.5 rounded-xl flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {ritaseError}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Tanggal</label>
                <input
                  type="date"
                  value={ritaseTanggal}
                  max={hariIniWitaClient()}
                  onChange={(e) => setRitaseTanggal(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Jumlah Ritase</label>
                <input
                  type="number"
                  min={ARMADA_LIMITS.ritase.min}
                  max={ARMADA_LIMITS.ritase.max}
                  step={1}
                  value={ritaseTrip}
                  placeholder="0 - 50"
                  onChange={(e) => setRitaseTrip(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Catatan (opsional)</label>
              <input
                type="text"
                value={ritaseCatatan}
                maxLength={ARMADA_LIMITS.ritaseCatatan.max}
                onChange={(e) => setRitaseCatatan(e.target.value)}
                className={inputClass}
              />
            </div>
            <p className="text-[10px] text-on-surface-variant">
              Satu armada satu angka per hari. Mengisi tanggal yang sama lagi akan menimpa angka sebelumnya.
            </p>
            <button
              onClick={handleSaveRitase}
              disabled={ritaseSaving}
              className="w-full py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary/90 shadow-md disabled:opacity-50"
            >
              {ritaseSaving ? 'Menyimpan...' : 'Simpan Ritase'}
            </button>

            <div className="pt-2 border-t border-outline-variant/30 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-on-surface">Riwayat bulan</span>
                <input
                  type="month"
                  value={ritaseBulan}
                  max={hariIniWitaClient().slice(0, 7)}
                  onChange={(e) => e.target.value && setRitaseBulan(e.target.value)}
                  className="px-2.5 py-1.5 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs text-on-surface"
                />
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Total bulan ini: <span className="font-bold text-primary">{ritaseTotal}</span> perjalanan
              </p>
              {ritaseLoading ? (
                <p className="text-xs text-on-surface-variant py-2">Memuat...</p>
              ) : ritaseItems.length === 0 ? (
                <p className="text-xs text-on-surface-variant py-2">Belum ada catatan ritase di bulan ini.</p>
              ) : (
                <ul className="divide-y divide-outline-variant/20 text-xs max-h-48 overflow-y-auto">
                  {ritaseItems.map((r) => (
                    <li key={r.id} className="py-1.5 flex items-center justify-between gap-2">
                      <button
                        className="text-left hover:text-primary"
                        onClick={() => {
                          setRitaseTanggal(r.tanggal);
                          setRitaseTrip(String(r.jumlah_trip));
                          setRitaseCatatan(r.catatan ?? '');
                        }}
                        title="Klik untuk koreksi"
                      >
                        <span className="font-semibold">{r.tanggal}</span>
                        {r.catatan && <span className="text-on-surface-variant"> &middot; {r.catatan}</span>}
                      </button>
                      <span className="font-bold text-primary shrink-0">{r.jumlah_trip}x</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
