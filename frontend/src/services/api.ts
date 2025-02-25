import axios, { AxiosResponse } from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Type guard to check if response data is an array
function isArrayResponse<T>(response: AxiosResponse<T[] | { data: T[] }>): response is AxiosResponse<T[]> {
  return Array.isArray(response.data);
}

// Type guard to check if response data has a data property that's an array
function hasDataArray<T>(response: AxiosResponse<T[] | { data: T[] }>): response is AxiosResponse<{ data: T[] }> {
  return !Array.isArray(response.data) && response.data?.data && Array.isArray(response.data.data);
}

// Add response interceptor to handle common response patterns
api.interceptors.response.use(
  (response) => {
    // If the response is already an array, return it
    if (isArrayResponse(response)) {
      return response.data;
    }
    // If response.data contains a data property that's an array, return that
    if (hasDataArray(response)) {
      return response.data.data;
    }
    // Otherwise, return the response data
    return response.data;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  url: string;
  success_criteria: string;
  created_at: string;
}

export interface Agent {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  code: string;
  created_at: string;
}

export interface Evaluation {
  id: string;
  agent_id: string;
  challenge_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  score: number | null;
  steps_taken: number | null;
  accuracy: number | null;
  logs: any;
  created_at: string;
  completed_at: string | null;
}

// Helper type for API responses
type ApiResponse<T> = Promise<T>;

// Challenges
export const getChallenges = (): ApiResponse<Challenge[]> => 
  api.get('/challenges').then(response => response as Challenge[]);

export const getChallenge = (id: string): ApiResponse<Challenge> => 
  api.get(`/challenges/${id}`).then(response => response as Challenge);

// Agents
export const getAgents = (): ApiResponse<Agent[]> => 
  api.get('/agents').then(response => response as Agent[]);

export const getAgentsByUser = async (userId: string): Promise<Agent[]> => {
  console.log('getAgentsByUser called with userId:', userId);
  try {
    const response = await api.get('/agents/user', {
      params: { userId }
    });
    console.log('getAgentsByUser response:', response);
    return response as Agent[];
  } catch (error) {
    console.error('getAgentsByUser error:', error);
    throw error;
  }
};

export const createAgent = (data: Omit<Agent, 'id' | 'created_at'>): ApiResponse<Agent> => 
  api.post('/agents', data).then(response => response as Agent);

export const getAgent = (id: string): ApiResponse<Agent> => 
  api.get(`/agents/${id}`).then(response => response as Agent);

export const updateAgent = (id: string, data: Partial<Agent>): ApiResponse<Agent> => 
  api.put(`/agents/${id}`, data).then(response => response as Agent);

export const deleteAgent = (id: string): Promise<void> => 
  api.delete(`/agents/${id}`).then(() => undefined);

// Evaluations
export const getEvaluations = (): ApiResponse<Evaluation[]> => 
  api.get('/evaluations').then(response => response as Evaluation[]);

export const createEvaluation = (data: { agent_id: string; challenge_id: string }): ApiResponse<Evaluation> => 
  api.post('/evaluations', data).then(response => response as Evaluation);

export const getEvaluation = (id: string): ApiResponse<Evaluation> => 
  api.get(`/evaluations/${id}`).then(response => response as Evaluation);
