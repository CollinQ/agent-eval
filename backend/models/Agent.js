const supabase = require('../config/database');
const { findAll } = require('./Challenge');

const Agent = {
  async create(agentData) {
    return supabase.from('agents').insert(agentData);
  },
  
  async findById(id) {
    return supabase.from('agents').select('*').eq('id', id);
  },
  
  async findByChallenge(challengeId) {
    return supabase.from('agents').select('*').eq('challenge_id', challengeId);
  },
  
  async findByUser(userId) {
    return supabase.from('agents').select('*').eq('created_by', userId);
  },

  async findAll() {
    return supabase.from('agents').select('*');
  },

  async delete(id) {
    return supabase.from('agents').delete().eq('id', id);
  },

  async update(id, updatedData) {
    return supabase.from('agents').update(updatedData).eq('id', id);
  }
};

module.exports = Agent;