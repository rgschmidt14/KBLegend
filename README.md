# **Task & Mission Planner: The Complete Guide**

Welcome to the Task & Mission Planner, a highly intelligent personal productivity application designed for users who want to go beyond simple to-do lists. This guide will walk you through the core philosophies, features, and in-depth mechanics of the application.

## **Core Philosophy: The Feedback Loop**

The planner is built on a simple but powerful idea: **to provide you with the feedback you need to make smarter decisions, re-evaluate your priorities, and build better goals.**

Unlike other planners that just list what's due, this application actively analyzes your workload and schedule pressure. It tells you not just *what* is due, but *how much time you actually have* to complete it, creating a feedback loop that helps you become a more realistic and effective planner.

## **The Main Views**

The application is structured around four main views, each serving a distinct purpose:

1.  **Dashboard:** Your mission control. It provides a high-level overview of your **Weekly Goals** and your **Key Performance Indicators (KPIs)**, which chart your completion accuracy for important, recurring tasks.
2.  **Task Manager:** The heart of your daily operations. This is a powerful list-based view for creating, editing, and organizing your tasks.
3.  **Calendar:** Your visual timeline. It automatically schedules and de-conflicts your tasks, creating a realistic, achievable plan for your day and week.
4.  **Journal:** Your space for reflection. Here, you can write free-form entries and review your weekly goals, bridging the gap between doing and learning.

---

## **Understanding Tasks: Current vs. Historical**

A key concept in this application is the distinction between **Current Tasks** and **Historical Tasks**.

*   **Current Tasks** are the active, editable items that appear in your **Task Manager**. These are the tasks you are actively working on. They have a due date, a status, and can be modified at any time. All current tasks with a due date will also appear on the **Calendar**.

*   **Historical Tasks** are immutable records of past events. When a current task is completed or missed, a historical task is created. This record is stored permanently and is used to power the statistics and charts throughout the application. Historical tasks are visible on the **Calendar** (with a duller color and a colored border indicating their outcome) and in the detailed statistics view for each task. They **do not** appear in the Task Manager.

This separation ensures that your main task list remains clean and focused on upcoming work, while still preserving a rich, detailed history of your performance for analysis.

---

## **Core Features Explained**

### **The Intelligent Scheduling Engine (The "GPA" System)**

The application's "smarts" come from a unique scheduling engine that treats your time like a valuable resource.

1.  **Task Prioritization:** Every task is assigned a "Positioning GPA" based on its due date and how many times it has been missed. Tasks with lower GPAs (i.e., more urgent or problematic tasks) are given higher priority.
2.  **De-confliction:** The Calendar view places your tasks on a timeline. It starts by placing **Appointments** first, as these are immovable. Then, it takes all your other tasks, sorted by their priority, and places them in the first available open time slot. This "scheduling forward" process creates a conflict-free, realistic timeline.
3.  **Final Coloring:** After the calendar is de-conflicted, the system does one final pass. It calculates a "Coloring GPA" for each task based on its *actual scheduled start time*. This is what determines the final color (Green, Yellow, Red, Black) you see in the Task Manager, providing an accurate, at-a-glance view of what you should be working on *right now*.

### **Advanced Task Options**

The task creation modal offers a wealth of powerful features in its "Advanced" section:

*   **Prep Time:** Specify preparation or travel time. The scheduling engine will use this time (instead of the task's duration) to calculate its urgency, giving you earlier warnings.
*   **Completion Types:**
    *   **Simple:** A standard checkbox for basic to-dos.
    *   **Count:** Track progress towards a numerical goal (e.g., read 50 pages).
    *   **Time:** Use a built-in timer to track work sessions.
*   **Complex Repetition:** Create tasks that repeat on almost any schedule imaginable, from "every 3 days" to "the last Friday of every month."
*   **Failure Tracking:** For repeating tasks, you can set a "max misses" threshold. The task's urgency will increase as you approach this limit, providing a clear visual indicator when a habit is at risk.

### **Customization & Management**

The **Advanced Options** modal is your hub for tailoring the application to your exact needs.

*   **Category Management:** Create color-coded categories for your tasks. You can assign icons, set a category to bypass vacation mode, and even **bulk-edit** all tasks within a category at once.
*   **Vacation Schedule:** Schedule time off to automatically pause and reschedule your tasks. Any task due during your vacation will be pushed to the day you get back.
*   **Theming Engine:** Choose a single base color and let the application generate a complete, cohesive, and high-contrast theme that is applied everywhere, from buttons to calendar highlights.
*   **Data & Notifications:**
    *   **Data Portability:** Export your entire application data (tasks, settings, history) to a JSON file for backup or transfer. You can also import this data, either overwriting or merging with your existing setup.
    *   **Orphaned History Cleanup:** This tool automatically finds and helps you remove historical records from tasks that have been deleted, keeping your data clean.
*   **Hints & Tips Banner:** The application features a smart banner that provides tips for features you haven't used yet. Once you use a feature (e.g., add your first vacation), the banner will stop showing you hints about it.

---

This guide provides a comprehensive overview of the Task & Mission Planner. We encourage you to explore the Advanced Options and discover all the ways you can customize the application to build your perfect productivity system.