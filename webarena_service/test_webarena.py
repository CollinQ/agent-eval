#!/usr/bin/env python3
"""
Improved WebArena Tester - Tool to investigate how WebArena processes actions and observations.

Usage:
    python improved_test_webarena.py <challenge_url> <agent_file_path>

Example:
    python improved_test_webarena.py https://evals-gomail.vercel.app/ ./my_agent.py
"""

import os
import sys
import re
import time
import json
import importlib.util
import traceback
from typing import Any, Dict, List, Optional, Callable

# Add WebArena to path - adjust if needed
sys.path.append(os.path.join(os.path.dirname(__file__), 'webarena'))

# Initialize colored output
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

def load_agent_from_file(file_path: str) -> Callable:
    """Load agent_logic function from a Python file."""
    print(color_text(f"Loading agent from {file_path}", BLUE))
    
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Agent file not found: {file_path}")
    
    module_name = os.path.basename(file_path).replace('.py', '')
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    
    if spec is None or spec.loader is None:
        raise ImportError(f"Could not load module spec from {file_path}")
    
    agent_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(agent_module)
    
    if not hasattr(agent_module, 'agent_logic'):
        raise AttributeError(f"No agent_logic function found in {file_path}")
    
    print(color_text("Agent loaded successfully!", GREEN))
    return agent_module.agent_logic

def print_accessibility_tree(text: str, max_lines: int = 30):
    """Print the accessibility tree with line numbers and highlights."""
    lines = text.split('\n')
    total_lines = len(lines)
    
    print(color_text("\n=== ACCESSIBILITY TREE ===", CYAN))
    
    # Print the first part of the tree
    for i, line in enumerate(lines[:max_lines]):
        # Highlight element IDs
        highlighted = re.sub(r'\[(\d+)\]', color_text(r'[\1]', GREEN), line)
        print(f"{i+1:3d}: {highlighted}")
    
    # If tree is longer, print a summary
    if total_lines > max_lines:
        print(color_text(f"... ({total_lines - max_lines} more lines) ...", YELLOW))
    
    print(color_text("===========================\n", CYAN))

def format_action_for_display(action: Dict[str, Any]) -> str:
    """Format an action dictionary for readable display."""
    if not isinstance(action, dict):
        return str(action)
    
    action_type = action.get('type', 'unknown')
    
    if action_type == 'click':
        if 'element_id' in action:
            return f"CLICK element_id=[{action.get('element_id')}]"
        else:
            return f"CLICK selector={action.get('selector', 'unknown')}"
    elif action_type == 'input':
        if 'element_id' in action:
            return f"INPUT element_id=[{action.get('element_id')}] → '{action.get('value', '')}'"
        else:
            return f"INPUT selector={action.get('selector', 'unknown')} → '{action.get('value', '')}'"
    elif action_type == 'select':
        if 'element_id' in action:
            return f"SELECT element_id=[{action.get('element_id')}] → '{action.get('value', '')}'"
        else:
            return f"SELECT selector={action.get('selector', 'unknown')} → '{action.get('value', '')}'"
    elif action_type == 'stop':
        return "STOP"
    else:
        return str(action)

def find_element_ids(text: str, keyword: str) -> List[str]:
    """Find potential element IDs in the accessibility tree based on a keyword."""
    results = []
    
    # Look for IDs of elements containing the keyword
    patterns = [
        # Match element ID with quoted text containing keyword 
        r'\[(\d+)\].*?[\'"].*?' + re.escape(keyword) + r'.*?[\'"]',
        # Match element ID with role+type containing keyword
        r'\[(\d+)\].*?' + re.escape(keyword),
        # Match element ID with attributes containing keyword
        r'\[(\d+)\].*?(?:id|name|title|aria-label).*?' + re.escape(keyword)
    ]
    
    for pattern in patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            results.append(match.group(1))
    
    return results

def attempt_actions_with_element_ids(env, action_type: str, element_ids: List[str], extra_args: str = "") -> Optional[Dict]:
    """Try different element IDs with different action commands until one works."""
    from browser_env import create_id_based_action

    # Define variations of commands to try
    if action_type == "click":
        commands = ["click"]
    elif action_type == "input":
        commands = ["fill", "type", "input"]
    elif action_type == "select":
        commands = ["select"]
    else:
        commands = [action_type]
    
    # Try each command with each element ID
    for command in commands:
        for element_id in element_ids:
            action_str = f"{command} [{element_id}]{' ' + extra_args if extra_args else ''}"
            try:
                print(color_text(f"Trying action: {action_str}", BLUE))
                action = create_id_based_action(action_str)
                
                # Try to execute the action
                obs, reward, terminated, truncated, info = env.step(action)
                print(color_text(f"✓ Action succeeded: {action_str}", GREEN))
                return obs, reward, terminated, truncated, info
            except Exception as e:
                print(color_text(f"✗ Action failed: {action_str}", RED))
                print(color_text(f"  Error: {str(e)}", RED))
    
    print(color_text(f"All action attempts failed", RED))
    return None

def wait_for_page_load(env, timeout=60):
    """Wait for the page to fully load and return observation."""
    print(color_text(f"Waiting for page to load (up to {timeout}s)...", BLUE))
    
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        # Get current observation
        obs = env.observation()
        text_obs = obs.get("text", "")
        
        # Check if we're still on about:blank
        if "url: about:blank" in text_obs:
            print(color_text("Still on about:blank, waiting...", YELLOW))
            time.sleep(1)
            continue
        
        # Check if the page has actual content
        if len(text_obs.split('\n')) > 5:  # If we have more than 5 lines, it probably loaded
            print(color_text(f"Page appears to be loaded after {time.time() - start_time:.1f}s", GREEN))
            return obs
        
        # Wait a bit and try again
        time.sleep(1)
    
    print(color_text(f"Warning: Timeout after {timeout}s waiting for page load", RED))
    return env.observation()

def test_webarena(challenge_url: str, agent_file_path: str):
    """Test WebArena with a challenge URL and agent file."""
    try:
        # Import WebArena components
        from browser_env import ScriptBrowserEnv, create_id_based_action
        print(color_text("Successfully imported WebArena components", GREEN))
        
        # Load the agent
        agent_function = load_agent_from_file(agent_file_path)
        
        # Initialize WebArena environment
        print(color_text("Initializing WebArena environment...", BLUE))
        env = ScriptBrowserEnv(
            headless=False,
            slow_mo=100,  # Slow down for visibility
            observation_type="accessibility_tree",
            current_viewport_only=True,
            viewport_size={"width": 1280, "height": 720},
        )
        print(color_text("WebArena environment initialized", GREEN))
        
        # Navigate to the challenge URL
        print(color_text(f"Navigating to {challenge_url}", BLUE))
        obs, info = env.reset(options={"url": challenge_url})
        
        # Wait for the page to fully load
        obs = wait_for_page_load(env)
        
        # Print the initial accessibility tree
        text_obs = obs.get("text", "")
        print_accessibility_tree(text_obs)
        
        # Loop for interactive testing - repeat agent action cycle multiple times
        max_steps = 10
        for step in range(max_steps):
            print(color_text(f"\n--- Step {step+1}/{max_steps} ---", MAGENTA))
            
            # Get actions from agent
            print(color_text("Getting actions from agent...", BLUE))
            try:
                actions = agent_function(obs)
                
                # Ensure actions is a list
                if not isinstance(actions, list):
                    print(color_text(f"Agent returned single action: {format_action_for_display(actions)}", YELLOW))
                    actions = [actions]
                else:
                    print(color_text(f"Agent returned {len(actions)} actions:", GREEN))
                    for i, action in enumerate(actions):
                        print(color_text(f"Action {i+1}: {format_action_for_display(action)}", BLUE))
                
                # Process just the first action
                if actions and len(actions) > 0:
                    action = actions[0]
                    print(color_text(f"\nProcessing action: {format_action_for_display(action)}", MAGENTA))
                    
                    # Check if this is a stop action
                    if action.get("type") == "stop":
                        print(color_text("Agent requested to stop", YELLOW))
                        break
                    
                    action_type = action.get("type")
                    
                    # Handle actions with element_id
                    if "element_id" in action:
                        element_id = action.get("element_id")
                        
                        if action_type == "click":
                            action_str = f"click [{element_id}]"
                        elif action_type == "input":
                            value = action.get("value", "")
                            # Try all possible input commands
                            for cmd in ["fill", "type", "input", "text"]:
                                try:
                                    action_str = f"{cmd} [{element_id}] {value}"
                                    print(color_text(f"Trying: {action_str}", BLUE))
                                    webarena_action = create_id_based_action(action_str)
                                    obs, reward, terminated, truncated, info = env.step(webarena_action)
                                    print(color_text(f"✓ Action succeeded: {action_str}", GREEN))
                                    # If we got here, we found a working command
                                    break
                                except Exception as e:
                                    print(color_text(f"✗ Failed with {cmd}: {str(e)}", RED))
                            else:
                                # If we get here, none of the commands worked
                                print(color_text("All input commands failed", RED))
                                break
                        else:
                            print(color_text(f"Unsupported action type: {action_type}", RED))
                            break
                    
                    # Handle actions with selector
                    elif "selector" in action:
                        selector = action.get("selector", "")
                        print(color_text(f"Finding elements matching '{selector}'...", BLUE))
                        
                        # Extract the key part of the selector (remove # or . prefix)
                        key = selector.replace('#', '').replace('.', '')
                        element_ids = find_element_ids(text_obs, key)
                        
                        if action_type == "click":
                            if not element_ids:
                                # Try looking for buttons or links
                                print(color_text(f"No elements found matching '{key}', trying general button/link search", YELLOW))
                                element_ids = find_element_ids(text_obs, "button") + find_element_ids(text_obs, "link")
                            
                            if element_ids:
                                print(color_text(f"Found {len(element_ids)} potential elements: {', '.join(element_ids)}", GREEN))
                                result = attempt_actions_with_element_ids(env, "click", element_ids)
                                if result:
                                    obs, reward, terminated, truncated, info = result
                            else:
                                print(color_text("No suitable elements found for clicking", RED))
                                break
                                
                        elif action_type == "input":
                            value = action.get("value", "")
                            
                            if not element_ids:
                                # Try looking for input fields
                                print(color_text(f"No elements found matching '{key}', trying general input search", YELLOW))
                                element_ids = find_element_ids(text_obs, "textbox") + find_element_ids(text_obs, "input")
                            
                            if element_ids:
                                print(color_text(f"Found {len(element_ids)} potential elements: {', '.join(element_ids)}", GREEN))
                                result = attempt_actions_with_element_ids(env, "input", element_ids, value)
                                if result:
                                    obs, reward, terminated, truncated, info = result
                            else:
                                print(color_text("No suitable elements found for input", RED))
                                break
                    else:
                        print(color_text("Action missing both element_id and selector", RED))
                        break
                else:
                    print(color_text("Agent returned no actions", YELLOW))
                    break
                
                # Get updated observation
                text_obs = obs.get("text", "")
                print_accessibility_tree(text_obs)
                
                # Pause to let user see what happened
                time.sleep(1)
                
            except Exception as e:
                print(color_text(f"Error executing agent: {str(e)}", RED))
                print(color_text(traceback.format_exc(), RED))
                break
        
        # Close the environment
        env.close()
        print(color_text("Test complete", GREEN))
        
    except Exception as e:
        print(color_text(f"Error: {str(e)}", RED))
        print(color_text(traceback.format_exc(), RED))

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(f"Usage: python {sys.argv[0]} <challenge_url> <agent_file_path>")
        sys.exit(1)
    
    challenge_url = sys.argv[1]
    agent_file_path = sys.argv[2]
    test_webarena(challenge_url, agent_file_path)