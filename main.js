// =================================================================================
// main.js - App Orchestrator
// Description: Initializes the application, manages global state, handles
//              data persistence (load/save), and runs the main update loop.
// =================================================================================

// --- Global State ---
let tasks = []; // Array to hold all task objects
let editingTaskId = null; // ID of the task currently being edited
let countdownIntervals = {}; // Holds setInterval IDs for countdown timers
let mainUpdateInterval = null; // Holds setInterval ID for the main status update loop
let taskTimers = {}; // Holds setInterval IDs for active time-based task timers
let taskTimerStartTimes = {}; // Holds start timestamps for active time-based timers

// --- Constants ---
const STATUS_UPDATE_INTERVAL = 15000; // How often to check task statuses (ms)
const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60000;
const MS_PER_HOUR = 3600000;
const MS_PER_DAY = 86400000;
const DUE_THRESHOLD_MS = 1000; // Threshold for showing "Due!" instead of seconds
const YELLOW_WINDOW_HOURS = 16; // How many hours ahead to consider for yellow status calculation
const YELLOW_WINDOW_MS = YELLOW_WINDOW_HOURS * MS_PER_HOUR;
const MAX_CYCLE_CALCULATION = 100; // Safety limit for calculating pending cycles

// --- DOM Element References ---
// (These will be assigned in initializeDOMElements)
let taskModal, taskForm, taskListDiv, modalTitle, taskIdInput, taskNameInput,
    dueDateTypeSelect, absoluteDueDateGroup, taskDueDateInput, relativeDueDateGroup,
    relativeAmountInput, relativeUnitSelect, taskRepetitionSelect, repetitionRelativeGroup,
    repetitionAmountInput, repetitionUnitSelect, repeatingOptionsGroup,
    maxMissesGroup, maxMissesInput, trackMissesInput,
    completionTypeSelect, estimatedDurationGroup,
    estimatedDurationAmountInput, estimatedDurationUnitSelect,
    completionCountGroup, countTargetInput,
    completionTimeGroup, timeTargetAmountInput, timeTargetUnitSelect,
    repetitionAbsoluteGroup, absoluteFrequencySelect,
    absoluteWeeklyOptions, absoluteMonthlyOptions, absoluteYearlyOptions,
    monthlyDayNumberOptions, monthlyDayOfWeekOptions, yearlyDayNumberOptions, yearlyDayOfWeekOptions,
    weekdayCheckboxes, monthlyOccurrenceCheckboxes, yearlyOccurrenceCheckboxes, yearlyMonthCheckboxes,
    monthlyWeekdayCheckboxes, yearlyWeekdayCheckboxes, monthlyDayCheckboxes, yearlyDayCheckboxes,
    countsAsBusyInput;

/** Initializes all DOM element variables after the page loads. */
function initializeDOMElements() {
    taskModal = document.getElementById('task-modal'); taskForm = document.getElementById('task-form'); taskListDiv = document.getElementById('task-list'); modalTitle = document.getElementById('modal-title'); taskIdInput = document.getElementById('task-id'); taskNameInput = document.getElementById('task-name'); dueDateTypeSelect = document.getElementById('due-date-type'); absoluteDueDateGroup = document.getElementById('absolute-due-date-group'); taskDueDateInput = document.getElementById('task-due-date'); relativeDueDateGroup = document.getElementById('relative-due-date-group'); relativeAmountInput = document.getElementById('relative-amount'); relativeUnitSelect = document.getElementById('relative-unit'); taskRepetitionSelect = document.getElementById('task-repetition'); repetitionRelativeGroup = document.getElementById('repetition-relative-group'); repetitionAmountInput = document.getElementById('repetition-amount'); repetitionUnitSelect = document.getElementById('repetition-unit');
    repeatingOptionsGroup = document.getElementById('repeating-options-group');
    maxMissesGroup = document.getElementById('max-misses-group'); maxMissesInput = document.getElementById('max-misses');
    trackMissesInput = document.getElementById('track-misses');
    completionTypeSelect = document.getElementById('completion-type'); estimatedDurationGroup = document.getElementById('estimated-duration-group'); estimatedDurationAmountInput = document.getElementById('estimated-duration-amount'); estimatedDurationUnitSelect = document.getElementById('estimated-duration-unit'); completionCountGroup = document.getElementById('completion-count-group'); countTargetInput = document.getElementById('count-target'); completionTimeGroup = document.getElementById('completion-time-group'); timeTargetAmountInput = document.getElementById('time-target-amount'); timeTargetUnitSelect = document.getElementById('time-target-unit');
    repetitionAbsoluteGroup = document.getElementById('repetition-absolute-group');
    absoluteFrequencySelect = document.getElementById('absolute-frequency');
    absoluteWeeklyOptions = document.getElementById('absolute-weekly-options');
    absoluteMonthlyOptions = document.getElementById('absolute-monthly-options');
    absoluteYearlyOptions = document.getElementById('absolute-yearly-options');
    weekdayCheckboxes = document.querySelectorAll('input[name="weekday"]');
    monthlyDayNumberOptions = document.getElementById('monthly-day-number-options');
    monthlyDayOfWeekOptions = document.getElementById('monthly-day-of-week-options');
    yearlyDayNumberOptions = document.getElementById('yearly-day-number-options');
    yearlyDayOfWeekOptions = document.getElementById('yearly-day-of-week-options');
    monthlyOccurrenceCheckboxes = document.querySelectorAll('input[name="monthlyOccurrence"]');
    monthlyWeekdayCheckboxes = document.querySelectorAll('input[name="monthlyWeekday"]');
    monthlyDayCheckboxes = document.querySelectorAll('input[name="monthlyDay"]');
    yearlyOccurrenceCheckboxes = document.querySelectorAll('input[name="yearlyOccurrence"]');
    yearlyMonthCheckboxes = document.querySelectorAll('input[name="yearlyMonth"]');
    yearlyWeekdayCheckboxes = document.querySelectorAll('input[name="yearlyWeekday"]');
    yearlyDayCheckboxes = document.querySelectorAll('input[name="yearlyDay"]');
    countsAsBusyInput = document.getElementById('counts-as-busy');
}

/** Sets up initial event listeners for the page */
function setupEventListeners() {
    // Main "Add Task" button
    const addTaskBtn = document.getElementById('add-task-btn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => openModal());
    }

    // Form submission
    if (taskForm) {
        taskForm.addEventListener('submit', handleFormSubmit);
    }
    
    // *** Main event listener for the entire task list using event delegation ***
    if (taskListDiv) {
        taskListDiv.addEventListener('click', handleTaskListClick);
    }

    // Modal close buttons
    const closeButton = taskModal.querySelector('.close-button');
    const cancelButton = taskModal.querySelector('button[type="button"]');
    if (closeButton) closeButton.addEventListener('click', closeModal);
    if (cancelButton) cancelButton.addEventListener('click', closeModal);

    // Dynamic form select listeners
    taskRepetitionSelect.addEventListener('change', (e) => {
        const type = e.target.value;
        repetitionRelativeGroup.classList.toggle('hidden', type !== 'relative');
        repetitionAbsoluteGroup.classList.toggle('hidden', type !== 'absolute');
        repeatingOptionsGroup.classList.toggle('hidden', type === 'none');
        if(type === 'absolute') { toggleAbsoluteRepetitionFields(absoluteFrequencySelect.value); }
        if (type === 'none') { maxMissesInput.value = ''; trackMissesInput.checked = true; }
    });

     absoluteFrequencySelect.addEventListener('change', (e) => {
         toggleAbsoluteRepetitionFields(e.target.value);
     });

     taskForm.querySelectorAll('input[name="monthlyOption"]').forEach(radio => {
         radio.addEventListener('change', (e) => toggleMonthlyOptions(e.target.value));
     });
      taskForm.querySelectorAll('input[name="yearlyOption"]').forEach(radio => {
         radio.addEventListener('change', (e) => toggleYearlyOptions(e.target.value));
     });

    dueDateTypeSelect.addEventListener('change', (e) => {
        absoluteDueDateGroup.classList.toggle('hidden', e.target.value !== 'absolute');
        relativeDueDateGroup.classList.toggle('hidden', e.target.value !== 'relative');
    });

    completionTypeSelect.addEventListener('change', (e) => {
        toggleCompletionFields(e.target.value);
    });

    // Close modal if clicking outside of it
    window.addEventListener('mousedown', (event) => {
        if (event.target === taskModal) {
            closeModal();
        }
    });
}

/** Loads tasks from localStorage, parses dates, and performs migrations/cleanup */
function loadTasks() {
     const storedTasks = localStorage.getItem('tasks');
     tasks = []; // Reset tasks array
     if (storedTasks) {
         try {
             const parsedTasks = JSON.parse(storedTasks);
             // Map stored data to task objects, ensuring correct types and handling migrations
             tasks = parsedTasks.map(task => ({
                 ...task,
                 dueDate: task.dueDate ? new Date(task.dueDate) : null,
                 createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
                 cycleEndDate: task.cycleEndDate ? new Date(task.cycleEndDate) : null,
                 estimatedDurationAmount: task.estimatedDurationAmount ? parseInt(task.estimatedDurationAmount, 10) : (task.estimatedDuration ? parseInt(task.estimatedDuration, 10) : null),
                 estimatedDurationUnit: task.estimatedDurationUnit || (task.estimatedDuration ? 'minutes' : null),
                 maxMisses: task.maxMisses ? parseInt(task.maxMisses, 10) : null,
                 misses: task.misses ? parseInt(task.misses, 10) : 0,
                 completed: !!task.completed,
                 relativeAmount: task.relativeAmount ? parseInt(task.relativeAmount, 10) : null,
                 repetitionAmount: task.repetitionAmount ? parseInt(task.repetitionAmount, 10) : null,
                 repetitionAbsoluteFrequency: task.repetitionAbsoluteFrequency || null,
                 repetitionAbsoluteWeeklyDays: Array.isArray(task.repetitionAbsoluteWeeklyDays) ? task.repetitionAbsoluteWeeklyDays.map(Number) : null,
                 repetitionAbsoluteMonthlyMode: task.repetitionAbsoluteMonthlyMode || null,
                 repetitionAbsoluteDaysOfMonth: Array.isArray(task.repetitionAbsoluteDaysOfMonth) ? task.repetitionAbsoluteDaysOfMonth.map(String) : null,
                 repetitionAbsoluteNthWeekdayOccurrence: Array.isArray(task.repetitionAbsoluteNthWeekdayOccurrence) ? task.repetitionAbsoluteNthWeekdayOccurrence.map(String) : null,
                 repetitionAbsoluteNthWeekdayDays: Array.isArray(task.repetitionAbsoluteNthWeekdayDays) ? task.repetitionAbsoluteNthWeekdayDays.map(Number) : null,
                 repetitionAbsoluteYearlyMonths: Array.isArray(task.repetitionAbsoluteYearlyMonths) ? task.repetitionAbsoluteYearlyMonths.map(Number) : null,
                 repetitionAbsoluteYearlyMode: task.repetitionAbsoluteYearlyMode || null,
                 repetitionAbsoluteYearlyDaysOfMonth: Array.isArray(task.repetitionAbsoluteYearlyDaysOfMonth) ? task.repetitionAbsoluteYearlyDaysOfMonth.map(String) : null,
                 repetitionAbsoluteYearlyNthWeekdayOccurrence: Array.isArray(task.repetitionAbsoluteYearlyNthWeekdayOccurrence) ? task.repetitionAbsoluteYearlyNthWeekdayOccurrence.map(String) : null,
                 repetitionAbsoluteYearlyNthWeekdayDays: Array.isArray(task.repetitionAbsoluteYearlyNthWeekdayDays) ? task.repetitionAbsoluteYearlyNthWeekdayDays.map(Number) : null,
                 countTarget: task.countTarget ? parseInt(task.countTarget, 10) : null,
                 timeTargetAmount: task.timeTargetAmount ? parseInt(task.timeTargetAmount, 10) : null,
                 timeTargetUnit: task.timeTargetUnit || null,
                 currentProgress: task.currentProgress ? parseInt(task.currentProgress, 10) : 0,
                 trackMisses: typeof task.trackMisses === 'boolean' ? task.trackMisses : true,
                 countsAsBusy: typeof task.countsAsBusy === 'boolean' ? task.countsAsBusy : true,
                 isTimerRunning: false,
                 confirmationState: null,
                 overdueStartDate: task.overdueStartDate || null,
                 pendingCycles: task.pendingCycles ? parseInt(task.pendingCycles, 10) : null,
                 completionReducedMisses: !!task.completionReducedMisses
             }));

             // Data cleanup and migration logic
             tasks.forEach(task => {
                 if (task.dueDate && isNaN(task.dueDate)) task.dueDate = null;
                 if (task.createdAt && isNaN(task.createdAt)) task.createdAt = new Date();
                 if (task.cycleEndDate && isNaN(task.cycleEndDate)) task.cycleEndDate = null;
                 if (task.estimatedDurationAmount && task.estimatedDurationUnit) delete task.estimatedDuration;

                 if (task.overdueStartDate && !task.pendingCycles) {
                     task.pendingCycles = calculatePendingCycles(task, Date.now());
                     if (task.pendingCycles > 0) {
                         task.confirmationState = 'awaiting_overdue_input';
                     } else {
                         delete task.overdueStartDate;
                         task.confirmationState = null;
                     }
                 } else if (!task.overdueStartDate) {
                     task.confirmationState = null;
                     delete task.pendingCycles;
                 }

                 if (!task.status || typeof task.status !== 'string') {
                     task.status = calculateStatus(task, Date.now(), tasks).name;
                 }
                 if (task.status !== 'blue' && task.cycleEndDate) {
                     task.cycleEndDate = null;
                 }
             });
         } catch (error) {
             console.error("Error parsing tasks from localStorage:", error);
             localStorage.removeItem('tasks');
         }
     }
     renderTasks();
     startMainUpdateLoop();
}

/** Saves the current tasks array to localStorage */
function saveTasks() {
     try {
         localStorage.setItem('tasks', JSON.stringify(tasks));
     } catch (error) {
         console.error("Error saving tasks to localStorage:", error);
     }
}

/** Periodically checks and updates task statuses, handling overdue transitions */
function updateAllTaskStatuses(forceRender = false) {
     let changed = false;
     const nowMs = Date.now();
     const currentTasks = [...tasks];

     tasks.forEach(task => {
         try {
            const isCompletedNonRepeating = task.repetitionType === 'none' && task.completed;
            if (isCompletedNonRepeating) return;

            const initialConfirmationState = task.confirmationState;
            let shouldClearConfirmation = false;

            const cycleEndMs = (task.cycleEndDate && !isNaN(task.cycleEndDate)) ? task.cycleEndDate.getTime() : null;
            const isCycleEnded = cycleEndMs !== null && cycleEndMs <= nowMs;

            if (task.status === 'blue' && isCycleEnded) {
                task.cycleEndDate = null;
                task.status = 'green';
                changed = true;
            }

            const dueDateMs = task.dueDate ? task.dueDate.getTime() : null;
            const isPastDue = dueDateMs !== null && dueDateMs <= nowMs;

            if (isPastDue && task.status !== 'blue' && !task.confirmationState) {
                 task.confirmationState = 'awaiting_overdue_input';
                 if (!task.overdueStartDate) {
                    task.overdueStartDate = task.dueDate.toISOString();
                 }
                 task.pendingCycles = calculatePendingCycles(task, nowMs);
                 changed = true;
                 if (task.isTimerRunning) { toggleTimer(task.id); }
            } else {
                 let newStatusName = task.status;
                 if (task.confirmationState !== 'awaiting_overdue_input' && task.confirmationState !== 'confirming_miss' && task.confirmationState !== 'confirming_delete' && task.confirmationState !== 'confirming_complete') {
                     const oldStatus = task.status;
                     const newStatusResult = calculateStatus(task, nowMs, currentTasks);
                     newStatusName = newStatusResult.name;

                     if (newStatusName !== oldStatus) {
                         if (oldStatus === 'blue' && newStatusName !== 'blue') {
                             task.cycleEndDate = null;
                         }
                         task.status = newStatusName;
                         changed = true;
                     }
                 } else if (task.confirmationState === 'confirming_complete') {
                     const statusBeforeConfirm = calculateStatus({...task, confirmationState: null}, nowMs, currentTasks).name;
                     if (task.status !== statusBeforeConfirm && statusBeforeConfirm !== 'blue') {
                        if (task.overdueStartDate && task.status !== 'red') {
                            task.status = 'red';
                            changed = true;
                        } else if (!task.overdueStartDate && task.status !== statusBeforeConfirm) {
                            task.status = statusBeforeConfirm;
                            changed = true;
                        }
                     }
                 }

                 if (initialConfirmationState && initialConfirmationState !== 'confirming_delete') {
                     if (!isPastDue && (initialConfirmationState === 'awaiting_overdue_input' || initialConfirmationState === 'confirming_miss')) {
                         shouldClearConfirmation = true;
                     }
                 }
            }


            if (shouldClearConfirmation) {
                task.confirmationState = null;
                delete task.overdueStartDate;
                delete task.pendingCycles;
                changed = true;
            }

         } catch (e) {
             console.error("Error updating status for task:", task?.id, e);
         }
     });

     if (changed || forceRender) {
         saveTasks();
         renderTasks();
     }
 }

/** Starts the main interval loop for status updates */
function startMainUpdateLoop() {
     if (mainUpdateInterval) clearInterval(mainUpdateInterval);
     setTimeout(() => updateAllTaskStatuses(true), 50);
     mainUpdateInterval = setInterval(() => updateAllTaskStatuses(false), STATUS_UPDATE_INTERVAL);
}

// --- Initialization ---
/** Runs when the DOM is fully loaded */
document.addEventListener('DOMContentLoaded', () => {
    try {
        initializeDOMElements();
        setupEventListeners();
        loadTasks();
    } catch (e) {
        console.error("Error during initialization:", e);
        const listDiv = document.getElementById('task-list');
        if(listDiv) listDiv.innerHTML = '<p class="text-red-600 font-bold text-center">Error initializing application. Please check console.</p>';
    }
});
