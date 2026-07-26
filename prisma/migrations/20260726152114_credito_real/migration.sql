/*
  Warnings:

  - You are about to drop the column `consumo` on the `CreditProductScore` table. All the data in the column will be lost.
  - You are about to drop the column `cupoCredito` on the `CreditProductScore` table. All the data in the column will be lost.
  - You are about to drop the column `vivienda` on the `CreditProductScore` table. All the data in the column will be lost.
  - Added the required column `compraCartera` to the `CreditProductScore` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cupoRotativo` to the `CreditProductScore` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hipotecario` to the `CreditProductScore` table without a default value. This is not possible if the table is not empty.
  - Added the required column `libreInversion` to the `CreditProductScore` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mejoraVivienda` to the `CreditProductScore` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mipymes` to the `CreditProductScore` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CreditProductScore" DROP COLUMN "consumo",
DROP COLUMN "cupoCredito",
DROP COLUMN "vivienda",
ADD COLUMN     "compraCartera" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "cupoRotativo" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "hipotecario" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "libreInversion" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "mejoraVivienda" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "mipymes" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "categoriaAfiliacion" TEXT NOT NULL DEFAULT 'B',
ADD COLUMN     "libranza" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tieneCreditoVivienda" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tieneTarjetaColsubsidio" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tipoVinculacion" TEXT NOT NULL DEFAULT 'asalariado';
