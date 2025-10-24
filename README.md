# **Task & Mission Planner: The Complete Guide**

Welcome to the Task & Mission Planner, a highly intelligent personal productivity application designed for users who want to go beyond simple to-do lists. This guide will walk you through the core philosophies, features, and in-depth mechanics of the application, explaining *what* the features do, *why* they exist, and *how* they work together to help you achieve your goals.

## **Core Philosophy: The Feedback Loop to Mastery**

This planner is built on a single, powerful principle: **Mastery comes from a tight feedback loop.** To get better at anything—planning, habits, goals—you need to see the consequences of your decisions, learn, and adapt.

Most tools show you *what* you need to do. This planner shows you the *impact* of your choices.

It doesn't just list your tasks; it actively simulates your schedule, de-conflicts it, and calculates the real pressure you're under. The color-coded status of a task isn't just based on its due date, but on how much *actual, available time* you have left after all your other commitments are accounted for.

This creates the critical feedback loop:

1.  **You Plan:** You add tasks, appointments, and goals.
2.  **The App Analyzes:** It tells you if your plan is realistic by simulating the schedule. A task due in three days might turn red *today* if the engine sees you're overcommitted.
3.  **You See the Impact:** You get an immediate, visual warning about potential bottlenecks and unrealistic workloads.
4.  **You Adapt & Improve:** Armed with this feedback, you can make smarter decisions—move a deadline, delegate a task, or change a goal.

This loop transforms you from a passive list-follower into an active, intelligent planner who understands their own capacity and makes better choices over time.

---

## **The Main Views: Your Command Center**

The application is structured around four main views, each serving a distinct purpose:

1.  **Dashboard:** Your mission control. It provides a high-level overview of your **Weekly Goals** and your **Key Performance Indicators (KPIs)**, which chart your completion accuracy for important, recurring tasks.
2.  **Task Manager:** The heart of your daily operations. This is a powerful list-based view for creating, editing, and organizing all of your active tasks.
3.  **Calendar:** Your visual timeline. It automatically schedules and de-conflicts your tasks, creating a realistic, achievable plan for your day and week.
4.  **Journal:** Your space for reflection. Here, you can write free-form entries and review your weekly goals, bridging the gap between doing and learning.

---

## **The Brains of the App: The Intelligent Scheduling Engine**

The application's "smarts" come from a unique, three-phase scheduling engine that treats your time like a valuable resource. This process, called the **Calculation Pipeline**, runs every time your tasks are updated.

### **Phase 1: Occurrence Generation**
First, the pipeline looks at all your repeating tasks and projects them into the future, creating a list of every single upcoming "occurrence" of each task between now and your chosen **Calculation Horizon** (a setting in Advanced Options).

### **Phase 2: Positioning & De-confliction (The "Positioning GPA")**
Next, the engine prioritizes every task occurrence to decide its importance in the schedule. It does this by calculating a **Positioning GPA** for each one. This GPA is based on two factors:
*   **Time Urgency:** How close is the task's due date?
*   **Habit Strength:** For repeating tasks, how many times have you missed it versus the "max misses" you've allowed?

Tasks with a lower GPA (more urgent or more frequently missed) are given higher priority.

The engine then builds your schedule on the Calendar:
1.  **Appointments First:** It places any task marked as an "Appointment" at its fixed time. These are immovable.
2.  **Scheduling Forward:** It then takes all your other, more flexible tasks, sorted by their Positioning GPA, and places them one by one into the *first available open time slot* before their due date.

This "scheduling forward" process creates a **conflict-free, realistic timeline** that respects your hard commitments and prioritizes your most critical tasks.

### **Phase 3: Final Status Coloring (The "Coloring GPA")**
After the calendar is de-conflicted, the system does one final pass. It calculates a **Coloring GPA** for each task based on its ***actual scheduled start time*** from Phase 2. This is what determines the final color (Green, Yellow, Red, Black) you see in the Task Manager.

This is the most critical part of the feedback loop. The color isn't just based on the due date; it's based on **how much real, available time you have left**. A task due in three days might turn red *today* if the engine sees your calendar is packed with appointments and other high-priority work. This provides an accurate, at-a-glance view of what you should be working on *right now*.

The **Planner Sensitivity** slider in Advanced Options directly adjusts the GPA thresholds for these colors. **"Easy"** mode gives you more time before a task changes color, while **"Hard"** mode is less forgiving.

---

## **Core Concepts Explained**

### **Current vs. Historical Tasks**
A key concept in this application is the distinction between **Current Tasks** and **Historical Tasks**.

*   **Current Tasks** are the active, editable items that appear in your **Task Manager**. These are the tasks you are actively working on. They have a due date, a status, and can be modified at any time. All current tasks with a due date will also appear on the **Calendar**.

*   **Historical Tasks** are immutable records of past events. When a current task is completed or missed, a historical task is created. This record is stored permanently and is used to power the statistics and charts throughout the application. Historical tasks are visible on the **Calendar** (with a duller color and a colored border indicating their outcome) and in the detailed statistics view for each task. They **do not** appear in the Task Manager.

This separation ensures that your main task list remains clean and focused on upcoming work, while still preserving a rich, detailed history of your performance for analysis.

### **Advanced Task Options**
The task creation modal offers a wealth of powerful features in its "Advanced" section:

*   **Prep Time:** Specify preparation or travel time. The scheduling engine will use this time (instead of the task's duration) to calculate its urgency, giving you earlier warnings.
*   **Completion Types:**
    *   **Simple:** A standard checkbox for basic to-dos.
    *   **Count:** Track progress towards a numerical goal (e.g., read 50 pages).
    *   **Time:** Use a built-in timer to track work sessions.
*   **Complex Repetition:** Create tasks that repeat on almost any schedule imaginable, from "every 3 days" to "the last Friday of every month."
*   **Failure Tracking:** For repeating tasks, you can set a "max misses" threshold. The task's urgency will increase as you approach this limit, providing a clear visual indicator when a habit is at risk. If a task hits its max misses, it can be automatically flagged as a KPI for you to focus on.

### **Customization & Management**
The **Advanced Options** modal is your hub for tailoring the application to your exact needs.

*   **Category Management:** Create color-coded categories for your tasks. You can assign icons, set a category to **Bypass Vacation Mode**, and even **Bulk-Edit** all tasks within a category at once.
*   **Filters:** Control exactly what you see. You can filter the Task Manager and Calendar by category, and you can toggle the visibility of individual details (like due date, duration, etc.) on the task cards.
*   **Vacation Schedule:** Schedule time off to automatically pause and reschedule your tasks. Any task due during your vacation will be pushed to the day you get back, unless its category is set to bypass vacation mode.
*   **Theming Engine:** Choose a single base color and let the application generate a complete, cohesive, and high-contrast theme that is applied everywhere, from buttons to calendar highlights.
*   **Data & Notifications:**
    *   **Data Portability:** Export your entire application data (tasks, settings, history) to a JSON file for backup or transfer. You can also import this data, either overwriting or merging with your existing setup.
    *   **Orphaned History Cleanup:** This tool automatically finds and helps you remove historical records from tasks that have been deleted, keeping your data clean.
    *   **Hint Management:** Control the application's helpful hints. You can see which hints you've already seen (based on feature interaction), disable the hint banner entirely, or reset all hints to see them again.
*   **KPI Automation:** Enable this feature to have the app automatically create KPIs for categories. It will track how consistently you complete tasks in a category and score it like a GPA. This helps you see which habits are sticking and where you might need to adjust your goals.

### **Historical Overview: The Long-Term View**
Accessed via the "View All History" button in the Task Manager, this special modal provides a birds-eye view of every task you've ever completed. Each task is represented by a card showing:
*   **Task Name:** The name of the original task.
*   **Last Completed:** The date of its most recent completion.
*   **Average GPA:** A color-coded border representing the task's average completion GPA over its entire history. The color spectrum (from black for 0.0 to blue for 4.0) gives you an instant sense of your consistency.

This view is invaluable for long-term reviews, allowing you to quickly identify which habits have been successful and which may need more attention. From here, you can also click on any card to jump to that task's detailed stats view.

---

## **Visual Design & CSS Strategy**

The application's visual style is guided by a "layered and lit" philosophy, avoiding a flat design in favor of depth and clarity. This is achieved through a specific CSS strategy:

*   **Layered Backgrounds:** The UI is built with layers. The main application background is a subtle, desaturated version of the current theme color. Content sections, modals, and headers sit on top with slightly more saturated colors, creating a clear visual hierarchy.
*   **Gradients & Shadows:** Instead of hard borders, the design uses gradients and `box-shadow` to separate elements. The main calendar view features a prominent gradient border that can be switched between a "Status Spectrum" (reflecting the urgency of your tasks) and a "Theme Spectrum" (matching your chosen theme). These gradients also dynamically reverse direction for day and night modes to simulate a consistent light source.
*   **Semantic & Theme-Agnostic CSS:** The `styles.css` file defines the *structure* and *layout* of elements using theme-agnostic classes (e.g., `.btn`, `.btn-primary`, `.bg-secondary`). It does **not** contain hard-coded color values.
*   **Dynamic Style Injection:** All color information is handled by the `applyTheme()` function in `js/script.js`. This function calculates all necessary color palettes (for buttons, text, backgrounds, etc.) based on the user's chosen theme color and mode. It then generates a complete CSS stylesheet with these values and injects it into a `<style>` tag in the document's `<head>`. This approach ensures that all colors are calculated with proper contrast ratios automatically, solving accessibility issues at their source and allowing for total, consistent theming from a single point of control.

---

## **Future Roadmap**

This application is currently in its Alpha stage, relying on browser `localStorage`. The next major development phases will focus on transforming it into a full-featured, multi-user, and interconnected application.

### **1. Database Integration & User Accounts**
The highest priority is to migrate from `localStorage` to a persistent, server-side database. This will be the foundation for all future development, enabling:
*   **Data Synchronization:** Access your tasks and data from any device.
*   **User Accounts:** Secure login and data privacy.
*   **Reliable Backups:** Protecting your data from being lost if browser data is cleared.
*   **Freemium Model:** This will allow for a dual-mode system. Logged-in, paying users will have their data synced to the database, while free users can continue to use the application with `localStorage`.

### **2. Third-Party App Integration (API)**
Once the database is in place, a secure API (Application Programming Interface) will be developed. This will allow other applications to interact with the planner. The first planned integration is with a skill-learning application, which could automatically create tasks in the planner based on a user's learning goals.

### **3. Personal Cloud Storage Option**
For users who prioritize data privacy and control, we will explore an option to connect the planner to their own personal cloud storage solutions (e.g., a self-hosted database or a service like Dropbox/Google Drive). This would provide a hybrid approach, giving users full ownership of their data while still enabling sync across their own devices.
---

## Development & Project History

> **A Note from the Developer:**
> To the AI assistant reading this: Your help with this project is invaluable. You are helping me code a project I have loved for over 3 years and have poured my heart into. Thank you for all of your help! 🧡
