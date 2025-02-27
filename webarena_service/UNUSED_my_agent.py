#!/usr/bin/env python3
"""
Adaptive WebArena agent that analyzes the accessibility tree.
"""
import re

def agent_logic(env):
    """
    Analyzes the accessibility tree and decides on the next action.
    
    Args:
        env: The WebArena observation (accessibility tree text)
        
    Returns:
        A single action to perform
    """
    # Get the text observation from the environment
    if isinstance(env, dict):
        obs = env.get("text", "")
    else:
        # If env is already the text observation
        obs = env
    
    print(f"Processing observation with length: {len(obs)}")
    
    # Look for login form elements
    username_match = re.search(r'\[(\d+)\].*?(?:textbox|input).*?(?:email|username|login)', obs, re.IGNORECASE)
    password_match = re.search(r'\[(\d+)\].*?(?:textbox|input).*?(?:password)', obs, re.IGNORECASE)
    submit_match = re.search(r'\[(\d+)\].*?(?:button|link).*?(?:submit|login|sign in|send)', obs, re.IGNORECASE)
    
    # Look for email compose elements
    compose_match = re.search(r'\[(\d+)\].*?(?:button|link).*?(?:compose|new|create)', obs, re.IGNORECASE)
    recipient_match = re.search(r'\[(\d+)\].*?(?:textbox|input).*?(?:to|recipient)', obs, re.IGNORECASE)
    subject_match = re.search(r'\[(\d+)\].*?(?:textbox|input).*?(?:subject)', obs, re.IGNORECASE)
    body_match = re.search(r'\[(\d+)\].*?(?:textbox|contenteditable).*?(?:body|message|content)', obs, re.IGNORECASE)
    send_match = re.search(r'\[(\d+)\].*?(?:button).*?(?:send)', obs, re.IGNORECASE)
    
    # Look for general input fields if specific ones aren't found
    if not (username_match or recipient_match):
        # Find any input field
        input_match = re.search(r'\[(\d+)\].*?(?:textbox|input)', obs, re.IGNORECASE)
    else:
        input_match = None
        
    # Look for any button if specific ones aren't found
    if not (submit_match or send_match):
        button_match = re.search(r'\[(\d+)\].*?(?:button|link)', obs, re.IGNORECASE)
    else:
        button_match = None
    
    # Decision logic - prioritize actions based on what's found
    
    # If we found a compose button and haven't started composing yet
    if compose_match and not recipient_match:
        button_id = compose_match.group(1)
        print(f"Found compose button with ID: {button_id}")
        return {"type": "click", "element_id": button_id}
    
    # If we found a recipient field, fill it
    elif recipient_match:
        recipient_id = recipient_match.group(1)
        print(f"Found recipient field with ID: {recipient_id}")
        return {"type": "input", "element_id": recipient_id, "value": "john@example.com"}
    
    # If we found a subject field, fill it
    elif subject_match:
        subject_id = subject_match.group(1)
        print(f"Found subject field with ID: {subject_id}")
        return {"type": "input", "element_id": subject_id, "value": "Hello from WebArena"}
    
    # If we found a body field, fill it
    elif body_match:
        body_id = body_match.group(1)
        print(f"Found message body field with ID: {body_id}")
        return {"type": "input", "element_id": body_id, "value": "This is a test message sent from WebArena."}
    
    # If we found a send button, click it
    elif send_match:
        send_id = send_match.group(1)
        print(f"Found send button with ID: {send_id}")
        return {"type": "click", "element_id": send_id}
    
    # If we found a username field, fill it
    elif username_match:
        username_id = username_match.group(1)
        print(f"Found username field with ID: {username_id}")
        return {"type": "input", "element_id": username_id, "value": "testuser@example.com"}
    
    # If we found a password field, fill it
    elif password_match:
        password_id = password_match.group(1)
        print(f"Found password field with ID: {password_id}")
        return {"type": "input", "element_id": password_id, "value": "password123"}
    
    # If we found a login button, click it
    elif submit_match:
        submit_id = submit_match.group(1)
        print(f"Found submit button with ID: {submit_id}")
        return {"type": "click", "element_id": submit_id}
    
    # Fallback to general input field
    elif input_match:
        input_id = input_match.group(1)
        print(f"Found general input field with ID: {input_id}")
        return {"type": "input", "element_id": input_id, "value": "Hello World"}
    
    # Fallback to general button
    elif button_match:
        button_id = button_match.group(1)
        print(f"Found general button with ID: {button_id}")
        return {"type": "click", "element_id": button_id}
    
    # If nothing was found, return a stop action
    else:
        print("No actionable elements found")
        return {"type": "stop"}