#!/usr/bin/env python3
"""
Debug script to test different WebArena navigation methods.
This script tests multiple ways to navigate in WebArena and prints detailed debug info.
"""

import os
import sys
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

def print_observation(obs, title="Observation"):
    """Print formatted observation for debugging."""
    print(color_text(f"\n=== {title} ===", CYAN))
    if isinstance(obs, dict):
        for key, value in obs.items():
            if key == "text" and value:
                print(color_text(f"text: First 200 chars:", BLUE))
                print(value[:200] + "..." if len(value) > 200 else value)
            elif key == "url":
                print(color_text(f"url: {value}", GREEN))
            else:
                print(color_text(f"{key}: {type(value)}", YELLOW))
    else:
        print(obs)
    print(color_text("=" * (len(title) + 8), CYAN))

def debug_webarena_navigation(url):
    """Debug WebArena navigation using different methods."""
    try:
        # Import all possible action creators from WebArena
        from browser_env import (
            ScriptBrowserEnv,
            create_id_based_action,
            create_goto_url_action,
            create_playwright_action,
        )
        
        print(color_text("Successfully imported WebArena components", GREEN))
        
        # Initialize environment with verbose output
        print(color_text("\n[1] Initializing WebArena environment...", MAGENTA))
        env = ScriptBrowserEnv(
            headless=False,  # Make browser visible
            slow_mo=500,     # Slow down for visibility
            observation_type="accessibility_tree",
            current_viewport_only=True,
            viewport_size={"width": 1280, "height": 720},
        )
        print(color_text("Environment initialized", GREEN))
        
        # First test: Using env.reset() with options directly
        print(color_text("\n[2] Testing navigation via env.reset() with url option", MAGENTA))
        print(color_text(f"Navigating to {url}", BLUE))
        obs, info = env.reset(options={"url": url})
        print(color_text("env.reset() completed", GREEN))
        print_observation(obs, "After env.reset() with url option")
        
        # Check if navigation was successful
        if obs and isinstance(obs, dict) and "text" in obs:
            text_obs = obs.get("text", "")
            if "url: about:blank" in text_obs:
                print(color_text("Navigation failed - still on about:blank", RED))
            else:
                print(color_text("Navigation appears successful", GREEN))
        
        # Wait to see if page loads after some time
        print(color_text("\nWaiting 5 seconds to see if page loads...", BLUE))
        time.sleep(5)
        
        # Try a different method: create_goto_url_action
        print(color_text("\n[3] Testing navigation via create_goto_url_action", MAGENTA))
        print(color_text(f"Navigating to {url}", BLUE))
        try:
            obs, reward, terminated, truncated, info = env.step(
                create_goto_url_action(url)
            )
            print(color_text("create_goto_url_action succeeded", GREEN))
            print_observation(obs, "After create_goto_url_action")
        except Exception as e:
            print(color_text(f"create_goto_url_action failed: {e}", RED))
            print(traceback.format_exc())
        
        # Wait to see if page loads after some time
        print(color_text("\nWaiting 5 seconds to see if page loads...", BLUE))
        time.sleep(5)
        
        # Try a third method: create_playwright_action
        print(color_text("\n[4] Testing navigation via create_playwright_action", MAGENTA))
        print(color_text(f"Navigating to {url}", BLUE))
        try:
            obs, reward, terminated, truncated, info = env.step(
                create_playwright_action(f'page.goto("{url}")')
            )
            print(color_text("create_playwright_action succeeded", GREEN))
            print_observation(obs, "After create_playwright_action")
        except Exception as e:
            print(color_text(f"create_playwright_action failed: {e}", RED))
            print(traceback.format_exc())
        
        # Wait to see if page loads after some time
        print(color_text("\nWaiting 5 seconds to see if page loads...", BLUE))
        time.sleep(5)
        
        # Try a fourth method: create_id_based_action with goto
        print(color_text("\n[5] Testing navigation via create_id_based_action with goto", MAGENTA))
        print(color_text(f"Navigating to {url}", BLUE))
        try:
            obs, reward, terminated, truncated, info = env.step(
                create_id_based_action(f"goto [{url}]")
            )
            print(color_text("create_id_based_action with goto succeeded", GREEN))
            print_observation(obs, "After create_id_based_action with goto")
        except Exception as e:
            print(color_text(f"create_id_based_action with goto failed: {e}", RED))
            print(traceback.format_exc())
        
        # Wait to see if page loads after some time
        print(color_text("\nWaiting 5 seconds to see if page loads...", BLUE))
        time.sleep(5)
        
        # Close environment
        print(color_text("\nClosing environment", BLUE))
        env.close()
        print(color_text("Environment closed successfully", GREEN))
        
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
    
    debug_webarena_navigation(url)