const express = require('express');
const router = express.Router();
const { createMenu, getMenus, deleteMenu } = require('../controllers/menuController');
const { protect, allowMess } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, allowMess, createMenu)
  .get(getMenus); // Depending on requirement, might be protected or open

router.route('/:id')
  .delete(protect, allowMess, deleteMenu);

module.exports = router;
