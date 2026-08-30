@echo off
title SAFAR Enterprise Full-Stack Runner
echo ========================================================
echo        Starting SAFAR Travel Marketplace Platform
echo ========================================================
echo.

set PATH=C:\Program Files\nodejs;%PATH%

echo [1/2] Starting FastAPI Backend (Port 8000)...
start "SAFAR FastAPI Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --reload --port 8000 --host 127.0.0.1"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Vite React Frontend (Port 5173)...
start "SAFAR Vite Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================================
echo  All services started successfully!
echo  - Frontend: http://localhost:5173
echo  - Backend API: http://127.0.0.1:8000/docs
echo ========================================================
echo.
timeout /t 2 /nobreak >nul
start http://localhost:5173/login
