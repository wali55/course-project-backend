const express = require("express");
const { authenticate } = require("../middleware/auth");
const { createItem, updateItem, deleteItem, fetchInventoryItems, fetchSingleInventoryItem } = require("../controllers/inventoryItemController");

const router = express.Router();

router.get('/:inventoryId/items', authenticate, fetchInventoryItems);
router.post('/:inventoryId/items', authenticate, createItem);
router.get('/:inventoryId/items/:itemId', authenticate, fetchSingleInventoryItem);
router.put('/:inventoryId/items/:itemId', authenticate, updateItem);
router.delete('/:inventoryId/items/:itemId', authenticate, deleteItem);

module.exports = router;