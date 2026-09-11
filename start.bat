@echo off
echo Starting Sri Vasavi Engineering College - Campus Retrieval Agent...
echo Opening in browser at http://127.0.0.1:8000
start http://127.0.0.1:8000
.\.venv\Scripts\python.exe -m uvicorn backend_service:app --host 127.0.0.1 --port 8000
pause
