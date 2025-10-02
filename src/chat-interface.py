import requests
import sys
import json
from datetime import datetime

def main():
    """
    Runs a command-line interface to chat with the deployed LLM API.
    """
    # 1. Get and Validate the Server URL
    ngrok_url = input("Please enter your public ngrok URL: ").strip()
    if not ngrok_url:
        print("\n❌ Error: No URL provided. Terminating.")
        sys.exit(1)

    try:
        print(f"\n[Connecting to {ngrok_url} and checking server health...]")
        health_response = requests.get(f"{ngrok_url}/health", timeout=10)
        
        if health_response.status_code == 200:
            print("✅ Connection successful. Server is healthy.")
            print("Type 'exit' or 'quit' to end the session.\n")
        else:
            print(f"\n❌ Error: Server responded with status {health_response.status_code}. Terminating.")
            sys.exit(1)

    except requests.exceptions.RequestException as e:
        print(f"\n❌ Error: Could not connect to the server at {ngrok_url}.")
        print("   Please check that the URL is correct and the server is running.")
        sys.exit(1)

    # --- 2. Main Chat Loop ---
    conversation_log = []
    while True:
        try:
            query = input("> ")
            if query.lower() in ['exit', 'quit']:
                print("\nEnding session...")
                break

            # Display status messages as in the example
            print("[Retrieving context...]")
            print("[Calling LLM...]")

            # Send a stateless request to the /chat endpoint
            response = requests.post(
                f"{ngrok_url}/chat",
                json={"query": query},
                timeout=120  # Long timeout for model inference
            )

            if response.status_code == 200:
                data = response.json()
                answer = data.get('response', 'No answer received.')
                sources = data.get('sources', 'No sources provided.')
                confidence = data.get('confidence', 'N/A')

                # Display the response in the required format
                print(f"\nAnswer: {answer}")
                print(f"Sources: {sources}")
                print(f"Confidence: {confidence}\n")
                
                # Add the interaction to our log list
                conversation_log.append({
                    "query": query,
                    "response": data
                })

            else:
                print(f"\n❌ Error: Server returned status code {response.status_code}")
                print(f"   Details: {response.text}\n")

        except requests.exceptions.RequestException as e:
            print(f"\n❌ Error: A connection error occurred: {e}\n")
        except KeyboardInterrupt:
            print("\n\nEnding session...")
            break
            
    # --- 3. Save Conversation Log on Exit ---
    if conversation_log:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_filename = f"chat_log_{timestamp}.json"
        try:
            with open(log_filename, 'w', encoding='utf-8') as f:
                json.dump(conversation_log, f, indent=2, ensure_ascii=False)
            print(f"✅ Conversation log saved to: {log_filename}")
        except IOError as e:
            print(f"❌ Error: Could not save log file: {e}")

if __name__ == "__main__":
    main()