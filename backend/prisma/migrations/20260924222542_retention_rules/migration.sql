-- CreateEnum
CREATE TYPE "MatrixSegment" AS ENUM ('VVIP', 'GROWABLE', 'GHOST', 'SAVE_ME_NOW');

-- CreateEnum
CREATE TYPE "RetentionChannel" AS ENUM ('SMS', 'EMAIL', 'SOCIALS', 'MARKETING', 'CUSTOMER_SERVICE', 'PORTAL');

-- AlterTable
ALTER TABLE "customer_profiles" ADD COLUMN     "matrix_segment" "MatrixSegment";

-- AlterTable
ALTER TABLE "retentions" ADD COLUMN     "channels" "RetentionChannel"[],
ADD COLUMN     "cost" DECIMAL(12,2),
ADD COLUMN     "from_segment" "MatrixSegment",
ADD COLUMN     "rule_id" TEXT,
ADD COLUMN     "to_segment" "MatrixSegment";

-- CreateTable
CREATE TABLE "retention_rules" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "from_segment" "MatrixSegment",
    "to_segment" "MatrixSegment" NOT NULL,
    "value_min" INTEGER,
    "value_max" INTEGER,
    "risk_min" INTEGER,
    "risk_max" INTEGER,
    "cost" DECIMAL(12,2) NOT NULL,
    "channels" "RetentionChannel"[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retention_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "retention_rules_code_key" ON "retention_rules"("code");

-- CreateIndex
CREATE INDEX "retention_rules_priority_idx" ON "retention_rules"("priority");

-- CreateIndex
CREATE INDEX "retentions_rule_id_idx" ON "retentions"("rule_id");

-- AddForeignKey
ALTER TABLE "retentions" ADD CONSTRAINT "retentions_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "retention_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
