# **Dynamic Task & Mission Planner**

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

### ✅ Recently Completed (Version 5.5) - 10/04/2025

This is a critical stability and reliability release that addresses several long-standing bugs related to data persistence and UI interaction, ensuring a smoother and more dependable user experience.

*   **Guaranteed Data Persistence:** Fixed a critical bug that could cause journal entries and weekly goals to be deleted upon reloading the application. This was caused by a race condition where the application would save its state before all data was fully loaded. A new initialization-aware saving mechanism has been implemented to prevent this, guaranteeing that your data is always safe.
*   **Seamless Calendar Interaction:** Resolved an error where clicking on active or future repeating tasks in the calendar would fail to open the task view. The event handling logic now correctly uses the stored base ID of the task, ensuring that any instance of a task on the calendar can be reliably opened.

### ✅ Recently Completed (Version 5.4) - 10/04/2025

This is a major feature release focused on providing users with a much richer, more intuitive, and actionable feedback loop on their performance. The historical data system has been overhauled to give users a clearer understanding of *how* and *when* they complete their tasks.

*   **New! Advanced Historical Status:** The system now tracks and displays the precise status of every completed or missed task, providing a more nuanced view of your habits.
    *   **Color-Coded Calendar Borders:** Historical tasks on the calendar now have a colored border indicating their status:
        *   `Blue`: The task was completed ahead of schedule.
        *   `Green`: The task was completed on time or after its due date.
        *   `Yellow`: The task was a "partial miss" (e.g., a late completion of an overdue repeating task).
        *   `Red`: This was the *first* time a repeating task was missed.
        *   `Black`: The task was missed and already had previous misses, or it was a non-repeating task that was missed.
    *   **Detailed History View:** The "Detailed History" in the task statistics modal now reflects this new system. The status of each entry is color-coded, and completed tasks will now show how early or late they were finished (e.g., "2 hours early").
*   **Improved Performance Chart:** The "Performance Over Time" graph has been fixed and enhanced.
    *   It now correctly interprets the new, detailed statuses to categorize completions and misses.
    *   It displays a continuous timeline from the first historical event to the last, filling in any empty days. This provides a much more accurate and useful visualization of performance over time.

### ✅ Recently Completed (Version 5.3) - 10/04/2025

This is a stability and bug-fix release that addresses several key issues related to task completion logic and UI consistency, improving the overall reliability of the planner.

*   **Corrected Early Completion Logic:**
    *   **"Blue" Lock State:** Fixed a critical bug where completing a repeating task early would incorrectly advance it to the next cycle. The task now correctly enters a "locked" (blue) state and remains that way until its original due date passes, preventing users from accidentally completing future tasks ahead of time.
    *   **Robust "Undo" Functionality:** The "Undo" action for a completed task has been made more robust. It now correctly restores any partial progress for count- or timer-based tasks, ensuring the task is reverted to its exact pre-completion state.

*   **Critical Bug Fixes:**
    *   **Calendar Click Error:** Resolved an error where clicking on a recurring task in the calendar would fail to open the task view and log a "Task or history item not found" error. The event handling logic now correctly parses the unique IDs of recurring task instances.
    *   **UI Contrast Fix:** Fixed a UI bug where the text and input field in the "Confirm Misses" dialog would become unreadable when displayed on tasks with dark (red or black) backgrounds. The text now reliably has high contrast in all situations.

### ✅ Recently Completed (Version 5.2) - 10/03/2025

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

### **🚀 Future Roadmap: Database & Collaboration**

These are larger, long-term goals for the project that are dependent on migrating the application's backend from `localStorage` to a persistent, server-side database. For a detailed guide on the migration process itself, see [`DATABASE_MIGRATION.md`](./DATABASE_MIGRATION.md).

*   **Database Integration:** Transition from `localStorage` to a persistent, server-side database. This is the foundational step for all other items in this section.
*   **User Authentication:** Implement user accounts, a prerequisite for database integration and multi-user features.
*   **Multi-Device Sync:** Ensure seamless real-time data synchronization across all devices once the database is in place.
*   **Groups & Collaborative Task Management:** Implement a system for users to join groups (e.g., a company, a family). This would allow group owners to assign tasks to members, who would see those tasks in their own list.
*   **Task History & Analytics:** Build a comprehensive dashboard to visualize historical data on task completion and misses, providing deep insights into productivity trends over time.

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