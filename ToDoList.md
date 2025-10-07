# **Programmer's Guide: Refactoring to the V11 GPA Model**

This document provides a step-by-step guide for refactoring the Task & Mission Planner application from its current state to the new, unified V11 GPA-based logic.

## **Objective**

The goal is to replace the complex, multi-faceted calculateStatus and calculateScheduledTimes functions with a single, cohesive pipeline. This new pipeline will ensure perfect consistency between the Task Manager's coloring and the Calendar's de-conflicted schedule.

## **Phase 1: Preparation & Data Model Updates**

Before altering the core logic, we need to update the data structures.

### **Step 1.1: Add prepTime to the Task Object**

The task object needs a new field for preparation/travel time.

1. **Task Modal (index.html):** In the "Time and Scheduling" fieldset inside the advanced-task-fields div, add a new form group for "Preparation Time".  
   * It should contain two inputs: prep-time-amount (type number) and prep-time-unit (a select with minutes/hours).  
   * Include a form hint: "Optional. How long you need to prepare for or travel to this task. If set, this will be used for urgency calculations instead of 'Estimated Duration'."  
2. **Data Handling (script.js):**  
   * In handleFormSubmit, read the prep-time-amount and prep-time-unit values and save them to the task object.  
   * In sanitizeAndUpgradeTask, add prepTimeAmount: null and prepTimeUnit: 'minutes' to the defaults to ensure all tasks have these properties.  
   * In openModal, make sure to populate the new prepTime fields when editing an existing task.

## **Phase 2: Core Logic Refactor (The V11 Pipeline)**

This is the most critical phase. We will be replacing the core logic in task-logic.js. The old calculateStatus and calculateScheduledTimes functions should be **deleted** and replaced with a single, new master function.

Let's call the new master function runCalculationPipeline(). This function will be the single source of truth for all task states and will be called whenever a task is updated or the 15-second interval fires.

### **The runCalculationPipeline() Function**

This function will execute the following 4 steps in order:

#### **Step 2.1: Calculate "Positioning GPA" & Prioritize**

1. **Iterate through every active task:**  
2. For each task, calculate its **positioningGpa**. This is a temporary score used *only* for scheduling priority.  
3. **Formula:** positioningGpa \= 4.0 \- timeDemerit \- habitDemerit  
   * **timeDemerit (Max 3.0):**  
     * First, determine the baseDueDate by running the task's dueDate through the adjustDateForVacation function.  
     * Determine the urgencySourceDuration: use prepTime if it's set and greater than zero, otherwise use estimatedDuration.  
     * Calculate the warningWindow \= urgencySourceDuration \* 4\.  
     * Calculate timeUntilDue \= baseDueDate \- now.  
     * If timeUntilDue \> warningWindow, timeDemerit is 0\.  
     * Otherwise, timeDemerit \= (1 \- (timeUntilDue / warningWindow)) \* 3.0.  
   * **habitDemerit (Max 2.0):**  
     * If the task is non-repeating or doesn't track misses, habitDemerit is 0\.  
     * Otherwise, habitDemerit \= (task.misses / task.maxMisses) \* 2.0.  
4. **Store this positioningGpa on the task object temporarily.**

#### **Step 2.2: De-conflict the Calendar ("Scheduling Forward")**

1. **Separate Tasks:** Create two groups:  
   * **Group A (Appointments):** All tasks where isAppointment is true.  
   * **Group B (Flexible Tasks):** All other tasks.  
2. **Sort Group B:** Sort the flexible tasks by their positioningGpa in **ascending order** (lowest GPA first).  
3. **Initialize Timeline:** Create a data structure representing the timeline for the "Calculation Horizon" (see Phase 3.2). This can be an array of "busy" time slots.  
4. **Place Appointments:** Iterate through Group A. For each appointment, calculate its start time from its baseDueDate and duration. Mark its time slot on the timeline as "busy." Store the scheduledStartTime and scheduledEndTime on the appointment task object.  
5. **Place Flexible Tasks:** Iterate through the *sorted* Group B. For each task:  
   * Find the first available open time slot on the timeline that is *before* its baseDueDate and large enough to fit its duration.  
   * Place the task in that slot and mark the slot as "busy."  
   * Store the resulting scheduledStartTime and scheduledEndTime on the task object.

#### **Step 2.3: Calculate Final "Coloring GPA"**

1. **Iterate through every active task again.** Now that they all have a scheduledStartTime, we calculate their final display properties.  
2. Calculate the **finalGpa** and finalStatus.  
3. **Formula:** finalGpa \= 4.0 \- finalTimeDemerit \- habitDemerit  
   * **finalTimeDemerit (Max 3.0):** This is calculated *identically* to the first time demerit, but instead of using the baseDueDate, it uses the scheduledStartTime to calculate timeUntilDue. (timeUntilDue \= scheduledStartTime \- now).  
   * **habitDemerit (Max 2.0):** This is the same value calculated in Step 2.1.  
4. **Determine finalStatus:**  
   * Get the user's sensitivity setting (s).  
   * Calculate the adjustedRedThreshold \= 0.5 \+ (s \- 0.5).  
   * Calculate the adjustedYellowThreshold \= 1.5 \+ (s \- 0.5).  
   * Calculate the adjustedGreenThreshold \= 2.5 \+ (s \- 0.5).  
   * Use these thresholds to assign the final color:  
     * If finalGpa \< adjustedRedThreshold, status is Black.  
     * If finalGpa \< adjustedYellowThreshold, status is Red.  
     * If finalGpa \< adjustedGreenThreshold, status is Yellow.  
     * Otherwise, status is Green.  
   * (The Blue status for completed tasks is handled separately during rendering/user interaction).  
5. **Store finalGpa and finalStatus on the task object.** These are the definitive values for the UI.

#### **Step 2.4: Return the Processed Tasks**

The runCalculationPipeline() function should return the full array of task objects, now updated with their final scheduled times and statuses. The main script.js will then use this returned array to render the UI.

## **Phase 3: UI and Feature Integration**

### **Step 3.1: Add the "Prep Time" Field**

* This was covered in Phase 1\. Ensure it is implemented.

### **Step 3.2: Implement the "Calculation Horizon"**

* **Location:** In the "Advanced Options" modal, under a new "Performance" or "Planner" section.  
* **Implementation Verbatim:** "Create an advanced option for a RELATIVE amount of time into the future the app should project repeating tasks and perform calculations. Suggest 1 year and start it there and suggest to shorten it to how far out their furthest task is for best results use lower render distance."  
* This setting will determine the end date of the timeline used in the runCalculationPipeline function. The main calculation loop should only generate task occurrences up to this horizon.

### **Step 3.3: Implement the Appointment/Vacation Conflict Modal**

1. **Trigger:** This check runs when a user saves a new/edited vacation, or saves a new/edited appointment.  
2. **Logic:**  
   * After saving, iterate through all appointments.  
   * For each appointment, check if its baseDueDate falls within any vacation period.  
   * Also check if the appointment's category is set to *bypass* vacations.  
   * If a conflict exists and the category does *not* bypass vacations, add it to a list of conflicted tasks.  
3. **Modal:** If the list of conflicted tasks is not empty, display a modal.  
   * The modal should list the appointments that are in conflict.  
   * It should ask the user: "These appointments are scheduled during a vacation. Would you like to reschedule them or keep them as is?"  
   * Provide options like "Reschedule Automatically" (which would re-run the vacation adjustment logic) or "Keep As Is."

## **Phase 4: Bug Fixes and Final To-Do List**

This phase involves cleaning up old code and implementing the remaining features from our brainstorming.

### **Main Refactor Items:**

* **\[BUG FIX\]** The new runCalculationPipeline replaces the old calculateStatus function entirely. This will resolve the hiccups with tasks near the current time and those awaiting user input, as their state will be determined by a single, consistent GPA calculation.  
* **\[BUG FIX\]** The final finalStatus calculated in Step 2.3 is used for *both* the Task Manager color and the Calendar border color. This guarantees they will always match, fixing the consistency bug.  
* **\[CHECK\]** After implementing the new pipeline, thoroughly test Vacation Mode. The baseDueDate calculation in Step 2.1 is the single point where vacation adjustments are made. Confirm that adding/removing vacations correctly triggers the pipeline and that baseDueDate is updated as expected.

### **New Features To-Do List:**

* **\[FEATURE\]** Implement the "Auto-KPI System" as detailed in the README.md.  
* **\[UX\]** Implement a scrolling "Hints & Tips" banner at the top of the main view to help users discover advanced features.