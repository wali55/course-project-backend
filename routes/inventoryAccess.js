const express = require("express");
const { authenticate } = require("../middleware/auth");
const { getInventoryAccessList, searchUsersForAddingToAccessList, addUserToInventoryAccessList, removeUserFromInventoryAccessList, checkUserHasWriteAccessToInventory } = require("../controllers/inventoryAccessController");

const router = express.Router();

router.get('/:inventoryId/access', authenticate, getInventoryAccessList);
router.get('/:inventoryId/users/search', authenticate, searchUsersForAddingToAccessList);
router.post('/:inventoryId/access', authenticate, addUserToInventoryAccessList);
router.delete('/:inventoryId/access/:accessId', authenticate, removeUserFromInventoryAccessList);
router.get('/:inventoryId/can-write', authenticate, checkUserHasWriteAccessToInventory);

module.exports = router;