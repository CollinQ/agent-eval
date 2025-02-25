const express = require('express');
const router = express.Router();

// Base API endpoint
router.get('/', (req, res) => {
  res.json({
    version: '1.0',
    status: 'running'
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;