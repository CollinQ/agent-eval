#!/usr/bin/env python
# WebArena Evaluation Microservice

import os
import sys
import json
import base64
import traceback
import importlib.util
import tempfile
from typing import Dict, List, Optional
import logging
import asyncio
import requests
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("webarena_service")

# Create FastAPI app
app = FastAPI(title="WebArena Evaluation Service")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class EvaluationRequest(BaseModel):
    evaluation_id: str
    agent_code: str
    challenge_url: str
    success_criteria: str
    callback_url: str

class EvaluationResponse(BaseModel):
    evaluation_id: str
    status: str
    message: str

# Initialize WebArena environment in a function to avoid 
# loading it when importing this module for testing
def init_webarena_env(headless=True):
    try:
        # Import WebArena components
        from browser_env import ScriptBrowserEnv, create_id_based_action
        
        # Initialize environment
        env = ScriptBrowserEnv(
            headless=headless,
            observation_type="accessibility_tree",
            current_viewport_only=True,
            viewport_size={"width": 1280, "height": 720},
        )
        
        return env, create_id_based_action
    except ImportError as e:
        logger.error(f"Failed to import WebArena: {e}")
        raise


# Function to load and execute agent code
def load_agent_function(agent_code: str):
    """Dynamically load agent function from the provided code."""
    try:
        # Create a temporary module
        with tempfile.NamedTemporaryFile(suffix='.py', delete=False) as f:
            f.write(agent_code.encode('utf-8'))
            temp_module_path = f.name
        
        # Load the module
        spec = importlib.util.spec_from_file_location("agent_module", temp_module_path)
        agent_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(agent_module)
        
        # Check if agent_logic function exists
        if not hasattr(agent_module, 'agent_logic'):
            raise ValueError("Agent code must contain an 'agent_logic' function")
        
        agent_function = agent_module.agent_logic
        
        # Clean up
        os.unlink(temp_module_path)
        
        return agent_function
    except Exception as e:
        logger.error(f"Error loading agent code: {e}")
        if os.path.exists(temp_module_path):
            os.unlink(temp_module_path)
        raise


# Function to convert agent actions to WebArena format
def convert_to_webarena_action(action, create_id_based_action_fn):
    """Convert agent-format action to WebArena format."""
    action_type = action.get("type")
    selector = action.get("selector")
    
    if action_type == "click":
        return create_id_based_action_fn(f"click {selector}")
    elif action_type == "input":
        value = action.get("value", "")
        return create_id_based_action_fn(f"type {selector} {value}")
    elif action_type == "select":
        value = action.get("value", "")
        return create_id_based_action_fn(f"select {selector} {value}")
    else:
        raise ValueError(f"Unsupported action type: {action_type}")


# Evaluation function
async def run_evaluation(
    evaluation_id: str,
    agent_code: str,
    challenge_url: str,
    success_criteria: str,
    callback_url: str
):
    """Run WebArena evaluation and send results back via callback."""
    logger.info(f"Starting evaluation {evaluation_id} for URL: {challenge_url}")
    
    result = {
        "evaluation_id": evaluation_id,
        "status": "failed",
        "success": False,
        "error": None,
        "steps": 0,
        "screenshot": None
    }
    
    try:
        # Initialize WebArena environment
        env, create_id_based_action_fn = init_webarena_env(headless=True)
        
        # Load agent function
        agent_function = load_agent_function(agent_code)
        
        # Reset environment and navigate to the challenge URL
        obs, info = env.reset(options={"url": challenge_url})
        
        # Set evaluation parameters
        max_steps = 20  # Maximum number of steps for the agent
        steps = 0
        success = False
        
        # Evaluation loop
        while steps < max_steps:
            # Get page observation
            text_obs = obs.get("text", "")
            
            # Get actions from agent
            try:
                actions = agent_function(text_obs)
                
                # Ensure actions is a list
                if not isinstance(actions, list):
                    logger.warning(f"Agent returned non-list: {actions}, converting to list")
                    actions = [actions]
                
                # Execute each action
                for action in actions:
                    # Convert to WebArena format
                    webarena_action = convert_to_webarena_action(action, create_id_based_action_fn)
                    
                    # Execute action
                    obs, reward, terminated, truncated, info = env.step(webarena_action)
                    
                    # Check for success criteria
                    if success_criteria and success_criteria in obs.get("text", ""):
                        success = True
                        break
                
                steps += 1
                
                if success or terminated or truncated:
                    break
                    
            except Exception as e:
                logger.error(f"Error during agent execution: {e}")
                result["error"] = str(e)
                break
        
        # Capture screenshot
        try:
            screenshot = env.render()
            result["screenshot"] = base64.b64encode(screenshot).decode('utf-8')
        except Exception as e:
            logger.error(f"Failed to capture screenshot: {e}")
        
        # Update result
        result["success"] = success
        result["steps"] = steps
        result["status"] = "completed"
        
        # Close environment
        env.close()
        
    except Exception as e:
        logger.error(f"Evaluation error: {e}")
        result["error"] = str(e)
        result["status"] = "failed"
        
    # Send callback
    try:
        response = requests.post(callback_url, json=result)
        logger.info(f"Callback response: {response.status_code}, {response.text}")
    except Exception as e:
        logger.error(f"Callback error: {e}")
    
    return result


# Routes
@app.post("/api/evaluate", response_model=EvaluationResponse)
async def evaluate(request: EvaluationRequest, background_tasks: BackgroundTasks):
    """
    Start a WebArena evaluation.
    
    The evaluation will run in the background, and results will be sent
    to the callback URL when complete.
    """
    try:
        logger.info(f"Received evaluation request: {request.evaluation_id}")
        
        # Add evaluation to background tasks
        background_tasks.add_task(
            run_evaluation,
            evaluation_id=request.evaluation_id,
            agent_code=request.agent_code,
            challenge_url=request.challenge_url,
            success_criteria=request.success_criteria,
            callback_url=request.callback_url
        )
        
        return EvaluationResponse(
            evaluation_id=request.evaluation_id,
            status="running",
            message="Evaluation started successfully"
        )
    except Exception as e:
        logger.error(f"Error starting evaluation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
