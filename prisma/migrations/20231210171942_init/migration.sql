-- CreateTable
CREATE TABLE `News` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `url` VARCHAR(191) NOT NULL,
    `title` VARCHAR(2048) NOT NULL,
    `thumbnail` VARCHAR(2048) NULL,
    `publisherLogo` VARCHAR(2048) NOT NULL,
    `publisherName` VARCHAR(2048) NOT NULL,
    `publishedAt` DATETIME(3) NOT NULL,
    `scrapedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `excerpt` VARCHAR(4096) NOT NULL,
    `headlineCoverId` INTEGER NULL,
    `headlineNewsId` INTEGER NULL,

    UNIQUE INDEX `News_url_key`(`url`),
    UNIQUE INDEX `News_headlineCoverId_key`(`headlineCoverId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Headline` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `referrer` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Headline_referrer_key`(`referrer`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `State` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` ENUM('LAST_SCRAPED') NOT NULL,
    `value` DATETIME(3) NOT NULL,

    UNIQUE INDEX `State_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `News` ADD CONSTRAINT `News_headlineCoverId_fkey` FOREIGN KEY (`headlineCoverId`) REFERENCES `Headline`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `News` ADD CONSTRAINT `News_headlineNewsId_fkey` FOREIGN KEY (`headlineNewsId`) REFERENCES `Headline`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;
