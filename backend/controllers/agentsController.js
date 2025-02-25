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
    const { data, error } = await Agent.findByUser(req.query.userId);
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
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