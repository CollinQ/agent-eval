# WebArena Evaluation Microservice

This microservice handles the execution of agent evaluations using WebArena. It provides a FastAPI server that receives evaluation requests, runs them in the WebArena environment, and sends results back to the main application.

## Features

- Accepts agent code and challenge details via HTTP API
- Dynamically loads and executes agent code in WebArena
- Captures screenshots of the evaluation
- Reports evaluation results (success/failure) back to the main application

## Setup

### Environment Variables

None required by default, but the service can be configured with:

- `PORT`: (optional) Port for the API server (default: 8000)

### Installation

#### Local Installation

1. Ensure you have Python 3.10+ installed
2. Install WebArena from the GitHub repository:
   ```bash
   git clone https://github.com/web-arena-x/webarena.git
   cd webarena
   pip install -r requirements.txt
   pip install -e .
   playwright install
   ```

3. Install the microservice dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the microservice:
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 8000 --reload
   ```

## API Endpoints

### POST /api/evaluate

Start a new evaluation.

**Request Body:**

```json
{
  "evaluation_id": "string",
  "agent_code": "string",
  "challenge_url": "string",
  "success_criteria": "string",
  "callback_url": "string"
}
```

**Response:**

```json
{
  "evaluation_id": "string",
  "status": "string",
  "message": "string"
}
```

### GET /health

Health check endpoint.

**Response:**

```json
{
  "status": "ok"
}
```

## Agent Code Format

The agent code should define a function called `agent_logic` that takes a text observation (HTML/accessibility tree) from WebArena and returns a list of actions to perform:

```python
def agent_logic(obs_text: str):
    """
    Takes the WebArena environment as input.
    Returns a dictionary of actions for WebArena to execute.

    The supported action types are found on page 5 of: [https://arxiv.org/pdf/2307.13854.pdf](https://arxiv.org/pdf/2307.13854.pdf)
    """
    return ["click [element]", "press [key_comb]"]
```

The supported action types are found on page 5 of: [https://arxiv.org/pdf/2307.13854.pdf](https://arxiv.org/pdf/2307.13854.pdf)

## Integration with Main Application

The microservice will call back to the main application with the evaluation results using the provided `callback_url`. The callback will include:

```json
{
  "evaluation_id": "string",
  "status": "completed|failed",
  "success": true|false,
  "steps": 0,
  "screenshot": "base64-encoded-image",
  "error": "error-message-if-any"
}
```
