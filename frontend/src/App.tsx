import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Challenges } from './pages/Challenges';
import { Challenge } from './pages/Challenge';
import { Leaderboard } from './pages/Leaderboard';
import { Profile } from './pages/Profile';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Evaluation } from './pages/Evaluation';
import { Evaluations } from './pages/Evaluations';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/challenges"
            element={
              <ProtectedRoute>
                <Challenges />
              </ProtectedRoute>
            }
          />
          <Route
            path="/challenges/:id"
            element={
              <ProtectedRoute>
                <Challenge />
              </ProtectedRoute>
            }
          />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route
            path="/profile/*"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/evaluation/:agentId"
            element={
              <ProtectedRoute>
                <Evaluations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/evaluation/:agentId/:id"
            element={
              <ProtectedRoute>
                <Evaluation />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;