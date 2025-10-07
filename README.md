# **Task & Mission Planner \- README**

## **1\. High-Level Summary**

The **Task & Mission Planner** is a comprehensive, highly intelligent personal productivity application designed for users who want to go beyond simple to-do lists. It integrates task management, visual scheduling, goal tracking, and personal reflection into a single, cohesive system. Its core purpose is to not only list what needs to be done but to provide a dynamic, real-time assessment of a user's workload and schedule pressure.

The application is structured around four main views:

1. **Dashboard:** A high-level overview featuring weekly goals and a Key Performance Indicator (KPI) section that charts completion accuracy for important, recurring tasks.  
2. **Task Manager:** A powerful list-based view for creating, editing, and organizing tasks. It supports complex features like varied completion types (simple checkbox, count-based, or timed), intricate repetition schedules, and habit-failure tracking.  
3. **Calendar:** A visual, interactive planner that automatically schedules and de-conflicts tasks. It prioritizes fixed appointments and high-urgency items, shifting flexible tasks to create a realistic, achievable timeline.  
4. **Journal:** A dedicated space for reflection, where users can create entries and review their weekly goals, bridging the gap between planning and self-assessment.

## **2\. Core Features**

### **Intelligent Task & Schedule Management**

* **Dynamic GPA System:** Every task is assigned a "Task GPA" from 4.0 (perfect) down to 0.0 (failed). This score is derived from the task's proximity to its due date and its history of being missed.  
* **User-Controlled Sensitivity:** Users can adjust a "sensitivity" slider that changes the GPA thresholds for what it means to be Green, Yellow, or Red, tailoring the app's urgency notifications to their personal planning style.  
* **Automatic Scheduling & Deconfliction:** The Calendar view is powered by a "scheduling forward" engine. It places immovable appointments first, then sorts all other tasks by their GPA (lowest score first). It then places each task on the timeline in the first available open slot, automatically resolving all conflicts.  
* **Real-Time Coloring:** The Task Manager uses a final calculation pass to adjust a task's color based on its true scheduled start time, providing an accurate, at-a-glance view of what to work on next.

### **Advanced Task Properties**

* **Prep Time:** A field to specify the preparation or travel time needed before a task, allowing for more realistic urgency calculations.  
* **Completion Types:** Tasks can be simple check-offs, require a target count, or be tracked with a built-in timer.  
* **Complex Repetition:** Supports relative intervals (e.g., every 3 days) and complex absolute schedules (e.g., the last Friday of every month).  
* **Failure Tracking:** Tracks "misses" for repeating tasks, which directly impacts the task's GPA.

### **Advanced Options & Customization**

* **Category Management:** Full CRUD functionality for categories, including color, icons, and bulk-editing tools.  
* **Vacation Mode:** Automatically pushes task due dates that fall within a defined vacation period, with the ability for specific categories to bypass this rule.  
* **Theming Engine:** A powerful theme manager for customizing the app's appearance.  
* **Data Portability:** Robust import/export tools for backing up and restoring all application data.

## **3\. Future Features & Improvements**

### **Auto-KPI System**

* **Concept:** This feature will help users identify and focus on tasks they consistently struggle with.  
* **Implementation:**  
  * There will be a setting to "Enable Auto-KPI".  
  * When enabled, any task that reaches its maxMisses count will be automatically flagged as a KPI.  
  * A sub-option will allow these auto-flagged KPIs to be automatically removed from the KPI list once their misses count is brought back down to 0 through consistent completion.  
  * This feature will be separate from manually added KPIs. A manually added KPI will remain a KPI regardless of its miss count, ensuring the user retains full control over their primary focus items.

### **Calculation Horizon (Render Distance)**

* **Concept:** To ensure performance remains fast for users with many repeating tasks, a setting will control how far into the future the app performs its intensive scheduling calculations.  
* **Implementation Verbatim:** There will be an advanced option for a RELATIVE amount of time into the future the app should project repeating tasks and perform calculations. Suggest 1 year and start it there and suggest to shorten it to how far out their furthest task is for best results use lower render distance.

## **4\. To-Do / Fix / Check List**

* **\[BUG\]** The calculateStatus function has hiccups with tasks very close to the current time or tasks awaiting user input (confirming\_complete, confirming\_miss). The new GPA pipeline must resolve this.  
* **\[BUG\]** The Calendar border color sometimes does not accurately reflect the true, final status of a task after deconfliction.  
* **\[CHECK\]** Thoroughly test Vacation Mode. Ensure that adding or removing a vacation correctly triggers a recalculation of all affected task occurrences.  
* **\[REFACTOR\]** Implement the Final V11 Blueprint for the GPA calculation and scheduling pipeline. This is the top priority.  
* **\[FEATURE\]** Add the "Prep Time" field to the task modal.  
* **\[FEATURE\]** Implement the Appointment/Vacation conflict-warning modal.  
* **\[UX\]** Add a scrolling hints/tips feature to help users discover advanced settings like vacation bypasses for categories.