const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');

// Create a new evaluation
router.post('/', evaluationController.createEvaluation);

// Get a specific evaluation
router.get('/:id', evaluationController.getEvaluation);

// Get evaluations for a specific agent
router.get('/agent/:agentId', evaluationController.getEvaluationsByAgent);

// Get evaluations for a specific challenge
router.get('/challenge/:challengeId', evaluationController.getEvaluationsByChallenge);

// Get leaderboard for a specific challenge
router.get('/leaderboard/:challengeId', evaluationController.getLeaderboard);

// Update an evaluation (for updating status, score, etc.)
router.patch('/:id', evaluationController.updateEvaluation);

module.exports = router;
