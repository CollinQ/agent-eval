import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Agent } from '../services/api';
import { getAgentsByUser } from '../services/api';

interface AgentSelectorProps {
  onAgentSelect: (agentId: string) => void;
  selectedAgentId?: string;
}

export const AgentSelector = ({ onAgentSelect, selectedAgentId }: AgentSelectorProps) => {
  const { user } = useUser();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        const fetchedAgents = await getAgentsByUser(user.id);
        setAgents(fetchedAgents);
      } catch (err) {
        console.error('Error fetching agents:', err);
        setError('Unable to load agents. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading your agents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-50 p-4 rounded-md flex items-start">
        <svg className="h-5 w-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="font-medium">Error loading agents</p>
          <p className="text-sm mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Refresh page
          </button>
        </div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">No existing agents found</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>You don't have any agents yet. You can:</p>
              <ul className="list-disc ml-4 mt-1">
                <li>Write a new agent using the "Write New Agent" option above</li>
                <li>Come back here after creating your first agent</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <label htmlFor="agent-select" className="block text-sm font-medium text-gray-700 mb-2">
        Select an Agent
      </label>
      <select
        id="agent-select"
        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        value={selectedAgentId || ''}
        onChange={(e) => onAgentSelect(e.target.value)}
      >
        <option value="">Select an agent</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name || `Agent ${agent.id}`}
          </option>
        ))}
      </select>
    </div>
  );
};
