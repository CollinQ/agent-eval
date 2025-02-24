import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, ArrowRight } from 'lucide-react';

const challenges = [
  {
    id: '1',
    title: 'Basic Form Submission',
    description: 'Fill out a simple form with basic validation.',
    difficulty: 'easy',
    url: 'www.realevals.xyz/form-basic',
    successCriteria: 'Page contains "Thank you for submitting!"',
  },
  {
    id: '2',
    title: 'Multi-Step Form',
    description: 'Navigate and complete a multi-page form with various input types.',
    difficulty: 'medium',
    url: 'www.realevals.xyz/multi-step',
    successCriteria: 'Final confirmation message appears.',
  },
  {
    id: '3',
    title: 'Checkout Simulation',
    description: 'Complete an e-commerce checkout process with multiple steps.',
    difficulty: 'hard',
    url: 'www.realevals.xyz/checkout',
    successCriteria: 'Page contains "Order Confirmed!"',
  },
];

export function Challenges() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Web Automation Challenges</h1>
        <p className="mt-2 text-gray-600">
          Choose a challenge and submit your AI agent to solve it. Each challenge is
          rated by difficulty and has specific success criteria.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize mb-4 ${
                  challenge.difficulty === 'easy'
                    ? 'bg-green-100 text-green-800'
                    : challenge.difficulty === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {challenge.difficulty}
              </div>
              <div className="flex items-center mb-3">
                <Code2 className="h-5 w-5 text-indigo-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-900">
                  {challenge.title}
                </h3>
              </div>
              <p className="text-gray-600 mb-4">{challenge.description}</p>
              <div className="space-y-2 text-sm text-gray-500 mb-4">
                <p>
                  <strong>URL:</strong> {challenge.url}
                </p>
                <p>
                  <strong>Success Criteria:</strong> {challenge.successCriteria}
                </p>
              </div>
              <Link
                to={`/challenges/${challenge.id}`}
                className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
              >
                View Challenge
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}