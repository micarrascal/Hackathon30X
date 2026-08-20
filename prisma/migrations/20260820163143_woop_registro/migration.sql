-- CreateTable
CREATE TABLE "WoopRegistro" (
    "employeeId" TEXT NOT NULL,
    "montoSolicitado" INTEGER NOT NULL,
    "plazoMeses" INTEGER NOT NULL,
    "productoInteres" TEXT NOT NULL,
    "motivo" TEXT,
    "registradoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WoopRegistro_pkey" PRIMARY KEY ("employeeId")
);

-- AddForeignKey
ALTER TABLE "WoopRegistro" ADD CONSTRAINT "WoopRegistro_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
