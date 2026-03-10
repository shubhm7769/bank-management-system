@echo off
title Bank Management System - Setup
color 0A
echo.
echo ============================================
echo   Bank Management System - Full Setup
echo ============================================
echo.

:: ─── Step 1: Check MySQL ────────────────────
echo [1/4] Checking MySQL...
where mysql >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ERROR: MySQL not found in PATH!
    echo.
    echo  Please add MySQL to your PATH. Common locations:
    echo    XAMPP  : C:\xampp\mysql\bin
    echo    WAMP   : C:\wamp64\bin\mysql\mysqlX.X.XX\bin
    echo    MySQL  : C:\Program Files\MySQL\MySQL Server X.X\bin
    echo.
    echo  After adding to PATH, restart this script.
    echo.
    pause
    exit /b 1
)
echo  MySQL found!
echo.

:: ─── Step 2: Get MySQL password ─────────────
set /p MYSQL_PASS=Enter your MySQL root password (press Enter if none): 
echo.

:: ─── Step 3: Run Schema ─────────────────────
echo [2/4] Creating database and tables...
IF "%MYSQL_PASS%"=="" (
    mysql -u root < database\schema.sql
) ELSE (
    mysql -u root -p%MYSQL_PASS% < database\schema.sql
)

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ERROR: Database setup failed!
    echo  - Make sure MySQL service is running
    echo  - Check your MySQL root password
    echo.
    pause
    exit /b 1
)
echo  Database and tables created!
echo.

:: ─── Step 4: Update .env password ───────────
echo [3/4] Updating .env with your MySQL password...
(
    echo # ============================================
    echo # Bank Management System - Environment Config
    echo # ============================================
    echo.
    echo # Server Configuration
    echo PORT=5000
    echo.
    echo # Database Configuration
    echo DB_HOST=localhost
    echo DB_USER=root
    echo DB_PASSWORD=%MYSQL_PASS%
    echo DB_NAME=bank_management
    echo.
    echo # JWT Secret Key
    echo JWT_SECRET=bank_management_secret_key_2024_secure
    echo.
    echo # JWT Expiry
    echo JWT_EXPIRES_IN=24h
) > backend\.env
echo  .env updated!
echo.

:: ─── Step 5: Install npm packages ───────────
echo [4/4] Installing Node.js dependencies...
cd backend
call npm install
cd ..
echo  Dependencies installed!
echo.

:: ─── Done ────────────────────────────────────
echo ============================================
echo   SETUP COMPLETE!
echo ============================================
echo.
echo   Admin Login Credentials:
echo     Email   : admin@bank.com
echo     Password: admin123
echo.
echo   To START the server, run:  start-server.bat
echo ============================================
echo.
pause
