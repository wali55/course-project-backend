-- CreateTable
CREATE TABLE "public"."id_formats" (
    "id" TEXT NOT NULL,
    "elements" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "inventoryId" TEXT NOT NULL,

    CONSTRAINT "id_formats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "id_formats_inventoryId_key" ON "public"."id_formats"("inventoryId");

-- AddForeignKey
ALTER TABLE "public"."id_formats" ADD CONSTRAINT "id_formats_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."inventories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
