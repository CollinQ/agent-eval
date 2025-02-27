import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  ArrowLeft,
  ChevronRight,
  PieChart,
  Activity,
  Filter,
  BarChart2,
  HourglassIcon
} from 'lucide-react';
import { getEvaluationsByAgent, getAgent, getChallenge, type Evaluation, type Agent, type Challenge } from '../services/api';

export function Evaluations() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [challengesMap, setChallengesMap] = useState<Record<string, Challenge>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'failed' | 'running' | 'queued'>('all');

  useEffect(() => {
    const fetchData = async () => {
      if (!agentId) return;

      try {
        // Fetch agent data
        console.log('Fetching agent with id:', agentId);
        const agentData = await getAgent(agentId) as Agent[];
        console.log('Agent API response:', agentData);
        if (agentData) {
          setAgent(agentData[0]);
        }

        // Fetch evaluations for this agent
        console.log('Fetching evaluations for agent:', agentId);
        const evaluationsData = await getEvaluationsByAgent(agentId);
        console.log('Evaluations API response:', evaluationsData);
        setEvaluations(evaluationsData);

        // Fetch challenge data for each unique challenge_id
        const uniqueChallengeIds = [...new Set(evaluationsData.map(e => e.challenge_id))];
        const challengesData: Record<string, Challenge> = {};
        
        for (const challengeId of uniqueChallengeIds) {
          try {
            const challenge = await getChallenge(challengeId);
            challengesData[challengeId] = challenge;
          } catch (err) {
            console.error(`Error fetching challenge ${challengeId}:`, err);
          }
        }
        
        setChallengesMap(challengesData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch evaluations data');
        setLoading(false);
      }
    };

    fetchData();
  }, [agentId]);

  // Filter and sort evaluations
  const filteredAndSortedEvaluations = React.useMemo(() => {
    let filtered = [...evaluations];
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(e => e.status === filterStatus);
    }
    
    // Apply sorting
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'score') {
      filtered.sort((a, b) => {
        // Handle null scores by placing them at the end
        if (a.score === null) return 1;
        if (b.score === null) return -1;
        return b.score - a.score;
      });
    }
    
    return filtered;
  }, [evaluations, sortBy, filterStatus]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Render status badge
  const renderStatusBadge = (status: Evaluation['status']) => {
    switch (status) {
      case 'queued':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 flex items-center">
            <HourglassIcon className="h-3 w-3 mr-1" />
            Queued
          </span>
        );
      case 'running':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center">
            <Activity className="h-3 w-3 mr-1" />
            Running
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Unknown
          </span>
        );
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading evaluations data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Evaluations</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => navigate(-1)} 
            className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center mx-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button 
        onClick={() => navigate(-1)} 
        className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </button>
      
      {/* Agent information */}
      {agent && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">{agent.name} - Evaluations</h1>
          <p className="text-gray-600 mb-4">{agent.description || 'No description provided'}</p>
          
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            <span>Created: {formatDate(agent.created_at)}</span>
          </div>
        </div>
      )}
      
      {/* Evaluations summary */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Evaluation Stats</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 flex items-center">
            <div className="p-3 bg-blue-100 rounded-full mr-3">
              <BarChart2 className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{evaluations.length}</div>
              <div className="text-sm text-gray-600">Total Evaluations</div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 flex items-center">
            <div className="p-3 bg-green-100 rounded-full mr-3">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {evaluations.filter(e => e.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 flex items-center">
            <div className="p-3 bg-red-100 rounded-full mr-3">
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {evaluations.filter(e => e.status === 'failed').length}
              </div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4 flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full mr-3">
              <PieChart className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {evaluations.filter(e => e.score !== null).length > 0
                  ? Math.round(evaluations.filter(e => e.score !== null).reduce((avg, e) => avg + (e.score || 0), 0) / 
                     evaluations.filter(e => e.score !== null).length)
                  : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Avg. Score</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters and sorting */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Evaluation Results</h2>
          
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-1 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="border border-gray-300 rounded-md text-sm p-1 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="running">Running</option>
                <option value="queued">Queued</option>
              </select>
            </div>
            
            <div className="flex items-center ml-2">
              <Activity className="h-4 w-4 mr-1 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-300 rounded-md text-sm p-1 bg-white"
              >
                <option value="date">Sort by Date</option>
                <option value="score">Sort by Score</option>
              </select>
            </div>
          </div>
        </div>
        
        {filteredAndSortedEvaluations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {filterStatus !== 'all' 
              ? `No evaluations with status "${filterStatus}" found.` 
              : "No evaluations found for this agent."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Challenge
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Steps
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedEvaluations.map((evaluation) => (
                  <tr 
                    key={evaluation.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/evaluation/${evaluation.agent_id}/${evaluation.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {challengesMap[evaluation.challenge_id]?.title || 'Unknown Challenge'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(evaluation.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {evaluation.score !== null ? (
                        <div className="text-sm font-medium text-gray-900">
                          {evaluation.score}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {evaluation.steps_taken !== null ? (
                        <div className="text-sm text-gray-500">
                          {evaluation.steps_taken}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(evaluation.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/evaluation/${evaluation.id}`}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Details
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}