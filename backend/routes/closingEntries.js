const express = require('express');
const router = express.Router();
const closingEntryController = require('../controllers/closingEntryController');

// Create a new closing entry
router.post('/', closingEntryController.createClosingEntry);

// Get all closing entries (optional, for future list view)
router.get('/', closingEntryController.getClosingEntries);

module.exports = router;