const { FIELD_TYPE_LIMITS } = require("../types/fieldTypes");
const prisma = require("../config/database");
const { checkFieldManageAccess } = require("../utils/checkFieldManageAccess");

const getCustomFields = async (req, res) => {
  try {
    const { inventoryId } = req.params;

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: {
        customFields: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    const hasAccess =
      inventory.creatorId === req.user.id || req.user.role === "ADMIN";

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    const fieldsByType = inventory.customFields.reduce((acc, field) => {
      acc[field.fieldType] = (acc[field.fieldType] || 0) + 1;
      return acc;
    }, {});

    res.json({
      customFields: inventory.customFields,
      limits: {
        current: fieldsByType,
        maximum: FIELD_TYPE_LIMITS,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch custom fields" });
  }
};

const createCustomField = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { title, description, fieldType, showInTable } = req.body;

    if (!title || !fieldType) {
      return res
        .status(400)
        .json({ message: "Title and field type are required" });
    }

    if (!Object.keys(FIELD_TYPE_LIMITS).includes(fieldType)) {
      return res.status(400).json({ message: "Invalid field type" });
    }

    const canManage = await checkFieldManageAccess(inventoryId, req.user.id);
    if (!canManage) {
      return res.status(403).json({ message: "Access denied" });
    }

    const existingFields = await prisma.customField.findMany({
      where: { inventoryId, fieldType },
    });

    if (existingFields.length >= FIELD_TYPE_LIMITS[fieldType]) {
      return res.status(400).json({
        message: `Maximum ${FIELD_TYPE_LIMITS[fieldType]} fields of type ${fieldType} allowed`,
      });
    }

    const maxOrder = await prisma.customField.aggregate({
      where: { inventoryId },
      _max: { sortOrder: true },
    });

    const customField = await prisma.customField.create({
      data: {
        inventoryId,
        title: title.trim(),
        description: description?.trim(),
        fieldType,
        showInTable: showInTable || false,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      },
    });

    res.status(201).json(customField);
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ message: "Field title must be unique within inventory" });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to create custom field" });
  }
};

const updateCustomField = async (req, res) => {
  try {
    const { inventoryId, fieldId } = req.params;
    const { title, description, showInTable } = req.body;

    const canManage = await checkFieldManageAccess(inventoryId, req.user.id);
    if (!canManage) {
      return res.status(403).json({ message: "Access denied" });
    }

    const customField = await prisma.customField.findUnique({
      where: { id: fieldId },
    });

    if (!customField || customField.inventoryId !== inventoryId) {
      return res.status(404).json({ message: "Custom field not found" });
    }

    const updated = await prisma.customField.update({
      where: { id: fieldId },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(showInTable !== undefined && { showInTable }),
      },
    });

    res.json(updated);
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ message: "Field title must be unique within inventory" });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to update custom field" });
  }
};

const reorderCustomFields = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { fieldOrders } = req.body;

    console.log("fieldOrders.........", fieldOrders);

    if (!Array.isArray(fieldOrders)) {
      console.log("not an array..................")
      return res.status(400).json({ message: "Field orders must be an array" });
    }

    const canManage = await checkFieldManageAccess(inventoryId, req.user.id);
    if (!canManage) {
      return res.status(403).json({ message: "Access denied" });
    }

    const fieldIds = fieldOrders.map((f) => f.id);
    const existingFields = await prisma.customField.findMany({
      where: {
        id: { in: fieldIds },
        inventoryId,
      },
    });

    if (existingFields.length !== fieldIds.length) {
      console.log("Some fields do not belong to this inventory........................")
      return res
        .status(400)
        .json({ message: "Some fields do not belong to this inventory" });
    }

    await prisma.$transaction(
      fieldOrders.map(({ id, sortOrder }) =>
        prisma.customField.update({
          where: { id },
          data: { sortOrder: parseInt(sortOrder) },
        })
      )
    );

    const updatedFields = await prisma.customField.findMany({
      where: { inventoryId },
      orderBy: { sortOrder: "asc" },
    });

    res.json(updatedFields);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to reorder fields" });
  }
};

const deleteCustomField = async (req, res) => {
  try {
    const { inventoryId, fieldId } = req.params;
    console.log("inventory id..........", inventoryId);
    const canManage = await checkFieldManageAccess(inventoryId, req.user.id);
    if (!canManage) {
      return res.status(403).json({ message: "Access denied" });
    }

    const customField = await prisma.customField.findUnique({
      where: { id: fieldId },
    });

    if (!customField || customField.inventoryId !== inventoryId) {
      return res.status(404).json({ message: "Custom field not found" });
    }

    await prisma.$transaction([
      prisma.customField.delete({ where: { id: fieldId } }),
      prisma.$executeRaw`
    UPDATE "inventory_items"
    SET "fieldValues" = "fieldValues" - ${customField.title}
    WHERE "inventoryId" = ${inventoryId}
  `,
    ]);

    res.json({ message: "Custom field deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete custom field" });
  }
};

module.exports = {
  getCustomFields,
  createCustomField,
  updateCustomField,
  reorderCustomFields,
  deleteCustomField,
};
