import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Code2, Play, CheckCircle, XCircle } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

const sampleCode = `def agent_logic(env):
    """
    Takes the WebArena environment as input.
    Returns a dictionary of actions for WebArena to execute.
    """
    return [
        {"type": "input", "selector": "#name", "value": "John Doe"},
        {"type": "input", "selector": "#email", "value": "john@example.com"},
        {"type": "click", "selector": "#submit"}
    ]`;

export function Challenge() {
  const { id } = useParams();
  const [code, setCode] = useState(sampleCode);
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'failed'>(
    'idle'
  );

  const handleSubmit = async () => {
    setStatus('running');
    // Simulate evaluation
    setTimeout(() => {
      setStatus(Math.random() > 0.5 ? 'success' : 'failed');
    }, 3000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Code2 className="h-8 w-8 text-indigo-600 mr-3" />
          Basic Form Submission Challenge
        </h1>
        <p className="mt-2 text-gray-600">
          Write an AI agent that can fill out and submit a basic form.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Challenge Details</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-700">Description</h3>
            <p className="text-gray-600">
              Create an agent that can fill out a form with name and email fields, then
              submit it. The agent should handle basic form validation and confirm
              successful submission.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">URL</h3>
            <p className="text-gray-600">www.realevals.xyz/form-basic</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Success Criteria</h3>
            <p className="text-gray-600">
              The page should display "Thank you for submitting!" after successful form
              submission.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Submit Your Agent</h2>
          <div className="flex items-center space-x-2">
            {status === 'running' && (
              <span className="text-yellow-600">Evaluating...</span>
            )}
            {status === 'success' && (
              <span className="text-green-600 flex items-center">
                <CheckCircle className="h-5 w-5 mr-1" />
                Success
              </span>
            )}
            {status === 'failed' && (
              <span className="text-red-600 flex items-center">
                <XCircle className="h-5 w-5 mr-1" />
                Failed
              </span>
            )}
            <button
              onClick={handleSubmit}
              disabled={status === 'running'}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Play className="h-4 w-4 mr-2" />
              Run Agent
            </button>
          </div>
        </div>
        <div className="relative">
          <SyntaxHighlighter
            language="python"
            style={tomorrow}
            customStyle={{
              margin: 0,
              borderRadius: '0.5rem',
              maxHeight: '400px',
            }}
          >
            {code}
          </SyntaxHighlighter>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-text"
            spellCheck="false"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Evaluation Results</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-700">Metrics</h3>
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Steps Taken</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">3</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Accuracy</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">100%</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Time Elapsed</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">1.2s</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Execution Log</h3>
            <div className="mt-2 bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                {`[INFO] Starting agent execution...
[INFO] Navigating to www.realevals.xyz/form-basic
[INFO] Found form elements
[INFO] Filling in name field
[INFO] Filling in email field
[INFO] Clicking submit button
[SUCCESS] Form submitted successfully`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}