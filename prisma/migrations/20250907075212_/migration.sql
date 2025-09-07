/*
  Warnings:

  - A unique constraint covering the columns `[inventoryId,customId]` on the table `inventory_items` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_inventoryId_customId_key" ON "public"."inventory_items"("inventoryId", "customId");
