# Campus Retrieval Agent - Start Backend + Frontend Dev Server
Write-Host "`n=== Campus Retrieval Agent ===" -ForegroundColor Cyan
Write-Host "Starting Backend (FastAPI) on http://127.0.0.1:8000 ..." -ForegroundColor Green

# Start backend in a new terminal window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PWD'; .\.venv\Scripts\python.exe -m uvicorn backend_service:app --host 127.0.0.1 --port 8000 --reload" -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "Starting Frontend (Vite Dev Server) on http://localhost:5173 ..." -ForegroundColor Yellow

# Start frontend dev server in another new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PWD\frontend'; npm run dev" -WindowStyle Normal

Write-Host "`nBoth servers are starting!" -ForegroundColor Cyan
Write-Host "  Backend  -> http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "  Frontend -> http://localhost:5173" -ForegroundColor Yellow
Write-Host "`nClose those two terminal windows to stop the servers.`n" -ForegroundColor Gray
