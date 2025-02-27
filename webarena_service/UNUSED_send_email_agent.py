# example_agent.py
import re

def agent_logic(observation: str):
    """Adaptive agent for WebArena email challenge"""
    actions = []
    
    # Look for compose button
    compose_match = re.search(r'\[(\d+)\].*button.*compose', observation)
    if compose_match:
        return [{"type": "click", "element_id": compose_match.group(1)}]
    
    # Look for recipient field
    recipient_match = re.search(r'\[(\d+)\].*textbox.*recipient', observation)
    if recipient_match:
        return [{
            "type": "input",
            "element_id": recipient_match.group(1),
            "value": "user@example.com"
        }]
    
    # Look for send button
    send_match = re.search(r'\[(\d+)\].*button.*send', observation)
    if send_match:
        return [{"type": "click", "element_id": send_match.group(1)}]
    
    # Default to stop if nothing found
    return {"type": "stop"}