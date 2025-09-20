# Dynamic Task & Mission Planner

Welcome to the Dynamic Task & Mission Planner, a powerful, highly customizable application designed to help you organize your life with intelligent, predictive scheduling and integrated planning. This app goes beyond a simple to-do list by analyzing your schedule, tracking your goals, and providing a clear visual interface to manage both your daily tasks and long-term missions.

## In-Depth Features

This application is built as a comprehensive tool for managing complex schedules and tracking progress towards specific goals. It combines a sophisticated task manager with a weekly mission planner, providing a single interface for all your planning needs.

### The Task Manager

The core of the application is a dynamic and intelligent task management system.

*   **Intelligent Task Status:** Tasks automatically change color and status (`Ready`, `Start Soon`, `Do Right Now`, `Overdue`) based on a predictive algorithm. This system doesn't just look at the due date; it considers the estimated duration of all your other high-priority tasks to warn you about potential time crunches before they happen.
*   **Flexible Time Input:** Choose to define a task by its due date and time, or by its start time and estimated duration. The application will handle the calculations for you.
*   **Advanced Repetition Engine:** Create tasks that repeat on almost any schedule imaginable.
    *   **Relative Repetition:** Set tasks to repeat at an interval after their due date (e.g., "every 3 days").
    *   **Absolute Repetition:** Define complex schedules, such as "the last Friday of every month" or "the 2nd and 4th Tuesday of January, March, and May."
*   **Flexible Completion Tracking:** Choose how you want to complete a task.
    *   **Simple:** A standard check-off for simple to-do items.
    *   **Count-Based:** Track progress towards a numerical goal (e.g., read 50 pages, do 100 push-ups).
    *   **Time-Based:** Track time spent on a task with a built-in timer (e.g., study for 45 minutes).
*   **Habit & Failure Tracking:** For repeating tasks, you can set a "max misses" threshold. The task's status will change as you approach this limit, providing a clear visual indicator when a habit is at risk of being broken.
*   **In-Depth Customization:**
    *   **Task Icons:** Assign a unique icon to each task using Font Awesome classes for quick visual identification.
    *   **Customizable Task Cards:** From the Advanced Options menu, choose exactly which details you want to see on your task cards, such as due date, duration, category, and more.
    *   **Categories:** Create an unlimited number of color-coded categories to organize your tasks.
    *   **Status Names & Colors:** Edit the names and colors for each status (`Ready`, `Overdue`, etc.) to match your personal workflow.
    *   **Theming Engine:** Choose a base color to generate a dynamic, cohesive theme across the entire application, or stick with the default color scheme. You can also randomize the theme for a fresh look.
*   **Notifications:** Receive desktop notifications when a task's status changes, ensuring you never miss an important deadline. (Currently under development).

### The Mission Planner

Integrated directly with the task manager, the mission planner provides a high-level view of your week and long-term progress.

*   **Seamless Task Creation:** Click directly on any time slot in the planner to instantly create a new one-hour task for that time.
*   **Repetition Projection:** Repeating tasks are automatically projected onto the planner, so you can see your future commitments at a glance.
*   **Historical View:** The planner maintains a 4-week history of completed and missed instances of your repeating tasks.
*   **Infinite Future View:** Scroll forward in the planner indefinitely in a read-only mode to see long-term projections.
*   **Weekly & Daily Views:** Plan your schedule on a traditional weekly grid or zoom in to a detailed daily view.
*   **Task Integration:** All tasks from the Task Manager with a due date will automatically appear on the planner grids.
*   **Custom KPIs:** Define and track your own Key Performance Indicators (KPIs). Set daily goals and record your actual performance.
*   **5-Week Progress Tracker:** A visual chart tracks your performance on all your KPIs over the last five weeks.
*   **Amendment Tracking:** If you edit a past week's schedule, goals, or KPIs, the changes are flagged with an asterisk, ensuring an honest record.
*   **Seamless Week Advancement:** At the end of the week, a single click archives the current week and sets up a fresh week for planning.

## Project Roadmap & Future Updates
This document outlines the planned features and improvements for the Modular Task Manager.

### Phase 1: Core Functionality & UX Polish (Complete)
*   **Task Icons:** Implemented the ability to associate Font Awesome icons with tasks.
*   **Customizable Task Cards:** Implemented a feature in "Advanced Options" allowing users to toggle the visibility of individual details on the task cards.
*   **Planner/Task Manager Sync:** Deeply integrated the planner and task manager, allowing for click-to-create tasks and seamless data flow between views.
*   **Planner History & Future View:** The planner now stores a 4-week history and can project repeating tasks infinitely into the future.
*   **Start Time vs. Due Time:** Users can now define tasks by their start time and duration, not just the due date.
*   **Accessibility (A11y) Audit:** Reviewed and improved the application to ensure it is more accessible to users with disabilities.

### Phase 2: Analytics & Deeper Customization
*   **Fix Notifications:** Investigate and debug the notification engine to ensure users receive timely alerts for task status changes.
*   **Task History & Analytics:** Store and visualize historical data on task completion and misses.
*   **Data Portability (Import/Export):** Implement features to import and export tasks and categories via JSON files.
*   **Advanced `calculateStatus` Tuning:** Fine-tune the predictive logic for task statuses based on user feedback.

### Phase 3: Backend & Monetization
*   **Database Integration:** Transition from `localStorage` to a persistent database like Firebase Firestore.
*   **User Authentication:** Implement user accounts.
*   **Multi-Device Sync:** Ensure seamless real-time data synchronization across all devices.
*   **Collaborative Features:** Allow users to share specific categories or tasks.
*   **Monetization:** Introduce a premium tier to unlock advanced features.

## AI Suggested Updates
Here are some suggestions for future enhancements:

### 1. Code Organization and Modularity
*   **Split `script.js` into modules:** The `script.js` file is quite large. Breaking it up into smaller, more focused files (like `task-manager.js`, `planner.js`, etc.) would make the code much easier to manage and maintain in the long run.
*   **Separate HTML templates:** The HTML for things like the task items is currently created inside the JavaScript. Moving this into separate template files would make the code cleaner and more organized.

### 2. Testing
*   **Implement a test suite:** The project doesn't currently have any automated tests. Adding a testing framework (like Jest or Mocha) would be a great way to ensure the application remains stable and bug-free as we add more features.

### 3. User Experience (UX) Enhancements
*   **Drag-and-drop:** Allowing you to drag and drop tasks to reschedule them on the planner would make it feel much more interactive and intuitive.
*   **Keyboard shortcuts:** Adding shortcuts for common actions (like creating a new task) could make the app faster to use.

### 4. Backend and Data
*   **Move to a database:** The `README.md` mentions this, and it's a great idea for the future. Moving from `localStorage` to a real database would open the door for features like user accounts and syncing your tasks across multiple devices.