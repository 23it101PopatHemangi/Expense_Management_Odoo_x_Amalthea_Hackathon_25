# 💸 ExpenseEase – Smart Expense Management & Approval System

![React](https://img.shields.io/badge/Frontend-React.js-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/API-Express.js-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)
![OCR](https://img.shields.io/badge/OCR-Tesseract.js%20%2F%20Google%20Vision-blue)

---

⚡ **A modern web platform that makes expense management effortless** with OCR-powered receipt scanning, multi-level approvals, and smart conditional workflows.

---

## ✨ Why ExpenseEase?

### 💡 The Problem
Companies struggle with:
- ❌ Manual, error-prone reimbursement processes  
- ❌ No flexible approval workflows  
- ❌ Lack of visibility & transparency  

### 🚀 Our Solution – ExpenseEase
- ✔ Automates approvals with role-based flows  
- ✔ Adds conditional rules (e.g., % approvals or CFO override)  
- ✔ Uses OCR to auto-read receipts & generate expenses  
- ✔ Provides real-time multi-currency support  

---

## 🔑 Key Features

### 👤 Authentication & User Management
- Auto-create Company & Admin on signup (currency auto-set by country)  
- Admin manages employees, managers, roles & hierarchies  

### 🧾 Expense Submission (Employee)
- Submit claims with amount, category, date, description  
- Supports multi-currency with automatic conversion  
- View personal expense history (approved/rejected)  

### ✅ Approval Workflow (Manager/Admin)
- Multi-level approvals (e.g., Manager → Finance → Director)  
- Approvers can approve/reject with comments  

### 🎯 Conditional Approval Rules
- **Percentage rule** → e.g., 60% approvers required  
- **Specific approver rule** → e.g., CFO auto-approves  
- **Hybrid rule** → 60% OR CFO approval  

### 📷 OCR for Receipts
- Upload/scan receipts  
- AI extracts amount, date, category, merchant → auto-fills expense  

---

## 👥 Roles & Permissions

| Role | Permissions |
|------|--------------|
| **Admin** | Manage company, roles, workflows, override approvals, view all expenses |
| **Manager** | Approve/reject team expenses, view team reports, escalate as per rules |
| **Employee** | Submit expenses, track approval status, view expense history |

---

## 🏗 Architecture

🔹 **Frontend:** React.js / Next.js + Tailwind CSS (OCR upload UI)  
🔹 **Backend:** Node.js + Express.js (REST APIs for auth, expenses & approvals)  
🔹 **Database:** PostgreSQL (users, roles, workflows, expenses)  
🔹 **APIs Integrated:**
- [REST Countries API](https://restcountries.com/) → for company currency setup  
- [Exchange Rate API](https://api.exchangerate-api.com/) → for currency conversions  

---

## 📌 Workflow

> Employee submits → Manager reviews → Finance → Director → Conditional rules applied → Final status

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-------------|
| 🎨 Frontend | React.js, Tailwind CSS |
| ⚙ Backend | Node.js, Express.js |
| 🗄 Database | PostgreSQL |
| 🔐 Auth | JWT |
| 🧠 OCR | Tesseract.js / Google Vision |
| 🚀 Deployment | Docker + AWS / Heroku / Vercel |

---

## 🎨 Mockups
👉 [View Excalidraw Mockup](#) *(add link when available)*  

---

## 🔄 Approval Flow

1️⃣ Employee submits expense  
2️⃣ Manager reviews → approve/reject  
3️⃣ Finance reviews → approve/reject  
4️⃣ Director makes final decision  
5️⃣ Conditional rules (CFO approval / % rule) can shortcut the flow  
6️⃣ Final status → visible to employee instantly  

---

## ⚙ Setup Instructions

```bash
# Clone repository
git clone https://github.com/your-username/expenseease.git
cd expenseease

## cd frontend

npm install
npm start

## cd backend
node mongodb-server.js
