const prisma = require("../config/database");

const checkWriteAccess = async (inventoryId, userId) => {
  const inventory = await prisma.inventory.findUnique({
    where: { id: inventoryId },
    include: {
      creator: true,
      accessList: { select: { userId: true } }
    }
  });

  if (!inventory) {
    return { hasAccess: false, error: 'Inventory not found' };
  }

  if (inventory.creatorId === userId) return { hasAccess: true, inventory };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (user?.role === 'ADMIN') return { hasAccess: true, inventory };
  if (inventory.isPublic) return { hasAccess: true, inventory };

  const hasExplicitAccess = inventory.accessList.some(access => access.userId === userId);
  return { hasAccess: hasExplicitAccess, inventory };
};

module.exports = {checkWriteAccess}