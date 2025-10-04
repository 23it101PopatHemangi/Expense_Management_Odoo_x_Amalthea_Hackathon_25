💸 ExpenseEase – Smart Expense Management & Approval System








⚡ A modern web platform that makes expense management effortless with OCR-powered receipt scanning, multi-level approvals, and smart conditional workflows.

✨ Why ExpenseEase?

💡 The Problem
Companies struggle with:

❌ Manual, error-prone reimbursement processes

❌ No flexible approval workflows

❌ Lack of visibility & transparency

🚀 Our Solution – ExpenseEase

✔ Automates approvals with role-based flows

✔ Adds conditional rules (e.g., % approvals or CFO override)

✔ Uses OCR to auto-read receipts & generate expenses

✔ Provides real-time multi-currency support

🔑 Key Features
👤 Authentication & User Management

Auto-create Company & Admin on signup (currency auto-set by country).

Admin manages employees, managers, roles & hierarchies.

🧾 Expense Submission (Employee)

Submit claims with amount, category, date, description.

Supports multi-currency with automatic conversion.

View personal expense history (approved/rejected).

✅ Approval Workflow (Manager/Admin)

Multi-level approvals (e.g., Manager → Finance → Director).

Approvers can approve/reject with comments.

🎯 Conditional Approval Rules

Percentage rule → e.g., 60% approvers required.

Specific approver rule → e.g., CFO auto-approves.

Hybrid rule → 60% OR CFO approval.

📷 OCR for Receipts

Upload/scan receipts.

AI extracts amount, date, category, merchant → auto-fills expense.

👥 Roles & Permissions
Role	Permissions
Admin	Manage company, roles, workflows, override approvals, view all expenses
Manager	Approve/reject team expenses, view team reports, escalate as per rules
Employee	Submit expenses, track approval status, view expense history
🏗 Architecture

🔹 Frontend (React.js/Next.js) → Modern UI with Tailwind styling, OCR upload
🔹 Backend (Node.js + Express) → REST APIs for authentication, expenses & approvals
🔹 Database (PostgreSQL) → Stores users, roles, workflows, expense records
🔹 APIs Integrated →

REST Countries API → for company currency setup

Exchange Rate API → for currency conversions

📌 Workflow
Employee submits → Manager reviews → Finance → Director → Conditional rules applied → Final status

🛠 Tech Stack

🎨 Frontend → React.js, Tailwind CSS

⚙ Backend → Node.js, Express.js

🗄 Database → PostgreSQL

🔐 Auth → JWT

🧠 OCR → Tesseract.js / Google Vision

🚀 Deployment → Docker + Cloud (AWS / Heroku / Vercel)

🎨 Mockups

👉 View Excalidraw Mockup

🔄 Approval Flow

1️⃣ Employee submits expense
2️⃣ Manager reviews → approve/reject
3️⃣ Finance reviews → approve/reject
4️⃣ Director makes final decision
5️⃣ Conditional rules (CFO approval / % rule) can shortcut the flow
6️⃣ Final status → visible to employee instantly

⚙ Setup Instructions

Clone repository
git clone https://github.com/your-username/expenseease.git

cd expenseease

Backend setup
cd backend
npm install
npm run dev

Frontend setup
cd frontend
npm install
npm start

Environment variables (.env)
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
EXCHANGE_RATE_API=https://api.exchangerate-api.com/v4/latest/

OCR_API_KEY=your_ocr_service_key

Access App →
Frontend → http://localhost:3000

Backend → http://localhost:5000

📌 Roadmap

📱 Mobile app (React Native / Flutter)

📊 Advanced analytics dashboards

🤖 AI-powered fraud detection in expenses

📤 Bulk imports (CSV/Excel)

🤝 Contributing

We ❤ contributions!

Fork this repo

Create feature branch

Commit changes

Push branch

Open Pull Request

📜 License

Licensed under the MIT License.
