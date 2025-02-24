import React from 'react';
import { User, Award, Clock, Code2 } from 'lucide-react';

export function Profile() {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center">
              <User className="h-12 w-12 text-indigo-600" />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">John Doe</h1>
            <p className="text-gray-600">john@example.com</p>
            <div className="mt-4 flex space-x-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Member since</dt>
                <dd className="mt-1 text-sm text-gray-900">January 2024</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Rank</dt>
                <dd className="mt-1 text-sm text-gray-900">#42</dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Success Rate</h2>
            <Award className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">92%</p>
          <p className="text-sm text-gray-500">Across all challenges</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Challenges Completed</h2>
            <Code2 className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">24</p>
          <p className="text-sm text-gray-500">Out of 30 total challenges</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Average Time</h2>
            <Clock className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">1.8s</p>
          <p className="text-sm text-gray-500">Per challenge completion</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[
            {
              challenge: 'Checkout Simulation',
              result: 'success',
              date: '2 hours ago',
              metrics: { steps: 8, accuracy: '98%', time: '2.1s' },
            },
            {
              challenge: 'Multi-Step Form',
              result: 'failed',
              date: '1 day ago',
              metrics: { steps: 5, accuracy: '85%', time: '1.5s' },
            },
            {
              challenge: 'Basic Form',
              result: 'success',
              date: '2 days ago',
              metrics: { steps: 3, accuracy: '100%', time: '1.2s' },
            },
          ].map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-3 border-b last:border-0"
            >
              <div>
                <h3 className="font-medium text-gray-900">{activity.challenge}</h3>
                <p className="text-sm text-gray-500">{activity.date}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <span className="text-gray-500">Steps: </span>
                  <span className="font-medium">{activity.metrics.steps}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Accuracy: </span>
                  <span className="font-medium">{activity.metrics.accuracy}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Time: </span>
                  <span className="font-medium">{activity.metrics.time}</span>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    activity.result === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {activity.result}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}