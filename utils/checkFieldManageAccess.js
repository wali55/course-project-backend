const prisma = require("../config/database");

const checkFieldManageAccess = async (inventoryId, userId) => {
  const inventory = await prisma.inventory.findUnique({
    where: { id: inventoryId },
    select: { creatorId: true }
  });

  if (!inventory) return false;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  return inventory.creatorId === userId || user?.role === 'ADMIN';
};

module.exports = {checkFieldManageAccess}