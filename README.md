# Educore Management (Supabase Edition)

A comprehensive school management system designed for practical implementation, replacing legacy PHP systems with a modern React + Supabase stack.

<div align="center">
  <img alt="Dashboard Preview" src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=1000" width="800" style="border-radius: 10px; margin: 20px 0;" />
</div>

## 🚀 Features

### 👥 User Management & Authentication
- **Secure Login:** Powered by Supabase Auth.
- **Role-based Access Control (RBAC):** Distinct views and permissions for **Admins**, **Teachers**, and **Students**.

### 🎓 Student Management
- **CRUD Operations:** Complete management of student data.
- **Profile Photos:** Direct upload to Supabase Storage.
- **Search & Filter:** Efficiently find students by name or class.

### 🏫 Academic Management
- **Classes:** Manage class capacities and assigning homeroom teachers.
- **Subjects:** Catalog of subjects taught.
- **Schedules:** Dynamic scheduling system (Day/Time/Room).

### 📊 Attendance & Performance
- **Attendance Tracking:** Record and monitor daily attendance.
- **Points System:** Track student achievements and violations with an activity log.
- **Dashboard:** Real-time statistics on students, teachers, and daily activities.

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Charts:** Recharts
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **PDF Generation:** jsPDF

## 💻 Run Locally

Follow these steps to get the project running on your local machine.

### Prerequisites
- Node.js (v18+ recommended)
- A Supabase project

### Installation

1. **Clone the repository** (if applicable) or navigate to the project folder.

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory (or use the existing `.env.local` as a template) and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

## 📂 Project Structure

- `/src/components` - UI components and page views (Dashboard, UserList, etc.)
- `/src/contexts` - React Contexts (AuthContext)
- `/src/database` - Database related utilities
- `/src/types` - TypeScript type definitions
