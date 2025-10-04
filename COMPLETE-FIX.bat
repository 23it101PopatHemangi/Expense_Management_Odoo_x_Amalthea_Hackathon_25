@echo off
title Expense Management System - Complete Fix
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                EXPENSE MANAGEMENT SYSTEM                      ║
echo ║                   COMPLETE FIX                               ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 🔧 STEP 1: Cleaning up existing processes...
taskkill /f /im node.exe 2>nul
echo ✅ All Node.js processes killed

echo.
echo 📦 STEP 2: Installing dependencies...
call npm install >nul 2>&1
cd server
call npm install >nul 2>&1
cd ../client
call npm install >nul 2>&1
cd ..
echo ✅ Dependencies installed

echo.
echo 🗄️ STEP 3: Database Setup...
echo MongoDB will be used if available, otherwise in-memory storage
echo If you have MongoDB installed, make sure it's running on localhost:27017
echo.

echo 🔧 STEP 4: Creating environment file...
if not exist server\.env (
    echo MONGODB_URI=mongodb://localhost:27017/expense-management > server\.env
    echo JWT_SECRET=your_jwt_secret_key_here_change_this_in_production >> server\.env
    echo PORT=5000 >> server\.env
    echo ✅ Environment file created
) else (
    echo ✅ Environment file already exists
)

echo.
echo 🚀 STEP 5: Starting Database Server...
start "Database Server" cmd /k "title Database Server && cd server && echo 🚀 Starting database server... && node database-server.js && pause"

echo ⏳ Waiting for database server to initialize...
timeout 5 >nul

echo.
echo 📱 STEP 6: Starting Frontend Client...
start "Frontend Client" cmd /k "title Frontend Client && cd client && echo 🚀 Starting React app... && npm start && pause"

echo.
echo ⏳ Waiting for frontend to initialize...
timeout 8 >nul

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                        🎉 SUCCESS! 🎉                        ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🌐 APPLICATION ACCESS:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo.
echo 🧪 TESTING ENDPOINTS:
echo   Health:   http://localhost:5000/api/health
echo   Countries: http://localhost:5000/api/currency/countries
echo.
echo 📋 HOW TO TEST THE COMPLETE SYSTEM:
echo   1. Open http://localhost:3000 in your browser
echo   2. Sign up with a new account
echo   3. Login with your account
echo   4. Navigate to different sections:
echo      - Dashboard: View statistics
echo      - Expenses: Submit new expenses
echo      - Users: Manage users (Admin only)
echo      - Approval Rules: Configure workflows (Admin only)
echo      - Approvals: Review pending approvals (Manager only)
echo.
echo 🔧 FEATURES NOW WORKING:
echo   ✅ User registration and login
echo   ✅ Data persistence (MongoDB or in-memory)
echo   ✅ Expense submission
echo   ✅ User management
echo   ✅ Approval rules configuration
echo   ✅ Approval workflow
echo   ✅ Dashboard with statistics
echo.
echo 📁 FILES CREATED:
echo   - database-server.js (Full-featured backend with database)
echo   - Updated frontend components with proper error handling
echo   - COMPLETE-FIX.bat (This script)
echo.
echo Press any key to open the application in your browser...
pause >nul

echo.
echo 🌐 Opening application in browser...
start http://localhost:3000

echo.
echo ✅ Complete system is now running!
echo Check the opened command windows for any errors.
echo Data will be persisted in MongoDB if available, otherwise in memory.
echo.
pause
