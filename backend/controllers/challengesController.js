const Challenge = require('../models/Challenge');


const createChallenge = async (req, res) => {
  try {
    const { data, error } = await Challenge.create(req.body);
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getChallenges = async (req, res) => {
    try {
        const { data, error } = await Challenge.findAll();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const getChallengesByUser = async(req, res) => {
    try {
        const { data, error } = await Challenge.findByUser(req.query.userId);
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const getChallengesById = async(req, res) => {
    try {
        const { data, error } = await Challenge.findById(req.params.id);
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const getChallengesByAgent = async(req, res) => {
    try {
        const { data, error } = await Challenge.findByAgent(req.query.agentId);
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const updateChallenge = async (req, res) => {
    try {
        const { data, error } = await Challenge.update(req.params.id, req.body);
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const deleteChallenge = async (req, res) => {
    try {
        const { data, error } = await Challenge.delete(req.params.id);
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getChallenges,
    createChallenge,
    getChallengesById,
    updateChallenge,
    deleteChallenge,
    getChallengesByUser,
    getChallengesByAgent
  };