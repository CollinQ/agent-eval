# Web Agent Evaluation Platform

A FastAPI backend service for evaluating web agents against various challenges.

## Overview

This platform allows users to:
- Create and manage web agents with custom code
- Test agents against predefined web challenges
- Track agent performance and evaluation results
- Compare agent scores across different challenges

## Database Schema

### Agents

Stores user-created web agents:

```sql
create table public.agents (
  id uuid not null default extensions.uuid_generate_v4(),
  user_id character varying(255) not null,
  name character varying(255) not null,
  description text null,
  code text not null,
  created_at timestamp with time zone not null default now(),
  constraint agents_pkey primary key (id)
);
```

### Challenges

Defines web-based challenges for agents to complete:

```sql
create table public.challenges (
  id uuid not null default extensions.uuid_generate_v4(),
  title character varying(255) not null,
  description text not null,
  difficulty character varying(50) not null, -- 'Easy', 'Medium', 'Hard'
  url character varying(255) not null,
  success_criteria text not null,
  expected_workflow text null,
  created_at timestamp with time zone not null default now(),
  constraint challenges_pkey primary key (id)
);
```

### Evaluations

Tracks results of agent evaluations against challenges:

```sql
create table public.evaluations (
  id uuid not null default extensions.uuid_generate_v4(),
  agent_id uuid not null,
  challenge_id uuid not null,
  status character varying(50) not null, -- 'queued', 'running', 'completed', 'failed'
  score numeric(5, 2) null,
  steps_taken integer null,
  created_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone null,
  result jsonb null,
  logs text[] null,
  constraint evaluations_pkey primary key (id),
  constraint unique_agent_challenge unique (agent_id, challenge_id),
  constraint evaluations_agent_id_fkey foreign key (agent_id) references agents (id),
  constraint evaluations_challenge_id_fkey foreign key (challenge_id) references challenges (id)
);
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Python 3.9+
- PostgreSQL database (Supabase recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/web-agent-evaluation.git
   cd web-agent-evaluation
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file with the following variables:
   ```
   DATABASE_URL=your_supabase_connection_string
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   EVALUATOR_API_URL=your_evaluator_service_url
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

The backend provides the following main API endpoints:

### Agents
- `GET /api/agents` - List all agents for current user
- `GET /api/agents/:id` - Get agent details
- `POST /api/agents` - Create a new agent
- `PUT /api/agents/:id` - Update an agent
- `DELETE /api/agents/:id` - Delete an agent

### Challenges
- `GET /api/challenges` - List all challenges
- `GET /api/challenges/:id` - Get challenge details
- `POST /api/challenges` - Create a new challenge (admin only)
- `PUT /api/challenges/:id` - Update a challenge (admin only)
- `DELETE /api/challenges/:id` - Delete a challenge (admin only)

### Evaluations
- `GET /api/evaluations` - List all evaluations for current user
- `GET /api/evaluations/:id` - Get evaluation details
- `POST /api/evaluations` - Create a new evaluation
- `GET /api/evaluations/:id/callback` - Endpoint for evaluation service callbacks

## Evaluation Flow

1. User creates an agent with custom code
2. User selects a challenge to evaluate the agent against
3. Backend creates an evaluation record and sends it to the evaluator service
4. Evaluator service runs the agent against the challenge
5. Results are sent back via callback and stored in the database
6. User can view detailed results and agent performance

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.