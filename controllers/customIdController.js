const prisma = require("../config/database");
const { ID_ELEMENTS } = require("../types/idformat");
const { IdGenerator } = require("../utils/idGenerator");

const inventoryIdFormats = new Map();

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
      include: { accessList: true }, 
    });

    if (!inventory && req.user.role !== "ADMIN") {
      return res.status(404).json({ message: "Inventory not found or not authorized" });
    }

    const format = inventoryIdFormats.get(inventoryId) || {
      elements: [
        { type: ID_ELEMENTS.FIXED_TEXT, value: "ITEM-" },
        { type: ID_ELEMENTS.SEQUENCE, format: { leadingZeros: true } },
      ],
    };

    res.json({
      format,
      preview: IdGenerator.generatePreview(format),
      supportedElements: Object.values(ID_ELEMENTS),
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
      return res.status(404).json({ message: "Inventory not found or not authorized" });
    }

    if (!Array.isArray(elements) || elements.length === 0) {
      return res.status(400).json({ message: "Invalid format elements" });
    }

    const format = { elements };
    inventoryIdFormats.set(inventoryId, format);

    res.json({
      format,
      preview: IdGenerator.generatePreview(format),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generatePreview = async (req, res) => {
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
      return res.status(404).json({ message: "Inventory not found or not authorized" });
    }

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
