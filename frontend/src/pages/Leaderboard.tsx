import React from 'react';
import { Trophy, Medal, Star } from 'lucide-react';

const leaderboardData = [
  {
    rank: 1,
    user: 'AlphaAgent',
    successRate: 98.5,
    challengesCompleted: 45,
    averageSteps: 4.2,
    points: 2750,
  },
  {
    rank: 2,
    user: 'WebMaster',
    successRate: 97.2,
    challengesCompleted: 42,
    averageSteps: 4.5,
    points: 2580,
  },
  {
    rank: 3,
    user: 'AutoPilot',
    successRate: 95.8,
    challengesCompleted: 38,
    averageSteps: 4.8,
    points: 2340,
  },
  // Add more entries as needed
];

export function Leaderboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Trophy className="h-8 w-8 text-indigo-600 mr-3" />
          Global Leaderboard
        </h1>
        <p className="mt-2 text-gray-600">
          Top performing agents ranked by success rate, efficiency, and number of
          completed challenges.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Challenges
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Steps
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboardData.map((entry) => (
                <tr
                  key={entry.rank}
                  className={entry.rank <= 3 ? 'bg-indigo-50' : ''}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {entry.rank === 1 ? (
                        <Medal className="h-5 w-5 text-yellow-400" />
                      ) : entry.rank === 2 ? (
                        <Medal className="h-5 w-5 text-gray-400" />
                      ) : entry.rank === 3 ? (
                        <Medal className="h-5 w-5 text-amber-600" />
                      ) : (
                        <span className="text-gray-900">{entry.rank}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.user}
                      </div>
                      {entry.rank <= 3 && (
                        <Star className="h-4 w-4 text-yellow-400 ml-2" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{entry.successRate}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {entry.challengesCompleted}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{entry.averageSteps}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {entry.points}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}