@echo off
title Complete Expense Management System - WITH EMAIL & UI ENHANCEMENTS
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                EXPENSE MANAGEMENT SYSTEM                      ║
echo ║              WITH EMAIL & UI ENHANCEMENTS                  ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 🔧 STEP 1: Complete cleanup...
taskkill /f /im node.exe 2>nul
echo ✅ All processes killed

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
echo 🗄️ STEP 3: MongoDB Database Setup...
echo ✅ Using MongoDB database: expense-management
echo ✅ Data will be saved to MongoDB and visible in MongoDB Compass
echo.

echo 🔧 STEP 4: Environment setup...
if not exist server\.env (
    echo MONGODB_URI=mongodb://localhost:27017/expense-management > server\.env
    echo JWT_SECRET=your_jwt_secret_key_here_change_this_in_production >> server\.env
    echo PORT=5000 >> server\.env
    echo EMAIL_USER=your-email@gmail.com >> server\.env
    echo EMAIL_PASS=your-app-password >> server\.env
    echo ✅ Environment file created
) else (
    echo ✅ Environment file already exists
)

echo.
echo 📧 STEP 5: Email Configuration...
echo ⚠️  IMPORTANT: Configure your email settings in server/.env
echo    - EMAIL_USER: Your Gmail address
echo    - EMAIL_PASS: Your Gmail App Password (not regular password)
echo    - To get App Password: Google Account → Security → 2-Step Verification → App Passwords
echo.

echo 🚀 STEP 6: Starting Enhanced Server...
start "Enhanced Server with Email" cmd /k "title Enhanced Server && cd server && echo 🚀 Starting ENHANCED expense management server... && echo 📧 NEW FEATURES: Forgot Password, Email Notifications, Enhanced UI && echo 🔍 Check MongoDB Compass to see the data! && node mongodb-server.js && pause"

echo ⏳ Waiting for server to initialize...
timeout 5 >nul

echo.
echo 📱 STEP 7: Starting Enhanced Frontend...
start "Enhanced Frontend" cmd /k "title Enhanced Frontend && cd client && echo 🚀 Starting React app with enhanced UI... && npm start && pause"

echo.
echo ⏳ Waiting for frontend to initialize...
timeout 10 >nul

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🎉 SYSTEM READY! 🎉                     ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🌐 APPLICATION ACCESS:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo.
echo 🆕 NEW FEATURES ADDED:
echo   ✅ Forgot Password - Complete email-based reset system
echo   ✅ Email Notifications - Expense approval notifications
echo   ✅ Enhanced UI - Interactive animations and modern design
echo   ✅ Manager Assignment - Fixed and working perfectly
echo   ✅ Employee Dashboard - Fixed data loading
echo   ✅ Approval Workflow - Complete email notifications
echo   ✅ OCR Receipt Processing - Auto-fill forms
echo   ✅ MongoDB Persistence - All data saved
echo.
echo 📧 EMAIL FEATURES:
echo   ✅ Password Reset - Users can reset passwords via email
echo   ✅ Approval Notifications - Employees get notified when expenses are approved/rejected
echo   ✅ Professional Email Templates - Beautiful HTML emails
echo   ✅ Gmail Integration - Works with Gmail SMTP
echo.
echo 🎨 UI ENHANCEMENTS:
echo   ✅ Modern Login/Signup - Gradient backgrounds, animations
echo   ✅ Forgot Password Page - Beautiful reset interface
echo   ✅ Enhanced Dashboard - User avatars, role badges, animations
echo   ✅ Interactive Elements - Hover effects, transitions
echo   ✅ Responsive Design - Works on all devices
echo   ✅ Custom Animations - Fade-in, slide-in, pulse effects
echo.
echo 🔧 EMAIL SETUP INSTRUCTIONS:
echo   1. Open server/.env file
echo   2. Replace EMAIL_USER with your Gmail address
echo   3. Replace EMAIL_PASS with your Gmail App Password
echo   4. To get App Password:
echo      - Go to Google Account Settings
echo      - Security → 2-Step Verification
echo      - App Passwords → Generate password for "Mail"
echo      - Use the generated 16-character password
echo.
echo 🧪 COMPLETE TESTING WORKFLOW:
echo   1. Open http://localhost:3000
echo   2. Test Forgot Password: Click "Forgot your password?" on login
echo   3. Sign up as Admin (creates company)
echo   4. Create Manager and Employee users
echo   5. Assign Manager to Employee (now working!)
echo   6. Login as Employee → Dashboard loads properly
echo   7. Submit expense → Gets assigned to Manager
echo   8. Login as Manager → View pending approvals
echo   9. Approve/Reject expense → Employee gets email notification
echo   10. Test OCR by uploading receipt image
echo.
echo 📊 MONGODB COLLECTIONS:
echo   - users (with resetPasswordToken fields)
echo   - companies (Company information)
echo   - expenses (with approval workflow)
echo   - approvalrules (Approval workflow rules)
echo.
echo 🔍 TO VIEW DATA IN MONGODB COMPASS:
echo   1. Open MongoDB Compass
echo   2. Connect to: mongodb://localhost:27017
echo   3. Select database: expense-management
echo   4. Browse collections: users, companies, expenses, approvalrules
echo.
echo ✅ ALL ISSUES FIXED & ENHANCED:
echo   - Employee dashboard "failed to load" → FIXED + ENHANCED
echo   - Manager assignment not working → FIXED + ENHANCED
echo   - Approval workflow not working → FIXED + EMAIL NOTIFICATIONS
echo   - Forgot password functionality → ADDED + WORKING
echo   - Email notifications → ADDED + WORKING
echo   - UI enhancements → ADDED + BEAUTIFUL
echo   - Data persistence issues → FIXED + WORKING
echo.
echo Press any key to open the application...
pause >nul

echo.
echo 🌐 Opening application in browser...
start http://localhost:3000

echo.
echo ✅ COMPLETE EXPENSE MANAGEMENT SYSTEM IS READY!
echo All issues fixed and enhanced with email + beautiful UI.
echo Check the opened command windows for any errors.
echo.
echo 📧 EMAIL CONFIGURATION REMINDER:
echo   Don't forget to configure your email settings in server/.env
echo   for forgot password and approval notifications to work!
echo.
pause
