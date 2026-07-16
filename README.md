# 🎓 MERN-Stack School Management System

A comprehensive, role-based school management platform built using the MERN stack (MongoDB, Express.js, React.js, Node.js). The application streamlines administrative, academic, and grading operations across three distinct authorization layers: Admin, Teacher, and Student.

---

## 🔑 Demo Access Credentials

To test the features across different system privileges, use the following pre-configured demonstration accounts:

### 👑 1. Admin Role
* **Email:** `dipakshah3321@gmail.com`
* **Password:** `99999999`
* **Access Level:** Complete operational override (Manage classes, assign subjects, register teachers/students).

### 👨‍🏫 2. Teacher Role
* **Email:** `jeetan@gmail.com`
* **Password:** `22222222`
* **Access Level:** Class management, student marks/results tabulation, and coursework assignment deployment.

### 🎒 3. Student Role
* **Email:** `dipak@gmail.com`
* **Password:** `1111111`
* **Access Level:** View academic performance cards, download coursework assignments, and tracking relative rank structures.

---

## 🚀 Key Features

### 🏢 Administrator Dashboard
* **User Management:** Onboard, update, or remove teachers and students securely.
* **Academic Architecture:** Design classes, sections, and add core subjects dynamically.
* **System Metrics:** Access quick analytics showing total enrollment numbers, staff allocation, and core structural distributions.

### 📝 Teacher Ecosystem
* **Result Tabulation Matrix:** Auto-calculates percentages, displays rank indexes across specific student pools, and computes average class score arrays natively in the frontend.
* **Assignment Management Engine:** Deploy homework modules with dynamic timeline states (`Upcoming`, `Due Within 48 Hours`, `Overdue`), complete with multi-format file attachment support via `FormData`.
* **Smart Auto-Resolution:** Fully automated matching mechanics that trace a teacher's assigned class profile and subject fields down to localized UI inputs instantly.

### 📊 Student Portal
* **Performance Report Cards:** Clean tracking UI highlighting marks obtained, total marks, percentage tracking, and custom letter grade mapping.
* **Assignment Center:** View, filter, and track upcoming assignment parameters with associated deadline notices.

---

## 🛠️ Tech Stack & Architecture

* **Frontend:** React.js, Tailwind CSS, Shadcn/UI, Lucide React, Zod (Schema Validation), Sonner (Toasts)
* **Backend:** Node.js, Express.js, RESTful API routing, Multipart Form Handling
* **Database:** MongoDB via Mongoose Object Modeling
* **State & Network Layer:** Context API (Authentication Tracking), Custom Axios/Fetch Hooks (`useApi`, `useAuth`)

---

## 💻 Installation & Setup Guide

### Prerequisites
* Node.js installed locally
* MongoDB instance running locally or via Atlas cluster

### 1. Clone the Repository
```bash
git clone [https://github.com/itsdipakshah/school-management-system.git](https://github.com/itsdipakshah/school-management-system.git)
cd school-management-system
