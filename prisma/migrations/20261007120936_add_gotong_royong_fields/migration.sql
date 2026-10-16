-- AlterTable
ALTER TABLE `laporan_sampah` ADD COLUMN `jenis_laporan` VARCHAR(191) NOT NULL DEFAULT 'Pengaduan',
    ADD COLUMN `jumlah_peserta` INTEGER NULL,
    ADD COLUMN `tanggal_rencana` DATETIME(3) NULL;
