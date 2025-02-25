const supabase = require('../config/database');
const { findAll } = require('./Challenge');

const Agent = {
  async create(agentData) {
    console.log('Agent.create called with:', agentData);
    try {
      // Ensure required fields are present
      const requiredFields = ['user_id', 'code'];
      const missingFields = requiredFields.filter(field => !agentData[field]);
      
      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Add created_at if not provided
      const dataToInsert = {
        ...agentData,
        created_at: new Date().toISOString()
      };

      console.log('Inserting agent with data:', dataToInsert);
      const response = await supabase
        .from('agents')
        .insert(dataToInsert)
        .select(); // Add select() to return the inserted row

      console.log('Supabase response:', response);
      return response;
    } catch (error) {
      console.error('Error in Agent.create:', error);
      return { data: null, error };
    }
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