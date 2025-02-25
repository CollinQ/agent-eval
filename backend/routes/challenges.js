const express = require('express');
const router = express.Router();
const { getChallenges, createChallenge, getChallengeById, updateChallenge, deleteChallenge } = require('../controllers/challenges');

router.post('/', createChallenge);
router.get('/', async (req, res) => {
    const userId = req.query.userId;
    const challengeId = req.query.challengeId;
    const agentId = req.query.agentId;

    if (challengeId) {
      await getChallengeById(req, res);
    } else if (agentId) {
      await getChallengesByAgent(req, res);
    } else if (userId) {
      await getChallengesByUser(req, res);
    } else {
      await getChallenges(req, res);
    }
  });
router.put('/:id', updateChallenge);
router.delete('/:id', deleteChallenge);

module.exports = router;