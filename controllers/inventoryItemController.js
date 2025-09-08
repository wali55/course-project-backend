const { uploadToCloudinary } = require("../config/cloudinary");
const prisma = require("../config/database");
const {
  validateAndProcessFieldValues,
} = require("../middleware/validateAndProcessFieldValues");
const { checkWriteAccess } = require("../utils/checkWriteAccess");
const { IdGenerator } = require("../utils/idGenerator");

const fetchInventoryItems = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const {
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "desc",
      search,
    } = req.query;

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: {
        idFormat: true,
        customFields: true,
        accessList: { select: { userId: true } },
      },
    });

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    const where = {
      inventoryId,
      ...(search && {
        OR: [
          { customId: { contains: search, mode: "insensitive" } },
          { fieldValues: { path: [], string_contains: search } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        include: {
          creator: { select: { id: true, username: true } },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    res.json({
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      customFields: inventory.customFields,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const fetchSingleInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
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
    let { customId, fieldValues } = req.body;

    const hasAccess = (await checkWriteAccess(inventoryId, req.user.id))
      .hasAccess;
    if (!hasAccess) {
      return res.status(403).json({ message: "Write access denied" });
    }

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: { customFields: true, idFormat: true },
    });

    if (!customId) {
      customId = await IdGenerator.generateCustomId(inventoryId, inventory?.idFormat, prisma);
    } else {
      const existing = await prisma.inventoryItem.findFirst({
        where: { inventoryId, customId },
      });
      if (existing) {
        return res.status(400).json({ message: "Custom ID already exists" });
      }
    }

    const validatedFieldValues = await validateAndProcessFieldValues(
      fieldValues || {},
      inventory.customFields
    );

    const item = await prisma.inventoryItem.create({
      data: {
        inventoryId,
        customId,
        createdBy: req.user.id,
        fieldValues: validatedFieldValues,
      },
      include: {
        creator: { select: { id: true, username: true } },
      },
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { fieldValues } = req.body; 

    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id },
      include: { inventory: { include: { customFields: true } } },
    });

    if (!existingItem) {
      return res.status(404).json({ error: "Item not found" });
    }

    const hasAccess = (
      await checkWriteAccess(existingItem.inventoryId, req.user.id)
    ).hasAccess;
    if (!hasAccess) {
      return res.status(403).json({ error: "Write access denied" });
    }

    const validatedFieldValues = await validateAndProcessFieldValues(
      fieldValues || {},
      existingItem.inventory.customFields
    );

    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: {
        fieldValues: validatedFieldValues,
      },
      include: {
        creator: { select: { id: true, username: true } },
      },
    });

    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const hasAccess = (await checkWriteAccess(item.inventoryId, req.user.id))
      .hasAccess;
    if (!hasAccess) {
      return res.status(403).json({ error: "Write access denied" });
    }

    await prisma.inventoryItem.delete({ where: { id } });
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const itemsBulkOperation = async (req, res) => {
  try {
    const { action, itemIds, inventoryId, data } = req.body;

    const hasAccess = await checkWriteAccess(inventoryId, req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Write access denied" });
    }

    let result;
    switch (action) {
      case "delete":
        result = await prisma.inventoryItem.deleteMany({
          where: { id: { in: itemIds }, inventoryId },
        });
        break;
      case "update":
        result = await prisma.inventoryItem.updateMany({
          where: { id: { in: itemIds }, inventoryId },
          data: { fieldValues: data.fieldValues },
        });
        break;
      default:
        return res.status(400).json({ error: "Invalid bulk action" });
    }

    res.json({ affected: result.count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadItemImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const result = await uploadToCloudinary(req.file.buffer, "items");

    res.json({
      imageUrl: result.secure_url,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to upload item image" });
  }
};

module.exports = {
  fetchInventoryItems,
  fetchSingleInventoryItem,
  createItem,
  updateItem,
  deleteItem,
  itemsBulkOperation,
  uploadItemImage,
};
