#!/usr/bin/env python3
"""
WebArena Tester that properly waits for the full application load
"""

import os
import sys
import re
import time
import tempfile
import importlib.util
import traceback
from typing import Any, Dict, List, Optional, Callable
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

# Add WebArena to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'webarena'))

# Terminal colors for better readability
RESET = "\033[0m"
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
MAGENTA = "\033[35m"
CYAN = "\033[36m"

def color_text(text, color):
    """Add color to terminal text."""
    return f"{color}{text}{RESET}"

def print_observation(obs, max_lines=1000):
    """Print formatted observation for debugging."""
    print(color_text("\n=== PAGE OBSERVATION ===", CYAN))
    if isinstance(obs, dict) and "text" in obs:
        text = obs["text"]
        lines = text.split('\n')
        total_lines = len(lines)
        
        # Print the first part
        for i, line in enumerate(lines[:max_lines]):
            # Highlight element IDs
            highlighted = re.sub(r'\[(\d+)\]', color_text(r'[\1]', GREEN), line)
            print(f"{i+1:3d}: {highlighted}")
        
        # If observation is longer, print a summary
        if total_lines > max_lines:
            print(color_text(f"... ({total_lines - max_lines} more lines) ...", YELLOW))
    else:
        print(obs)
    print(color_text("=======================\n", CYAN))

def wait_for_full_application_load(env, timeout=60):
    """
    Wait for the application to fully load by checking for the loading indicator
    and waiting for it to disappear.
    """
    from browser_env import create_id_based_action, create_playwright_action
    
    print(color_text(f"Waiting up to {timeout} seconds for full application load...", BLUE))
    start_time = time.time()
    check_interval = 1  # seconds between checks
    
    while time.time() - start_time < timeout:
        # Get current observation
        try:
            # Try using a "noop" action to refresh the observation
            try:
                action = create_playwright_action('page.evaluate("window.scrollBy(0, 0)")')
                obs, _, _, _, _ = env.step(action)
            except Exception:
                # If that fails, try a minimal click that shouldn't do anything
                try:
                    action = create_id_based_action("click [6]")  # Root WebArea
                    obs, _, _, _, _ = env.step(action)
                except:
                    # Last resort - wait and use whatever observation we have
                    pass
            
            text_obs = obs.get("text", "")
            
            # Check for loading indicators
            loading_indicators = [
                "Loading application",
                "progressbar",
                "loading",
                "please wait"
            ]
            
            if any(indicator.lower() in text_obs.lower() for indicator in loading_indicators):
                elapsed = time.time() - start_time
                print(color_text(f"Still loading ({elapsed:.1f}s elapsed)...", YELLOW))
                time.sleep(check_interval)
                continue
            
            # Check if we have substantial content (more than just loading elements)
            if len(text_obs.split('\n')) > 15:  # Arbitrary threshold for "substantial content"
                elapsed = time.time() - start_time
                print(color_text(f"Application appears fully loaded after {elapsed:.1f}s", GREEN))
                print_observation(obs)
                return obs
            
            print(color_text("Waiting for more content...", YELLOW))
            time.sleep(check_interval)
            
        except Exception as e:
            print(color_text(f"Error checking load status: {e}", RED))
            time.sleep(check_interval)
    
    print(color_text(f"Warning: Timeout after {timeout}s waiting for full load", RED))
    return obs

class EvaluationRequest(BaseModel):
    evaluation_id: str
    agent_code: str
    challenge_url: str
    success_criteria: str
    callback_url: str

class EvaluationResponse(BaseModel):
    evaluation_id: str
    status: str
    score: int
    result: dict | None

def init_webarena_env(headless=True):
    return ScriptBrowserEnv(
        headless=headless,
        observation_type="accessibility_tree",
        current_viewport_only=True,
        viewport_size={"width": 1280, "height": 720},
    )

def load_agent_function(agent_code: str):
    with tempfile.NamedTemporaryFile(suffix='.py', delete=False) as f:
        f.write(agent_code.encode('utf-8'))
        temp_module_path = f.name
    
    spec = importlib.util.spec_from_file_location("agent_module", temp_module_path)
    agent_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(agent_module)
    
    if not hasattr(agent_module, 'agent_logic'):
        raise ValueError("Agent code must contain an 'agent_logic' function")
    
    os.unlink(temp_module_path)
    return agent_module.agent_logic

def successful(obs, success_criteria):
    return success_criteria in obs.get('text', '')

def callback(callback_url: str, response: EvaluationResponse):
    print(color_text(f"Callback received: {response}", BLUE))
    try:
        response = requests.post(callback_url, json=response.model_dump())
    except Exception as e:
        print(color_text(f"Error parsing callback response: {e}", RED))
        return

def test_interactive_elements(request: EvaluationRequest):
    # Import WebArena components
    from browser_env import ScriptBrowserEnv, create_id_based_action, create_playwright_action
    print(color_text("Successfully imported WebArena components", GREEN))

    response = EvaluationResponse(
        evaluation_id=request.evaluation_id,
        status="failed",)
    
    # Initialize environment
    print(color_text("Initializing WebArena environment...", BLUE))
    env = ScriptBrowserEnv(
        headless=False,  # Make browser visible for debugging
        slow_mo=300,     # Slow down for visibility
        observation_type="accessibility_tree",
        current_viewport_only=True,
        viewport_size={"width": 1280, "height": 720},
    )
    print(color_text("Environment initialized", GREEN))
    
    # Navigate to the URL
    print(color_text(f"Navigating to {url} using id_based_action", BLUE))
    obs, info = env.reset()

    print(color_text(f"Navigating to {url} using id_based_action", BLUE))
    try:
        obs, reward, terminated, truncated, info = env.step(
            create_id_based_action(f"goto [{url}]")
        )
        print(color_text("Navigation initiated successfully", GREEN))
    except Exception as e:
        print(color_text(f"Error during navigation: {e}", RED))
        print(traceback.format_exc())
        env.close()
        return
    
    # Wait for full application load
    obs = wait_for_full_application_load(env, timeout=60)
    
    # Try interacting with the page after it's loaded
    print(color_text("\nTrying to identify interactable elements...", BLUE))

    agent_logic = load_agent_function(agent_code)

    max_steps = 25
    for step in range(max_steps):
        print(color_text(f"\n--- Step {step+1}/{max_steps} ---", MAGENTA))

        print(color_text("Getting actions from agent...", BLUE))
        try:
            actions = agent_logic(obs['text'])
            if not isinstance(actions, list):
                print(color_text("Actions from agent are not a list", YELLOW))
                actions = [actions]
            else:
                print(color_text(f"Actions from agent are a list of {len(actions)} actions", GREEN))
                for i, action in enumerate(actions):
                    print(color_text(f"Action {i+1}/{len(actions)}: {action}", BLUE))
            
            if actions and len(actions) > 0:
                for action in actions:
                    action_command = create_id_based_action(action)
                    print(color_text(f"Processing action: {action}", BLUE))
                    obs, reward, terminated, truncated, info = env.step(action_command)
                    print(color_text(f"✓ Action succeeded: {action}", GREEN))
            else:
                print(color_text("No actions from agent", YELLOW))
            
            print_observation(obs)

            if successful(obs, 'No messages matched'):
                print(color_text("Success criteria met!", GREEN))
                break
            else:
                print(color_text("Success criteria not met :(", RED))

            time.sleep(1)

        except Exception as e:
            print(color_text(f"Error executing agent: {str(e)}", RED))
            print(color_text(traceback.format_exc(), RED))
            break
        
    env.close()
    print(color_text("Test complete", GREEN))
    return None

# FastAPI setup
app = FastAPI(title="WebArena Evaluation Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/evaluate", response_model=EvaluationResponse)
async def evaluate(request: EvaluationRequest, background_tasks: BackgroundTasks):
    logger.info(f"Received evaluation request: {request.json()}")
    
    try:
        background_tasks.add_task(
            lambda: test_interactive_elements(request)
        )
        return EvaluationResponse(
            evaluation_id=request.evaluation_id,
            status="running",
            message="Evaluation started successfully"
        )
    except Exception as e:
        logger.error(f"Evaluation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
