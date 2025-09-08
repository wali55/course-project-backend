const prisma = require("../config/database");
const { IdGenerator } = require("../utils/idGenerator");

const getIdFormat = async (req, res) => {
  try {
    const { inventoryId } = req.params;

    const inventory = await prisma.inventory.findFirst({
      where: {
        id: inventoryId,
        OR: [
          { isPublic: true },
          { creatorId: req.user.id },
          { accessList: { some: { userId: req.user.id } } },
        ],
      },
      include: { idFormat: true },
    });

    if (!inventory && req.user.role !== "ADMIN") {
      return res
        .status(404)
        .json({ message: "Inventory not found or not authorized" });
    }

    const format = inventory.idFormat || {
      elements: [
        { type: "FIXED_TEXT", value: "ITEM-" },
        { type: "SEQUENCE", format: { leadingZeros: true } },
      ],
    };

    res.json({
      format,
      preview: IdGenerator.generatePreview(format),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateIdFormat = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { elements } = req.body;

    const inventory = await prisma.inventory.findFirst({
      where: {
        id: inventoryId,
        OR: [
          { isPublic: true },
          { creatorId: req.user.id },
          { accessList: { some: { userId: req.user.id } } },
        ],
      },
      include: { accessList: true },
    });

    if (!inventory && req.user.role !== "ADMIN") {
      return res
        .status(404)
        .json({ message: "Inventory not found or not authorized" });
    }

    if (!Array.isArray(elements) || elements.length === 0) {
      return res.status(400).json({ message: "Invalid format elements" });
    }

    const format = await prisma.idFormat.upsert({
        where: { inventoryId },
        create: { inventoryId, elements },
        update: { elements }
      });

    res.json({
        format,
        preview: IdGenerator.generatePreview(format)
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generatePreview = async (req, res) => {
  try {
    const { elements } = req.body;

    if (!Array.isArray(elements)) {
      return res.status(400).json({ message: "Invalid elements" });
    }

    const preview = IdGenerator.generatePreview({ elements });
    res.json({ preview });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getIdFormat, updateIdFormat, generatePreview };
