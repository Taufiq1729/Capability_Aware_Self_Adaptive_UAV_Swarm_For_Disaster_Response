# SAFE-SWARM Multi-Service Launcher (PowerShell)
$root = $PSScriptRoot

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " STARTING SAFE-SWARM UAV DISASTER RESPONSE SYSTEM" -ForegroundColor Yellow
Write-Host " (PyTorch + PettingZoo + NetworkX + Node.js + React Vite)" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan

Write-Host "`n[1/3] Launching Python AI Simulation Engine (Port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\simulation-service'; Write-Host '--- Python FastAPI AI Engine (Port 8000) ---' -ForegroundColor Green; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 2

Write-Host "[2/3] Launching Node.js Backend Gateway & Socket.IO (Port 5001)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; Write-Host '--- Node.js Swarm Gateway (Port 5001) ---' -ForegroundColor Yellow; node server.js"

Start-Sleep -Seconds 2

Write-Host "[3/3] Launching React Vite UI Dashboard (Port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; Write-Host '--- React Vite Dashboard (Port 5173) ---' -ForegroundColor Cyan; npm run dev"

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host " All 3 microservices launched in dedicated windows!" -ForegroundColor Green
Write-Host " Frontend Dashboard: http://localhost:5173" -ForegroundColor White
Write-Host " Backend Gateway:    http://localhost:5001" -ForegroundColor White
Write-Host " AI API Swagger:     http://localhost:8000/docs" -ForegroundColor White
Write-Host "=================================================================" -ForegroundColor Cyan
