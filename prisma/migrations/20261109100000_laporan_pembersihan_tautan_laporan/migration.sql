-- AlterTable
ALTER TABLE `laporan_pembersihan_tps` ADD COLUMN `laporan_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `laporan_pembersihan_tps_laporan_id_idx` ON `laporan_pembersihan_tps`(`laporan_id`);
