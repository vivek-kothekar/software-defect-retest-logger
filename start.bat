@echo off
title Software Defect Re-Test Logger Starter
echo ===================================================
echo  Starting Software Defect Re-Test Logger...
echo ===================================================

echo.
echo [1/3] Checking Backend dependencies...
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend && call npm install && cd ..
)

echo.
echo [2/3] Checking Frontend dependencies...
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend && call npm install && cd ..
)

echo.
echo [3/3] Starting Backend and Frontend servers...
start "Backend Server (Port 5000)" cmd /k "cd backend && node server.js"
start "Frontend UI (Port 3000)" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo  App is launching!
echo  Backend:  http://localhost:5000
echo  Frontend: http://localhost:3000
echo ===================================================
echo Opening browser in 3 seconds...
timeout /t 3 >nul
start http://localhost:3000
