import React from 'react';
import { Award, Clock, Code2, User } from 'lucide-react';
import { useUser, UserProfile } from '@clerk/clerk-react';

export function Profile() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return null;
  }

  // Original profile content
  const ProfileContent = () => (
    <div className="space-y-8 p-4 md:p-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={`${user.firstName}'s profile`}
                className="h-24 w-24 rounded-full"
              />
            ) : (
              <div className="h-24 w-24 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-semibold">
                  {user?.firstName?.charAt(0) || ''}
                  {user?.lastName?.charAt(0) || ''}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h1>
            <p className="text-gray-600">{user?.primaryEmailAddress?.emailAddress}</p>
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
        <div className="bg-white rounded-lg shadow-md p-5 h-full flex flex-col">
          <div className="mb-3 flex flex-col items-start">
            <div className="p-1.5 mb-2 rounded-md bg-indigo-50">
              <Award className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Success Rate</h2>
          </div>
          <div className="mt-auto">
            <p className="text-3xl font-bold text-gray-900">92%</p>
            <p className="mt-1 text-xs text-gray-500">Across all challenges</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-5 h-full flex flex-col">
          <div className="mb-3 flex flex-col items-start">
            <div className="p-1.5 mb-2 rounded-md bg-indigo-50">
              <Code2 className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Challenges</h2>
          </div>
          <div className="mt-auto">
            <p className="text-3xl font-bold text-gray-900">24</p>
            <p className="mt-1 text-xs text-gray-500">Out of 30 total challenges</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-5 h-full flex flex-col">
          <div className="mb-3 flex flex-col items-start">
            <div className="p-1.5 mb-2 rounded-md bg-indigo-50">
              <Clock className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Avg Time</h2>
          </div>
          <div className="mt-auto">
            <p className="text-3xl font-bold text-gray-900">1.8s</p>
            <p className="mt-1 text-xs text-gray-500">Per challenge completion</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
        <div className="space-y-6">
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
              className="flex flex-col md:flex-row md:items-center py-4 border-b last:border-0"
            >
              <div className="mb-4 md:mb-0 md:w-1/4">
                <h3 className="font-medium text-gray-900 text-lg">{activity.challenge}</h3>
                <p className="text-sm text-gray-500 mt-1">{activity.date}</p>
              </div>
              <div className="grid grid-cols-4 gap-4 md:w-3/4">
                <div className="text-sm bg-gray-50 px-3 py-2 rounded-md flex flex-col justify-center items-center">
                  <span className="text-gray-500 mb-1">Steps</span>
                  <span className="font-medium">{activity.metrics.steps}</span>
                </div>
                <div className="text-sm bg-gray-50 px-3 py-2 rounded-md flex flex-col justify-center items-center">
                  <span className="text-gray-500 mb-1">Accuracy</span>
                  <span className="font-medium">{activity.metrics.accuracy}</span>
                </div>
                <div className="text-sm bg-gray-50 px-3 py-2 rounded-md flex flex-col justify-center items-center">
                  <span className="text-gray-500 mb-1">Time</span>
                  <span className="font-medium">{activity.metrics.time}</span>
                </div>
                <div
                  className={`px-3 py-2 text-sm font-medium rounded-md flex flex-col justify-center items-center ${
                    activity.result === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  <span className="text-gray-500 mb-1">Result</span>
                  <span className="font-medium capitalize">{activity.result}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // My Agents tab content
  const MyAgentsContent = () => (
    <div className="space-y-8 p-8">
      <h2 className="text-xl font-semibold mb-4">My Agents</h2>
      <p className="text-gray-600 mb-6">View and manage all your AI agents here.</p>
      
      <div className="bg-white rounded-lg shadow-md p-8">
        <p className="text-center text-gray-500 py-12 text-lg">No agents created yet. Create one by completing a challenge!</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-full px-4 py-6">
        <UserProfile
          appearance={{
            baseTheme: {
              borderRadius: '0.5rem',
              fontFamily: 'inherit',
            },
            elements: {
              rootBox: "w-full flex justify-center",
              card: "shadow-xl rounded-xl border border-gray-200 overflow-visible flex-grow max-w-[calc(100%-250px)]",
              navbar: "px-8 py-5 min-w-[250px]",
              navbarButton: "px-5 py-3 text-base font-medium hover:bg-indigo-50 rounded-md transition-colors",
              navbarButtonActive: "text-indigo-600 font-semibold bg-indigo-50",
              navbarButtonIcon: "w-5 h-5",
              header: "px-8 py-6",
              headerTitle: "text-2xl font-bold",
              headerSubtitle: "text-base text-gray-600",
              main: "p-0",
              form: "p-8",
              formFieldLabel: "text-base font-medium",
              formFieldInput: "p-3 text-base rounded-lg",
              formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-md text-base",
              formButtonReset: "px-6 py-3 rounded-md text-base",
              profileSectionTitle: "text-xl font-semibold",
              profileSectionTitleText: "text-xl font-semibold",
              profileSectionContent: "mt-2",
              accordionTriggerButton: "w-full p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 rounded-lg",
            }
          }}
        >
          {/* Dashboard tab */}
          <UserProfile.Page
            label="Dashboard"
            url="dashboard"
            labelIcon={<User className="h-5 w-5" />}
          >
            <ProfileContent />
          </UserProfile.Page>
          
          {/* My Agents tab */}
          <UserProfile.Page
            label="My Agents"
            url="my-agents"
            labelIcon={<Code2 className="h-5 w-5" />}
          >
            <MyAgentsContent />
          </UserProfile.Page>
        </UserProfile>
      </div>
    </div>
  );
}