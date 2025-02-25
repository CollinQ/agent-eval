const express = require('express');
const router = express.Router();
const { getChallenges, createChallenge, getChallengeById, updateChallenge, deleteChallenge, getChallengesByUser, getChallengesByAgent } = require('../controllers/challengesController');

// List challenges with optional filters
router.get('/', async (req, res) => {
    const { userId, agentId } = req.query;

    try {
        if (agentId) {
            await getChallengesByAgent(req, res);
        } else if (userId) {
            await getChallengesByUser(req, res);
        } else {
            await getChallenges(req, res);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a specific challenge by ID
router.get('/:id', getChallengeById);

// Create a new challenge
router.post('/', createChallenge);

// Update a specific challenge
router.put('/:id', updateChallenge);

// Delete a specific challenge
router.delete('/:id', deleteChallenge);

module.exports = router;