#!/usr/bin/env python3
"""
WebArena Tester that properly waits for the full application load
"""

import os
import sys
import re
import time
import traceback

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

def print_observation(obs, max_lines=30):
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

def test_page_load(url):
    """Test navigating to a page and waiting for it to fully load."""
    try:
        # Import WebArena components
        from browser_env import ScriptBrowserEnv, create_id_based_action, create_playwright_action
        print(color_text("Successfully imported WebArena components", GREEN))
        
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
        
        # First reset without URL
        obs, info = env.reset()
        
        # Navigate to the URL
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
        
        # Look for various common elements
        for element_type in ["button", "link", "textbox", "input"]:
            pattern = rf'\[(\d+)\].*?{element_type}'
            matches = re.finditer(pattern, obs.get("text", ""), re.IGNORECASE)
            
            found = False
            for match in matches:
                element_id = match.group(1)
                element_text = match.group(0)
                found = True
                print(color_text(f"Found {element_type}: [{element_id}] {element_text}", GREEN))
            
            if not found:
                print(color_text(f"No {element_type}s found", YELLOW))
        
        # Close the environment
        env.close()
        print(color_text("Test complete", GREEN))
        
    except Exception as e:
        print(color_text(f"Error: {e}", RED))
        print(traceback.format_exc())

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: python {sys.argv[0]} <url>")
        url = "https://evals-gomail.vercel.app/"
        print(color_text(f"Using default URL: {url}", YELLOW))
    else:
        url = sys.argv[1]
    
    test_page_load(url)