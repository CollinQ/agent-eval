const express = require('express');
const router = express.Router();
const evaluationRoutes = require('./evaluations');

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

// Mount evaluation routes
router.use('/evaluations', evaluationRoutes);

module.exports = router;