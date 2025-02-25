const Challenge = require('../models/Challenge');

const createChallenge = async (req, res) => {
    try {
        const { data, error } = await Challenge.create(req.body);
        if (error) throw error;
        res.status(201).json(data[0]); // Return the first item since insert returns an array
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getChallenges = async (req, res) => {
    try {
        const { data, error } = await Challenge.findAll();
        console.log('getChallenges response:', { data, error });
        if (error) throw error;
        res.json(data || []); // Ensure we always return an array
    } catch (error) {
        console.error('Error in getChallenges:', error);
        res.status(500).json({ error: error.message });
    }
};

const getChallengesByUser = async (req, res) => {
    try {
        const { data, error } = await Challenge.findByUser(req.query.userId);
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getChallengeById = async (req, res) => {
    try {
        console.log('getChallengeById called with params:', req.params);
        const { data, error } = await Challenge.findById(req.params.id);
        console.log('getChallengeById response:', { data, error });
        
        if (error) {
            console.error('Error in getChallengeById:', error);
            throw error;
        }
        
        if (!data) {
            console.log('No data returned for challenge');
            return res.status(404).json({ error: 'Challenge not found' });
        }
        
        console.log('Sending challenge data:', data);
        res.json(data);
    } catch (error) {
        console.error('Error in getChallengeById:', error);
        res.status(500).json({ error: error.message });
    }
};

const getChallengesByAgent = async (req, res) => {
    try {
        const { data, error } = await Challenge.findByAgent(req.query.agentId);
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateChallenge = async (req, res) => {
    try {
        const { data, error } = await Challenge.update(req.params.id, req.body);
        if (error) throw error;
        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Challenge not found' });
        }
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteChallenge = async (req, res) => {
    try {
        const { error } = await Challenge.delete(req.params.id);
        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getChallenges,
    createChallenge,
    getChallengeById,
    getChallengesByUser,
    getChallengesByAgent,
    updateChallenge,
    deleteChallenge
};