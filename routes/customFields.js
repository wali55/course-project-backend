const express = require("express");
const { authenticate } = require("../middleware/auth");
const {
  getCustomFields,
  createCustomField,
  updateCustomField,
  reorderCustomFields,
  deleteCustomField,
} = require("../controllers/customFieldsController");

const router = express.Router();

router.get("/:inventoryId/fields", authenticate, getCustomFields);
router.post("/:inventoryId/fields", authenticate, createCustomField);
router.put("/:inventoryId/fields/reorder-fields", authenticate, reorderCustomFields);
router.put("/:inventoryId/fields/:fieldId", authenticate, updateCustomField);
router.delete("/:inventoryId/fields/:fieldId", authenticate, deleteCustomField);

module.exports = router;
