-- CreateTable
CREATE TABLE `laporan_pembersihan_tps` (
    `id` VARCHAR(191) NOT NULL,
    `tps_id` VARCHAR(191) NOT NULL,
    `tps_nama` VARCHAR(191) NOT NULL,
    `kecamatan` VARCHAR(191) NOT NULL,
    `pengawas_id` VARCHAR(191) NOT NULL,
    `pengawas_nama` VARCHAR(191) NOT NULL,
    `foto_url` LONGTEXT NOT NULL,
    `catatan` TEXT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `jarak_meter` DOUBLE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `laporan_pembersihan_tps_tps_id_created_at_idx`(`tps_id`, `created_at`),
    INDEX `laporan_pembersihan_tps_kecamatan_created_at_idx`(`kecamatan`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
