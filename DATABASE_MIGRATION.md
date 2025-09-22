# Guide: Migrating from localStorage to a Database

This document outlines the plan and process for transitioning the Dynamic Task & Mission Planner from using browser `localStorage` to a persistent, server-side database. This is a critical step for enabling multi-user features, data synchronization, and building a more robust application.

## **1. Why Move to a Database?**

`localStorage` is great for single-user, single-browser applications, but it has significant limitations:
*   **No Data Sync:** Data is trapped on a single device and browser.
*   **No Multi-User Capability:** It's impossible to share data or collaborate (e.g., the "Groups" feature).
*   **Limited Storage:** Browsers impose storage limits.
*   **Data Loss Risk:** Clearing browser data or switching devices means all data is lost.

A **database** solves these problems by providing a central, persistent source of truth for all application data.

## **2. Division of Labor: You & Your AI Assistant**

This is a collaborative effort. Here’s a breakdown of responsibilities:

### **Your Responsibilities (The User):**

1.  **Security & Credentials:**
    *   **Make the GitHub Repository Private:** This is **essential** to protect your code and any sensitive information. I, the AI, can be granted access to private repositories to continue working on the project.
    *   **Database Credentials:** You will need to provide the database connection details (host, username, password, database name) from Hostinger. These **must not** be hardcoded. You will need to manage them in a secure `.env` file on your server.

2.  **Hosting & Deployment:**
    *   You are responsible for the hosting environment on Hostinger. This includes setting up the backend environment (e.g., ensuring it can run Node.js) and deploying the backend code I will help write.

3.  **Final Decisions:**
    *   You will make the final decisions on technology choices (though I will provide recommendations) and approve the database schema.

### **My Responsibilities (Jules, the AI):**

1.  **Backend Development:**
    *   I will write the complete backend application code (e.g., using Node.js and Express.js) that will connect to your database.
    *   I will create all the necessary API endpoints (e.g., `GET /tasks`, `POST /tasks`) for the frontend to communicate with.

2.  **Database Schema Design:**
    *   I will design and provide the SQL code (`CREATE TABLE` statements) for all the necessary database tables (users, tasks, categories, groups, etc.).

3.  **Frontend Refactoring:**
    *   I will modify the existing frontend JavaScript, removing all `localStorage` logic and replacing it with API calls (`fetch`) to the new backend.

## **3. The Step-by-Step Migration Plan**

Here is the proposed technical path for the migration.

### **Step 1: Project Setup & Security**

1.  **Make Repository Private:** Before we begin, go to your repository settings on GitHub and make it private.
2.  **Create a `.gitignore` file:** We need to ensure sensitive files are never committed. I will add `.env` to the existing `.gitignore`.
3.  **Backend Directory:** I will create a `server/` directory to house all the new backend code, keeping it separate from the frontend.

### **Step 2: Backend Development (Node.js & Express)**

I recommend using **Node.js and Express.js** for the backend, as it uses JavaScript, which is consistent with the existing frontend codebase.

1.  **Initialize Node.js Project:** Inside the `server/` directory, I will run `npm init -y` and install necessary packages:
    *   `express`: The web server framework.
    *   `mysql2`: The driver to connect to your MySQL database on Hostinger.
    *   `dotenv`: To manage environment variables from a `.env` file.
    *   `cors`: To handle cross-origin requests from the frontend.

2.  **Database Connection:** I will create a `server/db.js` file to handle the database connection logic, pulling credentials securely from the `.env` file.

3.  **API Endpoints:** I will create a `server/index.js` file. This file will define all the API routes the application needs, such as:
    *   `GET /api/tasks`: Fetch all tasks.
    *   `POST /api/tasks`: Create a new task.
    *   `PUT /api/tasks/:id`: Update an existing task.
    *   `DELETE /api/tasks/:id`: Delete a task.
    *   Similar endpoints for categories, settings, history, etc.

### **Step 3: Database Schema Design**

I will provide you with a SQL script to create the necessary tables in your Hostinger database via a tool like phpMyAdmin. The schema will look something like this (simplified):

*   **`users` table:** (You mentioned you already have this) `id`, `username`, `password_hash`, `email`.
*   **`categories` table:** `id`, `user_id`, `name`, `color`.
*   **`tasks` table:** `id`, `user_id`, `category_id`, `title`, `dueDate`, `duration`, `status`, `isRepeating`, etc. (This will be a large table mapping to the existing `task` object properties).
*   **`groups` table:** `id`, `name`, `owner_id`.
*   **`group_members` table:** `group_id`, `user_id`, `role`.

### **Step 4: Frontend Refactoring**

This is where we replace `localStorage` with API calls. I will go through the `js/script.js` and `js/task-logic.js` files and perform the following changes:

1.  **Remove `localStorage.getItem`:** All calls that retrieve data from `localStorage` (e.g., `JSON.parse(localStorage.getItem('tasks'))`) will be replaced with `fetch` calls to the new backend API (e.g., `fetch('/api/tasks')`).
2.  **Remove `localStorage.setItem`:** All calls that save data will be replaced with `POST`, `PUT`, or `DELETE` requests to the API, sending the data in the request body.
3.  **Update UI Logic:** The app's loading and data handling logic will be updated to work asynchronously with API calls, accounting for loading states and potential network errors.

### **Step 5: Deployment**

1.  **Backend Deployment:** You will need to upload the `server/` directory to your Hostinger server. Hostinger provides documentation on how to run a Node.js application.
2.  **Environment Variables:** You will need to configure the environment variables (your database credentials in the `.env` file) in the Hostinger control panel. **Do not upload the `.env` file directly.**
3.  **Frontend Deployment:** The frontend files (`index.html`, `js/`, `styles.css`) will be deployed as they are now, as static files. The only difference is that they will now make requests to your backend server instead of `localStorage`.

This migration is a significant but essential upgrade. By following this plan, we can successfully transition the application to a powerful, scalable, and collaborative platform.
