const prisma = require("../config/database");
const { IdGenerator } = require("../utils/idGenerator");

const inventoryIdFormats = new Map();


const fetchInventoryItems = async (req, res) => {
  try {
    const { inventoryId } = req.params;

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      select: {
        isPublic: true,
        creatorId: true,
        accessList: { select: { userId: true } },
      },
    });

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    const items = await prisma.inventoryItem.findMany({
      where: { inventoryId },
      include: {
        creator: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const fetchSingleInventoryItem = async (req, res) => {
  try {
    const { inventoryId, itemId } = req.params;

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      select: {
        isPublic: true,
        creatorId: true,
        accessList: { select: { userId: true } },
      },
    });

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
      include: {
        creator: { select: { id: true, username: true } },
      },
    });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const createItem = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { fieldValues, customId: userCustomId } = req.body;

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      select: {
        isPublic: true,
        creatorId: true,
        accessList: { select: { userId: true } },
      },
    });

    if (!inventory) {
      return res
        .status(404)
        .json({ message: "Inventory not found" });
    }

    const userId = req.user.id;
    const isAdmin = req.user.role === "ADMIN";
    const hasPrivateAccess =
      inventory.creatorId === userId ||
      inventory.accessList.some((u) => u.userId === userId);

    if (!isAdmin) {
      if (!inventory.isPublic && !hasPrivateAccess) {
        return res
          .status(403)
          .json({ message: "Not authorized to create item in this inventory" });
      }
    }

    let customId = userCustomId;

    if (!customId) {
      const idFormat = inventoryIdFormats.get(inventoryId);
      if (idFormat) {
        customId = await IdGenerator.generateCustomId(
          inventoryId,
          idFormat,
          prisma
        );
      }
    }

    if (customId) {
      const existing = await prisma.inventoryItem.findFirst({
        where: {
          inventoryId,
          customId,
        },
      });

      if (existing) {
        return res.status(400).json({ message: "Custom ID already exists" });
      }
    }

    const item = await prisma.inventoryItem.create({
      data: {
        inventoryId,
        createdBy: userId,
        customId,
        fieldValues: fieldValues || {},
      },
      include: {
        creator: {
          select: { id: true, username: true },
        },
      },
    });

    res.status(201).json(item);
  } catch (error) {
    if (error.code === "P2002") {
      res.status(400).json({ message: "Custom ID must be unique" });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

const updateItem = async (req, res) => {
  try {
    const { inventoryId, itemId } = req.params;
    const { fieldValues, customId } = req.body;

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      select: {
        isPublic: true,
        creatorId: true,
        accessList: { select: { userId: true } },
      },
    });

    if (!inventory) {
      return res
        .status(404)
        .json({ message: "Inventory not found" });
    }

    const item = await prisma.inventoryItem.findFirst({
      where: { id: itemId, inventoryId },
    });

    if (!item) {
      return res
        .status(404)
        .json({ message: "Item not found" });
    }

    const userId = req.user.id;
    const isAdmin = req.user.role === "ADMIN";
    const hasPrivateAccess =
      inventory.creatorId === userId ||
      inventory.accessList.some((u) => u.userId === userId);

    if (!isAdmin) {
      if (!inventory.isPublic && !hasPrivateAccess) {
        return res
          .status(403)
          .json({ message: "Not authorized to update item in this inventory" });
      }
    }

    if (customId && customId !== item.customId) {
      const existing = await prisma.inventoryItem.findFirst({
        where: {
          inventoryId,
          customId,
          id: { not: itemId },
        },
      });

      if (existing) {
        return res.status(400).json({ message: "Custom ID already exists" });
      }
    }

    const updatedItem = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        ...(fieldValues && { fieldValues }),
        ...(customId && { customId }),
      },
      include: {
        creator: {
          select: { id: true, username: true },
        },
      },
    });

    res.json(updatedItem);
  } catch (error) {
    if (error.code === "P2002") {
      res.status(400).json({ message: "Custom ID must be unique" });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};


const deleteItem = async (req, res) => {
  try {
    const { inventoryId, itemId } = req.params;

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      select: {
        isPublic: true,
        creatorId: true,
        accessList: { select: { userId: true } },
      },
    });

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: itemId,
        inventoryId,
      },
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const userId = req.user.id;
    const userRole = req.user.role;

    const isAdmin = userRole === 'ADMIN';
    const hasPrivateAccess =
      inventory.creatorId === userId ||
      inventory.accessList.some((u) => u.userId === userId);

    if (!isAdmin) {
      if (!inventory.isPublic && !hasPrivateAccess) {
        return res.status(403).json({ message: 'Not authorized to delete this item' });
      }
    }

    await prisma.inventoryItem.delete({
      where: { id: itemId },
    });

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = { fetchInventoryItems, fetchSingleInventoryItem, createItem, updateItem, deleteItem };
