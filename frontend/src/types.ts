export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  url: string;
  successCriteria: string;
  createdAt: string;
}

export interface Submission {
  id: string;
  userId: string;
  challengeId: string;
  code: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  result?: {
    success: boolean;
    logs: string[];
    actions: any[];
    metrics: {
      steps: number;
      accuracy: number;
      timeElapsed: number;
    };
  };
  createdAt: string;
}