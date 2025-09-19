# Pilot's Mission Planner & Task Manager

Welcome to the Pilot's Mission Planner & Task Manager, a powerful, highly customizable application designed to help you organize your life with intelligent, predictive scheduling and integrated planning. This app goes beyond a simple to-do list by analyzing your schedule, tracking your goals, and providing a clear visual interface to manage both your daily tasks and long-term missions.

## In-Depth Features

This application is built as a comprehensive tool for managing complex schedules and tracking progress towards specific goals. It combines a sophisticated task manager with a weekly mission planner, providing a single interface for all your planning needs.

### The Task Manager

The core of the application is a dynamic and intelligent task management system.

*   **Intelligent Task Status:** Tasks automatically change color and status (`Ready`, `Start Soon`, `Do Right Now`, `Overdue`) based on a predictive algorithm. This system doesn't just look at the due date; it considers the estimated duration of all your other high-priority tasks to warn you about potential time crunches before they happen.
*   **Advanced Repetition Engine:** Create tasks that repeat on almost any schedule imaginable.
    *   **Relative Repetition:** Set tasks to repeat at an interval after their due date (e.g., "every 3 days").
    *   **Absolute Repetition:** Define complex schedules, such as "the last Friday of every month" or "the 2nd and 4th Tuesday of January, March, and May."
*   **Flexible Completion Tracking:** Choose how you want to complete a task.
    *   **Simple:** A standard check-off for simple to-do items.
    *   **Count-Based:** Track progress towards a numerical goal (e.g., read 50 pages, do 100 push-ups).
    *   **Time-Based:** Track time spent on a task with a built-in timer (e.g., study for 45 minutes).
*   **Habit & Failure Tracking:** For repeating tasks, you can set a "max misses" threshold. The task's status will change as you approach this limit, providing a clear visual indicator when a habit is at risk of being broken.
*   **In-Depth Customization:**
    *   **Categories:** Create an unlimited number of color-coded categories to organize your tasks.
    *   **Status Names & Colors:** Edit the names and colors for each status (`Ready`, `Overdue`, etc.) to match your personal workflow.
    *   **Theming Engine:** Choose a base color to generate a dynamic, cohesive theme across the entire application, or stick with the default color scheme. You can also randomize the theme for a fresh look.
*   **Notifications:** Receive desktop notifications when a task's status changes, ensuring you never miss an important deadline.

### The Pilot's Mission Planner

Integrated directly with the task manager, the mission planner provides a high-level view of your week and long-term progress.

*   **Weekly & Daily Views:** Plan your schedule on a traditional weekly grid or zoom in to a detailed daily view.
*   **Task Integration:** All tasks from the Task Manager with a due date will automatically appear on the planner grids, giving you a visual representation of your scheduled commitments.
*   **Custom KPIs:** Define and track your own Key Performance Indicators (KPIs). Set daily goals and record your actual performance to see how you're tracking against your objectives.
*   **5-Week Progress Tracker:** A visual chart tracks your performance on all your KPIs over the last five weeks, allowing you to easily spot trends and measure progress over time.
*   **Amendment Tracking:** If you edit a past week's schedule, goals, or KPIs, the changes are flagged with an asterisk, ensuring a clear and honest record of your planning and performance.
*   **Seamless Week Advancement:** At the end of the week, a single click archives the current week, rolls over your plans, and sets up a fresh week for planning.

## Project Roadmap & Future Updates
This document outlines the planned features and improvements for the Modular Task Manager.

### Phase 1: Core Functionality & UX Polish
*   **Fix Notifications:** Investigate and debug the notification engine to ensure users receive timely alerts for task status changes.
*   **Responsive Calendar View:** Refactor the CSS for `calendar.html` to ensure it displays correctly on all screen sizes.
*   **Customizable Task Cards:** Implement a feature in "Advanced Options" allowing users to toggle the visibility of individual details on the task cards.
*   **Accessibility (A11y) Audit:** Review the application to ensure it is fully accessible to users with disabilities.

### Phase 2: Analytics & Deeper Customization
*   **Task History & Analytics:** Store and visualize historical data on task completion and misses.
*   **Data Portability (Import/Export):** Implement features to import and export tasks and categories via JSON files.
*   **Advanced `calculateStatus` Tuning:** Fine-tune the predictive logic for task statuses based on user feedback.

### Phase 3: Backend & Monetization
*   **Database Integration:** Transition from `localStorage` to a persistent database like Firebase Firestore.
*   **User Authentication:** Implement user accounts.
*   **Multi-Device Sync:** Ensure seamless real-time data synchronization across all devices.
*   **Collaborative Features:** Allow users to share specific categories or tasks.
*   **Monetization:** Introduce a premium tier to unlock advanced features.