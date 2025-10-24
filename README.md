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

Welcome to the Dynamic Task & Mission Planner, a powerful, highly customizable application designed to help you organize your life with intelligent, predictive scheduling and integrated planning. This app goes beyond a simple to-do list by analyzing your schedule, tracking your goals, and providing a clear visual interface to manage both your daily tasks and long-term missions.

## **The Three Pillars of the Planner**

This application is built on three core principles that set it apart from standard to-do lists and planners. The overarching goal is to provide users with the feedback they need to make smart decisions, re-evaluate their criteria for tasks, and build smarter goals in general. This philosophy is woven into the following pillars:

*   **1. Intelligent & Predictive Scheduling:** The planner doesn't just show you what's due; it predicts your future workload. The `calculateStatus` engine analyzes the time required for all high-priority tasks and warns you *before* you run out of time to complete them. It's a proactive system designed to prevent crises, not just report on them.

*   **2. Deep Customization & Theming:** Your planner should look and feel the way *you* want. The advanced theming engine allows you to generate a complete, cohesive, and accessible color palette from a single base color. This theme is applied globally, from buttons and backgrounds to calendar highlights and status colors, ensuring a personalized and readable experience.

*   **3. Integrated Task & Goal Management:** The application seamlessly combines a powerful daily task manager with a high-level mission and KPI tracker. You can manage granular to-do items with complex repetition schedules (e.g., "the last Friday of every month") while also tracking your progress on long-term goals and performance indicators, all within a single, unified interface.

## **Functionality of the App**

This section details the core user-facing functionality of the application, explaining how key features behave.

*   **Early & On-Time Task Completion:**
    *   When a user clicks "Complete" on a task (either a repeating or non-repeating one), a historical record of the completion is immediately created. This record is visible in the "Detailed History" of the task's statistics view.
    *   The task then enters a "locked" (blue) state. It will remain in this state until its original due date passes. This prevents a user from accidentally completing a task multiple times before its cycle is over.
    *   For non-repeating tasks, once the original due date passes, the task is automatically removed from the active task list, completing its lifecycle.

*   **Undo Functionality:**
    *   While a task is in the "locked" (blue) state after being completed, an "Undo" button is available.
    *   Clicking "Undo" and confirming the action will perform the following:
        1.  It finds the most recent "completed" record for that task in the history and removes it.
        2.  It restores any partial progress the task had before it was completed (e.g., for timer- or counter-based tasks).
        3.  It reverts the task's status from "blue" back to its calculated active state (e.g., green, yellow, or red).
        4.  For a non-repeating task, it clears the internal `completed` flag, making it fully active again.
    *   Once the task's original due date passes and it is no longer blue, the "Undo" option is no longer available.

## **In-Depth Features**

This application is built as a comprehensive tool for managing complex schedules and tracking progress towards specific goals. It combines a sophisticated task manager with a weekly mission planner, providing a single interface for all your planning needs.

### **The Task Manager**

The core of the application is a dynamic and intelligent task management system.

* **Intelligent Task Status:** Tasks automatically change color and status (Ready, Start Soon, Do Right Now, Overdue) based on a predictive algorithm. This system doesn't just look at the due date; it considers the estimated duration of all your other high-priority tasks to warn you about potential time crunches before they happen.
*   **How `calculateStatus` Works:** The `calculateStatus` function is the predictive engine that drives the application's intelligent warnings. It's triggered whenever tasks are loaded, modified, or periodically in the background. Here’s a breakdown of its logic:
    1.  **Immediate Overdue Check:** The first thing it does is check if a task's due date is in the past. If so, it's immediately marked `red` (or `black` if the miss ratio is high).
    2.  **Time-to-Due Buffers:** It checks if the time remaining is less than the task's estimated duration (making it `red`) or less than twice the estimated duration (making it `yellow`). This provides a simple, direct warning if you're cutting it close.
    3.  **Predictive Workload Analysis:** This is the core of the intelligent system. It calculates the sum of the remaining estimated durations of all other *active, high-priority* tasks.
        *   It first checks if the current time plus the sum of all other `red` and `yellow` tasks would push you past the due date of the task being calculated. If so, this task becomes `red`.
        *   It then performs a wider check, summing the estimates of all `red`, `yellow`, and *soon-to-be-yellow* tasks (those due within the next 16 hours). If that total workload pushes you past the due date, the task becomes `yellow`.
    4.  **Miss Ratio Escalation:** For repeating tasks, the system checks the current `misses` against the `maxMisses`. If the ratio exceeds 50%, the status is escalated to the next level of urgency (e.g., `green` becomes `yellow`, `yellow` becomes `red`). If the ratio reaches 100%, the task is marked `black` (failed).
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
  * **Reorganized Advanced Options:** The Advanced Options menu has been completely reorganized for clarity and ease of use. Sections have been renamed and reordered into more intuitive groups: Theme and Color, Naming, Planner Sensitivity, Category Management, Vacation Schedule, Other Features, and Data & Notifications. All sections remain collapsible, and your preferences are saved automatically.
  * **Categories:** Create an unlimited number of color-coded categories to organize your tasks.
  * **Status Names & Colors:** Edit the names and colors for each status (Ready, Overdue, etc.) to match your personal workflow.
  * **Advanced Theming Engine:** The application features a powerful, dynamic theming system that ensures readability and a cohesive look across the entire interface.
    *   **One-Click Palettes:** From the "Advanced Options" menu, enable the theme and select a single "base color." The application instantly generates a full, complementary palette for backgrounds, buttons, accents, and even the five status colors used for tasks.
    *   **Dynamic Contrast:** To guarantee text is always readable, the system automatically calculates the luminance of any background color. It then selects from a palette of four white shades or four black shades (ranging from 100% pure to 55% gray) to provide optimal contrast. This is handled via CSS custom properties (`--text-color-primary`, etc.) that are applied automatically.
    *   **Global Application:** The generated theme is applied everywhere, including the main background, modal windows, all buttons, the "current day" and "current time" indicators on the calendar, and category colors.
    *   **Easy Integration:** To make a new element compatible with the theming engine, simply assign it the appropriate class (e.g., `themed-button-primary`). Avoid hardcoded color classes (like `bg-blue-600`) as these will override the dynamic theme styles. The core logic can be found in the `applyTheme` and `getContrastingTextColor` functions in `js/script.js`.
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

### **The Journal**

The Journal provides a space for free-form entries and serves as a log for your weekly goals.

*   **Free-form Entries:** Create, edit, and delete journal entries with a title, content, and an optional icon.
*   **Weekly Goal Logging:** The journal automatically displays your weekly goals, providing a historical record of your focus over time.
*   **Flexible Sorting:** View your entries chronologically (grouped by week) or grouped by their assigned icon.
*   **Customizable Goal Icon:** To better integrate weekly goals into your categorized view, you can now set a custom icon for them.
    *   In `Advanced Options` > `Journal Settings`, you can specify any Font Awesome icon class (e.g., `fa-solid fa-bullseye`).
    *   When sorting the journal by icon, all your weekly goals will be grouped under this custom icon.
*   **Collapsible Icon Groups:** To make the icon-sorted view easier to navigate, icon groups are now collapsible.
    *   Click the header of any icon group to expand or collapse it.
    *   The application will remember the state of each group, so your preferences are saved for your next visit.
    *   The system is dynamic: if you delete all entries for a specific icon, its collapse/expand setting is automatically removed.

## **Project Updates**

This section provides a high-level overview of the project's status, recent updates, and future plans.

### ✅ Recently Completed (Version 5.8) - 10/05/2025

This is a major enhancement to the calendar's scheduling and deconfliction engine, making it fully vacation-aware and more user-friendly.

*   **Intelligent Vacation Lookahead:** Fixed a bug where tasks due immediately after a vacation would not be visible to the scheduling engine. The calendar now intelligently "looks ahead" past any scheduled vacation periods to fetch tasks, ensuring that the user's true workload is always visible.
*   **Vacation-Aware Deconfliction:** The task deconfliction algorithm has been improved. If a high-priority task (like "Sleep") pushes another task backward in the schedule, the algorithm will now ensure the pushed task does not land in a vacation period. If it does, the task is automatically "jumped" to the time immediately preceding the vacation, preventing tasks from being scheduled during time off.
*   **User-Friendly Confirmation for Schedule Changes:** To prevent unexpected changes, a confirmation modal now appears whenever a vacation is added/deleted or a category's "Bypass Vacation" setting is changed. This modal clearly lists all tasks that will be rescheduled, showing their old and new due dates, and allowing the user to confirm or cancel the action.
*   **Smarter Recurring Task Scheduling:** The logic for calculating the next due date for a repeating task is now fully vacation-aware. When a task is completed, its next occurrence will automatically be scheduled on the first available non-vacation day, respecting the "Bypass Vacation" category setting.

### ✅ Recently Completed (Version 5.7) - 10/05/2025

This is a major enhancement to the calendar's scheduling and deconfliction engine, making it fully vacation-aware.

*   **Intelligent Vacation Lookahead:** Fixed a bug where tasks due immediately after a vacation would not be visible to the scheduling engine. The calendar now intelligently "looks ahead" past any scheduled vacation periods to fetch tasks, ensuring that the user's true workload is always visible.
*   **Vacation-Aware Deconfliction:** The task deconfliction algorithm has been improved. If a high-priority task (like "Sleep") pushes another task backward in the schedule, the algorithm will now ensure the pushed task does not land in a vacation period. If it does, the task is automatically "jumped" to the time immediately preceding the vacation, preventing tasks from being scheduled during time off.

### ✅ Recently Completed (Version 5.6) - 10/05/2025

This is a comprehensive UI/UX and feature update focused on fixing core issues with the Journal and Weekly Goals, and adding powerful new customization options.

*   **Fixed Weekly Goal Persistence & Lifecycle:**
    *   **Reliable Saving:** The "Mission/Goals for this Week" on the dashboard now saves reliably and is correctly reloaded when the page is refreshed or when navigating between views.
    *   **Seamless Journal Integration:** The journal view now updates immediately when the weekly goal is changed, providing a smoother user experience.
*   **Corrected Journal Theming:**
    *   **High-Contrast Day Mode:** Fixed a critical bug where journal entries and controls were unreadable in day mode. All journal components now have proper background and text colors, ensuring high contrast and readability in all themes.
*   **Improved Journal Display Logic:**
    *   **Pinned Weekly Goals:** The journal view has been refactored to always "pin" the weekly goal to the top of its corresponding week, regardless of sorting order. A week's goal will now appear even if no other entries have been made for that week.
*   **New! Application Customization:**
    *   **Custom Branding:** From the "Advanced Options" menu, you can now customize the application's main **Title**, **Subtitle**, and the **Weekly Goal Label** to personalize your planner. These settings are saved and loaded automatically.

### ✅ Recently Completed (Version 5.5) - 10/04/2025

This is a critical stability and reliability release that addresses several long-standing bugs related to data persistence and UI interaction, ensuring a smoother and more dependable user experience.

*   **Guaranteed Data Persistence:** Fixed a critical bug that could cause journal entries and weekly goals to be deleted upon reloading the application. This was caused by a race condition where the application would save its state before all data was fully loaded. A new initialization-aware saving mechanism has been implemented to prevent this, guaranteeing that your data is always safe.
*   **Seamless Calendar Interaction:** Resolved an error where clicking on active or future repeating tasks in the calendar would fail to open the task view. The event handling logic now correctly uses the stored base ID of the task, ensuring that any instance of a task on the calendar can be reliably opened.

### ✅ Recently Completed (Version 5.4) - 10/04/2025

This is a major feature release that introduces a powerful new "Vacation Mode" to prevent task pile-ups during time off, along with several critical bug fixes and developer tool improvements.

*   **New! Vacation Mode:**
    *   **Schedule Time Off:** From the "Advanced Options" menu, users can now schedule vacation periods with a start and end date.
    *   **Automatic Task Pushing:** Any task whose due date falls within a scheduled vacation is now automatically pushed to the day after the vacation ends, preserving the original time of day. This prevents users from returning to a mountain of overdue tasks.
    *   **Category-Based Bypass:** A new "Bypass Vacation" option has been added to each category's settings. Tasks in a category with this option enabled (e.g., "Medication") will ignore vacation mode and remain on their original schedule.
    *   **Intelligent Repetition:** The logic for calculating the next due date for repeating tasks is now fully vacation-aware, ensuring that the next instance of a task is never scheduled during a vacation period.

*   **Critical Bug Fixes:**
    *   **Safe Historical Deletion:** Fixed a critical bug where attempting to delete a historical task record from the calendar view would incorrectly delete the active parent task. Clicking on a historical event now provides a safe, context-specific "Delete This Record" option that only removes that single entry.
    *   **Icon Picker UI:** Resolved a UI bug where the icon picker modal could appear underneath the Advanced Options menu, making it impossible to use. The picker now correctly renders on top of all other modals.

*   **Developer & Theming Tools:**
    *   **Smarter Contrast Checker:** The internal contrast checking tool has been significantly improved. It now correctly handles elements with transparent backgrounds by checking against the first visible parent background, eliminating false-positive warnings for clear buttons.
    *   **Contrast Fixes:** Based on the improved checker, several real contrast issues were fixed, including updating the default red status color to a more accessible shade. The tool is no longer run automatically for end-users but is preserved for internal pre-commit checks.

### ✅ Recently Completed (Version 5.1) - 10/03/2025

This is a major UI/UX and stability update that addresses key user feedback points across the application, from statistics and task management to theming and the journal.

*   **Statistics and History Fixes:**
    *   **Intuitive Stats Graph:** Fixed a bug in the task statistics chart that was causing confusion. The "Performance Over Time" graph now correctly groups completions and misses by individual day, not by the start of the week, providing a more accurate and intuitive visualization of performance.
    *   **Historical Task Deletion:** Users can now delete historical task entries directly from the "Detailed History" list in the stats view. A new inline confirmation provides options to delete a single entry, delete *all* historical entries for that specific task, or cancel the action.
*   **Improved Deletion Workflows:**
    *   **Inline Calendar Deletion:** The workflow for deleting a task from the calendar view has been completely overhauled. Instead of the old confirmation system, clicking "Delete Task" now shows a clean, inline confirmation UI directly within the task view modal, complete with a dashed red border to indicate a destructive action.
*   **UI and Theming Enhancements:**
    *   **Journal Button Styling:** The "New Entry" button in the Journal view has been restyled as a primary action button, making it more prominent and consistent with the "New Task" button.
    *   **Theme Stability:** Fixed a bug where disabling the gradient theme in "Night" or "Auto" mode would cause the main application background to become bright white. The background now correctly remains dark, ensuring a consistent night mode experience.
    *   **Automatic Contrast Checking:** A new diagnostic tool has been built into the theming engine. It automatically runs a WCAG-compliant contrast check on key UI elements every time the theme is changed and logs a warning to the console if any element has insufficient text-to-background contrast. This ensures readability is maintained across all themes.

### ✅ Recently Completed (Version 5.0) - 10/03/2025

This update focused on expanding customization options and improving the Journal UI.

*   **Enhanced Icon Library:** Significantly expanded the set of available icons for tasks, categories, and journal entries. Added several new categories ("Nature & Weather," "Animals," "Gaming & Hobbies," "Symbols & Shapes") and populated all categories with many more icon choices from Font Awesome.
*   **Journal UI/UX Improvements:**
    *   **Cleaner Icon Sorting:** When sorting the journal by icon, the group headers now display a clean, human-readable name (e.g., "Productivity" or "Star") instead of the raw Font Awesome class name.
    *   **Conditional Goal Display:** Confirmed that the weekly goal is correctly displayed at the top of the journal entries for the relevant week *only* when sorting by date, as intended.

### ✅ Recently Completed (Version 4.9) - 10/03/2025

This update introduces the foundational Journal feature, improves UI/UX by relocating key controls, and fixes a persistent data-saving bug.

*   **New! Journal Feature (Phase 1):**
    *   **Dedicated View:** A new "Journal" view has been added to the main navigation, providing a dedicated space for daily entries.
    *   **Create & Edit:** Users can create new journal entries with a title, a rich-text content area, and an optional icon. Existing entries can be edited or deleted.
    *   **Data Persistence:** All journal entries are saved to `localStorage`, ensuring they persist between sessions. Entries are displayed in reverse chronological order.
*   **UI/UX Improvements:**
    *   **Accessible Sorting:** The sorting controls for the Task Manager (Sort By, Direction) have been moved from the Advanced Options modal directly into the Task Manager header, making them immediately accessible.
    *   **Category Icons:** Categories can now have an icon assigned to them. A new "Auto-apply icon" checkbox in the category settings allows this icon to be automatically populated in the new task form when the category is selected.
*   **Bug Fixes:**
    *   **Weekly Goal Saving:** Fixed a critical bug where weekly goals were not being saved to the correct week. Goals are now always saved to the current week, regardless of which week is being viewed on the calendar.

### ✅ Recently Completed (Version 4.8) - 10/02/2025

This is a comprehensive overhaul of the task history and scheduling engine, resolving critical bugs related to duplicate tasks, incorrect calendar placement, and visual clarity.

*   **Corrected Task History Logic:**
    *   **No More Duplicates:** Fixed the root cause of task duplication. Non-repeating tasks are now correctly moved to a separate `historicalTasks` array upon completion or miss, permanently removing them from the active task list.
    *   **Accurate Calendar Placement:** Historical tasks now appear on the calendar on the day they were *due*, not the day they were marked as completed. This provides a true and intuitive reflection of past schedules.
    *   **Clean Future Projections:** The calendar no longer projects active tasks into the past. The scheduling view is now exclusively for upcoming events, eliminating visual clutter.

*   **Enhanced Historical Task Styling:**
    *   **At-a-Glance Status:** Historical tasks on the calendar now feature a detailed, color-coded border to indicate their exact outcome:
        *   `Blue`: Completed ahead of schedule.
        *   `Green`: Completed on or after the due date.
        *   `Yellow`: Partially completed (e.g., more than 50% of a timed task).
        *   `Red`: Mostly missed (e.g., less than 50% of a timed task).
        *   `Black`: A complete miss (0% progress).
    *   **Improved Data Granularity:** The history system now stores both the time a task was due (`originalDueDate`) and the time the user took action (`actionDate`) to enable this precise styling.

*   **Robust Repetition Handling:**
    *   **Accurate Cycle Tracking:** The logic for handling overdue repeating tasks has been completely refactored. When a user confirms multiple pending cycles at once, the system now correctly creates a distinct and accurately dated historical entry for *every single* cycle, whether it was completed or missed. This ensures perfect data integrity for user statistics.

### ✅ Recently Completed (Version 4.7) - 10/02/2025

This update resolves a long-standing issue with "ghost" events on the calendar and introduces a powerful data integrity tool to give users more control over their data.

*   **Orphaned History Cleanup Tool:**
    *   **Problem Solved:** Fixed the root cause of non-interactive, un-deletable "ghost" events appearing on the calendar. These were caused by historical records from tasks that had been deleted.
    *   **Automated Detection:** The application now automatically scans for these orphaned records every time it starts.
    *   **Interactive Cleanup:** If any orphaned records are found, a new "Orphaned History Cleanup" tool will appear. This tool presents a clear list of all orphaned records, allowing the user to select exactly which ones to delete. This provides fine-grained control and prevents accidental data loss.
    *   **Improved Data Integrity:** This new feature ensures that the calendar remains clean and that all displayed events correspond to active, editable tasks.

### ✅ Recently Completed (Version 4.6) - 10/02/2025

This update introduces several key UI/UX improvements for better task management and fixes a critical bug in how historical data is recorded, ensuring the accuracy of user statistics.

*   **Enhanced Task Management UI:**
    *   **Direct Deletion:** A "Delete Task" button has been added directly to the task details view, streamlining the workflow for removing tasks without needing to go back to the main list.
    *   **Consistent Button Styling:** The "View Statistics," "Edit Task," and "Back to Details" buttons have been updated with a clear, theme-adaptive style for a cleaner and more modern user interface.
    *   **Theme Correction:** Fixed a bug where text in the task statistics and history views would become unreadable. These views now correctly respect the application's theming, ensuring legibility in both light and dark modes.
*   **Accurate History & Statistics Tracking:**
    *   **Corrected Confirmation Logic:** Fixed a major bug in how task completions and misses were recorded for overdue repeating tasks. When confirming multiple pending cycles at once, the system now correctly creates a distinct historical entry for *each* individual cycle, whether it was completed or missed.
    *   **Intelligent Partial Confirmations:** When a user confirms a mix of completions and misses, the logic now correctly assigns completions to the earliest overdue dates and misses to the latest, ensuring the user's history and statistics are accurate.

### ✅ Recently Completed (Version 4.5) - 10/02/2025

This is a major update that fixes a long-standing, critical bug in the scheduling engine and introduces several significant UI and readability improvements to the calendar.

*   **Corrected Scheduling Rollover Logic:** Fixed a critical bug where tasks that were pushed from a future week into the current week's view by the deconfliction algorithm would fail to render. The event generation pipeline has been refactored, centralizing all scheduling and occurrence logic into a single function. This ensures that the calendar now provides a completely accurate representation of the user's deconflicted schedule, regardless of how far tasks are moved.
*   **Enhanced Calendar Readability & UI:**
    *   **Improved Text Handling:** All event titles on the calendar, regardless of duration, now correctly truncate with an ellipsis (`...`) to prevent text from overflowing its container.
    *   **Consistent Short Task Display:** Tasks under 30 minutes in the Day View now behave like the Week View, hiding the time and showing only the task name for a cleaner look.
    *   **Improved Legibility:** The font size for all calendar events has been slightly increased for better readability.
    *   **Night Mode Polish:** The unnecessary white border that appeared around tasks in night mode has been removed, giving events more space and a cleaner appearance.

### ✅ Recently Completed (Version 4.4) - 10/02/2025

This update focused on resolving critical theme-related bugs and improving the accuracy of the calendar's visual display.

*   **Corrected Theme Engine:** Fixed several issues with the application's theming system.
    *   **Title Visibility:** Resolved a bug where the main application title would become invisible when the theme was disabled. This was caused by a hardcoded text color that has now been removed, allowing the title to correctly adapt to the background.
    *   **"Auto" Theme Fix:** The "Auto" theme mode now correctly and instantly detects the user's system preference (light or dark) and applies the appropriate theme without requiring a page reload.
*   **Improved Calendar Color-Coding:** The calendar now uses a more intuitive coloring system to convey information at a glance.
    *   **Category Coloring:** The background color of a calendar event is now determined by its assigned category color, making it easy to see the distribution of different types of tasks.
    *   **Status Border:** The border color of an event now represents its status (e.g., green for 'Ready', red for 'Do Right Now'), providing an immediate visual cue for task urgency.
    *   **Future Task Status:** Future occurrences of a repeating task that is currently overdue are now correctly colored blue (locked), making it clear that they cannot be acted upon.

### ✅ Recently Completed (Version 4.3) - 10/02/2025

*   **Improved Calendar Readability:**
    *   **Short Event Styling:** Tasks shorter than 30 minutes on the calendar now have improved styling. The text is vertically centered, and overflow is handled with an ellipsis (...) to prevent text from wrapping or overflowing the event container.
    *   **Historical Task Display:** The calendar has been decluttered. It now only displays historical tasks (completed or missed) from the last seven days, providing a cleaner and more relevant view of recent activity.
    *   **Future Task Coloring:** Fixed a bug where future occurrences of an overdue repeating task were incorrectly colored red. They are now correctly colored blue (locked), indicating they cannot be acted upon until the current instance is resolved.
*   **New History Deletion Feature:** A "Delete All History" button has been added to the "Danger Zone" within the Advanced Options menu. This allows users to permanently clear all task completion and miss records, providing a way to start fresh without deleting the tasks themselves.

### ✅ Recently Completed (Version 4.2) - 10/02/2025

*   **Fixed Critical Initialization Bug:** Resolved a JavaScript error that occurred during application startup, which was preventing the calendar from being displayed. The error was caused by leftover code from a deprecated feature that was trying to access HTML elements that no longer exist.
*   **Corrected Calendar View Button Styling:** Fixed a persistent UI bug where the "Day," "Week," and "Month" view buttons would not update their visual style correctly when the calendar view was changed. This was resolved by addressing a race condition between the view change event and the application of the theme.
*   **Reduced Console Noise:** Removed several unnecessary `console.log` statements from the notification engine to provide a cleaner and more professional development experience.

### ✅ Recently Completed (Version 4.1) - 10/02/2025

*   **Themed "Current Time" Indicator:** The calendar now features a "current time" indicator line in the day and week views. The color of this indicator is dynamically tied to the application's theme, ensuring it is always visible and matches the user's chosen aesthetic.
*   **Enhanced Calendar Navigation:** Clicking on a date header in the week view now seamlessly navigates the user to the corresponding day view, improving the ease and speed of schedule navigation.

### ✅ Recently Completed (Version 4.0) - 10/02/2025

*   **Themed "Current Day" Highlight:** The calendar's highlight for the current day now dynamically adapts to the selected theme. It uses a semi-transparent version of the theme's primary accent color for the background and automatically selects a high-contrast text color for the date, ensuring readability. This highlight is applied to the month and week views, but correctly omitted from the day view where it is not needed. The default day and night mode colors have also been improved for better visual appeal.

### ✅ Recently Completed (Version 3.9) - 10/02/2025

This update includes two critical fixes to the task scheduling and data handling logic, improving the stability and correctness of the calendar view.

*   **Corrected Deconfliction Sorting:** Fixed a logical flaw in the scheduling algorithm. When two tasks that require full attention conflict, the task with the *later* due date is now correctly treated as the anchor, and the task with the earlier due date is scheduled before it. This ensures that long-term tasks don't incorrectly push short-term, urgent tasks too far into the past.
*   **Fixed Date Object Handling:** Resolved a critical bug where `Date` objects were being improperly converted to strings during the scheduling process. This prevented the calendar from rendering events. The cloning mechanism now correctly preserves `Date` objects, ensuring the calendar displays all scheduled tasks reliably.

### ✅ Recently Completed (Version 3.8) - 10/02/2025

This update focused on improving the legibility of the calendar and ensuring UI consistency.

*   **Improved Small Task Legibility:** Tasks under 30 minutes in the calendar view now use a smaller font and have reduced padding to ensure the task name is always readable. For very short tasks in the weekly view, the time is now omitted to prevent visual clutter.
*   **Themed Import Buttons:** The data import and migration buttons in the Advanced Options menu now correctly use the `themed-button-clear` style, ensuring they adapt to the application's day/night and custom gradient themes.

### ✅ Recently Completed (Version 3.7) - 10/01/2025

This update overhauls the task history system, ensuring data is never lost, and dramatically improves the calendar's ability to visualize both past performance and future commitments.

*   **Robust Task History Persistence:**
    *   **Persistence Fix:** Resolved a critical bug where task history could be lost on page reload if the main data object was from an older version. History is now stored in its own dedicated, isolated entry in local storage, making it immune to corruption in other data areas.
    *   **Automatic Data Migration:** A one-time, automatic migration process has been added. The application now detects if a user has history stored in the old format and seamlessly moves it to the new, safer location, ensuring no data is lost during the update.
*   **Enhanced Calendar View:**
    *   **Historical Task Display:** The calendar now displays your completed and missed tasks from the past, providing a complete picture of your activity.
    *   **Clearer Visual Distinction:** Historical tasks are now rendered with a duller background color, making it easy to distinguish them from active, upcoming tasks.
*   **UI & Styling Improvements:**
    *   **Clear Buttons:** Many secondary buttons (like "Edit," "Delete," and "Save/Cancel" in various forms) now have a clear background with theme-adaptive text, creating a cleaner and more modern user interface.

### ✅ Recently Completed (Version 3.6) - 10/01/2025

This update introduces a more intelligent calendar scheduling system, giving users finer control over task prioritization and improving the clarity of the calendar view.

*   **New "Appointment" Feature:** You can now mark a task as an "Appointment" using a new checkbox in the task form. Appointments are treated as immovable events on the calendar and will not be shifted by the automatic scheduling algorithm. This is perfect for meetings, doctor's appointments, or any other time-critical event.
*   **Corrected Calendar Stacking Order:** The logic for how tasks are stacked and scheduled on the calendar has been significantly improved. Tasks are now prioritized in the following order:
    1.  **Appointments:** Fixed in time.
    2.  **Task Status:** Higher-priority tasks (e.g., "Do Right Now") are scheduled before lower-priority ones ("Start Soon").
    3.  **Due Date:** For tasks with the same status, the one due sooner is scheduled first.
    This ensures the calendar view more accurately reflects the priority order seen in the Task Manager.
*   **Improved Overlapping Task Visualization:** The calendar view now intelligently renders overlapping tasks. Longer tasks are always placed in the background, ensuring that shorter tasks are never hidden from view. This makes complex schedules much easier to read at a glance.

### ✅ Recently Completed (Version 3.5) - 10/01/2025

This update focused on improving data integrity and fixing UI bugs related to theming.

*   **Robust History Tracking:** Fixed a critical bug where task history (completions and misses) was not being saved correctly, particularly if the local data had become corrupted. The data loading process now intelligently validates and cleans the history on startup, ensuring that corrupted data is automatically repaired and new history is always saved reliably.
*   **Intelligent History Cleanup:** The Data Migration & Integrity tool has been enhanced. It now automatically detects and reports "orphaned" history records—entries for tasks that have been deleted. Users are now given a simple one-click option to clean these records, maintaining data integrity.
*   **Dynamic Button Theming Fix:** Resolved a UI bug where the main view-switching buttons (Task Manager, Calendar, Dashboard) would get "stuck" on their old colors after the theme was changed. They now update their styles instantly and correctly when switching between day and night modes.

### ✅ Recently Completed (Version 3.4) - 10/01/2025

This update introduces a more intelligent data migration tool and resolves several UI theming inconsistencies.

*   **Intelligent Data Migration:** The data migration tool has been significantly enhanced to be more user-friendly.
    *   It now automatically compares the schema of an imported file against the current data structure.
    *   Fields that are identical are auto-mapped and grayed out.
    *   The UI now highlights only the fields that are new or different, requiring user mapping.
    *   If no differences are found, the tool now presents a simple one-click confirmation step, streamlining the process.
*   **UI Theming Fixes:**
    *   Resolved an issue where several buttons and toggles (like the calendar view chooser and KPI combined/stacked toggle) were hardcoded with a blue background, ignoring the application's theme. These now correctly use the dynamic theming system.
    *   Added a new `themed-button-clear` class for buttons that require a transparent background. Their text color will now correctly adapt to day/night mode. This has been applied to the "Choose Icon", "Export Data", and various category management buttons for a cleaner look.

### ✅ Recently Completed (Version 3.3) - 09/30/2025

This is a comprehensive feature update that improves the user experience, enhances the KPI dashboard, and automates key data management processes.

*   **UI/UX Enhancements for Time and Scheduling**:
    *   The "Start Date & Time" field is now correctly hidden when "Relative Time" is selected in the task form, reducing clutter.
    *   The label for relative time input now dynamically changes from "Due In:" to "Start In:" based on the "Time Input Type" selection, improving clarity.
*   **KPI View Improvements**:
    *   Added "Previous Week," "Next Week," and "Today" buttons to the KPI view, allowing for easy navigation through weekly data to review past performance.
    *   Weekly goals and KPIs are now saved and can be viewed for previous weeks.
*   **Data Export/Import**:
    *   The "Export All" feature now includes all application settings, ensuring a complete and accurate backup for restoration.
*   **Migration Tool Automation**:
    *   The data migration tool is now automated. When the application detects outdated task formats, it will automatically launch the tool with the data pre-loaded, streamlining the update process for the user.

### ✅ Recently Completed (Version 3.2) - 09/22/2025

This update focused on fixing key UI bugs to improve the user experience.

*   **Button Spacing Fix:** Corrected a CSS layout issue where the main navigation buttons were positioned too close to the page header. A top margin was added to provide appropriate spacing.
*   **Calendar Rendering Fix:** Resolved a critical JavaScript error that was preventing the FullCalendar component from rendering. The error was caused by an incorrect variable reference when applying themes, which has now been fixed.

### ✅ Recently Completed (Version 3.1) - 09/22/2025

This update focused on improving data management and providing deeper insight into the application's core logic.

*   **Task Data Migration Tool:** A new tool has been added to the "Advanced Options" menu that allows users to migrate tasks from an older, unstructured JSON format. The tool intelligently detects fields from the uploaded file and prompts the user to map them to the current task properties, ensuring a smooth transition from legacy data formats.
*   **Partial Miss Logic Refinement:** The logic for confirming multiple overdue cycles has been clarified. The system now correctly applies only one partial miss (based on progress) for the most recent cycle and full, whole-number misses for any older cycles being confirmed at the same time. This ensures that a user's partial effort is fairly counted without being unfairly compounded.

### ✅ Recently Completed (Version 3.0) - 09/22/2025

This is a major feature update that adds powerful new ways to manage tasks and customize the application's look and feel, while also fixing key bugs.

*   **Bulk-Edit by Category:** In the "Advanced Options" menu, each category now has a "Bulk Edit" button. This opens a form that allows a user to apply changes (like setting a new duration or completion type) to all tasks within that category at once. The form remembers the last-used settings to speed up repetitive edits across multiple categories.
*   **Themeable Buttons:** The theming engine has been expanded to all buttons throughout the application. When a user picks a base color for their theme, all buttons will now adopt a complementary primary, secondary, or tertiary color, creating a more cohesive and personalized user experience.
*   **Status Color Picker Fix:** Fixed a critical bug where the color pickers for the five task statuses (Locked, Ready, Start Soon, etc.) would not display the currently saved color, always defaulting to black. They now correctly show the user's chosen color.
*   **Partial Miss Tracking:** For tasks that use a timer or a counter, the miss tracking system has been enhanced to support partial completion. If a task is only 50% complete when it becomes overdue, it is now recorded as a "0.5 miss" instead of a full one, providing a more nuanced and fair reflection of the user's effort.

### ✅ Recently Completed (Version 2.9) - 09/22/2025

This update focused on improving the user experience by implementing several features from the backlog.

*   **Re-integrated "Today" Button:** The "Today" button has been re-integrated into the main calendar header, providing quick navigation back to the current day.
*   **Incremental Data Import:** The import functionality has been enhanced to allow users to merge imported tasks and categories with their existing data, in addition to the previous overwrite functionality.
*   **Unified Task Click Behavior:** Ensured that clicking on a task in the main Task Manager list opens the "Task View" modal, providing a consistent user experience with the calendar view.

### ✅ Recently Completed (Version 2.8) - 09/22/2025

This update focused on code quality and analytics, continuing the project's cleanup and feature enhancement goals.

*   **Comprehensive HTML Refactoring:** Continued the major initiative to separate application logic from presentation by moving all remaining HTML generation out of `js/script.js` and into dedicated functions in `js/templates.js`. This makes the code significantly cleaner, more maintainable, and easier to test.
*   **Enhanced Task Statistics:** The dedicated Task Statistics page has been upgraded to provide deeper insights into user performance. It now features a bar chart that visualizes completions and misses on a weekly basis, allowing users to track their performance trends over time. This was implemented using Chart.js.

### ✅ Recently Completed (Version 2.7) - 09/22/2025

This update improves data management safety, enhances data portability, and continues the ongoing code refactoring initiative.

*   **Category Deletion Behavior:** Corrected the behavior of category deletion. It now deletes the category and all of its associated active tasks, as intended. A confirmation dialog warns the user of this action and clarifies that task history will be preserved.
*   **Enhanced Task Portability:** The "Export Tasks" feature has been improved. It now includes all relevant category data (colors, names) within the same file. The import process has also been updated to intelligently merge this category data, either adding new categories or updating existing ones to match the imported file, ensuring seamless transfer of tasks between different instances of the application.
*   **Code Refactoring:** The `renderTaskStats` function was refactored to use a dedicated template file (`js/templates.js`), separating its HTML structure from the core application logic. This continues the important work of making the codebase cleaner and easier to maintain.

### ✅ Recently Completed (Version 2.6) - 09/22/2025

This update introduces critical data management features and lays the groundwork for task analytics, improving data portability and user insight.

*   **Data Portability (Import/Export):**
    *   **Flexible Backups:** From the "Advanced Options" menu, users can now export their application data to a JSON file. This feature provides flexible backup options, allowing users to export all data or specific parts like tasks, categories, history, or settings.
    *   **Data Recovery:** Users can import data from a backup file, which will overwrite the current data and reload the application. This is crucial for data safety and recovery.
*   **Task Statistics Page:**
    *   **New Task View:** Clicking a task in the planner now opens a "Task View" modal, which provides a quick overview of the task's details.
    *   **Dedicated Stats:** From the "Task View," users can navigate to a dedicated statistics page that shows the task's completion rate, total completions vs. misses, and a detailed history of its activity. This provides users with valuable insights into their performance on individual tasks.

### ✅ Recently Completed (Version 2.5) - 09/22/2025

This update improves accessibility and continues the ongoing effort to refactor the codebase for better maintainability.

*   **Advanced Options Button:** The "Advanced Options" panel, previously only accessible from within the Task Manager, can now be opened directly from the main application header. This provides users with quicker access to powerful customization features.
*   **Code Refactoring:** The `renderCategoryManager` function was refactored to use a dedicated template file (`js/templates.js`), separating its HTML structure from the core application logic. This makes the code cleaner and easier to maintain.

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

### 📝 Backlog & To-Do List

This is the official backlog of tasks to be completed before moving on to the larger database migration.

1.  **Standardize All Confirmation Dialogs:** The application has a mix of old modal pop-ups and newer, cleaner inline confirmations. Audit the entire application and replace all remaining modal confirmations (e.g., for category deletion) with the modern inline pattern found in the task manager and calendar views. This will create a more consistent and less disruptive user experience.

2.  **Optimize Calendar Performance:** The calendar's event loading function currently processes the entire task history on every view change. As the history grows, this will cause performance issues. Refactor the `events` function in `initializeCalendar` to implement a more efficient caching or pre-processing strategy for historical tasks to ensure the calendar remains fast and responsive.

3.  **Enhance "Undo" Functionality:** The current "Undo" action only reverts the single most recent completion. It should be enhanced to handle more complex scenarios, such as undoing a specific action from a bulk confirmation of multiple overdue cycles.

4.  **Improve Icon Picker Testability:** The icon picker modal is difficult to interact with in automated tests, causing them to be flaky. Investigate the modal's rendering logic in `js/script.js` and `js/templates.js` and refactor it to ensure that all elements, particularly the category headers, are rendered in a way that is stable and easily located by testing frameworks like Playwright.

5.  **Smarter Task Status Calculation:** The current status calculation can be misleading when a very long task (like "Sleep") makes short, unrelated tasks (like "Brush Teeth") turn red prematurely.
    > "I have a concern about my task logic... Maybe could we add .. yet another checkbox to have a task excluded from the calculation for yellow red? Eg, back to the sleep example. It's making my "brush teeth" show up red way too early in the day. I would appreciate this particular problem being added to the to do list as well as it will require some thinking. I may even get some outside help too before we tackle that."
    *   **Proposed Solution:** Instead of just summing up all high-priority task durations, the `calculateStatus` function in `js/task-logic.js` should first use the deconfliction logic from `calculateScheduledTimes` to determine a more realistic "effective start time" for each task. The yellow/red status then would be calculated based on the time remaining until this *effective* start time, not the final due date. This would prevent tasks from turning red hours or days before they can actually be worked on.
    *   **Related Idea:** As a simpler, more direct alternative, add a checkbox to the task form: "Exclude from status calculations". If checked, the task's duration would not be included in the predictive workload analysis for other tasks.

6.  **Add User Confirmation for Vacation Changes:** When a vacation is added, removed, or a category's "Bypass Vacation" setting is toggled, the application should calculate which tasks will have their due dates changed. It should then present a confirmation modal to the user, listing the affected tasks and their new due dates, and allow the user to confirm or cancel the change before it is saved. This prevents unexpected schedule modifications.

### **🚀 Future Roadmap: Database & Collaboration**

These are larger, long-term goals for the project that are dependent on migrating the application's backend from `localStorage` to a persistent, server-side database. For a detailed guide on the migration process itself, see [`DATABASE_MIGRATION.md`](./DATABASE_MIGRATION.md).

*   **Database Integration:** Transition from `localStorage` to a persistent, server-side database. This is the foundational step for all other items in this section.
*   **User Authentication:** Implement user accounts, a prerequisite for database integration and multi-user features.
*   **Multi-Device Sync:** Ensure seamless real-time data synchronization across all devices once the database is in place.
*   **Groups & Collaborative Task Management:** Implement a system for users to join groups (e.g., a company, a family). This would allow group owners to assign tasks to members, who would see those tasks in their own list.
*   **Task History & Analytics:** Build a comprehensive dashboard to visualize historical data on task completion and misses, a providing deep insights into productivity trends over time.

### ✅ **Completed AI Suggestions**

*   **Consolidate Repetition Logic (Completed 10/04/2025):** The logic for calculating task repetitions was spread across multiple functions (`generateAbsoluteOccurrences`, `getAllPastDueDates`, and logic inside `calculateScheduledTimes`). This was refactored by creating a single, comprehensive `getOccurrences(task, startDate, endDate)` function in `js/task-logic.js`. This new function is now the single source of truth for generating all occurrences of a task, regardless of its repetition type (`none`, `relative`, or `absolute`), within a given date range. All other parts of the application have been updated to use this centralized function, which reduces code duplication, improves maintainability, and is now covered by a dedicated unit test suite.

### **🔩 Ongoing Development**

To ensure the long-term health and stability of the application, the following principles should be followed during development.

*   **Continuous Refactoring:** As new features are added, prioritize clean code. If a component's HTML is generated in `js/script.js`, take the time to move it into a dedicated function in `js/templates.js`.
*   **Test-Driven Development (TDD):** For any new logical function (especially in `task-logic.js`), write tests *before* writing the function itself. This ensures correctness and prevents future regressions. The project is set up with Jest for this purpose.

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

### ✅ Recently Completed (Version 11.0) - 10/06/2025

This was a major architectural refactor to implement the new V11 GPA-based logic, unifying the task status and calendar scheduling systems. The following guide was used for the implementation.

---

# **Programmer's Guide: Refactoring to the V11 GPA Model**

This document provides a step-by-step guide for refactoring the Task & Mission Planner application from its current state to the new, unified V11 GPA-based logic.

## **Objective**

The goal is to replace the complex, multi-faceted calculateStatus and calculateScheduledTimes functions with a single, cohesive pipeline. This new pipeline will ensure perfect consistency between the Task Manager's coloring and the Calendar's de-conflicted schedule.

## **Phase 1: Preparation & Data Model Updates**

~~Before altering the core logic, we need to update the data structures. (2025-10-06 18:16)~~

### **Step 1.1: Add prepTime to the Task Object**

~~The task object needs a new field for preparation/travel time. (2025-10-06 18:16)~~

~~1. **Task Modal (index.html):** In the "Time and Scheduling" fieldset inside the advanced-task-fields div, add a new form group for "Preparation Time". (2025-10-06 18:16)~~
   ~~* It should contain two inputs: prep-time-amount (type number) and prep-time-unit (a select with minutes/hours). (2025-10-06 18:16)~~
   ~~* Include a form hint: "Optional. How long you need to prepare for or travel to this task. If set, this will be used for urgency calculations instead of 'Estimated Duration'." (2025-10-06 18:16)~~
~~2. **Data Handling (script.js):** (2025-10-06 18:16)~~
   ~~* In handleFormSubmit, read the prep-time-amount and prep-time-unit values and save them to the task object. (2025-10-06 18:16)~~
   ~~* In sanitizeAndUpgradeTask, add prepTimeAmount: null and prepTimeUnit: 'minutes' to the defaults to ensure all tasks have these properties. (2025-10-06 18:16)~~
   ~~* In openModal, make sure to populate the new prepTime fields when editing an existing task. (2025-10-06 18:16)~~

## **Phase 2: Core Logic Refactor (The V11 Pipeline)**

~~This is the most critical phase. We will be replacing the core logic in task-logic.js. The old calculateStatus and calculateScheduledTimes functions should be **deleted** and replaced with a single, new master function. (2025-10-06 18:16)~~

~~Let's call the new master function runCalculationPipeline(). This function will be the single source of truth for all task states and will be called whenever a task is updated or the 15-second interval fires. (2025-10-06 18:16)~~

### **The runCalculationPipeline() Function**

~~This function will execute the following 4 steps in order: (2025-10-06 18:16)~~

#### **Step 2.1: Calculate "Positioning GPA" & Prioritize**

~~1. **Iterate through every active task:** (2025-10-06 18:16)~~
~~2. For each task, calculate its **positioningGpa**. This is a temporary score used *only* for scheduling priority. (2025-10-06 18:16)~~
~~3. **Formula:** positioningGpa \= 4.0 \- timeDemerit \- habitDemerit (2025-10-06 18:16)~~
   ~~* **timeDemerit (Max 3.0):** (2025-10-06 18:16)~~
     ~~* First, determine the baseDueDate by running the task's dueDate through the adjustDateForVacation function. (2025-10-06 18:16)~~
     ~~* Determine the urgencySourceDuration: use prepTime if it's set and greater than zero, otherwise use estimatedDuration. (2025-10-06 18:16)~~
     ~~* Calculate the warningWindow \= urgencySourceDuration \* 4\. (2025-10-06 18:16)~~
     ~~* Calculate timeUntilDue \= baseDueDate \- now. (2025-10-06 18:16)~~
     ~~* If timeUntilDue \> warningWindow, timeDemerit is 0\. (2025-10-06 18:16)~~
     ~~* Otherwise, timeDemerit \= (1 \- (timeUntilDue / warningWindow)) \* 3.0. (2025-10-06 18:16)~~
   ~~* **habitDemerit (Max 2.0):** (2025-10-06 18:16)~~
     ~~* If the task is non-repeating or doesn't track misses, habitDemerit is 0\. (2025-10-06 18:16)~~
     ~~* Otherwise, habitDemerit \= (task.misses / task.maxMisses) \* 2.0. (2025-10-06 18:16)~~
~~4. **Store this positioningGpa on the task object temporarily.** (2025-10-06 18:16)~~

#### **Step 2.2: De-conflict the Calendar ("Scheduling Forward")**

~~1. **Separate Tasks:** Create two groups: (2025-10-06 18:16)~~
   ~~* **Group A (Appointments):** All tasks where isAppointment is true. (2025-10-06 18:16)~~
   ~~* **Group B (Flexible Tasks):** All other tasks. (2025-10-06 18:16)~~
~~2. **Sort Group B:** Sort the flexible tasks by their positioningGpa in **ascending order** (lowest GPA first). (2025-10-06 18:16)~~
~~3. **Initialize Timeline:** Create a data structure representing the timeline for the "Calculation Horizon" (see Phase 3.2). This can be an array of "busy" time slots. (2025-10-06 18:16)~~
~~4. **Place Appointments:** Iterate through Group A. For each appointment, calculate its start time from its baseDueDate and duration. Mark its time slot on the timeline as "busy." Store the scheduledStartTime and scheduledEndTime on the appointment task object. (2025-10-06 18:16)~~
~~5. **Place Flexible Tasks:** Iterate through the *sorted* Group B. For each task: (2025-10-06 18:16)~~
   ~~* Find the first available open time slot on the timeline that is *before* its baseDueDate and large enough to fit its duration. (2025-10-06 18:16)~~
   ~~* Place the task in that slot and mark the slot as "busy." (2025-10-06 18:16)~~
   ~~* Store the resulting scheduledStartTime and scheduledEndTime on the task object. (2025-10-06 18:16)~~

#### **Step 2.3: Calculate Final "Coloring GPA"**

~~1. **Iterate through every active task again.** Now that they all have a scheduledStartTime, we calculate their final display properties. (2025-10-06 18:16)~~
~~2. Calculate the **finalGpa** and finalStatus. (2025-10-06 18:16)~~
~~3. **Formula:** finalGpa \= 4.0 \- finalTimeDemerit \- habitDemerit (2025-10-06 18:16)~~
   ~~* **finalTimeDemerit (Max 3.0):** This is calculated *identically* to the first time demerit, but instead of using the baseDueDate, it uses the scheduledStartTime to calculate timeUntilDue. (timeUntilDue \= scheduledStartTime \- now). (2025-10-06 18:16)~~
   ~~* **habitDemerit (Max 2.0):** This is the same value calculated in Step 2.1. (2025-10-06 18:16)~~
~~4. **Determine finalStatus:** (2025-10-06 18:16)~~
   ~~* Get the user's sensitivity setting (s). (2025-10-06 18:16)~~
   ~~* Calculate the adjustedRedThreshold \= 0.5 \+ (s \- 0.5). (2025-10-06 18:16)~~
   ~~* Calculate the adjustedYellowThreshold \= 1.5 \+ (s \- 0.5). (2025-10-06 18:16)~~
   ~~* Calculate the adjustedGreenThreshold \= 2.5 \+ (s \- 0.5). (2025-10-06 18:16)~~
   ~~* Use these thresholds to assign the final color: (2025-10-06 18:16)~~
     ~~* If finalGpa \< adjustedRedThreshold, status is Black. (2025-10-06 18:16)~~
     ~~* If finalGpa \< adjustedYellowThreshold, status is Red. (2025-10-06 18:16)~~
     ~~* If finalGpa \< adjustedGreenThreshold, status is Yellow. (2025-10-06 18:16)~~
     ~~* Otherwise, status is Green. (2025-10-06 18:16)~~
   ~~* (The Blue status for completed tasks is handled separately during rendering/user interaction). (2025-10-06 18:16)~~
~~5. **Store finalGpa and finalStatus on the task object.** These are the definitive values for the UI. (2025-10-06 18:16)~~

#### **Step 2.4: Return the Processed Tasks**

~~The runCalculationPipeline() function should return the full array of task objects, now updated with their final scheduled times and statuses. The main script.js will then use this returned array to render the UI. (2025-10-06 18:16)~~

## **Phase 3: UI and Feature Integration**

### **Step 3.1: Add the "Prep Time" Field**

~~* This was covered in Phase 1\. Ensure it is implemented. (2025-10-06 18:16)~~

### **Step 3.2: Implement the "Calculation Horizon"**

~~* **Location:** In the "Advanced Options" modal, under a new "Performance" or "Planner" section. (2025-10-06 18:16)~~
~~* **Implementation Verbatim:** "Create an advanced option for a RELATIVE amount of time into the future the app should project repeating tasks and perform calculations. Suggest 1 year and start it there and suggest to shorten it to how far out their furthest task is for best results use lower render distance." (2025-10-06 18:16)~~
~~* This setting will determine the end date of the timeline used in the runCalculationPipeline function. The main calculation loop should only generate task occurrences up to this horizon. (2025-10-06 18:16)~~

### **Step 3.3: Implement the Appointment/Vacation Conflict Modal**

~~1. **Trigger:** This check runs when a user saves a new/edited vacation, or saves a new/edited appointment. (2025-10-06 18:16)~~
~~2. **Logic:** (2025-10-06 18:16)~~
   ~~* After saving, iterate through all appointments. (2025-10-06 18:16)~~
   ~~* For each appointment, check if its baseDueDate falls within any vacation period. (2025-10-06 18:16)~~
   ~~* Also check if the appointment's category is set to *bypass* vacations. (2025-10-06 18:16)~~
   ~~* If a conflict exists and the category does *not* bypass vacations, add it to a list of conflicted tasks. (2025-10-06 18:16)~~
~~3. **Modal:** If the list of conflicted tasks is not empty, display a modal. (2025-10-06 18:16)~~
   ~~* The modal should list the appointments that are in conflict. (2025-10-06 18:16)~~
   ~~* It should ask the user: "These appointments are scheduled during a vacation. Would you like to reschedule them or keep them as is?" (2025-10-06 18:16)~~
   ~~* Provide options like "Reschedule Automatically" (which would re-run the vacation adjustment logic) or "Keep As Is." (2025-10-06 18:16)~~

## **Phase 4: Bug Fixes and Final To-Do List**

This phase involves cleaning up old code and implementing the remaining features from our brainstorming.

### **Main Refactor Items:**

* ~~**\[BUG FIX\]** The new runCalculationPipeline replaces the old calculateStatus function entirely. This will resolve the hiccups with tasks near the current time and those awaiting user input, as their state will be determined by a single, consistent GPA calculation. (2025-10-06 18:16)~~
* ~~**\[BUG FIX\]** The final finalStatus calculated in Step 2.3 is used for *both* the Task Manager color and the Calendar border color. This guarantees they will always match, fixing the consistency bug. (2025-10-06 18:16)~~
* ~~**\[CHECK\]** After implementing the new pipeline, thoroughly test Vacation Mode. The baseDueDate calculation in Step 2.1 is the single point where vacation adjustments are made. Confirm that adding/removing vacations correctly triggers the pipeline and that baseDueDate is updated as expected. (2025-10-06 18:16)~~

### **New Features To-Do List:**

* **\[FEATURE\]** Implement the "Auto-KPI System" as detailed in the README.md.
* **\[UX\]** Implement a scrolling "Hints & Tips" banner at the top of the main view to help users discover advanced features.
