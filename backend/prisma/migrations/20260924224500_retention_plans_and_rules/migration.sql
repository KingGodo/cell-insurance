-- CreateTable
CREATE TABLE "retention_plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "offer" TEXT NOT NULL DEFAULT '',
    "cost" DECIMAL(12,2) NOT NULL,
    "channels" "RetentionChannel"[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retention_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "retention_plans_code_key" ON "retention_plans"("code");

-- Copy the current combined rows into plans, then turn the old rows into rules.
INSERT INTO "retention_plans" ("id", "code", "name", "summary", "offer", "cost", "channels", "enabled", "created_at", "updated_at")
SELECT gen_random_uuid()::text, "code", "name", "summary", "offer", "cost", "channels", "enabled", "created_at", "updated_at"
FROM "retention_rules";

ALTER TABLE "retention_rules" ADD COLUMN "plan_id" TEXT;

UPDATE "retention_rules" AS rule
SET "plan_id" = plan."id"
FROM "retention_plans" AS plan
WHERE plan."code" = rule."code";

UPDATE "retention_rules"
SET "code" = "code" || '-rule'
WHERE "code" NOT LIKE '%-rule';

UPDATE "retention_rules" SET "name" = 'Holders with children in a reopen month', "summary" = 'Value at least 40, risk at least 25, and a child on the membership, in January, May, or September.' WHERE "code" = 'back-to-school-rule';
UPDATE "retention_rules" SET "name" = 'High value and high risk', "summary" = 'Value at least 70 and risk at least 55.' WHERE "code" = 'personal-save-rule';
UPDATE "retention_rules" SET "name" = 'High value and contained risk', "summary" = 'Value at least 70 and risk at most 54.' WHERE "code" = 'premium-rebuild-rule';
UPDATE "retention_rules" SET "name" = 'Lower value and high risk', "summary" = 'Value at most 69 and risk at least 55.' WHERE "code" = 'early-hold-rule';

ALTER TABLE "retention_rules" ALTER COLUMN "plan_id" SET NOT NULL;

ALTER TABLE "retention_rules" DROP COLUMN "offer",
DROP COLUMN "cost",
DROP COLUMN "channels";

ALTER TABLE "retentions" ADD COLUMN "plan_id" TEXT;

UPDATE "retentions" AS deployment
SET "plan_id" = rule."plan_id"
FROM "retention_rules" AS rule
WHERE deployment."rule_id" = rule."id";

CREATE INDEX "retention_rules_plan_id_idx" ON "retention_rules"("plan_id");
CREATE INDEX "retentions_plan_id_idx" ON "retentions"("plan_id");

ALTER TABLE "retention_rules" ADD CONSTRAINT "retention_rules_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "retention_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "retentions" ADD CONSTRAINT "retentions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "retention_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
