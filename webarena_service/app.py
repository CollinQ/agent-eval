#!/usr/bin/env python
# WebArena Evaluation Microservice

import os
import sys
import json
import base64
import re
import traceback
import importlib.util
import tempfile
from typing import Dict, List, Optional, Any
import logging
import asyncio
import requests
import concurrent.futures
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.append(os.path.join(os.path.dirname(__file__), 'webarena'))

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

# ThreadPoolExecutor for running sync code
thread_pool = concurrent.futures.ThreadPoolExecutor()

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


# Function to find element IDs in accessibility tree based on selectors
def find_element_id(selector: str, accessibility_tree: str) -> Optional[str]:
    """Find element ID in accessibility tree that matches a CSS selector."""
    # Remove the # or . prefix from the selector to get the element name or id
    if selector.startswith('#'):
        # ID selector - look for element with matching id
        element_id = selector[1:]
        
        # Try to find elements with matching id or name
        # Example pattern: [123] textbox 'name' or [123] textbox id='name'
        patterns = [
            rf'\[(\d+)\][^\[\]]*?id=[\'"]?{re.escape(element_id)}[\'"]?',
            rf'\[(\d+)\][^\[\]]*?name=[\'"]?{re.escape(element_id)}[\'"]?',
            rf'\[(\d+)\][^\[\]]*?[\'"]?{re.escape(element_id)}[\'"]?',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, accessibility_tree)
            if match:
                return match.group(1)
    
    elif selector.startswith('.'):
        # Class selector - look for element with matching class
        element_class = selector[1:]
        # Find elements with matching class
        pattern = rf'\[(\d+)\][^\[\]]*?class=[\'"]?.*?{re.escape(element_class)}.*?[\'"]?'
        match = re.search(pattern, accessibility_tree)
        if match:
            return match.group(1)
    
    else:
        # Tag selector - look for matching tag
        tag = selector
        # Find elements with matching tag
        pattern = rf'\[(\d+)\] {re.escape(tag)}'
        match = re.search(pattern, accessibility_tree)
        if match:
            return match.group(1)
    
    # If no match found, look for elements with similar text or role
    fallback_patterns = [
        # Look for elements containing the selector text in their name
        rf'\[(\d+)\][^\[\]]*?[\'"].*?{re.escape(selector)}.*?[\'"]',
        # Look for buttons/links with matching text
        rf'\[(\d+)\] (?:button|link) [\'"].*?{re.escape(selector)}.*?[\'"]',
        # Special case for common elements like submit buttons
        rf'\[(\d+)\] button [\'"](?:submit|Search|Send|OK|Continue)[\'"]' if selector.lower() in ['submit', 'search', 'send', 'ok', 'continue'] else None,
    ]
    
    for pattern in fallback_patterns:
        if pattern:
            match = re.search(pattern, accessibility_tree)
            if match:
                return match.group(1)
    
    logger.warning(f"Could not find element ID for selector: {selector}")
    return None


# Function to convert agent actions to WebArena format
def convert_to_webarena_action(action: Dict[str, Any], 
                              create_id_based_action_fn, 
                              accessibility_tree: str):
    """Convert agent-format action to WebArena format."""
    action_type = action.get("type")
    selector = action.get("selector")
    
    # If the agent has already provided an element_id, use it directly
    if "element_id" in action:
        element_id = action["element_id"]
    else:
        # Otherwise, try to find the element ID based on the selector
        element_id = find_element_id(selector, accessibility_tree)
    
    # If we couldn't find an element ID, log warning and use a fallback
    if not element_id:
        logger.warning(f"Could not find element ID for selector: {selector}")
        # Fallback: Just use the selector as provided (this likely won't work but better than failing)
        element_id = selector
    
    if action_type == "click":
        return create_id_based_action_fn(f"click [{element_id}]")
    elif action_type == "input":
        value = action.get("value", "")
        return create_id_based_action_fn(f"type [{element_id}] {value}")
    elif action_type == "select":
        value = action.get("value", "")
        return create_id_based_action_fn(f"select [{element_id}] {value}")
    else:
        raise ValueError(f"Unsupported action type: {action_type}")


# Synchronous evaluation function that will run in a thread
def run_evaluation_sync(
    evaluation_id: str,
    agent_code: str,
    challenge_url: str,
    success_criteria: str
):
    """Run WebArena evaluation synchronously (to be called from a thread)."""
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
            
            # Display observation for debugging
            logger.info(f"Observation: {text_obs[:200]}...")
            
            # Get actions from agent
            try:
                actions = agent_function(text_obs)
                
                # Ensure actions is a list
                if not isinstance(actions, list):
                    logger.warning(f"Agent returned non-list: {actions}, converting to list")
                    actions = [actions]
                
                # Execute each action
                for action in actions:
                    logger.info(f"Agent action: {action}")
                    
                    # Convert to WebArena format using the accessibility tree
                    webarena_action = convert_to_webarena_action(
                        action, 
                        create_id_based_action_fn,
                        text_obs  # Pass the accessibility tree
                    )
                    
                    logger.info(f"WebArena action: {webarena_action}")
                    
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
                logger.error(traceback.format_exc())
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
        logger.error(traceback.format_exc())
        result["error"] = str(e)
        result["status"] = "failed"
    
    return result


# Async function to call the callback URL
async def send_callback(callback_url: str, result: dict):
    """Send the evaluation result to the callback URL."""
    try:
        response = requests.post(callback_url, json=result)
        logger.info(f"Callback response: {response.status_code}, {response.text}")
    except Exception as e:
        logger.error(f"Callback error: {e}")


# Async function that orchestrates the evaluation
async def run_evaluation(
    evaluation_id: str,
    agent_code: str,
    challenge_url: str,
    success_criteria: str,
    callback_url: str
):
    """Run evaluation in a thread and send results via callback."""
    loop = asyncio.get_running_loop()
    
    # Run the sync evaluation in a thread
    result = await loop.run_in_executor(
        thread_pool,
        run_evaluation_sync,
        evaluation_id,
        agent_code,
        challenge_url,
        success_criteria
    )
    
    # Send callback
    await send_callback(callback_url, result)
    
    return result


# Routes
@app.post("/api/evaluate", response_model=EvaluationResponse)
async def evaluate(request: EvaluationRequest, background_tasks: BackgroundTasks):
    logger.info("Received evaluation request: %s", request.json())
    logger.debug("Evaluation Data: %s", request.dict())
    logger.info("Successfully processed evaluation for ID: %s", request.evaluation_id)
    
    try:
        # Add evaluation to background tasks
        background_tasks.add_task(
            run_evaluation,
            evaluation_id=request.evaluation_id,
            agent_code=request.agent_code,
            challenge_url=request.challenge_url,
            success_criteria=request.success_criteria,
            callback_url=request.callback_url
        )
        
        logger.info("Evaluation request added to background tasks")
        logger.info("Sending response to client")
        
        return EvaluationResponse(
            evaluation_id=request.evaluation_id,
            status="running",
            message="Evaluation started successfully"
        )
    except Exception as e:
        logger.error("Error processing evaluation: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)