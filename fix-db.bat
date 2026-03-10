@echo off
title Bank Management System - Database Fix
color 0E
echo.
echo ============================================
echo   Database Connection - Auto Fix Tool
echo ============================================
echo.

REM ── Auto-detect MySQL path ─────────────────────────────
set MYSQL_BIN=

REM Check if mysql is already in PATH
where mysql >nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    set MYSQL_BIN=mysql
    goto :found
)

REM Check XAMPP
IF EXIST "C:\xampp\mysql\bin\mysql.exe" (
    set MYSQL_BIN=C:\xampp\mysql\bin\mysql.exe
    goto :found
)

REM Check WAMP (search for any version)
for /d %%d in ("C:\wamp64\bin\mysql\*") do (
    IF EXIST "%%d\bin\mysql.exe" (
        set MYSQL_BIN=%%d\bin\mysql.exe
        goto :found
    )
)
for /d %%d in ("C:\wamp\bin\mysql\*") do (
    IF EXIST "%%d\bin\mysql.exe" (
        set MYSQL_BIN=%%d\bin\mysql.exe
        goto :found
    )
)

REM Check standard MySQL install
for /d %%d in ("C:\Program Files\MySQL\MySQL Server *") do (
    IF EXIST "%%d\bin\mysql.exe" (
        set MYSQL_BIN=%%d\bin\mysql.exe
        goto :found
    )
)

REM Check MySQL 8+ default path
IF EXIST "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set MYSQL_BIN=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe
    goto :found
)

echo  [X] MySQL not found anywhere!
echo.
echo  Please install one of:
echo    - XAMPP  : https://www.apachefriends.org/
echo    - MySQL  : https://dev.mysql.com/downloads/installer/
echo.
pause
exit /b 1

:found
echo  [OK] MySQL found at: %MYSQL_BIN%
echo.

REM ── Check MySQL service is RUNNING ────────────────────
echo  Checking MySQL service status...
sc query mysql >nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    sc query mysql | find "RUNNING" >nul 2>&1
    IF %ERRORLEVEL% NEQ 0 (
        echo  MySQL service stopped — starting it...
        net start mysql >nul 2>&1
        IF %ERRORLEVEL% NEQ 0 (
            echo  [!] Could not auto-start MySQL service.
            echo      Please start it manually from XAMPP / Services.
            pause
            exit /b 1
        )
        echo  [OK] MySQL started!
    ) ELSE (
        echo  [OK] MySQL service is running!
    )
) ELSE (
    REM XAMPP uses "mysql" or "mysqld" not registered as Windows service
    echo  [OK] MySQL service check skipped (XAMPP mode)
)

echo.

REM ── Get MySQL password ────────────────────────────────
set /p MYSQL_PASS=Enter MySQL root password (press ENTER if blank): 
echo.

REM ── Test connection ───────────────────────────────────
echo  Testing MySQL connection...
IF "%MYSQL_PASS%"=="" (
    "%MYSQL_BIN%" -u root -e "SELECT 1;" >nul 2>&1
) ELSE (
    "%MYSQL_BIN%" -u root -p%MYSQL_PASS% -e "SELECT 1;" >nul 2>&1
)

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [X] Connection failed! Wrong password or MySQL not running.
    echo      - Open XAMPP Control Panel ^> Make sure MySQL is STARTED
    echo      - Try running this script again with correct password
    echo.
    pause
    exit /b 1
)
echo  [OK] MySQL connection successful!
echo.

REM ── Create database and tables ────────────────────────
echo  Setting up bank_management database...
IF "%MYSQL_PASS%"=="" (
    "%MYSQL_BIN%" -u root < database\schema.sql
) ELSE (
    "%MYSQL_BIN%" -u root -p%MYSQL_PASS% < database\schema.sql
)

IF %ERRORLEVEL% NEQ 0 (
    echo  [X] Database setup failed!
    pause
    exit /b 1
)
echo  [OK] Database, tables and admin created!
echo.

REM ── Update .env with correct password ─────────────────
echo  Updating backend\.env ...
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
echo  [OK] .env updated!
echo.

REM ── Done ──────────────────────────────────────────────
echo ============================================
echo   ALL FIXED! Database is ready.
echo ============================================
echo.
echo   Admin Login:
echo     Email   : shubham@bank.com
echo     Password: Admin@123
echo.
echo   Now run: start-server.bat
echo ============================================
echo.
pause
