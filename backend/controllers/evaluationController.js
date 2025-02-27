const Evaluation = require('../models/Evaluation');
const Agent = require('../models/Agent');
const Challenge = require('../models/Challenge');
const axios = require('axios');

// Get WebArena service URL from environment variables or use default
const WEBARENA_SERVICE_URL = process.env.WEBARENA_SERVICE_URL || 'http://localhost:8000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

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

      //console.log("Evaluation Data:", evaluationData);
      const { data, error } = await Evaluation.create(evaluationData);

      //console.log("Evaluation Response:", { data, error });
      
      if (error) throw error;
      
      // Trigger WebArena evaluation microservice
      try {
        // Fetch agent code and challenge details
        const { data: agentData } = await Agent.findById(agent_id);
        const { data: challengeData } = await Challenge.findById(challenge_id);
        
        if (!agentData || !challengeData) {
          throw new Error('Agent or challenge not found');
        }
        
        //console.log(`agentData:`, agentData);
        //console.log(`challengeData:`, challengeData);
        //console.log(`Starting evaluation for agent: ${agent_id}, challenge: ${challenge_id}`);
        
        // Call WebArena microservice
        const evaluationRequest = {
          evaluation_id: data[0].id,
          agent_code: agentData[0].code,
          challenge_url: challengeData.url,
          success_criteria: challengeData.success_criteria,
          callback_url: `${BACKEND_URL}/api/evaluations/${data[0].id}/callback`
        };
        
        // Send request to WebArena microservice
        //console.log('Sending evaluation request to WebArena:', evaluationRequest);
        axios.post(`${WEBARENA_SERVICE_URL}/api/evaluate`, evaluationRequest)
          .then(response => {
            //console.log('WebArena evaluation started:', response.data);
          })
          .catch(error => {
            console.error('Error starting WebArena evaluation:', error);
            Evaluation.update(data[0].id, { 
              status: 'failed',
              result: { error: 'Failed to start evaluation' }
            });
          });
        
        // Update status to running
        await Evaluation.update(data[0].id, { status: 'running' });
      } catch (evalError) {
        console.error('Failed to start evaluation:', evalError);
        // Don't fail the request, just update the status
        await Evaluation.update(data[0].id, { 
          status: 'failed',
          result: { error: evalError.message }
        });
      }
      
      res.status(201).json(data[0].id);
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
  },
  
  // New callback handler for the WebArena microservice
  async evaluationCallback(req, res) {
    try {
      const { id } = req.params;
      const { steps_taken, score, status, result, logs } = req.body;
      
      //console.log(`Received callback for evaluation ${id}:`, req.body);
      
      const updateData = {
        status: status || 'completed',
        score: score || 0,  // Simple scoring: 100 for success, 0 for failure
        steps_taken: steps_taken || 0,
        result: result,
        completed_at: new Date(),
        logs: logs || []
      };
      
      const { data, error } = await Evaluation.update(id, updateData);
      
      if (error) throw error;
      
      res.status(200).json({ message: 'Evaluation updated successfully' });
    } catch (error) {
      console.error('Error in evaluation callback:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = evaluationController;