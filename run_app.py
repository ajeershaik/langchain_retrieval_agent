"""
Convenience launcher for Campus Retrieval Agent
Starts the server and automatically launches the browser.
"""

import webbrowser
import time
import threading
import uvicorn
import backend_service

def open_browser():
    time.sleep(1.2)
    webbrowser.open("http://127.0.0.1:8000")

if __name__ == "__main__":
    print("=" * 60)
    print("retrieval-agent: Langchain Retrieval Agent")
    print("Serving UI & API on: http://127.0.0.1:8000")
    print("=" * 60)
    threading.Thread(target=open_browser, daemon=True).start()
    uvicorn.run("backend_service:app", host="127.0.0.1", port=8000, reload=False)
