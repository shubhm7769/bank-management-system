@echo off
title Bank Management System - Server
color 0B
echo.
echo ============================================
echo   Bank Management System - Starting Server
echo ============================================
echo.
echo  Opening browser at: http://localhost:5000
echo  Press Ctrl+C to stop the server.
echo.

:: Open browser after short delay
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5000"

:: Start the Node.js server
cd backend
node server.js
