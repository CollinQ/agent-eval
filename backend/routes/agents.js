const express = require('express');
const router = express.Router();
const { 
  getAgents, 
  createAgent, 
  getAgent, 
  updateAgent, 
  deleteAgent,
  getAgentsByChallenge,
  getAgentsByUser
} = require('../controllers/agentsController');

// Separate route for getting agents by user
router.get('/user', getAgentsByUser);

router.get('/', async (req, res) => {
  const challengeId = req.query.challengeId;
  const agentId = req.query.agentId;

  if (challengeId) {
    await getAgentsByChallenge(req, res);
  } else if (agentId) {
    req.params.id = agentId;
    await getAgent(req, res);
  } else {
    await getAgents(req, res);
  }
});

router.post('/', createAgent);
router.get('/:id', getAgent);
router.put('/:id', updateAgent);
router.delete('/:id', deleteAgent);

module.exports = router;