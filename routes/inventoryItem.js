const express = require("express");
const { authenticate } = require("../middleware/auth");
const {
  createItem,
  updateItem,
  deleteItem,
  fetchInventoryItems,
  fetchSingleInventoryItem,
  uploadItemImage,
  itemsBulkOperation,
} = require("../controllers/inventoryItemController");
const upload = require("../middleware/upload");

const router = express.Router();

router.post('/upload', authenticate, upload.single('file'), uploadItemImage);
router.post('/bulk', authenticate, itemsBulkOperation);
router.get("/inventory/:inventoryId/items", authenticate, fetchInventoryItems);
router.post("/inventory/:inventoryId/items", authenticate, createItem);
router.get(
  "/inventory/:id",
  authenticate,
  fetchSingleInventoryItem
);
router.put("/inventory/:id", authenticate, updateItem);
router.delete("/inventory/:id", authenticate, deleteItem);

module.exports = router;
