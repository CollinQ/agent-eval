#!/usr/bin/env python3
"""
Improved WebArena Tester - Uses the correct navigation methods confirmed to work
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
    print(color_text(f"Searching for elements matching '{keyword}'...", BLUE))
    
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
            element_id = match.group(1)
            element_text = match.group(0)
            results.append(element_id)
            print(color_text(f"  Found element [{element_id}]: {element_text}", GREEN))
    
    if not results:
        print(color_text(f"  No elements found matching '{keyword}'", YELLOW))
    
    return results

def test_webarena(challenge_url: str, agent_file_path: str):
    """Test WebArena with a challenge URL and agent file."""
    try:
        # Import WebArena components - using the two confirmed working methods
        from browser_env import ScriptBrowserEnv, create_id_based_action, create_playwright_action
        print(color_text("Successfully imported WebArena components", GREEN))
        
        # Load the agent
        agent_function = load_agent_from_file(agent_file_path)
        
        # Initialize WebArena environment
        print(color_text("Initializing WebArena environment...", BLUE))
        env = ScriptBrowserEnv(
            headless=False,  # Set to True in production
            slow_mo=300,     # Slow down for visibility
            observation_type="accessibility_tree",
            current_viewport_only=True,
            viewport_size={"width": 1280, "height": 720},
        )
        print(color_text("WebArena environment initialized", GREEN))
        
        # NAVIGATION METHOD 1: Using create_playwright_action (confirmed working)
        print(color_text(f"Navigating to {challenge_url} using Playwright action", BLUE))
        try:
            # First reset without URL - we'll navigate directly
            obs, info = env.reset()
            
            # Now use Playwright action for navigation
            obs, reward, terminated, truncated, info = env.step(
                create_playwright_action(f'page.goto("{challenge_url}", {{waitUntil: "networkidle"}})')
            )
            print(color_text("Navigation successful via playwright action", GREEN))
        except Exception as e:
            print(color_text(f"Error using playwright navigation: {e}", RED))
            print(color_text("Trying alternative navigation method...", YELLOW))
            
            # NAVIGATION METHOD 2: Using create_id_based_action with goto (confirmed working)
            try:
                obs, info = env.reset()
                obs, reward, terminated, truncated, info = env.step(
                    create_id_based_action(f"goto [{challenge_url}]")
                )
                print(color_text("Navigation successful via id_based goto action", GREEN))
            except Exception as e:
                print(color_text(f"All navigation methods failed: {e}", RED))
                print(traceback.format_exc())
                return
        
        # Wait a moment for page to fully load
        print(color_text("Waiting for page to fully load (5 seconds)...", BLUE))
        time.sleep(5)
        
        # Check if we're on about:blank (common issue)
        text_obs = obs.get("text", "")
        if "url: about:blank" in text_obs:
            print(color_text("WARNING: Still on about:blank after navigation", RED))
            print(color_text("Trying one more navigation attempt...", YELLOW))
            try:
                obs, reward, terminated, truncated, info = env.step(
                    create_playwright_action(f'page.goto("{challenge_url}", {{timeout: 60000}})')
                )
                text_obs = obs.get("text", "")
            except Exception as e:
                print(color_text(f"Final navigation attempt failed: {e}", RED))
        
        # Print the accessibility tree
        print_accessibility_tree(text_obs)
        
        # Test valid action formats
        print(color_text("Testing valid WebArena action formats:", BLUE))
        action_formats = [
            "click [1]",
            "type [1] Test text",
            "fill [1] Test text", 
            "input [1] Test text",
            "noop"
        ]
        
        for action_format in action_formats:
            try:
                action = create_id_based_action(action_format)
                print(color_text(f"✓ Valid format: {action_format}", GREEN))
            except Exception as e:
                print(color_text(f"✗ Invalid format: {action_format}", RED))
                print(color_text(f"  Error: {str(e)}", RED))
        
        # Loop for interactive testing - repeat agent action cycle multiple times
        max_steps = 5
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
                
                # Display all returned actions
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
                            try:
                                webarena_action = create_id_based_action(f"click [{element_id}]")
                                obs, reward, terminated, truncated, info = env.step(webarena_action)
                                print(color_text(f"✓ Click action succeeded on element [{element_id}]", GREEN))
                            except Exception as e:
                                print(color_text(f"✗ Click action failed: {str(e)}", RED))
                        
                        elif action_type == "input":
                            value = action.get("value", "")
                            success = False
                            
                            # Try all three input commands since different ones might work
                            for cmd in ["fill", "type", "input"]:
                                try:
                                    print(color_text(f"Trying {cmd} command...", BLUE))
                                    webarena_action = create_id_based_action(f"{cmd} [{element_id}] {value}")
                                    obs, reward, terminated, truncated, info = env.step(webarena_action)
                                    print(color_text(f"✓ {cmd} action succeeded on element [{element_id}]", GREEN))
                                    success = True
                                    break
                                except Exception as e:
                                    print(color_text(f"✗ {cmd} action failed: {str(e)}", RED))
                            
                            if not success:
                                print(color_text("All input methods failed", RED))
                        
                        else:
                            print(color_text(f"Unsupported action type: {action_type}", RED))
                    
                    # Handle actions with selector
                    elif "selector" in action:
                        selector = action.get("selector", "")
                        # Extract the key part of the selector (remove # or . prefix)
                        key = selector.replace('#', '').replace('.', '')
                        
                        # Find matching elements
                        element_ids = find_element_ids(text_obs, key)
                        
                        if action_type == "click":
                            if element_ids:
                                # Try clicking each potential element
                                success = False
                                for element_id in element_ids:
                                    try:
                                        webarena_action = create_id_based_action(f"click [{element_id}]")
                                        obs, reward, terminated, truncated, info = env.step(webarena_action)
                                        print(color_text(f"✓ Click succeeded on element [{element_id}]", GREEN))
                                        success = True
                                        break
                                    except Exception as e:
                                        print(color_text(f"✗ Click failed on element [{element_id}]: {str(e)}", RED))
                                
                                if not success:
                                    print(color_text("All click attempts failed", RED))
                            
                            # If no elements found by keyword, try looking for generic buttons/links
                            elif not element_ids:
                                print(color_text("Looking for generic clickable elements...", YELLOW))
                                generic_elements = []
                                for keyword in ["button", "link", "submit"]:
                                    generic_elements.extend(find_element_ids(text_obs, keyword))
                                
                                if generic_elements:
                                    success = False
                                    for element_id in generic_elements[:3]:  # Try first 3 only
                                        try:
                                            webarena_action = create_id_based_action(f"click [{element_id}]")
                                            obs, reward, terminated, truncated, info = env.step(webarena_action)
                                            print(color_text(f"✓ Click succeeded on generic element [{element_id}]", GREEN))
                                            success = True
                                            break
                                        except Exception as e:
                                            print(color_text(f"✗ Click failed on generic element [{element_id}]: {str(e)}", RED))
                                    
                                    if not success:
                                        print(color_text("All generic click attempts failed", RED))
                                else:
                                    print(color_text("No clickable elements found", RED))
                        
                        elif action_type == "input":
                            value = action.get("value", "")
                            
                            if element_ids:
                                # Try input with each potential element
                                success = False
                                for element_id in element_ids:
                                    # Try different input commands
                                    for cmd in ["fill", "type", "input"]:
                                        try:
                                            webarena_action = create_id_based_action(f"{cmd} [{element_id}] {value}")
                                            obs, reward, terminated, truncated, info = env.step(webarena_action)
                                            print(color_text(f"✓ {cmd} succeeded on element [{element_id}]", GREEN))
                                            success = True
                                            break
                                        except Exception as e:
                                            print(color_text(f"✗ {cmd} failed on element [{element_id}]: {str(e)}", RED))
                                    
                                    if success:
                                        break
                                
                                if not success:
                                    print(color_text("All input attempts failed", RED))
                            
                            # If no elements found by keyword, try looking for generic inputs
                            elif not element_ids:
                                print(color_text("Looking for generic input elements...", YELLOW))
                                generic_elements = []
                                for keyword in ["textbox", "input", "field"]:
                                    generic_elements.extend(find_element_ids(text_obs, keyword))
                                
                                if generic_elements:
                                    success = False
                                    for element_id in generic_elements[:3]:  # Try first 3 only
                                        # Try different input commands
                                        for cmd in ["fill", "type", "input"]:
                                            try:
                                                webarena_action = create_id_based_action(f"{cmd} [{element_id}] {value}")
                                                obs, reward, terminated, truncated, info = env.step(webarena_action)
                                                print(color_text(f"✓ {cmd} succeeded on generic element [{element_id}]", GREEN))
                                                success = True
                                                break
                                            except Exception as e:
                                                print(color_text(f"✗ {cmd} failed on generic element [{element_id}]: {str(e)}", RED))
                                        
                                        if success:
                                            break
                                    
                                    if not success:
                                        print(color_text("All generic input attempts failed", RED))
                                else:
                                    print(color_text("No input elements found", RED))
                        
                        else:
                            print(color_text(f"Unsupported action type: {action_type}", RED))
                    
                    else:
                        print(color_text("Action missing both element_id and selector", RED))
                
                # Get updated observation and print tree
                text_obs = obs.get("text", "")
                print_accessibility_tree(text_obs)
                
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