-- CreateEnum
CREATE TYPE "RiskBand" AS ENUM ('STEADY', 'WATCH', 'LEAVING');

-- CreateEnum
CREATE TYPE "ValueBand" AS ENUM ('LOWER', 'CORE', 'HIGH');

-- CreateEnum
CREATE TYPE "RetentionStatus" AS ENUM ('OPEN', 'KEPT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SegmentKind" ADD VALUE 'RISK';
ALTER TYPE "SegmentKind" ADD VALUE 'VALUE';

-- AlterTable
ALTER TABLE "customer_profiles" ADD COLUMN     "risk_band" "RiskBand" NOT NULL DEFAULT 'STEADY',
ADD COLUMN     "risk_score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scored_at" TIMESTAMP(3),
ADD COLUMN     "value_band" "ValueBand" NOT NULL DEFAULT 'CORE',
ADD COLUMN     "value_score" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "retentions" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" "RetentionStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retentions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "retentions_customer_id_idx" ON "retentions"("customer_id");

-- CreateIndex
CREATE INDEX "retentions_status_idx" ON "retentions"("status");

-- AddForeignKey
ALTER TABLE "retentions" ADD CONSTRAINT "retentions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
