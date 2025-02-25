const Agent = require('../models/Agent');

const getAgents = async (req, res) => {
  try {
    const { data, error } = await Agent.findAll();
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createAgent = async (req, res) => {
  try {
    const { data, error } = await Agent.create(req.body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAgent = async (req, res) => {
  try {
    const { data, error } = await Agent.findById(req.params.id);
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateAgent = async (req, res) => {
  try {
    const { data, error } = await Agent.update(req.params.id, req.body);
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteAgent = async (req, res) => {
  try {
    const { data, error } = await Agent.delete(req.params.id);
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAgentsByChallenge = async (req, res) => {
  try {
    const { data, error } = await Agent.findByChallenge(req.query.challengeId);
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAgentsByUser = async (req, res) => {
  try {
    const userId = req.query.userId;
    console.log('Received request for agents with userId:', userId);
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Handle Clerk user ID format
    const { data, error } = await Agent.findByUser(userId);
    
    if (error) {
      console.error('Database error:', error);
      if (error.message && error.message.includes('invalid input syntax for type uuid')) {
        // If this error occurs, we might need to update the database schema
        console.error('Schema error: user_id column might be UUID instead of TEXT');
      }
      throw error;
    }
    
    console.log('Found agents:', data);
    res.status(200).json(data || []);
  } catch (error) {
    console.error('Error in getAgentsByUser:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'If this is a UUID error, the database schema needs to be updated to use TEXT for user_id'
    });
  }
};

module.exports = {
  getAgents,
  createAgent,
  getAgent,
  updateAgent,
  deleteAgent,
  getAgentsByChallenge,
  getAgentsByUser
};