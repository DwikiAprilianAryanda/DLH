/**
 * Kompres foto di browser sebelum dikirim.
 * Foto HP bisa 4-8 MB; disimpan base64 di MySQL itu berat. Di sini diperkecil jadi
 * sisi terpanjang maks 1280 px, JPEG kualitas 0.8 (biasanya 150-400 KB) dan EXIF
 * (termasuk lokasi di metadata foto) otomatis terbuang karena digambar ulang lewat canvas.
 * Hanya untuk dipanggil dari komponen 'use client'.
 */
export async function kompresFoto(file: File, sisiMaks = 1280, kualitas = 0.8): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar (JPG, PNG, atau WEBP).');
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Gambar tidak bisa dibaca. Coba foto ulang.'));
      el.src = url;
    });

    const skala = Math.min(1, sisiMaks / Math.max(img.naturalWidth, img.naturalHeight));
    const lebar = Math.max(1, Math.round(img.naturalWidth * skala));
    const tinggi = Math.max(1, Math.round(img.naturalHeight * skala));

    const canvas = document.createElement('canvas');
    canvas.width = lebar;
    canvas.height = tinggi;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Browser tidak mendukung pemrosesan gambar.');
    ctx.drawImage(img, 0, 0, lebar, tinggi);

    return canvas.toDataURL('image/jpeg', kualitas);
  } finally {
    URL.revokeObjectURL(url);
  }
}
