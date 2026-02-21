-- AlterEnum
ALTER TYPE "OrderStatus" RENAME VALUE 'DELIVERED' TO 'PAID';

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH_ON_DELIVERY', 'BANK_TRANSFER');

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "orderCode" TEXT,
ADD COLUMN "email" TEXT,
ADD COLUMN "totalAmount" DOUBLE PRECISION,
ADD COLUMN "paymentMethod" "PaymentMethod",
ADD COLUMN "paymentReference" TEXT,
ADD COLUMN "paymentReceiptUrl" TEXT,
ADD COLUMN "paymentDetails" JSONB,
ADD COLUMN "specialInstructions" TEXT,
ADD COLUMN "emailSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "smsSent" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Order"
SET "orderCode" = CONCAT('LEGACY-', "id"),
    "email" = CONCAT('legacy-order-', "id", '@foodie.local'),
    "totalAmount" = 0,
    "paymentMethod" = 'CASH_ON_DELIVERY';

ALTER TABLE "Order"
ALTER COLUMN "orderCode" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "totalAmount" SET NOT NULL,
ALTER COLUMN "paymentMethod" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderCode_key" ON "Order"("orderCode");
