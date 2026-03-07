@echo off
echo Starting Alambana Healthcare...
echo.

REM Kill any existing servers
taskkill /F /IM python.exe /FI "WINDOWTITLE eq uvicorn*" 2>nul
taskkill /F /IM node.exe /FI "WINDOWTITLE eq yarn*" 2>nul

REM Start backend
echo [1/2] Starting backend on http://localhost:8000
start "Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000"

REM Wait a moment then start frontend
timeout /t 2 /nobreak >nul

REM Start frontend
echo [2/2] Starting frontend on http://localhost:3000
start "Frontend" cmd /k "cd /d %~dp0frontend && yarn start"

echo.
echo Both servers starting. Check the two new terminal windows.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
pause
