import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Play, 
  AlertTriangle, 
  Code, 
  Star, 
  HourglassIcon, 
  FileText,
  ArrowLeft
} from 'lucide-react';
import { getEvaluation, getChallenge, getAgent, type Evaluation as EvaluationType } from '../services/api';

export function Evaluation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState<EvaluationType | null>(null);
  const [challenge, setChallenge] = useState<any | null>(null);
  const [agent, setAgent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<number | null>(null);

  // Function to fetch evaluation data
  const fetchEvaluation = async () => {
    if (!id) return;
    
    try {
      console.log('Fetching evaluation with id:', id);
      const evalData = await getEvaluation(id);
      console.log('Evaluation API response:', evalData);
      setEvaluation(evalData);
      
      // If we have challenge_id and agent_id, fetch those too
      if (evalData.challenge_id && !challenge) {
        try {
          const challengeData = await getChallenge(evalData.challenge_id);
          console.log('Challenge data:', challengeData);
          setChallenge(challengeData);
        } catch (err) {
          console.error('Error fetching challenge:', err);
        }
      }
      
      if (evalData.agent_id && !agent) {
        try {
          const agentData = await getAgent(evalData.agent_id);
          console.log('Agent data:', agentData);
          setAgent(agentData);
        } catch (err) {
          console.error('Error fetching agent:', err);
        }
      }
      
      // If status is now completed or failed, stop polling
      if (evalData.status === 'completed' || evalData.status === 'failed') {
        if (pollInterval) {
          clearInterval(pollInterval);
          setPollInterval(null);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching evaluation:', err);
      setError('Failed to fetch evaluation data');
      setLoading(false);
      
      // Stop polling on error
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
    }
  };

  // Set up initial data fetch and polling
  useEffect(() => {
    fetchEvaluation();
    
    // Set up polling every 3 seconds
    const interval = window.setInterval(fetchEvaluation, 3000);
    setPollInterval(interval);
    
    // Clean up interval on component unmount
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [id]);

  // Helper to format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Calculate elapsed time
  const calculateElapsedTime = () => {
    if (!evaluation) return 'N/A';
    
    const startTime = new Date(evaluation.created_at).getTime();
    const endTime = evaluation.completed_at 
      ? new Date(evaluation.completed_at).getTime() 
      : new Date().getTime();
    
    const diffInSeconds = Math.floor((endTime - startTime) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds} seconds`;
    
    const minutes = Math.floor(diffInSeconds / 60);
    const seconds = diffInSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  // Render status badge
  const renderStatusBadge = () => {
    if (!evaluation) return null;
    
    switch (evaluation.status) {
      case 'queued':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 flex items-center">
            <HourglassIcon className="h-4 w-4 mr-1" />
            Queued
          </span>
        );
      case 'running':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center">
            <Play className="h-4 w-4 mr-1" />
            Running
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center">
            <CheckCircle className="h-4 w-4 mr-1" />
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center">
            <XCircle className="h-4 w-4 mr-1" />
            Failed
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Unknown
          </span>
        );
    }
  };

  // Show loading state
  if (loading && !evaluation) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading evaluation data...</p>
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
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Evaluation</h2>
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

  // Show not found state
  if (!evaluation) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Evaluation Not Found</h2>
          <p className="text-gray-600">The evaluation you're looking for doesn't exist or has been removed.</p>
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button 
        onClick={() => navigate(-1)} 
        className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </button>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {challenge ? challenge.title : 'Evaluation'}
            </h1>
            <div className="flex items-center space-x-4">
              {renderStatusBadge()}
              
              <span className="text-sm text-gray-500 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {evaluation.created_at ? formatTime(evaluation.created_at) : 'N/A'}
              </span>
              
              <span className="text-sm text-gray-500 flex items-center">
                <HourglassIcon className="h-4 w-4 mr-1" />
                {calculateElapsedTime()}
              </span>
            </div>
          </div>
          
          {evaluation.score !== null && (
            <div className="flex items-center">
              <div className="bg-blue-50 border border-blue-100 rounded-full h-16 w-16 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">{evaluation.score}</div>
                  <div className="text-xs text-blue-500">Score</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-500" />
              Challenge Details
            </h2>
            {challenge ? (
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium">{challenge.title}</h3>
                <p className="text-sm text-gray-600 mt-2">{challenge.description}</p>
                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    challenge.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                    challenge.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {challenge.difficulty}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-500 italic">Loading challenge details...</p>
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center">
              <Code className="h-5 w-5 mr-2 text-blue-500" />
              Agent Details
            </h2>
            {agent ? (
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium">{agent.name}</h3>
                <p className="text-sm text-gray-600 mt-2">
                  {agent.description || 'No description provided'}
                </p>
                {evaluation.steps_taken !== null && (
                  <div className="mt-3 text-sm">
                    <span className="text-gray-600">Steps taken: </span>
                    <span className="font-medium">{evaluation.steps_taken}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-500 italic">Loading agent details...</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Evaluation progress/status visualization */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Evaluation Progress</h2>
        
        <div className="mb-6">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {evaluation.status === 'queued' ? 'Queued' :
                   evaluation.status === 'running' ? 'Running' :
                   evaluation.status === 'completed' ? 'Completed' : 'Failed'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {evaluation.status === 'queued' ? '0%' :
                   evaluation.status === 'running' ? '50%' :
                   '100%'}
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
              <div style={{ width: 
                evaluation.status === 'queued' ? '0%' :
                evaluation.status === 'running' ? '50%' :
                '100%'
              }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                evaluation.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
              }`}></div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className={`flex items-center ${evaluation.status !== 'queued' ? 'text-gray-700' : 'text-gray-400'}`}>
            <div className={`rounded-full w-8 h-8 flex items-center justify-center mr-3 ${
              evaluation.status !== 'queued' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}>1</div>
            <div>
              <h3 className="font-medium">Agent Queued</h3>
              <p className="text-sm text-gray-500">
                {evaluation.created_at ? formatTime(evaluation.created_at) : 'N/A'}
              </p>
            </div>
          </div>
          
          <div className={`flex items-center ${
            evaluation.status === 'running' || evaluation.status === 'completed' || evaluation.status === 'failed' 
              ? 'text-gray-700' : 'text-gray-400'
          }`}>
            <div className={`rounded-full w-8 h-8 flex items-center justify-center mr-3 ${
              evaluation.status === 'running' || evaluation.status === 'completed' || evaluation.status === 'failed'
                ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}>2</div>
            <div>
              <h3 className="font-medium">Agent Running</h3>
              {evaluation.status === 'running' && (
                <div className="flex items-center mt-1">
                  <div className="animate-pulse mr-2 h-2 w-2 bg-blue-500 rounded-full"></div>
                  <p className="text-sm text-blue-500">In progress...</p>
                </div>
              )}
            </div>
          </div>
          
          <div className={`flex items-center ${
            evaluation.status === 'completed' || evaluation.status === 'failed' 
              ? 'text-gray-700' : 'text-gray-400'
          }`}>
            <div className={`rounded-full w-8 h-8 flex items-center justify-center mr-3 ${
              evaluation.status === 'completed'
                ? 'bg-green-500 text-white' : 
              evaluation.status === 'failed'
                ? 'bg-red-500 text-white' : 'bg-gray-200'
            }`}>
              {evaluation.status === 'completed' ? (
                <CheckCircle className="h-5 w-5" />
              ) : evaluation.status === 'failed' ? (
                <XCircle className="h-5 w-5" />
              ) : 3}
            </div>
            <div>
              <h3 className="font-medium">
                {evaluation.status === 'completed' ? 'Success' : 
                 evaluation.status === 'failed' ? 'Failed' : 'Completion'}
              </h3>
              {evaluation.completed_at && (
                <p className="text-sm text-gray-500">
                  {formatTime(evaluation.completed_at)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Logs section */}
      {evaluation.logs && Array.isArray(evaluation.logs) && evaluation.logs.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Execution Logs</h2>
          <div className="bg-gray-800 text-gray-200 p-4 rounded-md font-mono text-sm overflow-auto max-h-96">
            {evaluation.logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}