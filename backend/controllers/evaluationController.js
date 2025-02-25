const Evaluation = require('../models/Evaluation');

const evaluationController = {
  async createEvaluation(req, res) {
    try {
      const { agent_id, challenge_id } = req.body;
      
      if (!agent_id || !challenge_id) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const evaluationData = {
        agent_id,
        challenge_id,
        status: 'queued',
      };

      const { data, error } = await Evaluation.create(evaluationData);
      
      if (error) throw error;
      
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getEvaluation(req, res) {
    try {
      const { id } = req.params;
      const { data, error } = await Evaluation.findById(id);
      
      if (error) throw error;
      if (!data) {
        return res.status(404).json({ error: 'Evaluation not found' });
      }
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getEvaluationsByAgent(req, res) {
    try {
      const { agentId } = req.params;
      const { data, error } = await Evaluation.findByAgentId(agentId);
      
      if (error) throw error;
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getEvaluationsByChallenge(req, res) {
    try {
      const { challengeId } = req.params;
      const { data, error } = await Evaluation.findByChallengeId(challengeId);
      
      if (error) throw error;
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateEvaluation(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const { data, error } = await Evaluation.update(id, updateData);
      
      if (error) throw error;
      if (!data) {
        return res.status(404).json({ error: 'Evaluation not found' });
      }
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getLeaderboard(req, res) {
    try {
      const { challengeId } = req.params;
      const { data, error } = await Evaluation.getLeaderboard(challengeId);
      
      if (error) throw error;
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = evaluationController;
