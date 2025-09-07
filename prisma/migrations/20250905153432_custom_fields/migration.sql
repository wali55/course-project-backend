-- CreateEnum
CREATE TYPE "public"."FieldType" AS ENUM ('SINGLE_TEXT', 'MULTI_TEXT', 'NUMBER', 'DOCUMENT_LINK', 'BOOLEAN');

-- CreateTable
CREATE TABLE "public"."custom_fields" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fieldType" "public"."FieldType" NOT NULL,
    "showInTable" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "inventoryId" TEXT NOT NULL,

    CONSTRAINT "custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventory_items" (
    "id" TEXT NOT NULL,
    "customId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "fieldValues" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_fields_inventoryId_title_key" ON "public"."custom_fields"("inventoryId", "title");

-- AddForeignKey
ALTER TABLE "public"."custom_fields" ADD CONSTRAINT "custom_fields_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."inventories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_items" ADD CONSTRAINT "inventory_items_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."inventories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_items" ADD CONSTRAINT "inventory_items_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
