const express = require("express");
const { getHomePageInventories, getHomePageInventory, fetchHomePageInventoryItems, fetchSingleHomePageInventoryItems } = require("../controllers/homePageController");

const router = express.Router();

router.get("/inventories", getHomePageInventories);
router.get("/items/:itemId/single", fetchSingleHomePageInventoryItems);
router.get("/inventories/:inventoryId", getHomePageInventory);
router.get("/items/:inventoryId", fetchHomePageInventoryItems);

module.exports = router;