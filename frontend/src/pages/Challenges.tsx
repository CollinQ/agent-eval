import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Code2, ArrowRight } from 'lucide-react';
import { getChallenges, type Challenge } from '../services/api';

export function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const response = await getChallenges();
        console.log('Response from API:', response); // Debug log

        // Handle different response formats
        let challengesData: Challenge[] = [];
        
        if (Array.isArray(response)) {
          challengesData = response;
        } else if (Array.isArray(response.data)) {
          challengesData = response.data;
        } else if (response && typeof response === 'object') {
          console.log('Response is an object:', response); // Debug log
          if (response.data && Array.isArray(response.data)) {
            challengesData = response.data;
          } else if (response.challenges && Array.isArray(response.challenges)) {
            challengesData = response.challenges;
          }
        }

        console.log('Processed challenges data:', challengesData); // Debug log
        
        if (challengesData.length > 0) {
          setChallenges(challengesData);
        } else {
          console.log('No challenges found in response'); // Debug log
          setChallenges([]);
        }
      } catch (err) {
        console.error('Error fetching challenges:', err); // Debug log
        setError('Failed to fetch challenges');
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading challenges...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  if (challenges.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No challenges available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Available Challenges</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => (
          <Link
            key={challenge.id}
            to={`/challenges/${challenge.id}`}
            className="block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start justify-between">
              <Code2 className="w-6 h-6 text-blue-600" />
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                challenge.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                challenge.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {challenge.difficulty}
              </span>
            </div>
            <h2 className="text-xl font-semibold mt-4">{challenge.title}</h2>
            <p className="mt-2 text-gray-600">{challenge.description}</p>
            <div className="mt-4 flex items-center text-blue-600">
              View Challenge <ArrowRight className="ml-2 w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}