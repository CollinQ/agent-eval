const supabase = require('../config/database');

const Evaluation = {
  async create(evaluationData) {
    return supabase.from('evaluations').insert(evaluationData);
  },
  
  async findById(id) {
    return supabase.from('evaluations')
      .select(`
        *,
        agents (id, name, user_id),
        challenges (id, title, difficulty)
      `)
      .eq('id', id)
      .single();
  },
  
  async findByAgentId(agentId) {
    return supabase.from('evaluations')
      .select(`
        *,
        challenges (id, title, difficulty)
      `)
      .eq('agent_id', agentId);
  },

  async findByChallengeId(challengeId) {
    return supabase.from('evaluations')
      .select(`
        *,
        agents (id, name, user_id)
      `)
      .eq('challenge_id', challengeId)
      .order('score', { ascending: false });
  },

  async findByStatus(status) {
    return supabase.from('evaluations')
      .select(`
        *,
        agents (id, name, user_id),
        challenges (id, title, difficulty)
      `)
      .eq('status', status);
  },

  async update(id, updatedData) {
    return supabase.from('evaluations')
      .update(updatedData)
      .eq('id', id);
  },

  async delete(id) {
    return supabase.from('evaluations')
      .delete()
      .eq('id', id);
  },

  async getLeaderboard(challengeId) {
    return supabase.from('evaluations')
      .select(`
        score,
        steps_taken,
        accuracy,
        agents (id, name, user_id)
      `)
      .eq('challenge_id', challengeId)
      .eq('status', 'completed')
      .order('score', { ascending: false })
      .limit(10);
  }
};

module.exports = Evaluation;
