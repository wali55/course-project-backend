const { checkWriteAccess } = require("../utils/checkWriteAccess");
const prisma = require("../config/database");

const getInventoryAccessList = async (req, res) => {
  try {
    const { inventoryId } = req.params;

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: {
        category: true,
        tags: { include: { tag: true } },
        creator: { select: { id: true, username: true } },
        accessList: {
          include: {
            user: { select: { id: true, username: true, email: true } },
          },
        },
        customFields: true,
        _count: { select: { tags: true } },
      },
    });

    if (!inventory) {
      return res.status(404).json({ error: "Inventory not found" });
    }

    res.json({
      inventory: { ...inventory, tags: inventory.tags.map((t) => t.tag) },
      accessList: inventory.accessList.map((access) => ({
        id: access.id,
        user: access.user,
        grantedAt: access.grantedAt,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch access list" });
  }
};

const searchUsersForAddingToAccessList = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { q, limit = 10 } = req.query;

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
    });

    if (!inventory) {
      return res.status(404).json({ error: "Inventory not found" });
    }

    const canManage =
      inventory.creatorId === req.user.id || req.user.role === "ADMIN";
    if (!canManage) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const existingAccess = await prisma.inventoryAccess.findMany({
      where: { inventoryId },
      select: { userId: true },
    });
    const excludeUserIds = [
      inventory.creatorId,
      ...existingAccess.map((a) => a.userId),
    ];

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { notIn: excludeUserIds } },
          { isActive: true },
          {
            OR: [
              { username: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: { id: true, username: true, email: true },
      take: parseInt(limit),
      orderBy: { username: "asc" },
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to search users" });
  }
};

const addUserToInventoryAccessList = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
    });

    if (!inventory) {
      return res.status(404).json({ error: "Inventory not found" });
    }

    const canManage =
      inventory.creatorId === req.user.id || req.user.role === "ADMIN";
    if (!canManage) {
      return res.status(403).json({ error: "Access denied" });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, isActive: true },
    });

    if (!targetUser || !targetUser.isActive) {
      return res.status(400).json({ error: "User not found or inactive" });
    }

    const existingAccess = await prisma.inventoryAccess.findUnique({
      where: {
        inventoryId_userId: { inventoryId, userId },
      },
    });

    if (existingAccess) {
      return res.status(400).json({ error: "User already has access" });
    }

    const access = await prisma.inventoryAccess.create({
      data: {
        inventoryId,
        userId,
        grantedBy: req.user.id,
      },
      include: {
        user: { select: { id: true, username: true, email: true } },
      },
    });

    res.status(201).json({
      id: access.id,
      user: access.user,
      grantedAt: access.grantedAt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add user access" });
  }
};

const removeUserFromInventoryAccessList = async (req, res) => {
  try {
    const { inventoryId, accessId } = req.params;

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
    });

    if (!inventory) {
      return res.status(404).json({ error: "Inventory not found" });
    }

    const canManage =
      inventory.creatorId === req.user.id || req.user.role === "ADMIN";
    if (!canManage) {
      return res.status(403).json({ error: "Access denied" });
    }

    const access = await prisma.inventoryAccess.findUnique({
      where: { id: accessId },
    });

    if (!access || access.inventoryId !== inventoryId) {
      return res.status(404).json({ error: "Access record not found" });
    }

    await prisma.inventoryAccess.delete({
      where: { id: accessId },
    });

    res.json({ message: "Access removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to remove user access" });
  }
};

const checkUserHasWriteAccessToInventory = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { hasAccess } = await checkWriteAccess(inventoryId, req.user.id);
    res.json({ canWrite: hasAccess });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to check access" });
  }
};

module.exports = {
  getInventoryAccessList,
  searchUsersForAddingToAccessList,
  addUserToInventoryAccessList,
  removeUserFromInventoryAccessList,
  checkUserHasWriteAccessToInventory,
};
