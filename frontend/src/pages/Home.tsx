import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Trophy, Users } from 'lucide-react';
import { SignInButton, SignedOut, SignedIn } from '@clerk/clerk-react';

export function Home() {
  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to WebArena Evaluation Platform
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Test and evaluate AI agents on real-world web tasks. Submit your solutions,
          compete with others, and climb the leaderboard.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mb-4">
            <Code2 className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Tackle Challenges</h3>
          <p className="text-gray-600 mb-4">
            Choose from various difficulty levels and submit your AI agents to solve web
            automation tasks.
          </p>
          <SignedIn>
            <Link
              to="/challenges"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Browse Challenges →
            </Link>
          </SignedIn>
          <SignedOut>
          </SignedOut>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mb-4">
            <Trophy className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Compete</h3>
          <p className="text-gray-600 mb-4">
            Submit your solutions and see how they stack up against other participants on
            our global leaderboard.
          </p>
          <Link
            to="/leaderboard"
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            View Leaderboard →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mb-4">
            <Users className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Join the Community</h3>
          <p className="text-gray-600 mb-4">
            Connect with other developers, share insights, and learn from the community's
            collective experience.
          </p>
          <SignedOut>
            <SignInButton
              mode="modal">
              <button className="text-indigo-600 hover:text-indigo-800 font-medium">
                Get Started →
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md mt-12">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="text-2xl font-bold text-indigo-600 mb-2">1</div>
            <h3 className="text-lg font-semibold mb-2">Choose a Challenge</h3>
            <p className="text-gray-600">
              Browse through our collection of web automation challenges, ranging from
              simple form submissions to complex multi-step workflows.
            </p>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-600 mb-2">2</div>
            <h3 className="text-lg font-semibold mb-2">Submit Your Agent</h3>
            <p className="text-gray-600">
              Write and submit your AI agent using our standardized API. Your agent will
              be evaluated based on task completion and efficiency.
            </p>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-600 mb-2">3</div>
            <h3 className="text-lg font-semibold mb-2">Get Evaluated</h3>
            <p className="text-gray-600">
              Watch as your agent is evaluated in real-time. Get detailed feedback,
              metrics, and see how you rank against other submissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}