const { uploadToCloudinary } = require("../config/cloudinary");
const prisma = require("../config/database");

const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

const getTagsWithAutocomplete = async (req, res) => {
  try {
    const { search } = req.query;
    const tags = await prisma.tag.findMany({
      where: search
        ? {
            name: { contains: search, mode: "insensitive" },
          }
        : {},
      take: 10,
      orderBy: { name: "asc" },
    });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tags" });
  }
};

const getUserInventories = async (req, res) => {
  try {
    let {
      page = "1",
      limit = "10",
      search,
      category,
      sortBy = "updatedAt",
      sortOrder = "desc",
      visibility, 
    } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    sortOrder = sortOrder.toLowerCase() === "asc" ? "asc" : "desc";

    const where = {
      creatorId: req.user.id,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.categoryId = category; 
    }

    if (visibility) {
      if (visibility === "public") {
        where.isPublic = true;
      } else if (visibility === "private") {
        where.isPublic = false;
      }
    }

    const inventories = await prisma.inventory.findMany({
      where,
      include: {
        category: true,
        tags: {
          include: { tag: true },
        },
        creator: {
          select: {
            username: true,
          },
        },
        _count: {
          select: { tags: true },
        },
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

const getSingleInventory = async (req, res) => {
  try {
    const inventory = await prisma.inventory.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        creator: { select: { id: true, username: true } },
        tags: { include: { tag: true } },
      },
    });

    if (!inventory) {
      return res.status(404).json({ error: "Inventory not found" });
    }

    const canAccess =
      inventory.isPublic ||
      inventory.creatorId === req.user?.id ||
      req.user?.role === "ADMIN";

    if (!canAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({
      ...inventory,
      tags: inventory.tags.map((t) => t.tag),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
};

const createInventory = async (req, res) => {
  try {
    const {
      title,
      description,
      categoryId,
      image,
      isPublic,
      tagObjs: tags,
    } = req.body;

    if (!title || !categoryId) {
      return res.status(400).json({ error: "Title and category are required" });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return res.status(400).json({ error: "Invalid category" });
    }

    const tagRecords = [];
    if (tags && tags.length > 0) {
      for (const tagObj of tags) {
        const tag = await prisma.tag.upsert({
          where: { id: tagObj.id },
          update: {},
          create: { name: tagObj.name.toLowerCase() },
        });
        tagRecords.push(tag);
      }
    }

    console.log("tags", tags);
    console.log("tagRecords", tagRecords);

    const inventory = await prisma.inventory.create({
      data: {
        title,
        description,
        categoryId,
        image,
        isPublic: isPublic || false,
        creatorId: req.user.id,
        tags: {
          create: tagRecords.map((tag) => ({
            tag: { connect: { id: tag.id } },
          })),
        },
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
        creator: { select: { username: true } },
        _count: { select: { tags: true } },
      },
    });

    res.status(201).json({
      ...inventory,
      tags: inventory.tags.map((t) => t.tag),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create inventory" });
  }
};

const updateInventory = async (req, res) => {
  try {
    const {
      title,
      description,
      categoryId,
      image,
      isPublic,
      tagObjs: tags,
      version,
    } = req.body;

    const existing = await prisma.inventory.findUnique({
      where: { id: req.params.id },
      include: { tags: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Inventory not found" });
    }

    const canEdit =
      existing.creatorId === req.user.id || req.user.role === "ADMIN";
    if (!canEdit) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (version && existing.version !== version) {
      return res
        .status(409)
        .json({ error: "Inventory was modified by another user" });
    }

    let tagOperations = {};
    if (tags) {
      await prisma.inventoryOnTag.deleteMany({
        where: { inventoryId: req.params.id },
      });

      if (tags.length > 0) {
        const tagRecords = [];
        for (const tagObj of tags) {
          const tag = await prisma.tag.upsert({
            where: { id: tagObj.id },
            update: {},
            create: { name: tagObj.name.toLowerCase() },
          });
          tagRecords.push(tag);
        }

        tagOperations = {
          tags: {
            create: tagRecords.map((tag) => ({
              tag: { connect: { id: tag.id } },
            })),
          },
        };
      }
    }

    const inventory = await prisma.inventory.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(categoryId && { categoryId }),
        ...(image !== undefined && { image }),
        ...(isPublic !== undefined && { isPublic }),
        version: { increment: 1 },
        ...tagOperations,
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
        creator: { select: { username: true } },
        _count: { select: { tags: true } },
      },
    });

    res.json({
      ...inventory,
      tags: inventory.tags.map((t) => t.tag),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update inventory" });
  }
};

const deleteInventory = async (req, res) => {
  try {
    const inventory = await prisma.inventory.findUnique({
      where: { id: req.params.id },
    });

    if (!inventory) {
      return res.status(404).json({ error: "Inventory not found" });
    }

    const canDelete =
      inventory.creatorId === req.user.id || req.user.role === "ADMIN";
    if (!canDelete) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prisma.inventory.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "Inventory deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete inventory" });
  }
};

const uploadInventoryImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const result = await uploadToCloudinary(req.file.buffer, "inventories");

    res.json({
      imageUrl: result.secure_url,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to upload item image" });
  }
};

module.exports = {
  getAllCategories,
  getTagsWithAutocomplete,
  getUserInventories,
  getSingleInventory,
  createInventory,
  updateInventory,
  deleteInventory,
  uploadInventoryImage,
};
