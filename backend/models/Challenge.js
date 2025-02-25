const supabase = require('../config/database');

const Challenge = {
    async create(challengeData) {
      return supabase.from('challenges').insert(challengeData);
    },
    
    async findById(id) {
      console.log('Challenge.findById called with id:', id);
      const result = await supabase.from('challenges').select('*').eq('id', id).single();
      console.log('Supabase response for findById:', result);
      return result;
    },
    
    async findByUser(userId) {
      return supabase.from('challenges').select('*').eq('created_by', userId);
    },
    
    async findByAgent(agentId) {
      return supabase.from('challenges').select('*').eq('agent_id', agentId);
    },
    
    async findAll() {
      const result = await supabase.from('challenges').select('*');
      console.log('Supabase response for findAll:', result);
      return result;
    },
    
    async update(id, updatedData) {
      return supabase.from('challenges').update(updatedData).eq('id', id);
    },
    
    async delete(id) {
      return supabase.from('challenges').delete().eq('id', id);
    }
  };

module.exports = Challenge;