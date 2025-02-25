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
    console.log('Finding agents for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Found agents:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Error in findByUser:', error);
      return { data: null, error };
    }
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