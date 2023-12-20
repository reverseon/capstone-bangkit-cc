/*
  Warnings:

  - Added the required column `bias` to the `News` table without a default value. This is not possible if the table is not empty.
  - Added the required column `center_tendency` to the `News` table without a default value. This is not possible if the table is not empty.
  - Added the required column `left_tendency` to the `News` table without a default value. This is not possible if the table is not empty.
  - Added the required column `right_tendency` to the `News` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subjectivity` to the `News` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `News` ADD COLUMN `bias` DOUBLE NOT NULL,
    ADD COLUMN `center_tendency` DOUBLE NOT NULL,
    ADD COLUMN `left_tendency` DOUBLE NOT NULL,
    ADD COLUMN `right_tendency` DOUBLE NOT NULL,
    ADD COLUMN `subjectivity` DOUBLE NOT NULL;
