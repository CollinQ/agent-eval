import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  Code,
  Calendar,
  ArrowRight,
  AlertTriangle,
  Plus,
  Trash2,
  Edit,
  BarChart2,
  Search,
  Filter,
  Terminal
} from 'lucide-react';
import { getAgentsByUser, getEvaluationsByAgent, type Agent, type Evaluation } from '../services/api';

export function MyAgents() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentEvaluations, setAgentEvaluations] = useState<Record<string, Evaluation[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'evaluations'>('date');
  
  useEffect(() => {
    const fetchAgents = async () => {
      if (!isLoaded || !user) return;
      
      try {
        console.log('Fetching agents for user:', user.id);
        const agentData = await getAgentsByUser(user.id);
        console.log('Agents API response:', agentData);
        setAgents(agentData);
        
        // Fetch evaluation stats for each agent
        const evaluationsData: Record<string, Evaluation[]> = {};
        
        for (const agent of agentData) {
          try {
            const evaluations = await getEvaluationsByAgent(agent.id);
            evaluationsData[agent.id] = evaluations;
          } catch (err) {
            console.error(`Error fetching evaluations for agent ${agent.id}:`, err);
            evaluationsData[agent.id] = [];
          }
        }
        
        setAgentEvaluations(evaluationsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching agents:', err);
        setError('Failed to fetch your agents');
        setLoading(false);
      }
    };

    if (isLoaded && user) {
      fetchAgents();
    }
  }, [isLoaded, user]);

  // Filter and sort agents
  const filteredAndSortedAgents = React.useMemo(() => {
    let filtered = [...agents];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(agent => 
        agent.name.toLowerCase().includes(term) || 
        (agent.description && agent.description.toLowerCase().includes(term))
      );
    }
    
    // Apply sorting
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'evaluations') {
      filtered.sort((a, b) => {
        const aCount = agentEvaluations[a.id]?.length || 0;
        const bCount = agentEvaluations[b.id]?.length || 0;
        return bCount - aCount;
      });
    }
    
    return filtered;
  }, [agents, searchTerm, sortBy, agentEvaluations]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Calculate average score for an agent
  const calculateAverageScore = (agentId: string): number | null => {
    const evaluations = agentEvaluations[agentId] || [];
    const completedEvals = evaluations.filter(e => e.status === 'completed' && e.score !== null);
    
    if (completedEvals.length === 0) return null;
    
    const sum = completedEvals.reduce((total, evaluation) => total + (evaluation.score || 0), 0);
    return Math.round(sum / completedEvals.length);
  };

  // Calculate success rate
  const calculateSuccessRate = (agentId: string): number => {
    const evaluations = agentEvaluations[agentId] || [];
    if (evaluations.length === 0) return 0;
    
    const completedCount = evaluations.filter(e => e.status === 'completed').length;
    return Math.round((completedCount / evaluations.length) * 100);
  };

  // Show loading state if Clerk is still loading or we're fetching agents
  if (!isLoaded || (loading && agents.length === 0)) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your agents...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Agents</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Agents</h1>
      </div>
      
      {/* Filters and search */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center">
            <Filter className="h-5 w-5 mr-2 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded-md pl-2 pr-8 py-2 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="evaluations">Sort by Evaluations</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Agents grid */}
      {filteredAndSortedAgents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <Terminal className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Agents Found</h2>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? "No agents match your search criteria."
              : "You haven't created any agents yet."}
          </p>
          <p className="text-gray-500">
            Check back later or contact support for assistance.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedAgents.map((agent) => {
            const evaluationCount = agentEvaluations[agent.id]?.length || 0;
            const avgScore = calculateAverageScore(agent.id);
            const successRate = calculateSuccessRate(agent.id);
            
            return (
              <div 
                key={agent.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => navigate(`/evaluation/${agent.id}`)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-md mr-3">
                        <Code className="h-5 w-5 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 truncate" title={agent.name}>
                        {agent.name}
                      </h3>
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(agent.created_at)}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2" title={agent.description || ''}>
                    {agent.description || 'No description provided'}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">Evaluations</div>
                      <div className="text-lg font-semibold">{evaluationCount}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">Avg. Score</div>
                      <div className="text-lg font-semibold">
                        {avgScore !== null ? avgScore : '--'}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">Success Rate</div>
                      <div className="text-lg font-semibold">{successRate}%</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">Created</div>
                      <div className="text-sm font-semibold truncate">
                        {formatDate(agent.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  <Link
                    to={`/agent/${agent.id}/evaluations`}
                    className="flex items-center text-blue-600 text-sm font-medium hover:text-blue-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Evaluations
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}