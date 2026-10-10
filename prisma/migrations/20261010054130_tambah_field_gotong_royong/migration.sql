-- AlterTable
ALTER TABLE `laporan_sampah` ADD COLUMN `institusi` VARCHAR(191) NULL,
    ADD COLUMN `nama_pemohon` VARCHAR(191) NULL,
    ADD COLUMN `surat_permohonan_url` LONGTEXT NULL;
