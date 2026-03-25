const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');

// Routes
router.get('/', searchController.search);

module.exports = router;
