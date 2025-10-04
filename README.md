# 💸 ExpenseEase – Smart Expense Management & Approval System

![React](https://img.shields.io/badge/Frontend-React.js-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/API-Express.js-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)
![OCR](https://img.shields.io/badge/OCR-Tesseract.js%20%2F%20Google%20Vision-blue)

---

⚡ ExpenseEase simplifies and automates corporate expense reimbursement with AI-powered OCR receipt scanning, dynamic approval workflows, and multi-currency support — all while ensuring transparency and control.

✨ Why ExpenseEase?
💡 The Problem

Companies often face challenges like:

❌ Manual and time-consuming reimbursement processes

❌ High chances of human error

❌ Lack of flexible approval workflows

❌ Poor visibility into expense statuses

🚀 Our Solution – ExpenseEase

ExpenseEase revolutionizes expense management by providing:

✅ Role-based multi-level approval system

✅ Smart conditional workflows (percentage or specific approver-based)

✅ OCR-powered receipt scanning and auto-expense generation

✅ Real-time currency conversion and localization

✅ Transparent dashboards for employees, managers, and admins

🧩 Core Features
🔐 Authentication & User Management

On first signup/login:

A new company is auto-created with the country’s default currency.

The Admin user is auto-generated.

Admin can:

Create Employees & Managers

Assign or change roles

Define manager-employee relationships

💰 Expense Submission (Employee Role)

Employees can:

Submit expense claims with amount, category, description, and date

Upload receipts (auto-read via OCR)

View expense history (Approved/Rejected)

🧾 Approval Workflow (Manager/Admin Role)

Multi-level sequential approval setup

Example:

Step 1 → Manager

Step 2 → Finance

Step 3 → Director

Expense moves to the next approver only after current approval

Managers can view, approve/reject expenses with comments

🧠 Conditional Approval Rules

Percentage Rule: Approve if X% of approvers approve

Specific Approver Rule: Auto-approved if CFO approves

Hybrid Rule: Combine both rules

Supports multiple and conditional approvers simultaneously

🧾 OCR for Receipts

Upload or scan a receipt → fields like amount, date, description, and vendor name are auto-filled

Saves time and prevents manual data errors

🌍 Multi-Currency & Localization

Fetch currency data via:
👉 REST Countries API

Currency conversion using:
👉 ExchangeRate API

🧑‍💻 Roles & Permissions
Role	Permissions
👑 Admin	Create company (auto on signup), manage users, set roles, configure approval rules, view all expenses, override approvals
👔 Manager	Approve/reject team expenses, view reports, escalate as per rules
👩‍💼 Employee	Submit expenses, upload receipts, view personal expense history
⚙️ Tech Stack

Frontend: React.js, Tailwind CSS
Backend: Node.js, Express.js
Database: MongoDB
Authentication: JWT (JSON Web Tokens)
APIs: REST Countries, ExchangeRate API
OCR: Tesseract.js (for receipt text extraction)

🧑‍🤝‍🧑 Team Members

👩‍💻 Hemangi Popat – Frontend Development & UI/UX Design
👩‍💻 Venisha Thakker – Database Management & API Integration
👩‍💻 Krishna Thakkar – Backend Development & Authentication
👩‍💻 Khyati Thakkar – OCR Integration & Automation Logic

🎨 Mockup & Flow Diagram

📌 View our system mockup here → Excalidraw Mockup

🌟 Highlights

🧠 Smart multi-level approvals with dynamic rules

📸 OCR-powered expense automation

💹 Real-time currency conversion

🔒 Secure login and user management

🪄 Beautiful, intuitive UI

🚀 Future Enhancements

📊 AI-powered expense trend analysis

💼 Integration with payroll systems

🔔 Email & push notifications for approvals

📱 Mobile-friendly responsive design

💬 Conclusion

ExpenseEase is built to streamline how organizations handle expense reimbursements — saving time, reducing errors, and boosting transparency.
With automation at its core, ExpenseEase empowers businesses to focus on growth, not paperwork.
