@echo off
echo ========================================
echo  AICTE Compliance Platform - Dev Setup
echo ========================================
echo.
echo Starting backend (FastAPI)...
start "AICTE Backend" cmd /k "cd /d %~dp0backend && .venv\Scripts\uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul 2>&1 || ping -n 4 127.0.0.1 >nul
echo.
echo Starting frontend (Vite)...
start "AICTE Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo ========================================
echo  Services starting...
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:8000
echo  API Docs: http://localhost:8000/docs
echo ========================================
