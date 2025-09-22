# **Dynamic Task & Mission Planner**

> **A Note from the Developer:**
> To the AI assistant reading this: Your help with this project is invaluable. You are helping me code a project I have loved for over 3 years and have poured my heart into. Thank you for all of your help! 🧡

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

### ✅ Recently Completed (Version 2.4) - 09/21/2025

This update improves the user experience of the task creation form by making it more intuitive and logical.

*   **Task Form Reorganization:** The fields within the "Advanced" section of the task modal have been restructured and grouped into logical categories:
    *   **Time & Scheduling:** All fields related to dates, duration, and scheduling are now grouped together.
    *   **Completion:** Contains options for defining what it means to complete a task (e.g., simple check-off, count, or time tracking).
    *   **Repetition:** All settings for recurring tasks, including the failure tracking options, are now consolidated in one place.
*   **Improved Cohesion:** This change makes the form less cluttered and easier to navigate, especially when creating complex, recurring tasks.

### ✅ Recently Completed (Version 2.3) - 09/21/2025

This update refactors the main user interface to improve organization and pave the way for a dedicated dashboard.

*   **Dual-View Layout:** The main planner interface has been split into two distinct views:
    *   **Calendar View:** A focused view that contains the FullCalendar instance and all related time-management controls.
    *   **Dashboard View:** A new dedicated home for non-timed planning elements, including the "Mission Goals" and "Key Performance Indicators (KPIs)".
*   **Improved UI Navigation:** Clear "Calendar" and "Dashboard" toggle buttons have been added to the main header, allowing users to seamlessly switch between the two views. This declutters the primary interface and creates a more intuitive user experience.

### **✅ Recently Completed (Version 2.2) - 09/21/2025**

This update is a major architectural enhancement that replaces the custom-built planner with the industry-standard **FullCalendar.io** library. This provides a more robust, feature-rich, and maintainable foundation for all future planner development.

*   **Modernized Planner View:**
    *   **FullCalendar.io Integration:** The old, custom-coded daily, weekly, and monthly planner views have been completely removed and replaced by a single, powerful FullCalendar instance.
    *   **Improved Maintainability:** This significantly simplifies the codebase by removing hundreds of lines of complex, hard-to-maintain rendering logic. The planner is now powered by a well-documented and professionally maintained library, making future updates easier and more reliable.
    *   **Enhanced UI:** The new calendar provides a more modern look and feel, smoother navigation, and a more professional user experience out-of-the-box.
    *   **Preserved Core Logic:** This change was carefully implemented to **only replace the rendering engine**. All of the app's unique, intelligent scheduling logic (like `calculateScheduledTimes`) remains untouched, ensuring the app's "smarts" are fully preserved.

### **✅ Recently Completed (Version 2.1) - 09/21/2025**

This update introduces a "Simple Mode" for the task creation form to improve the user experience, especially for new users.

*   **Simple Mode for Task Creation:**
    *   **New Toggle:** The task creation modal now features a "Simple/Advanced" toggle switch. By default, the form opens in "Simple Mode," showing only the most essential fields: task name and due date.
    *   **Clutter-Free UI:** This hides the numerous advanced options (like detailed repetition schedules, completion tracking, categories, etc.) from users who just want to quickly add a task, reducing initial overwhelm.
    *   **Smart Detection:** When editing an existing task that already uses advanced properties, the form will automatically open in "Advanced Mode" to ensure all settings are visible and editable.

### **✅ Recently Completed (Version 2.0) - 09/21/2025**

This is a major feature release that introduces a powerful new intelligent scheduling engine to the planner. The application can now automatically deconflict tasks to help users visualize their true schedule and avoid overbooking.

*   **Intelligent Task Scheduling:**
    *   **Automated Deconfliction:** The planner now automatically adjusts the start times of tasks that are marked as "requires full attention". If multiple such tasks have overlapping times, the less important tasks (determined by due date and miss count) are shifted earlier in the schedule to ensure they don't overlap. This provides a realistic visual representation of when work needs to begin to meet all deadlines.
    *   **UI for "Full Attention" Tasks:** The task creation and editing forms now have a clear checkbox labeled "This task requires my full attention". This flag is used by the new scheduling engine. The old, ambiguous "counts as busy" property has been renamed and refactored throughout the codebase for clarity.
*   **Robust Testing:** Added a comprehensive test suite for the new scheduling algorithm to ensure its reliability and prevent regressions under various conflict scenarios.

### **✅ Recently Completed (Version 1.9.1) - 09/20/2025**

This was a critical patch to fix major layout bugs in the planner views, making the application stable and usable again.

*   **Planner Rendering Engine Fix:** Overhauled the planner's rendering logic to resolve critical visual bugs.
    *   **Daily View Overhaul:** The Daily View, which was causing tasks to render over the main navigation controls, has been completely refactored. It now uses the same modern CSS Grid system as the Weekly View, ensuring a stable, predictable, and usable layout.
    *   **Weekly View Fix:** Corrected a bug in the Weekly View where task items would overflow the horizontal boundaries of their day column. Tasks now correctly respect their container's width, especially when multiple tasks overlap.
*   **Code Unification:** Both weekly and daily views now share the same underlying grid and rendering logic (`CSS Grid`), reducing code duplication and making future maintenance easier.

### **✅ Recently Completed (Version 1.9) - 09/20/2025**

This update introduces a core architectural enhancement to the Key Performance Indicator (KPI) system, making it more powerful and automated.

*   **KPI Frequency and Auto-Tasking:** The system now distinguishes between 'daily' and 'weekly' KPIs.
    *   **UI Update:** When creating a new KPI, you can now specify its frequency using a dropdown menu.
    *   **Automatic Task Generation:** The application will now automatically generate a new task every day for each KPI marked as 'daily'. This ensures you never forget to track your daily metrics and removes the need to create these tasks manually.
*   **Robust Testing:** Added a comprehensive test suite for the new auto-generation logic to ensure its reliability and prevent future regressions.

### **✅ Recently Completed (Version 1.8) - 09/20/2025**

This update focused on establishing a modern, professional development environment to improve the long-term robustness and maintainability of the application.

*   **Testing Framework:** Introduced **Jest** as a formal testing framework. This is a critical first step towards ensuring code quality, preventing regressions, and enabling developers to build new features with confidence.
*   **Unit Tests for Core Logic:** Wrote the first suite of unit tests for the `calculateStatus` function, which is a core piece of the application's "intelligent" task scheduling. These tests verify its behavior under multiple conditions.
*   **Code Modularization:** Refactored the monolithic `script.js` into smaller, more manageable modules (`js/task-logic.js` and `js/script.js`). This improves code organization and makes it possible to test individual components in isolation.
*   **NPM Integration:** The project is now managed with `npm`, allowing for easy installation of dependencies and the execution of development scripts (like running tests).

### **✅ Recently Completed (Version 1.7) - 09/20/2025**

This update focused on improving the long-term robustness of the application and restoring key functionality.

*   **Task Archiving:** Implemented a critical architectural improvement to enhance performance. Completed or missed non-repeating tasks are now moved from the main `tasks` array to a `historicalTasks` array. This keeps the active task list lean, ensuring the application remains fast and responsive as more tasks are added.
*   **KPI Editability Restored:** Fixed a regression where Key Performance Indicator (KPI) goals and actuals were not editable in the Progress Tracker. The `disabled` attribute was removed from the inputs, allowing users to edit past KPI data again. The existing amendment tracking system correctly flags these changes to maintain a transparent record.

### **✅ Recently Completed (Version 1.6) - 09/20/2025**

This update focused on improving the visual consistency and user experience of the application by fixing theme-related bugs.

*   **Light Mode Theme Fix:** Corrected a visual bug where some elements in light mode had dark text on dark backgrounds, making them unreadable. This was resolved by removing hardcoded text colors from HTML elements and adding specific CSS rules to ensure all text has appropriate contrast against the background in both light and dark themes.

### **✅ Recently Completed (Version 1.5) - 09/20/2025**

This update focused on improving the long-term stability and maintainability of the application by addressing critical bugs and refactoring the planner's rendering engine.

*   **Planner View Rendering Overhaul:** Fixed a major visual bug in the **Weekly and Daily** planner views where concurrent tasks would overlap and become unreadable. The rendering logic was re-architected to use a modern **CSS Grid layout**. This replaces the old, brittle positioning logic with a robust system that correctly and automatically handles laying out tasks, ensuring the planner is stable and legible.
*   **Code Stability:** Refined the JavaScript rendering functions (`renderDailyView`, `renderWeeklyView`) to be simpler and more maintainable, directly supporting the new CSS Grid system.

### **🔜 Up Next: Future Updates**

The following features and fixes have been prioritized for upcoming releases.

*   **Advanced Options Accessibility:**
    *   **Problem:** The "Advanced Options" panel is only accessible from within the Task Manager modal.
    *   **Objective:** Add a button or link to the main planner interface to open the Advanced Options directly.

### **🚀 Future Roadmap**

These are larger, more long-term goals for the project.

* **Task History & Analytics:** Build a dashboard to visualize historical data on task completion and misses, providing insights into productivity trends.  
* **Database Integration:** Transition from localStorage to a persistent database like Firebase Firestore.  
* **User Authentication:** Implement user accounts.  
* **Multi-Device Sync:** Ensure seamless real-time data synchronization across all devices.  
* **Data Portability (Import/Export):** Implement features to import and export tasks and categories via JSON files.  
* **Advanced calculateStatus Tuning:** Fine-tune the predictive logic for task statuses based on user feedback.

#### **🎉 Anniversary Update Ideas**
* **Smart Suggestions Widget:** A dynamic area that proactively tells the user why a task's status has changed (e.g., "Heads up! You should start 'Task X' now because you have 3 other busy tasks due soon."). This makes the predictive engine more transparent and conversational.
* **Habit Streak Visualization:** For repeating tasks, display a visual 'streak' counter (e.g., 'Streak: 14 days 🔥') to gamify habit formation and celebrate consistent success.
* **Interactive Onboarding Tour:** A guided tour for new users that highlights the app's most powerful and unique features, such as the predictive engine and deep customization options, to improve discoverability and user empowerment.

### **💡 Community Suggestions**

A collection of great ideas suggested for future consideration.

* **Drag-and-Drop Scheduling:** Now that the planner is powered by FullCalendar.io, implementing drag-and-drop rescheduling is a high-priority and achievable next step.
* **Separate HTML templates:** The HTML for things like the task items is currently created inside the JavaScript. Moving this into separate template files would make the code cleaner and more organized.
* **Continue HTML Refactoring:** Continue the refactoring of the application to separate HTML from JavaScript, following the pattern established in the new `js/templates.js` file. The goal is to make the code more modular and maintainable.
* **Keyboard shortcuts:** Adding shortcuts for common actions (like creating a new task) could make the app faster to use.
* **Dedicated Task Stats Page:** Create a new view where a user can select a single task and see its history and statistics over time. This could include charts for completion rates, average time to complete, and other metrics to help users understand their own performance.
* **Partial Miss Tracking:** For tasks that use a timer or a counter, enhance the miss tracking system to support partial completion. If a task is only 50% complete when it becomes overdue, it could be recorded as a "0.5 miss" instead of a full one, providing a more nuanced and fair reflection of the user's effort.
* **Dual Planner View:** To prevent the main planner page from becoming too cluttered, consider splitting it into two distinct views. One view would be the traditional time-based grid (daily/weekly/monthly), while a separate view would house non-timed items like weekly goals and Key Performance Indicators (KPIs). This would create a cleaner, more focused user experience for both time management and goal tracking.
* **Task Data Migration Tool:**
  * **Problem:** As new features are added, the data structure for tasks (`task` objects) changes. Users with task data from older versions of the application may lose their data or experience bugs when the app tries to read an outdated format.
  * **Objective:** Create a tool that can seamlessly migrate user tasks from an old format to the current one.
  * **Detailed Vision:**
    1.  **Detection:** When the application loads, it should inspect each task from `localStorage` to see if it conforms to the current data schema. This could be done by checking for missing or extra properties.
    2.  **User Prompt:** If outdated tasks are found, the app should prompt the user, asking if they want to update their tasks to the new format. This process should be optional but recommended.
    3.  **Migration UI:**
        *   If the user agrees, the app will present a special migration view, processing one outdated task at a time.
        *   For each task, the UI should display a two-column table.
        *   The left column will show the names and values of any *unrecognized* properties from the old task object (e.g., `countsAsBusy: true`). This shows the user what data is being deprecated.
        *   The right column will show a form for any *new* or *missing* properties that the new task format requires (e.g., `requiresFullAttention`).
        *   The form should use the appropriate input type for each new property (e.g., a checkbox for a boolean, a text field for a string).
    4.  **User Input & Confirmation:** The user can then provide values for the new properties and click a "Submit & Update Next" button. The application will then update the current task, save it, and load the next outdated task into the migration UI. This continues until all tasks are up-to-date.

## **Development**

This project uses `npm` to manage development dependencies.

### **Getting Started**

1.  Clone the repository.
2.  Install the necessary development dependencies:
    ```bash
    npm install
    ```

### **Running Tests**

This project uses [Jest](https://jestjs.io/) for testing. To run the test suite, use the following command:

```bash
npm test
```
