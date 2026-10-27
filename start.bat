@echo off
title GitHub Project Analyzer - Launcher
echo =====================================================================
echo  GitHub Project Analyzer: AI-Powered Source Code Analysis
echo  MCA Mini Project
echo =====================================================================
echo.

echo Starting FastAPI Backend Server on http://127.0.0.1:8000...
start "Git Analyzer Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo Starting React + Vite Frontend on http://localhost:3000...
start "Git Analyzer Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo =====================================================================
echo  Both servers started!
echo  Frontend UI: http://localhost:3000
echo  Backend Docs: http://127.0.0.1:8000/docs
echo =====================================================================
pause
