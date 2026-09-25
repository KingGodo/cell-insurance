-- CreateEnum
CREATE TYPE "PaymentChannel" AS ENUM ('BANK', 'MOBILE_MONEY', 'EMPLOYER_DEDUCTION', 'DIASPORA_TRANSFER', 'CASH');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- AlterTable
ALTER TABLE "customer_interactions" ADD COLUMN     "sentiment" "Sentiment" NOT NULL DEFAULT 'NEUTRAL';

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "employer" TEXT;

-- AlterTable
ALTER TABLE "insurance_policies" ADD COLUMN     "previous_premium" DECIMAL(12,2),
ADD COLUMN     "renewal_premium" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "premium_payments" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "channel" "PaymentChannel" NOT NULL,
    "payer_country" TEXT NOT NULL,
    "payer_city" TEXT NOT NULL,
    "due_date" DATE NOT NULL,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "premium_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "premium_payments_customer_id_idx" ON "premium_payments"("customer_id");

-- CreateIndex
CREATE INDEX "premium_payments_due_date_idx" ON "premium_payments"("due_date");

-- AddForeignKey
ALTER TABLE "premium_payments" ADD CONSTRAINT "premium_payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
