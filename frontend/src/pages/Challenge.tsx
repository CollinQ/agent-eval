import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Code2, Play, CheckCircle, XCircle } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useUser } from '@clerk/clerk-react';
import { getChallenge, createAgent, createEvaluation, type Challenge as ChallengeType } from '../services/api';
import { AgentSelector } from '../components/AgentSelector';
import { Editor } from '@monaco-editor/react';
import type { OnMount, OnChange } from '@monaco-editor/react';
import { useRef } from 'react';

const sampleCode = `def agent_logic(obs_text: str):
    """
    Takes the WebArena environment as input.
    Returns a dictionary of actions for WebArena to execute.

    The supported action types are found on page 5 of: [https://arxiv.org/pdf/2307.13854.pdf](https://arxiv.org/pdf/2307.13854.pdf)
    """
    return ["click [element]", "press [key_comb]"]`;

export function Challenge() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [challenge, setChallenge] = useState<ChallengeType | null>(null);
  const [code, setCode] = useState(sampleCode);
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [agentFile, setAgentFile] = useState<File | null>(null);
  const [submissionType, setSubmissionType] = useState<'new' | 'existing'>('new');
  const [agentTitle, setAgentTitle] = useState<string>('');

  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAgentFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          setCode(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.py')) {
        setAgentFile(file);
        
        // Read the file contents
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (content) {
            setCode(content);
          }
        };
        reader.readAsText(file);
      }
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const handleEditorChange: OnChange = (value) => {
    setCode(value || '');
  };

  useEffect(() => {
    const fetchChallenge = async () => {
      if (!id) return;
      try {
        console.log('Fetching challenge with id:', id);
        const response = await getChallenge(id);
        console.log('Challenge API response:', response);
        setChallenge(response);
      } catch (err) {
        console.error('Error fetching challenge:', err);
        setError('Failed to fetch challenge');
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [id]);

  const handleSubmit = async () => {
    if (!challenge || !user) return;
    
    setStatus('running');
    setError(null);
    
    try {
      let agentId: string;

      if (submissionType === 'new') {
        // Create a new agent
        const agentResponse = await createAgent({
          user_id: user.id,
          name: agentTitle || `Agent for ${challenge.title}`,
          description: `Auto-generated agent for challenge: ${challenge.title}`,
          code: code
        });
        agentId = agentResponse.id;
      } else {
        // Use existing agent
        agentId = selectedAgentId;
      }

      // Create an evaluation
      const evaluation = await createEvaluation({
        agent_id: agentId,
        challenge_id: challenge.id
      });

      console.log('Evaluation created:', evaluation);

      setStatus('success');
      // Navigate to profile page or evaluation details
      navigate('/evaluation/' + evaluation.id);
    } catch (err) {
      console.error('Error submitting agent:', err);
      setStatus('failed');
      setError('Failed to submit agent for evaluation');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading challenge...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  if (!challenge) {
    return <div className="text-center py-8">Challenge not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Code2 className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold">{challenge.title}</h1>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              challenge.difficulty === 'Easy'
                ? 'bg-green-100 text-green-800'
                : challenge.difficulty === 'Medium'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {challenge.difficulty}
          </span>
        </div>

        <div className="prose max-w-none mb-6">
          <h2 className="text-lg font-semibold mb-2">Description</h2>
          <p className="text-gray-600">{challenge.description}</p>

          <h2 className="text-lg font-semibold mt-4 mb-2">Success Criteria</h2>
          <p className="text-gray-600">{challenge.success_criteria}</p>

          <h2 className="text-lg font-semibold mt-4 mb-2">Challenge URL</h2>
          <a
            href={challenge.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {challenge.url}
          </a>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Submit Your Agent</h2>
        
        <div className="mb-6">
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setSubmissionType('new')}
              className={`px-4 py-2 rounded-md ${
                submissionType === 'new'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Write New Agent
            </button>
            <button
              onClick={() => setSubmissionType('existing')}
              className={`px-4 py-2 rounded-md ${
                submissionType === 'existing'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Use Existing Agent
            </button>
          </div>

          {submissionType === 'new' ? (
            <div
              className="mb-4"
            >
              <div
                style={{
                  minHeight: '300px',
                  maxHeight: '800px',
                  height: '400px',
                }}
                className="resize-y overflow-auto border border-gray-300 rounded-md"
                >
                  <Editor
                    language="python"
                    height="100%"
                    width="100%"
                    defaultValue={sampleCode}
                    value={code}
                    theme="vs-dark"
                    onMount={handleEditorDidMount}
                    onChange={handleEditorChange}
                    options={{
                      autoIndent: 'full',
                      contextmenu: true,
                      fontFamily: 'monospace',
                      fontSize: 14,
                      lineHeight: 24,
                      minimap: { enabled: true },
                      scrollbar: {
                        horizontalSliderSize: 4,
                        verticalSliderSize: 18,
                      },
                      selectOnLineNumbers: true,
                      roundedSelection: false,
                      readOnly: false,
                      cursorStyle: 'line',
                      automaticLayout: true,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      folding: true,
                      renderLineHighlight: 'all',
                      scrollBeyondLastLine: false,
                      tabSize: 2
                    }}
                  />
              </div>
              <div className="mt-4">
                <label htmlFor="agent-title" className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Title
                </label>
                <input
                  type="text"
                  id="agent-title"
                  value={agentTitle}
                  onChange={(e) => setAgentTitle(e.target.value)}
                  placeholder="Enter a name for your agent"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div 
                className="mt-4 border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="python-file"
                  accept=".py"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Upload Python File
                </button>
                {agentFile ? (
                  <p className="mt-2 text-sm text-gray-600">
                    {agentFile.name} ({Math.round(agentFile.size / 1024)} KB)
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-gray-600">or drag and drop a .py file here</p>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <AgentSelector
                onAgentSelect={setSelectedAgentId}
                selectedAgentId={selectedAgentId}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleSubmit}
            disabled={status === 'running' || (submissionType === 'existing' && !selectedAgentId)}
            className={`inline-flex items-center px-4 py-2 rounded-md text-white ${
              status === 'running' || (submissionType === 'existing' && !selectedAgentId)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {status === 'running' ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                {submissionType === 'new' ? 'Submit New Agent' : 'Run Selected Agent'}
              </>
            )}
          </button>

          {status === 'success' && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="mr-2 h-5 w-5" />
              Submitted successfully!
            </div>
          )}

          {status === 'failed' && (
            <div className="flex items-center text-red-600">
              <XCircle className="mr-2 h-5 w-5" />
              Submission failed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}