-- AlterTable
ALTER TABLE "User" ADD COLUMN     "contactadoAt" TIMESTAMP(3),
ADD COLUMN     "contactadoPorAsesor" BOOLEAN NOT NULL DEFAULT false;
