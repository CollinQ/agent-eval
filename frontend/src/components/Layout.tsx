import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Trophy, Code2, Home, User, LogOut } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton, useClerk } from "@clerk/clerk-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                to="/"
                className="flex items-center px-3 py-2 text-gray-900 hover:text-indigo-600"
              >
                <Code2 className="h-6 w-6 mr-2" />
                <span className="font-semibold">WebArena</span>
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className="flex items-center px-3 py-2 text-gray-900 hover:text-indigo-600"
                >
                  <Home className="h-5 w-5 mr-1" />
                  Home
                </Link>
                <Link
                  to="/challenges"
                  className="flex items-center px-3 py-2 text-gray-900 hover:text-indigo-600"
                >
                  <Code2 className="h-5 w-5 mr-1" />
                  Challenges
                </Link>
                <Link
                  to="/leaderboard"
                  className="flex items-center px-3 py-2 text-gray-900 hover:text-indigo-600"
                >
                  <Trophy className="h-5 w-5 mr-1" />
                  Leaderboard
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <SignedIn>
                <UserButton afterSignOutUrl="/" userProfileUrl="/profile">
                </UserButton>
              </SignedIn>
              <SignedOut>
                <div className="text-gray-900 px-3 py-2 hover:text-indigo-600 cursor-pointer transition-colors">
                  <SignInButton 
                  mode="modal"/>
                </div>
              </SignedOut>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}