-- AlterTable
ALTER TABLE "retention_rules" DROP COLUMN "from_segment",
DROP COLUMN "to_segment",
ADD COLUMN     "active_months" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "offer" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "requires_children" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "retentions" DROP COLUMN "from_segment",
DROP COLUMN "to_segment",
ADD COLUMN     "risk_score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "value_score" INTEGER NOT NULL DEFAULT 0;
