@echo off
title SAFE-SWARM Multi-Service Launcher
echo =====================================================================
echo  STARTING SAFE-SWARM UAV DISASTER RESPONSE SYSTEM
echo  (PyTorch + PettingZoo + NetworkX + Node.js + React Vite)
echo =====================================================================
echo.
echo [1/3] Launching Python Simulation Engine (FastAPI + PyTorch + PettingZoo + NetworkX on Port 8000)...
start "SAFE-SWARM Python AI Service (Port 8000)" cmd /k "cd /d %~dp0simulation-service && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/3] Launching Node.js Backend Gateway & Socket.IO (Port 5001)...
start "SAFE-SWARM Node.js Gateway (Port 5001)" cmd /k "cd /d %~dp0backend && node server.js"

timeout /t 3 /nobreak >nul

echo [3/3] Launching React Vite Frontend Dashboard (Port 5173)...
start "SAFE-SWARM React UI (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo =====================================================================
echo  ALL 3 SERVICES LAUNCHED SUCCESSFULLY!
echo  Web Dashboard:       http://localhost:5173
echo  Backend Gateway:     http://localhost:5001
echo  Python FastAPI Docs: http://localhost:8000/docs
echo =====================================================================
pause
