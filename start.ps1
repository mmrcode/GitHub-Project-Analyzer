Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host " GitHub Project Analyzer: AI-Powered Source Code Analysis" -ForegroundColor Green
Write-Host " MCA Mini Project" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Cyan

Write-Host "Starting FastAPI Backend Server on http://127.0.0.1:8000..." -ForegroundColor White
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/backend'; ./venv/Scripts/Activate.ps1; uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 2

Write-Host "Starting React + Vite Frontend on http://localhost:3000..." -ForegroundColor White
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/frontend'; npm run dev"

Write-Host "`nServers launched successfully!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
