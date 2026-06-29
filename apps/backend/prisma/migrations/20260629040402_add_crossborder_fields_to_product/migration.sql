/*
  Warnings:

  - You are about to drop the column `stock` on the `Product` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "OrderState" ADD VALUE 'AWAITING_QUOTE';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "importDuty" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "shippingFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tax" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "productName" TEXT;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "stock",
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'VND',
ADD COLUMN     "height" DOUBLE PRECISION,
ADD COLUMN     "importDutyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "length" DOUBLE PRECISION,
ADD COLUMN     "originalPrice" DOUBLE PRECISION,
ADD COLUMN     "requiresQuote" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
ADD COLUMN     "weight" DOUBLE PRECISION,
ADD COLUMN     "width" DOUBLE PRECISION;
