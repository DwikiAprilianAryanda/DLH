-- AlterTable
ALTER TABLE `armada` ADD COLUMN `bagian_pekerjaan` VARCHAR(191) NOT NULL DEFAULT '-',
    ADD COLUMN `jenis_armada` VARCHAR(191) NOT NULL DEFAULT '-',
    ADD COLUMN `tahun` VARCHAR(191) NOT NULL DEFAULT '-';

-- CreateTable
CREATE TABLE `ritase_armada` (
    `id` VARCHAR(191) NOT NULL,
    `armada_id` VARCHAR(191) NOT NULL,
    `tanggal` DATE NOT NULL,
    `jumlah_trip` INTEGER NOT NULL,
    `catatan` VARCHAR(191) NULL,
    `dicatat_oleh` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ritase_armada_tanggal_idx`(`tanggal`),
    UNIQUE INDEX `ritase_armada_armada_id_tanggal_key`(`armada_id`, `tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
