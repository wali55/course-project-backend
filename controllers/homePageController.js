const prisma = require("../config/database");

const getHomePageInventories = async (req, res) => {
  try {
    let {
      page = "1",
      limit = "10",
      search,
      category,
      visibility,
      creator,
      sortBy = "updatedAt",
      sortOrder = "desc",
    } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    sortOrder = sortOrder.toLowerCase() === "asc" ? "asc" : "desc";

    let where = {};

    if (search) {
      (where.AND ??= []).push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (category && category !== "all") {
      (where.AND ??= []).push({ categoryId: category });
    }

    if (visibility && visibility !== "all") {
      (where.AND ??= []).push({ isPublic: visibility === "public" });
    }

    if (creator && creator !== "all") {
      (where.AND ??= []).push({ creatorId: creator });
    }

    const inventories = await prisma.inventory.findMany({
      where,
      include: {
        category: true,
        tags: { include: { tag: true } },
        creator: { select: { id: true, username: true } },
        accessList: {
          include: {
            user: { select: { id: true, username: true, email: true } },
          },
        },
        _count: { select: { tags: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.inventory.count({ where });

    res.json({
      inventories: inventories.map((inv) => ({
        ...inv,
        tags: inv.tags.map((t) => t.tag),
      })),
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching inventories:", error);
    res.status(500).json({ error: "Failed to fetch inventories" });
  }
};


const getHomePageInventory = async (req, res) => {
  try {
    let {inventoryId} = req.params;

    const inventory = await prisma.inventory.findUnique({
      where: {id: inventoryId},
      include: {
        category: true,
        tags: { include: { tag: true } },
        creator: { select: { id: true, username: true } },
        accessList: {
          include: {
            user: { select: { id: true, username: true, email: true } },
          },
        },
        _count: { select: { tags: true } },
      },
    });

    res.json({
      inventory: {
        ...inventory,
        tags: inventory.tags.map((t) => t.tag),
      },
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
};

const fetchHomePageInventoryItems = async (req, res) => {
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

const fetchSingleHomePageInventoryItems = async (req, res) => {
  try {
    const { itemId } = req.params;

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

module.exports = {fetchHomePageInventoryItems, fetchSingleHomePageInventoryItems, getHomePageInventories, getHomePageInventory}