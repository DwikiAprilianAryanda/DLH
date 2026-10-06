-- CreateTable
CREATE TABLE `tps` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `kecamatan` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `bangunan` VARCHAR(191) NULL,
    `mobilitas` VARCHAR(191) NULL,
    `jumlah_bak` INTEGER NULL,
    `jenis` VARCHAR(191) NULL,
    `jam_buka` VARCHAR(191) NULL,
    `jam_tutup` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
