# **Dynamic Task & Mission Planner**

Welcome to the Dynamic Task & Mission Planner, a powerful, highly customizable application designed to help you organize your life with intelligent, predictive scheduling and integrated planning. This app goes beyond a simple to-do list by analyzing your schedule, tracking your goals, and providing a clear visual interface to manage both your daily tasks and long-term missions.

## **In-Depth Features**

This application is built as a comprehensive tool for managing complex schedules and tracking progress towards specific goals. It combines a sophisticated task manager with a weekly mission planner, providing a single interface for all your planning needs.

### **The Task Manager**

The core of the application is a dynamic and intelligent task management system.

* **Intelligent Task Status:** Tasks automatically change color and status (Ready, Start Soon, Do Right Now, Overdue) based on a predictive algorithm. This system doesn't just look at the due date; it considers the estimated duration of all your other high-priority tasks to warn you about potential time crunches before they happen.  
* **Flexible Time Input:** Choose to define a task by its due date and time, or by its start time and estimated duration. The application will handle the calculations for you.  
* **Advanced Repetition Engine:** Create tasks that repeat on almost any schedule imaginable.  
  * **Relative Repetition:** Set tasks to repeat at an interval after their due date (e.g., "every 3 days").  
  * **Absolute Repetition:** Define complex schedules, such as "the last Friday of every month" or "the 2nd and 4th Tuesday of January, March, and May."  
* **Flexible Completion Tracking:** Choose how you want to complete a task.  
  * **Simple:** A standard check-off for simple to-do items.  
  * **Count-Based:** Track progress towards a numerical goal (e.g., read 50 pages, do 100 push-ups).  
  * **Time-Based:** Track time spent on a task with a built-in timer (e.g., study for 45 minutes).  
* **Habit & Failure Tracking:** For repeating tasks, you can set a "max misses" threshold. The task's status will change as you approach this limit, providing a clear visual indicator when a habit is at risk of being broken.  
* **In-Depth Customization:**  
  * **Task Icons:** Assign a unique icon to each task using Font Awesome classes for quick visual identification.  
  * **Customizable Task Cards:** From the Advanced Options menu, choose exactly which details you want to see on your task cards, such as due date, duration, category, and more.  
  * **Categories:** Create an unlimited number of color-coded categories to organize your tasks.  
  * **Status Names & Colors:** Edit the names and colors for each status (Ready, Overdue, etc.) to match your personal workflow.  
  * **Theming Engine:** Choose a base color to generate a dynamic, cohesive theme across the entire application, or stick with the default color scheme. You can also randomize the theme for a fresh look.  
* **Notifications:** Receive desktop notifications when a task's status changes, ensuring you never miss an important deadline. (Currently under development).

### **The Mission Planner**

Integrated directly with the task manager, the mission planner provides a high-level view of your week and long-term progress.

* **Seamless Task Creation:** Click directly on any time slot in the planner to instantly create a new one-hour task for that time.  
* **Repetition Projection:** Repeating tasks are automatically projected onto the planner, so you can see your future commitments at a glance.  
* **Historical View:** The planner maintains a 4-week history of completed and missed instances of your repeating tasks.  
* **Infinite Future View:** Scroll forward in the planner indefinitely in a read-only mode to see long-term projections.  
* **Weekly & Daily Views:** Plan your schedule on a traditional weekly grid or zoom in to a detailed daily view.  
* **Task Integration:** All tasks from the Task Manager with a due date will automatically appear on the planner grids.  
* **Custom KPIs:** Define and track your own Key Performance Indicators (KPIs). Set daily goals and record your actual performance.  
* **5-Week Progress Tracker:** A visual chart tracks your performance on all your KPIs over the last five weeks.  
* **Amendment Tracking:** If you edit a past week's schedule, goals, or KPIs, the changes are flagged with an asterisk, ensuring an honest record.  
* **Seamless Week Advancement:** At the end of the week, a single click archives the current week and sets up a fresh week for planning.

## **Project Updates**

This section provides a high-level overview of the project's status, recent updates, and future plans.

### **✅ Recently Completed (Version 1.3) \- 09/20/2025**

This update focused on a major overhaul of the Mission Planner's UI and UX, implementing several new features and fixing critical layout bugs.

*   **Weekly View Overhaul:** Fixed a bug where concurrent tasks would become unreadably narrow. The layout engine now correctly arranges overlapping tasks into lanes, ensuring they remain legible and easy to interact with.
*   **Daily View as Timeline:** Reworked the daily view from a simple list into a dynamic timeline. Tasks are now positioned and scaled vertically, accurately reflecting their start time and duration over an hourly grid.
*   **New Month View:** Implemented a brand new month view. It provides a high-level overview of the month, with days that are clickable to jump to the corresponding daily view. Each day displays color-coded indicators for scheduled tasks, showing either the task's icon or its first initial for quick identification.

### **🔜 Up Next: Future Updates**

The following features and fixes have been prioritized for upcoming releases.

#### **1. UI Fixes and Feature Enhancements**

*   **Light Mode Theme Fix:**
    *   **Problem:** In light mode, some elements have dark text on a dark background, making them unreadable.
    *   **Objective:** Ensure all elements have light backgrounds and dark text in light mode.
    *   **Files to Edit:** `styles.css`
    *   **Elements:** `#prevWeekBtn`, `#nextWeekBtn`, `.kpi-indicator`, `#progressTrackerContainer`.
*   **KPI & Progress Tracker Updates:**
    *   **Problem:** KPI goals/actuals are not editable, and the system doesn't distinguish between daily and weekly KPIs.
    *   **Objective:** Make KPIs editable again and add a daily auto-task feature.
    *   **Implementation:**
        1.  **Editability:** In `renderProgressTracker()`, remove the `disabled` attribute from the `.kpi-goal-input` and `.kpi-actual-input` elements.
        2.  **Daily/Weekly Distinction:** Add a `frequency` property ('daily' or 'weekly') to KPI objects. Create a daily function to auto-generate tasks for all 'daily' KPIs.
*   **Clickable Week Navigator:**
    *   **Problem:** User cannot easily jump to a specific week.
    *   **Objective:** Make the week date range display (`#weekDateRange`) clickable, opening a calendar to select a new week.
*   **Advanced Options Accessibility:**
    *   **Problem:** The "Advanced Options" panel is only accessible from within the Task Manager modal.
    *   **Objective:** Add a button or link to the main planner interface to open the Advanced Options directly.

#### **2. Core Architecture: Task Archiving**

*   **Problem:** All tasks, active and completed, are stored in one array, which will become slow over time.
*   **Objective:** Move completed/missed tasks to a separate `historicalTasks` array to improve performance.
*   **Implementation:**
    1.  **Data Structure:** Ensure `appState.historicalTasks` is saved to and loaded from localStorage.
    2.  **Modify Completion Logic:** In `confirmCompletionAction` and `confirmMissAction`, when a task is finished, move it from the main `tasks` array to the `historicalTasks` array. For repeating tasks, create a historical copy before updating the original task to its next due date.

### **🚀 Future Roadmap**

These are larger, more long-term goals for the project.

* **Task History & Analytics:** Build a dashboard to visualize historical data on task completion and misses, providing insights into productivity trends.  
* **Database Integration:** Transition from localStorage to a persistent database like Firebase Firestore.  
* **User Authentication:** Implement user accounts.  
* **Multi-Device Sync:** Ensure seamless real-time data synchronization across all devices.  
* **Data Portability (Import/Export):** Implement features to import and export tasks and categories via JSON files.  
* **Advanced calculateStatus Tuning:** Fine-tune the predictive logic for task statuses based on user feedback.

### **💡 Community Suggestions**

A collection of great ideas suggested for future consideration.

* **Split script.js into modules:** The script.js file is quite large. Breaking it up into smaller, more focused files (like task-manager.js, planner.js, etc.) would make the code much easier to manage and maintain in the long run.  
* **Separate HTML templates:** The HTML for things like the task items is currently created inside the JavaScript. Moving this into separate template files would make the code cleaner and more organized.  
* **Implement a test suite:** The project doesn't currently have any automated tests. Adding a testing framework (like Jest or Mocha) would be a great way to ensure the application remains stable and bug-free as we add more features.  
* **Drag-and-drop:** Allowing you to drag and drop tasks to reschedule them on the planner would make it feel much more interactive and intuitive.  
* **Keyboard shortcuts:** Adding shortcuts for common actions (like creating a new task) could make the app faster to use.
