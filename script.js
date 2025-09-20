// =================================================================================
// SCRIPT.JS - COMBINED AND CLEANED
// =================================================================================

// =================================================================================
// SECTION 1: Global State, Constants, & DOM References
// =================================================================================
let tasks = [];
let categories = [];
const defaultStatusColors = { blue: '#00BFFF', green: '#22c55e', yellow: '#facc15', red: '#dc2626', black: '#4b5563' };
const defaultStatusNames = { blue: 'Locked', green: 'Ready', yellow: 'Start Soon', red: 'Do Right Now', black: 'Overdue' };
let statusColors = { ...defaultStatusColors };
let statusNames = { ...defaultStatusNames };
let notificationSettings = { enabled: false, rateLimit: { amount: 5, unit: 'minutes' }, categories: {} };
let notificationEngine = { timeouts: [], lastNotificationTimestamps: {} };
let theming = { enabled: false, baseColor: '#3b82f6', mode: 'night' };
let calendarSettings = { categoryFilter: [], syncFilter: true, lastView: 'timeGridWeek' };
let editingTaskId = null;
let countdownIntervals = {};
let mainUpdateInterval = null;
let taskTimers = {};
let sortBy = 'status';
let sortDirection = 'asc';
let categoryFilter = [];
let plannerSettings = { defaultCategoryId: 'Planner' };
let taskDisplaySettings = {
    showDueDate: true, showRepetition: true, showDuration: true,
    showCategory: true, showCountdown: true, showProgress: true,
};
const STATUS_UPDATE_INTERVAL = 15000;
const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60000;
const MS_PER_HOUR = 3600000;
const MS_PER_DAY = 86400000;
const DUE_THRESHOLD_MS = 1000;
const YELLOW_WINDOW_HOURS = 16;
const YELLOW_WINDOW_MS = YELLOW_WINDOW_HOURS * MS_PER_HOUR;
const MAX_CYCLE_CALCULATION = 100;

// DOM Element References (Task Manager)
let taskModal, taskForm, taskListDiv, modalTitle, taskIdInput, taskNameInput, taskIconInput,
    timeInputTypeSelect, dueDateGroup, taskDueDateInput, startDateGroup, taskStartDateInput,
    dueDateTypeSelect, relativeDueDateGroup,
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
    countsAsBusyInput,
    taskCategorySelect, newCategoryGroup, newCategoryNameInput,
    advancedOptionsModal,
    sortBySelect, sortDirectionSelect, categoryFilterList,
    plannerDefaultCategorySelect, dayNightToggle;

// DOM Element References (Pilot Planner)
let app, weeklyGoalsEl, indicatorListEl, newIndicatorInput, addIndicatorBtn,
    plannerContainer, weeklyViewContainer, dailyViewContainer,
    progressTrackerContainer, viewBtns, startNewWeekBtn, confirmModal,
    cancelNewWeekBtn, confirmNewWeekBtn, prevWeekBtn, nextWeekBtn,
    weekStatusEl, weekDateRangeEl;

// Pilot Planner State
const MAX_WEEKS_STORED = 6;
const CURRENT_WEEK_INDEX = 4;
const DATA_KEY = 'pilotPlannerDataV8';
const VIEW_STATE_KEY = 'pilotPlannerViewStateV8';

const appState = {
    weeks: [],
    indicators: [ { id: 1, name: 'Hours Studied' }, { id: 2, name: 'Maneuvers Practiced' } ],
    historicalTasks: [],
    viewingIndex: CURRENT_WEEK_INDEX, currentView: 'weekly', currentDayIndex: 0,
};


// =================================================================================
// SECTION 2: Logic & Utility Functions
// =================================================================================
function generateId() { return '_' + Math.random().toString(36).substr(2, 9); }
const pad = (num, length = 2) => String(num).padStart(length, '0');
function formatDateForInput(date) {
    if (!date || !(date instanceof Date) || isNaN(date)) return '';
    try {
        const yr = date.getFullYear();
        const mm = pad(date.getMonth() + 1);
        const dd = pad(date.getDate());
        const hh = pad(date.getHours());
        const min = pad(date.getMinutes());
        return `${yr}-${mm}-${dd}T${hh}:${min}`;
    } catch (e) { console.error("Error formatting date:", date, e); return ''; }
}
function calculateFutureDate(amount, unit, baseDate) {
    try {
        const date = new Date(baseDate);
        amount = parseInt(amount, 10);
        if (isNaN(amount) || amount <= 0) amount = 1;
        switch (unit) {
            case 'minutes': date.setMinutes(date.getMinutes() + amount); break;
            case 'hours': date.setHours(date.getHours() + amount); break;
            case 'days': date.setDate(date.getDate() + amount); break;
            case 'weeks': date.setDate(date.getDate() + amount * 7); break;
            case 'months': date.setMonth(date.getMonth() + amount); break;
            default: console.warn("Unknown unit:", unit);
        }
        return date;
    } catch (e) { console.error("Error calculating future date:", e); return new Date(baseDate); }
}
function getDurationMs(amount, unit) {
    if (!amount || !unit || amount <= 0) return 0;
    amount = parseInt(amount, 10);
    let ms = 0;
    switch (unit) {
        case 'minutes': ms = amount * MS_PER_MINUTE; break;
        case 'hours': ms = amount * MS_PER_HOUR; break;
        case 'days': ms = amount * MS_PER_DAY; break;
        case 'weeks': ms = amount * 7 * MS_PER_DAY; break;
        case 'months': ms = amount * 30 * MS_PER_DAY; break; // Approximation
        default: console.warn("Unknown duration unit:", unit); ms = amount * MS_PER_MINUTE;
    }
    return ms;
}
function formatDuration(amount, unit) {
    if (!amount || !unit || amount <= 0) return 'N/A';
    return `${amount} ${unit}`;
}
function formatMsToTime(ms) {
    if (isNaN(ms) || ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / MS_PER_SECOND);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
function parseTimeToMs(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.split(':').map(Number);
    let ms = 0;
    if (parts.length === 3) {
        ms += (isNaN(parts[0]) ? 0 : parts[0]) * MS_PER_HOUR;
        ms += (isNaN(parts[1]) ? 0 : parts[1]) * MS_PER_MINUTE;
        ms += (isNaN(parts[2]) ? 0 : parts[2]) * MS_PER_SECOND;
    } else if (parts.length === 2) {
        ms += (isNaN(parts[0]) ? 0 : parts[0]) * MS_PER_MINUTE;
        ms += (isNaN(parts[1]) ? 0 : parts[1]) * MS_PER_SECOND;
    } else if (parts.length === 1) {
        ms += (isNaN(parts[0]) ? 0 : parts[0]) * MS_PER_SECOND;
    }
    return ms;
}
function parseMinutesToMs(minutes) {
    minutes = parseInt(minutes, 10);
    return isNaN(minutes) || minutes < 0 ? 0 : minutes * MS_PER_MINUTE;
}
function calculateStatus(task, nowMs, allTasks) {
    try {
        if (task.repetitionType === 'none' && task.completed) return { name: 'blue', className: 'task-blue' };
        if (task.repetitionType !== 'none' && task.maxMisses > 0 && task.trackMisses && (task.misses / task.maxMisses) >= 1) {
            return { name: 'black', className: 'task-black' };
        }
        if (task.confirmationState === 'awaiting_overdue_input' || task.confirmationState === 'confirming_miss') {
            let currentVisualStatus = (task.repetitionType !== 'none' && task.maxMisses > 0 && task.trackMisses && (task.misses / task.maxMisses) > 0.5) ? 'black' : 'red';
            return { name: currentVisualStatus, className: `task-${currentVisualStatus}` };
        }
        if (task.confirmationState === 'confirming_complete') {
            const dueDateMs = (task.dueDate && !isNaN(task.dueDate)) ? task.dueDate.getTime() : null;
            if (dueDateMs && dueDateMs <= nowMs) {
                return { name: 'red', className: 'task-red' };
            }
        }
        const cycleEndMs = (task.cycleEndDate && !isNaN(task.cycleEndDate)) ? task.cycleEndDate.getTime() : null;
        const isCycleActive = cycleEndMs === null || cycleEndMs <= nowMs;
        if (task.status === 'blue' && !isCycleActive) {
            return { name: 'blue', className: 'task-blue' };
        }
        const dueDateMs = (task.dueDate && !isNaN(task.dueDate)) ? task.dueDate.getTime() : null;
        const isPastDue = dueDateMs !== null && dueDateMs <= nowMs;
        if (isPastDue) {
            let overdueStatusName = (task.repetitionType !== 'none' && task.maxMisses > 0 && task.trackMisses && (task.misses / task.maxMisses) > 0.5) ? 'black' : 'red';
            return { name: overdueStatusName, className: `task-${overdueStatusName}` };
        }
        let activeStatusName = 'green';
        let taskEstimateMs = getDurationMs(task.estimatedDurationAmount, task.estimatedDurationUnit) || MS_PER_MINUTE * 30;
        if (dueDateMs) {
            const timeUntilDue = dueDateMs - nowMs;
            const activeBusyTasksForSum = allTasks.filter(t => {
                if (t.id === task.id) return false;
                if (t.countsAsBusy === false) return false;
                if (t.repetitionType === 'none' && t.completed) return false;
                const tCycleEndMs = (t.cycleEndDate && !isNaN(t.cycleEndDate)) ? t.cycleEndDate.getTime() : null;
                if (t.status === 'blue' && tCycleEndMs !== null && tCycleEndMs > nowMs) return false;
                if (t.status === 'black') return false;
                const tDueDateMs = (t.dueDate && !isNaN(t.dueDate)) ? t.dueDate.getTime() : null;
                if (!tDueDateMs || tDueDateMs <= nowMs) return false;
                if (t.confirmationState) return false;
                return true;
            });
            const getRemainingEstimateMs = (t) => {
                const tEstimateMs = getDurationMs(t.estimatedDurationAmount, t.estimatedDurationUnit) || MS_PER_MINUTE * 30;
                if (t.completionType === 'count' && t.countTarget > 0) {
                    const ratio = Math.min(1, (t.currentProgress || 0) / t.countTarget);
                    return tEstimateMs * (1 - ratio);
                } else if (t.completionType === 'time' && t.timeTargetAmount) {
                    const target = getDurationMs(t.timeTargetAmount, t.timeTargetUnit);
                    return Math.max(0, target - (t.currentProgress || 0));
                } else {
                    return tEstimateMs;
                }
            };
            const yellowLookaheadMs = nowMs + YELLOW_WINDOW_MS;
            const sumRelevantEstimatesMs = activeBusyTasksForSum.reduce((sum, t) => {
                const tDueDateMs = t.dueDate.getTime();
                if (t.status === 'yellow' || t.status === 'red' || (t.status === 'green' && tDueDateMs <= yellowLookaheadMs)) {
                    return sum + getRemainingEstimateMs(t);
                }
                return sum;
            }, 0);
            const sumYellowAndRedEstimatesMs = activeBusyTasksForSum
                .filter(t => t.status === 'yellow' || t.status === 'red')
                .reduce((sum, t) => sum + getRemainingEstimateMs(t), 0);
            if ((nowMs + sumYellowAndRedEstimatesMs) > dueDateMs) {
                activeStatusName = 'red';
            } else if ((nowMs + sumRelevantEstimatesMs) > dueDateMs) {
                activeStatusName = 'yellow';
            }
            if (timeUntilDue <= taskEstimateMs) {
                activeStatusName = 'red';
            } else if (activeStatusName !== 'red' && timeUntilDue <= taskEstimateMs * 2) {
                activeStatusName = 'yellow';
            }
        } else {
            activeStatusName = 'green';
        }
        let finalStatusName = activeStatusName;
        if (finalStatusName !== 'black' && task.repetitionType !== 'none' && task.maxMisses > 0 && task.trackMisses) {
            const missRatio = task.misses / task.maxMisses;
            if (missRatio > 0.5 && missRatio < 1) {
                if (finalStatusName === 'red') finalStatusName = 'black';
                else if (finalStatusName === 'yellow') finalStatusName = 'red';
                else if (finalStatusName === 'green') finalStatusName = 'yellow';
            }
        }
        if (task.repetitionType !== 'none' && task.maxMisses > 0 && task.trackMisses && (task.misses / task.maxMisses) >= 1) {
            finalStatusName = 'black';
        }
        return { name: finalStatusName, className: `task-${finalStatusName}` };
    } catch (e) {
        console.error("Error calculating status for task:", task?.id, e);
        return { name: 'green', className: 'task-green' };
    }
}
function calculatePendingCycles(task, nowMs) {
    let cycles = 0;
    const originalDueDate = task.overdueStartDate ? new Date(task.overdueStartDate) : (task.dueDate ? new Date(task.dueDate) : null);
    if (!originalDueDate || isNaN(originalDueDate)) {
        console.warn(`Cannot calculate pending cycles for task ${task.id}: Invalid original due date.`);
        return 0;
    }
    const originalDueDateMs = originalDueDate.getTime();
    const nowDate = new Date(nowMs);
    if (task.repetitionType !== 'none' && originalDueDateMs < nowMs) {
        if (task.repetitionType === 'relative' && task.repetitionAmount && task.repetitionUnit) {
            const intervalMs = getDurationMs(task.repetitionAmount, task.repetitionUnit);
            if (intervalMs > 0) {
                cycles = Math.floor((nowMs - originalDueDateMs) / intervalMs);
                cycles = Math.max(0, cycles) + 1;
            } else {
                console.warn(`Invalid relative interval for task ${task.id}. Defaulting to 1 cycle.`);
                cycles = 1;
            }
        } else if (task.repetitionType === 'absolute') {
            try {
                const occurrences = generateAbsoluteOccurrences(task, new Date(originalDueDate), new Date(nowDate));
                const missedOccurrences = occurrences.filter(occ =>
                    occ.getTime() > originalDueDateMs && occ.getTime() <= nowMs
                );
                cycles = missedOccurrences.length + 1;
            } catch (e) {
                console.error(`Error generating occurrences for pending cycles task ${task.id}:`, e);
                cycles = 1;
            }
        } else {
            cycles = 1;
        }
    }
    return Math.max(cycles, 0);
}
function checkDayOfMonthMatch(date, daysOfMonth) {
    if (!daysOfMonth || daysOfMonth.length === 0) return false;
    const day = date.getDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (const selectedDay of daysOfMonth) {
        const selectedDayStr = String(selectedDay);
        if (selectedDayStr === 'last' && day === daysInMonth) return true;
        if (selectedDayStr === 'second_last' && day === daysInMonth - 1) return true;
        if (selectedDayStr === 'third_last' && day === daysInMonth - 2) return true;
        const selectedDayNum = parseInt(selectedDayStr, 10);
        if (!isNaN(selectedDayNum) && selectedDayNum === day) {
            return true;
        }
    }
    return false;
}
function checkNthWeekdayMatch(date, occurrences, weekdays) {
    if (!occurrences || occurrences.length === 0 || !weekdays || weekdays.length === 0) return false;
    const targetDayOfWeek = date.getDay();
    if (!weekdays.includes(targetDayOfWeek)) {
        return false;
    }
    const dayOfMonth = date.getDate();
    const month = date.getMonth();
    const occurrenceNumber = Math.ceil(dayOfMonth / 7);
    for (const selectedOcc of occurrences) {
        const selectedOccStr = String(selectedOcc);
        if (selectedOccStr === 'last') {
            let nextWeekDate = new Date(date);
            nextWeekDate.setDate(dayOfMonth + 7);
            if (nextWeekDate.getMonth() !== month) return true;
        } else {
            const selectedOccNum = parseInt(selectedOccStr, 10);
            if (!isNaN(selectedOccNum) && selectedOccNum === occurrenceNumber) {
                return true;
            }
        }
    }
    return false;
}
function generateAbsoluteOccurrences(task, startDate, endDate) {
    if (task.repetitionType !== 'absolute' || !task.repetitionAbsoluteFrequency || !startDate || isNaN(startDate) || !endDate || isNaN(endDate) || endDate < startDate) {
        console.error(`Invalid input for generateAbsoluteOccurrences for task ${task.id}`);
        return [];
    }
    let occurrences = [];
    let currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    const maxDaysToScan = 366 * 10;
    let daysScanned = 0;
    const applyTime = (date) => {
        const originalTimeSource = task.dueDate || startDate;
        if (originalTimeSource && !isNaN(originalTimeSource)) {
            date.setHours(originalTimeSource.getHours(), originalTimeSource.getMinutes(), originalTimeSource.getSeconds(), originalTimeSource.getMilliseconds());
        } else {
            date.setHours(0, 0, 0, 0);
        }
        return date;
    };
    while (currentDate <= endDate && daysScanned < maxDaysToScan) {
        daysScanned++;
        let month = currentDate.getMonth();
        let dayOfWeek = currentDate.getDay();
        let isMatch = false;
        try {
            switch (task.repetitionAbsoluteFrequency) {
                case 'weekly':
                    if (task.repetitionAbsoluteWeeklyDays?.includes(dayOfWeek)) isMatch = true;
                    break;
                case 'monthly':
                    if (task.repetitionAbsoluteMonthlyMode === 'day_number') {
                        if (checkDayOfMonthMatch(currentDate, task.repetitionAbsoluteDaysOfMonth)) isMatch = true;
                    } else {
                        if (checkNthWeekdayMatch(currentDate, task.repetitionAbsoluteNthWeekdayOccurrence, task.repetitionAbsoluteNthWeekdayDays)) isMatch = true;
                    }
                    break;
                case 'yearly':
                    if (task.repetitionAbsoluteYearlyMonths?.includes(month)) {
                        if (task.repetitionAbsoluteYearlyMode === 'day_number') {
                            if (checkDayOfMonthMatch(currentDate, task.repetitionAbsoluteYearlyDaysOfMonth)) isMatch = true;
                        } else {
                            if (checkNthWeekdayMatch(currentDate, task.repetitionAbsoluteYearlyNthWeekdayOccurrence, task.repetitionAbsoluteYearlyNthWeekdayDays)) isMatch = true;
                        }
                    }
                    break;
            }
        } catch (e) {
            console.error(`Error checking match for ${task.id} on ${currentDate} in generateAbsoluteOccurrences:`, e);
        }
        if (isMatch) {
            let occurrenceDate = applyTime(new Date(currentDate));
            if (occurrenceDate.getTime() >= startDate.getTime() && occurrenceDate.getTime() <= endDate.getTime()) {
                occurrences.push(occurrenceDate);
            }
        }
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(0, 0, 0, 0);
    }
    if (daysScanned >= maxDaysToScan) {
        console.warn(`generateAbsoluteOccurrences reached scan limit (${maxDaysToScan} days) for task ${task.id}`);
    }
    occurrences.sort((a, b) => a.getTime() - b.getTime());
    return occurrences;
}
function sanitizeAndUpgradeTask(task) {
    const defaults = {
        name: 'Unnamed Task',
        icon: null,
        timeInputType: 'due',
        dueDateType: 'absolute',
        dueDate: null,
        repetitionType: 'none',
        maxMisses: null,
        trackMisses: true,
        countsAsBusy: true,
        completionType: 'simple',
        currentProgress: 0,
        isTimerRunning: false,
        timerLastStarted: null,
        confirmationState: null,
        overdueStartDate: null,
        pendingCycles: null,
        misses: 0,
        completed: false,
        status: 'green',
        createdAt: new Date(),
        cycleEndDate: null,
        completionReducedMisses: false,
        estimatedDurationAmount: null,
        estimatedDurationUnit: 'minutes',
        categoryId: null,
        relativeAmount: null,
        relativeUnit: null,
        repetitionAmount: null,
        repetitionUnit: null,
        repetitionAbsoluteFrequency: null,
        repetitionAbsoluteWeeklyDays: null,
        repetitionAbsoluteMonthlyMode: null,
        repetitionAbsoluteDaysOfMonth: null,
        repetitionAbsoluteNthWeekdayOccurrence: null,
        repetitionAbsoluteNthWeekdayDays: null,
        repetitionAbsoluteYearlyMonths: null,
        repetitionAbsoluteYearlyMode: null,
        repetitionAbsoluteYearlyDaysOfMonth: null,
        repetitionAbsoluteYearlyNthWeekdayOccurrence: null,
        repetitionAbsoluteYearlyNthWeekdayDays: null,
        countTarget: null,
        timeTargetAmount: null,
        timeTargetUnit: null,
    };
    const originalTaskJSON = JSON.stringify(task);
    let upgradedTask = { ...defaults };
    for (const key in defaults) {
        if (task.hasOwnProperty(key) && task[key] !== undefined) {
            upgradedTask[key] = task[key];
        }
    }

    upgradedTask.id = task.id;
    if (task.createdAt) {
      upgradedTask.createdAt = task.createdAt;
    }
    if (task.estimatedDuration && !task.estimatedDurationAmount) {
        upgradedTask.estimatedDurationAmount = parseInt(task.estimatedDuration, 10);
        upgradedTask.estimatedDurationUnit = 'minutes';
    }
    if (upgradedTask.dueDateType !== 'relative') {
        upgradedTask.relativeAmount = null;
        upgradedTask.relativeUnit = null;
    }
    if (upgradedTask.repetitionType === 'none') {
        upgradedTask.repetitionAmount = null;
        upgradedTask.repetitionUnit = null;
        upgradedTask.repetitionAbsoluteFrequency = null;
        upgradedTask.maxMisses = null;
    }
    if (upgradedTask.repetitionType !== 'relative') {
        upgradedTask.repetitionAmount = null;
        upgradedTask.repetitionUnit = null;
    }
    if (upgradedTask.repetitionType !== 'absolute') {
        upgradedTask.repetitionAbsoluteFrequency = null;
    }
    if (upgradedTask.completionType !== 'count') {
        upgradedTask.countTarget = null;
    }
    if (upgradedTask.completionType !== 'time') {
        upgradedTask.timeTargetAmount = null;
        upgradedTask.timeTargetUnit = null;
    }
    if (JSON.stringify(upgradedTask) !== originalTaskJSON) {
        console.log(`Upgraded task ID ${task.id}:`, { from: JSON.parse(originalTaskJSON), to: upgradedTask });
    }
    return upgradedTask;
}
function getRandomColor() {
    // If theming is enabled, use one of the complementary colors for new categories.
    if (theming.enabled) {
        const complementaryPalette = generateComplementaryPalette(theming.baseColor);
        // Return a random color from the complementary set (excluding the main button colors)
        return complementaryPalette[Math.floor(Math.random() * (complementaryPalette.length - 2)) + 2];
    }
    // Original random pastel color logic
    const hue = Math.floor(Math.random() * 360);
    const hslToHex = (h, s, l) => {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    };
    return hslToHex(hue, 80, 85);
}
function getContrastingTextColor(hexcolor) {
    if (!hexcolor) return { color: '#000000', textShadow: 'none' };

    const r = parseInt(hexcolor.substr(1, 2), 16);
    const g = parseInt(hexcolor.substr(3, 2), 16);
    const b = parseInt(hexcolor.substr(5, 2), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    let textColor = luminance > 0.5 ? '#000000' : '#FFFFFF';
    let textShadow = 'none';

    const distanceFromMiddle = Math.abs(luminance - 0.5);
    const opacity = 1 - (distanceFromMiddle / 0.5);

    if (luminance > 0.25 && luminance < 0.75) {
        let shadowColor = luminance > 0.5 ? `rgba(255, 255, 255, ${opacity * 0.7})` : `rgba(0, 0, 0, ${opacity * 0.7})`;
        textShadow = `0px 0px 1px ${shadowColor}`;
    }

    return { color: textColor, textShadow: textShadow };
}
function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0');
}
function interpolateColor(color1, color2, factor) {
    let rgb1 = hexToRgb(color1);
    let rgb2 = hexToRgb(color2);
    if (!rgb1 || !rgb2) return color1; // Fallback

    let result = {
        r: Math.round(rgb1.r + factor * (rgb2.r - rgb1.r)),
        g: Math.round(rgb1.g + factor * (rgb2.g - rgb1.g)),
        b: Math.round(rgb1.b + factor * (rgb2.b - rgb1.b))
    };
    return rgbToHex(result.r, result.g, result.b);
}
function interpolateFiveColors(percent) {
    const colors = [statusColors.black, statusColors.red, statusColors.yellow, statusColors.green, statusColors.blue];
    if (percent <= 0) return colors[0];
    if (percent >= 1) return colors[4];

    const scaledPercent = percent * 4; // Scale to 0-4 range
    const colorIndex = Math.floor(scaledPercent);
    const factor = scaledPercent - colorIndex;

    const interpolatedHex = interpolateColor(colors[colorIndex], colors[colorIndex + 1], factor);

    // Adjust lightness to prevent colors from becoming too pale, ensuring text contrast.
    const hsl = hexToHSL(interpolatedHex);
    hsl.l = Math.max(25, Math.min(hsl.l, 85)); // Clamp lightness between 25% and 85%
    return HSLToHex(hsl.h, hsl.s, hsl.l);
}
function getDueDateGroup(dueDate) {
    if (!dueDate || isNaN(dueDate)) return { name: 'Unscheduled', index: 12 };

    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();

    if (diffMs <= 0) return { name: 'Overdue', index: 0 };
    if (diffMs <= MS_PER_HOUR) return { name: 'Next Hour', index: 1 };
    if (diffMs <= MS_PER_HOUR * 4) return { name: 'Next 4 Hours', index: 2 };
    if (diffMs <= MS_PER_HOUR * 8) return { name: 'Next 8 Hours', index: 3 };

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    if (dueDate <= endOfDay) return { name: 'End of Day', index: 4 };

    const endOfTomorrow = new Date(endOfDay);
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
    if (dueDate <= endOfTomorrow) return { name: 'End of Tomorrow', index: 5 };

    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (6 - now.getDay())); // Assuming Sunday is day 0
    endOfWeek.setHours(23, 59, 59, 999);
    if (dueDate <= endOfWeek) return { name: 'End of Week', index: 6 };

    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    if (dueDate <= endOfMonth) return { name: 'End of Month', index: 7 };

    const quarter = Math.floor(now.getMonth() / 3);
    const endOfQuarter = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
    if (dueDate <= endOfQuarter) return { name: 'End of Quarter', index: 8 };

    const endOfYear = new Date(now.getFullYear(), 12, 0, 23, 59, 59, 999);
    if (dueDate <= endOfYear) return { name: 'End of Year', index: 9 };

    const endOf5Years = new Date(now.getFullYear() + 5, 11, 31, 23, 59, 59, 999);
    if (dueDate <= endOf5Years) return { name: 'Next 5 Years', index: 10 };

    const endOf10Years = new Date(now.getFullYear() + 10, 11, 31, 23, 59, 59, 999);
    if (dueDate <= endOf10Years) return { name: 'Next 10 Years', index: 11 };

    return { name: 'Beyond 10 Years', index: 12 };
}

function getTaskOccurrences(task, viewStartDate, viewEndDate) {
    if (!task.dueDate) return [];

    const initialDueDate = new Date(task.dueDate);

    if (task.repetitionType === 'none') {
        if (initialDueDate >= viewStartDate && initialDueDate < viewEndDate) {
            return [initialDueDate];
        }
        return [];
    }

    if (task.repetitionType === 'absolute') {
        // For absolute, we can just generate occurrences within the window.
        // We need a reliable start date for the generation, let's use the task's creation date or an early date.
        const generationStartDate = new Date(Math.min(initialDueDate.getTime(), viewStartDate.getTime()));
        return generateAbsoluteOccurrences(task, generationStartDate, viewEndDate)
               .filter(occ => occ >= viewStartDate && occ < viewEndDate);
    }

    if (task.repetitionType === 'relative') {
        let results = [];
        const intervalMs = getDurationMs(task.repetitionAmount, task.repetitionUnit);
        if (intervalMs <= 0) return [];

        // Start from the task's due date and generate forward.
        let currentDate = new Date(initialDueDate);
        while (currentDate < viewStartDate) {
             currentDate = new Date(currentDate.getTime() + intervalMs);
        }

        // Generate occurrences within the view window
        let i = 0; // Safety break
        while (currentDate < viewEndDate && i < 100) {
            if (currentDate >= viewStartDate) {
                 results.push(new Date(currentDate));
            }
            currentDate = new Date(currentDate.getTime() + intervalMs);
            i++;
        }
        return results;
    }

    return [];
}


// --- Theming Engine Functions ---

function hexToHSL(H) {
    let r = 0, g = 0, b = 0;
    if (H.length == 4) {
        r = "0x" + H[1] + H[1]; g = "0x" + H[2] + H[2]; b = "0x" + H[3] + H[3];
    } else if (H.length == 7) {
        r = "0x" + H[1] + H[2]; g = "0x" + H[3] + H[4]; b = "0x" + H[5] + H[6];
    }
    r /= 255; g /= 255; b /= 255;
    let cmin = Math.min(r,g,b), cmax = Math.max(r,g,b), delta = cmax - cmin, h = 0, s = 0, l = 0;
    if (delta == 0) h = 0;
    else if (cmax == r) h = ((g - b) / delta) % 6;
    else if (cmax == g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    l = (cmax + cmin) / 2;
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);
    return { h, s, l };
}

function HSLToHex(h, s, l) {
    s /= 100; l /= 100;
    let c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c/2, r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
    r = Math.round((r + m) * 255).toString(16);
    g = Math.round((g + m) * 255).toString(16);
    b = Math.round((b + m) * 255).toString(16);
    if (r.length == 1) r = "0" + r;
    if (g.length == 1) g = "0" + g;
    if (b.length == 1) b = "0" + b;
    return "#" + r + g + b;
}

function generateGradientPalette(baseColor) {
    const baseHSL = hexToHSL(baseColor);
    const palette = {
        blue:   HSLToHex(baseHSL.h, Math.min(100, baseHSL.s + 10), Math.min(100, baseHSL.l + 15)),
        green:  HSLToHex(baseHSL.h, baseHSL.s, baseHSL.l),
        yellow: HSLToHex(baseHSL.h, Math.min(100, baseHSL.s + 15), Math.max(0, baseHSL.l - 15)),
        red:    HSLToHex(baseHSL.h, Math.min(100, baseHSL.s + 25), Math.max(0, baseHSL.l - 30)),
        black:  HSLToHex(baseHSL.h, baseHSL.s, Math.max(0, baseHSL.l - 45))
    };
    return palette;
}

function generateComplementaryPalette(baseColor) {
    const baseHSL = hexToHSL(baseColor);
    // Main buttons are a triadic color scheme (evenly spaced on the color wheel)
    const addTaskBtnColor = HSLToHex(baseHSL.h, baseHSL.s, baseHSL.l);
    const calendarBtnColor = HSLToHex((baseHSL.h + 120) % 360, baseHSL.s, baseHSL.l);
    const advancedOptionsBtnColor = HSLToHex((baseHSL.h + 240) % 360, baseHSL.s, baseHSL.l);

    // Category colors are more varied, derived from the complementary
    const complementaryHue = (baseHSL.h + 180) % 360;
    const catColor1 = HSLToHex(complementaryHue, baseHSL.s - 10, baseHSL.l + 10);
    const catColor2 = HSLToHex((complementaryHue + 60) % 360, baseHSL.s - 10, baseHSL.l + 10);
    const catColor3 = HSLToHex((complementaryHue - 60 + 360) % 360, baseHSL.s, baseHSL.l);
    return [addTaskBtnColor, calendarBtnColor, advancedOptionsBtnColor, catColor1, catColor2, catColor3];
}

function applyDayNightMode() {
    document.body.classList.toggle('light-mode', theming.mode === 'day');
    // We will add more comprehensive style changes in styles.css
    if (theming.mode === 'day') {
        document.body.style.backgroundColor = '#F9FAFB'; // Light Gray
        document.body.style.color = '#111827'; // Dark Gray
    } else {
        document.body.style.backgroundColor = '#111827'; // Dark Gray
        document.body.style.color = '#F3F4F6'; // Light Gray
    }
}

function applyTheme() {
    applyDayNightMode(); // Apply day/night mode first

    const addTaskBtn = document.getElementById('add-task-btn');
    const advancedOptionsBtn = document.getElementById('advanced-options-btn');

    if (theming.enabled) {
        const gradientPalette = generateGradientPalette(theming.baseColor);
        statusColors = gradientPalette;

        const complementaryPalette = generateComplementaryPalette(theming.baseColor);

        [addTaskBtn, advancedOptionsBtn].forEach((btn, index) => {
            if (btn) {
                const bgColor = complementaryPalette[index];
                const textStyle = getContrastingTextColor(bgColor);
                btn.style.backgroundColor = bgColor;
                btn.style.color = textStyle.color;
                btn.style.textShadow = textStyle.textShadow;
            }
        });

    } else {
        // Revert to default colors
        statusColors = { ...defaultStatusColors };
        [addTaskBtn, advancedOptionsBtn].forEach(btn => {
            if (btn) {
                btn.style.backgroundColor = ''; // Revert to CSS
                btn.style.color = '';
                btn.style.textShadow = '';
            }
        });
    }
    renderTasks();
    renderPlanner(); // Re-render planner to apply theme changes
}





// =================================================================================
// SECTION 3: UI Rendering Functions
// =================================================================================
function stopAllTimers() {
    stopAllCountdownTimers();
    Object.keys(taskTimers).forEach(taskId => stopTaskTimer(taskId));
}
function stopCountdownTimer(taskId) {
    if (countdownIntervals[taskId]) {
        clearInterval(countdownIntervals[taskId]);
        delete countdownIntervals[taskId];
    }
}
function stopAllCountdownTimers() {
    Object.keys(countdownIntervals).forEach(taskId => clearInterval(countdownIntervals[taskId]));
    countdownIntervals = {};
}
function stopTaskTimer(taskId) {
    if (taskTimers[taskId]) {
        clearInterval(taskTimers[taskId]);
        delete taskTimers[taskId];
    }
}
function renderTasks() {
    stopAllTimers();
    taskListDiv.innerHTML = '';
    const filteredTasks = tasks.filter(task => {
        if (categoryFilter.length === 0) return true;
        if (!task.categoryId) return categoryFilter.includes(null);
        return categoryFilter.includes(task.categoryId);
    });
    if (filteredTasks.length === 0) {
        taskListDiv.innerHTML = '<p class="text-gray-500 text-center italic">No tasks match the current filter.</p>';
        return;
    }
    const statusOrder = { 'black': 0, 'red': 1, 'yellow': 2, 'green': 3, 'blue': 4 };

    // 1. FIRST: Sort the tasks and create the final sorted array.
    const sortedTasks = filteredTasks.sort((a, b) => {
        const completedA = a.repetitionType === 'none' && a.completed;
        const completedB = b.repetitionType === 'none' && b.completed;
        if (completedA && !completedB) return 1;
        if (!completedA && completedB) return -1;
        let comparison = 0;
        if (sortBy === 'status') {
            comparison = (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
        } else if (sortBy === 'dueDate') {
            const dueDateA = a.dueDate ? a.dueDate.getTime() : Infinity;
            const dueDateB = b.dueDate ? b.dueDate.getTime() : Infinity;
            comparison = dueDateA - dueDateB;
        } else if (sortBy === 'category') {
            const categoryA = categories.find(c => c.id === a.categoryId)?.name || 'Uncategorized';
            const categoryB = categories.find(c => c.id === b.categoryId)?.name || 'Uncategorized';
            comparison = categoryA.localeCompare(categoryB);
        }
        if (comparison === 0) {
            const dueDateA = a.dueDate ? a.dueDate.getTime() : Infinity;
            const dueDateB = b.dueDate ? b.dueDate.getTime() : Infinity;
            comparison = dueDateA - dueDateB;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
    });

    // 2. THEN: Now that the array is sorted, loop through it to render the tasks.
    if (sortBy === 'dueDate') {
        const groupedByDate = {};
        sortedTasks.forEach(task => {
            const group = getDueDateGroup(task.dueDate);
            if (!groupedByDate[group.index]) {
                groupedByDate[group.index] = {
                    name: group.name,
                    tasks: []
                };
            }
            groupedByDate[group.index].tasks.push(task);
        });

        const groupOrder = Object.keys(groupedByDate).sort((a, b) => a - b);

        if (sortDirection === 'desc') {
            groupOrder.reverse();
        }

        groupOrder.forEach((groupIndex, i) => {
            const group = groupedByDate[groupIndex];
            const header = document.createElement('div');
            header.className = 'collapsible-header p-2 rounded-md cursor-pointer flex justify-between items-center mt-4';

            const percent = groupOrder.length <= 1 ? 0 : (sortDirection === 'asc' ? i / (groupOrder.length - 1) : (groupOrder.length - 1 - i) / (groupOrder.length - 1));
            const bgColor = interpolateFiveColors(percent);
            const textStyle = getContrastingTextColor(bgColor);

            header.style.backgroundColor = bgColor;
            header.style.color = textStyle.color;
            header.style.textShadow = textStyle.textShadow;

            header.innerHTML = `<h4 class="font-bold">${group.name}</h4><span class="transform transition-transform duration-200"> ▼ </span>`;
            header.dataset.group = group.name;
            taskListDiv.appendChild(header);

            group.tasks.forEach(task => {
                renderSingleTask(task, { groupName: group.name });
            });
        });

    } else { // This block handles 'status' and 'category' sorting
        let lastGroup = null;
        sortedTasks.forEach(task => {
            let currentGroup = '';
            let groupColor = '#e5e7eb';
            let textStyle = { color: '#000000', textShadow: 'none' };

            if (sortBy === 'status') {
                currentGroup = statusNames[task.status] || task.status;
                groupColor = statusColors[task.status] || '#e5e7eb';
            } else if (sortBy === 'category') {
                const category = categories.find(c => c.id === task.categoryId);
                currentGroup = category ? category.name : 'Uncategorized';
                groupColor = category ? category.color : '#FFFFFF';
            }

            if (currentGroup !== lastGroup) {
                const header = document.createElement('div');
                header.className = 'collapsible-header p-2 rounded-md cursor-pointer flex justify-between items-center mt-4';

                textStyle = getContrastingTextColor(groupColor);
                header.style.backgroundColor = groupColor;
                header.style.color = textStyle.color;
                header.style.textShadow = textStyle.textShadow;

                header.innerHTML = `<h4 class="font-bold">${currentGroup}</h4><span class="transform transition-transform duration-200"> ▼ </span>`;
                header.dataset.group = currentGroup;
                taskListDiv.appendChild(header);
                lastGroup = currentGroup;
            }
            renderSingleTask(task, { groupName: currentGroup });
        });
    }

    startAllCountdownTimers();
}

function renderSingleTask(task, options = {}) {
    try {
        const taskElement = document.createElement('div');
        const isCompletedNonRepeating = task.repetitionType === 'none' && task.completed;

        taskElement.className = `task-item p-2 rounded-lg shadow flex justify-between items-start`;
        taskElement.dataset.taskId = task.id;
        taskElement.dataset.status = task.status;

        const statusColor = statusColors[task.status] || statusColors.green;
        taskElement.style.backgroundColor = statusColor;

        const category = categories.find(c => c.id === task.categoryId);
        const categoryColor = category ? category.color : 'transparent';
        taskElement.style.borderLeft = `5px solid ${categoryColor}`;

        const textStyle = getContrastingTextColor(statusColor);
        taskElement.style.color = textStyle.color;
        taskElement.style.textShadow = textStyle.textShadow;

        if (options.groupName) {
            taskElement.dataset.group = options.groupName;
        }
        taskElement.dataset.confirming = !!task.confirmationState;
        if (isCompletedNonRepeating) {
            taskElement.classList.add('task-completed');
        }
        if (task.confirmationState === 'confirming_delete') {
            taskElement.classList.add('task-confirming-delete');
        }

        const categoryName = category ? category.name : 'Uncategorized';
        let categoryHtml = '';
        if (taskDisplaySettings.showCategory) {
            const categoryColor = category ? category.color : '#808080'; // Default to gray
            const categoryTextStyle = getContrastingTextColor(categoryColor);
            categoryHtml = `<span class="text-xs font-medium px-2 py-1 rounded-full" style="background-color: ${categoryColor}; color: ${categoryTextStyle.color}; text-shadow: ${categoryTextStyle.textShadow};">${categoryName}</span>`;
        }

        const dueDateStr = (task.dueDate && !isNaN(task.dueDate)) ? task.dueDate.toLocaleString() : 'No due date';
        const dueDateHtml = taskDisplaySettings.showDueDate ? `<p class="text-sm opacity-80">Due: ${dueDateStr}</p>` : '';

        let repetitionStr = '';
        if (task.repetitionType === 'relative') {
            repetitionStr = `Repeats: Every ${task.repetitionAmount || '?'} ${task.repetitionUnit || '?'}`;
        } else if (task.repetitionType === 'absolute') {
            repetitionStr = `Repeats: ${getAbsoluteRepetitionString(task)}`;
        }
        const repetitionHtml = taskDisplaySettings.showRepetition && repetitionStr ? `<p class="text-sm opacity-70">${repetitionStr}</p>` : '';

        const durationStr = formatDuration(task.estimatedDurationAmount, task.estimatedDurationUnit);
        const durationHtml = taskDisplaySettings.showDuration ? `<p class="text-sm opacity-70">Est. Duration: ${durationStr}</p>` : '';

        const countdownHtml = taskDisplaySettings.showCountdown ? `<p id="countdown-${task.id}" class="countdown-timer"></p>` : '';

        let progressHtml = '';
        if (taskDisplaySettings.showProgress && task.status !== 'blue' && !isCompletedNonRepeating && (task.completionType === 'count' || task.completionType === 'time')) {
            progressHtml = `<div id="progress-container-${task.id}" class="mt-1 h-5">`;
            let progressText = '';
            if (task.completionType === 'count' && task.countTarget) {
                progressText = `${task.currentProgress || 0} / ${task.countTarget}`;
            } else if (task.completionType === 'time' && task.timeTargetAmount) {
                const targetMs = getDurationMs(task.timeTargetAmount, task.timeTargetUnit);
                progressText = `${formatMsToTime(task.currentProgress || 0)} / ${formatMsToTime(targetMs)}`;
            }
            progressHtml += `<span id="progress-${task.id}" class="progress-display">${progressText}</span>`;
            if (!task.confirmationState && task.status !== 'blue') {
                progressHtml += `<button data-action="editProgress" data-task-id="${task.id}" class="edit-progress-button" title="Edit Progress" aria-label="Edit progress for ${task.name}">[Edit]</button>`;
            }
            progressHtml += `</div>`;
        }

        const missesHtml = (task.repetitionType !== 'none' && task.maxMisses && task.trackMisses)
            ? `<p class="misses-display mt-1">Misses: ${task.misses}/${task.maxMisses}</p>`
            : '';
        const actionAreaContainer = `<div id="action-area-${task.id}" class="flex flex-col space-y-1 items-end flex-shrink-0 min-h-[50px]"></div>`;
        const commonButtonsContainer = `<div id="common-buttons-${task.id}" class="common-buttons-container"></div>`;
        const iconHtml = task.icon ? `<i class="${task.icon} mr-2"></i>` : '';

        taskElement.innerHTML = `<div class="flex-grow pr-4"><div class="flex justify-between items-baseline"><h3 class="text-lg font-semibold">${iconHtml}${task.name || 'Unnamed Task'}</h3>${categoryHtml}</div>${dueDateHtml}${repetitionHtml}${durationHtml}${countdownHtml}${progressHtml}</div><div class="flex flex-col space-y-1 items-end flex-shrink-0">${actionAreaContainer}${missesHtml}${commonButtonsContainer}</div>`;
        taskListDiv.appendChild(taskElement);
        const actionArea = taskElement.querySelector(`#action-area-${task.id}`);
        const commonButtonsArea = taskElement.querySelector(`#common-buttons-${task.id}`);
        if (actionArea) actionArea.innerHTML = generateActionHtml(task);
        if (commonButtonsArea) commonButtonsArea.innerHTML = generateCommonButtonsHtml(task);
    } catch (e) {
        console.error("Error rendering task:", task?.id, e);
    }
}

function getAbsoluteRepetitionString(task) {
    if (!task.repetitionAbsoluteFrequency) return 'Absolute Schedule (Error)';
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const occurrences = { '1': 'First', '2': 'Second', '3': 'Third', '4': 'Fourth', 'last': 'Last' };
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const daySuffix = (day) => {
        if (day === 'last') return 'Last';
        if (day === 'second_last') return '2nd Last';
        if (day === 'third_last') return '3rd Last';
        const n = parseInt(day);
        if (isNaN(n)) return '?';
        if (n % 10 === 1 && n !== 11) return `${n}st`;
        if (n % 10 === 2 && n !== 12) return `${n}nd`;
        if (n % 10 === 3 && n !== 13) return `${n}rd`;
        return `${n}th`;
    };
    try {
        switch (task.repetitionAbsoluteFrequency) {
            case 'weekly':
                const selectedDaysW = (task.repetitionAbsoluteWeeklyDays || []).sort((a,b) => a-b).map(d => weekdays[d]).join(', ');
                return `Weekly on ${selectedDaysW || '...'}`;
            case 'monthly':
                if (task.repetitionAbsoluteMonthlyMode === 'day_of_week') {
                    const occArr = (task.repetitionAbsoluteNthWeekdayOccurrence || []);
                    const occStr = occArr.length > 0 ? occArr.map(o => occurrences[o] || '?').join(', ') : '...';
                    const dayArr = (task.repetitionAbsoluteNthWeekdayDays || []);
                    const dayStrM = dayArr.length > 0 ? dayArr.sort((a,b)=>a-b).map(d => weekdays[d]).join(', ') : '...';
                    return `Monthly on the ${occStr} ${dayStrM}`;
                } else {
                    const dayArr = (task.repetitionAbsoluteDaysOfMonth || []);
                    const dayStr = dayArr.length > 0 ? dayArr.map(d => daySuffix(d)).join(', ') : '?';
                    return `Monthly on day(s) ${dayStr}`;
                }
            case 'yearly':
                const monthArr = (task.repetitionAbsoluteYearlyMonths || []);
                const monthStr = monthArr.length > 0 ? monthArr.sort((a,b)=>a-b).map(m => months[m] || '?').join(', ') : '...';
                if (task.repetitionAbsoluteYearlyMode === 'day_of_week') {
                    const occArr = (task.repetitionAbsoluteYearlyNthWeekdayOccurrence || []);
                    const occStr = occArr.length > 0 ? occArr.map(o => occurrences[o] || '?').join(', ') : '?';
                    const dayArr = (task.repetitionAbsoluteYearlyNthWeekdayDays || []);
                    const dayStrY = dayArr.length > 0 ? dayArr.sort((a,b)=>a-b).map(d => weekdays[d]).join(', ') : '...';
                    return `Yearly on the ${occStr} ${dayStrY} of ${monthStr}`;
                } else {
                    const dayArr = (task.repetitionAbsoluteYearlyDaysOfMonth || []);
                    const dayStr = dayArr.length > 0 ? dayArr.map(d => daySuffix(d)).join(', ') : '?';
                    return `Yearly on ${monthStr} ${dayStr}`;
                }
            default: return `Repeats: ${task.repetitionAbsoluteFrequency}`;
        }
    } catch (e) {
        console.error("Error generating absolute repetition string:", task.id, e);
        return "Absolute Schedule (Error)";
    }
}
function generateActionHtml(task) {
    const cycles = task.pendingCycles || 1;
    switch (task.confirmationState) {
        case 'confirming_complete':
            const text = cycles > 1 ? `Confirm Completion (${cycles} cycles)?` : 'Confirm Completion?';
            return `<div class="flex items-center space-x-1"><span class="action-area-text">${text}</span> <button data-action="confirmCompletion" data-task-id="${task.id}" data-confirmed="true" class="control-button control-button-green">Yes</button> <button data-action="confirmCompletion" data-task-id="${task.id}" data-confirmed="false" class="control-button control-button-red">No</button></div>`;
        case 'awaiting_overdue_input':
            return `<div class="flex items-center space-x-1"><span class="action-area-text">Past Due:</span> <button data-action="handleOverdue" data-task-id="${task.id}" data-choice="completed" class="control-button control-button-green">Done</button> <button data-action="handleOverdue" data-task-id="${task.id}" data-choice="missed" class="control-button control-button-red">Missed</button></div>`;
        case 'confirming_miss':
            const input = cycles > 1 ? `<input type="number" id="miss-count-input-${task.id}" value="${cycles}" min="0" max="${cycles}" class="miss-input"> / ${cycles} cycles?` : '?';
            return `<div class="flex items-center space-x-1"><span class="action-area-text">Confirm Misses ${input}</span> <button data-action="confirmMiss" data-task-id="${task.id}" data-confirmed="true" class="control-button control-button-green">Yes</button> <button data-action="confirmMiss" data-task-id="${task.id}" data-confirmed="false" class="control-button control-button-red">No</button></div>`;
        case 'confirming_delete':
            return `<div class="flex items-center space-x-1"><span class="action-area-text">Delete Task?</span> <button data-action="confirmDelete" data-task-id="${task.id}" data-confirmed="true" class="control-button control-button-red">Yes</button> <button data-action="confirmDelete" data-task-id="${task.id}" data-confirmed="false" class="control-button control-button-gray">Cancel</button></div>`;
        case 'confirming_undo':
            return `<div class="flex items-center space-x-1"><span class="action-area-text">Undo Completion?</span> <button data-action="confirmUndo" data-task-id="${task.id}" data-confirmed="true" class="control-button control-button-yellow">Yes</button> <button data-action="confirmUndo" data-task-id="${task.id}" data-confirmed="false" class="control-button control-button-gray">Cancel</button></div>`;
    }
    const isCompletedNonRepeating = task.repetitionType === 'none' && task.completed;
    if (isCompletedNonRepeating) {
        return '<span class="text-xs text-gray-500 italic">Done</span>';
    }
    if (task.status === 'blue') {
        return `<button data-action="triggerUndo" data-task-id="${task.id}" class="control-button control-button-gray" title="Undo Completion / Reactivate Early">Undo</button>`;
    }
    switch (task.completionType) {
        case 'count':
            const target = task.countTarget || Infinity;
            return (task.currentProgress < target)
                ? `<div class="flex items-center space-x-1"> <button data-action="decrementCount" data-task-id="${task.id}" class="control-button control-button-gray w-6 h-6 flex items-center justify-center">-</button> <button data-action="incrementCount" data-task-id="${task.id}" class="control-button control-button-blue w-6 h-6 flex items-center justify-center">+</button> </div>`
                : `<button data-action="triggerCompletion" data-task-id="${task.id}" class="control-button control-button-green">Complete</button>`;
        case 'time':
            const targetMs = getDurationMs(task.timeTargetAmount, task.timeTargetUnit);
            if (task.currentProgress >= targetMs) {
                return `<button data-action="triggerCompletion" data-task-id="${task.id}" class="control-button control-button-green">Complete</button>`;
            }
            const btnText = task.isTimerRunning ? 'Pause' : (task.currentProgress > 0 ? 'Resume' : 'Start');
            const btnClass = task.isTimerRunning ? 'control-button-yellow' : 'control-button-green';
            return `<button data-action="toggleTimer" data-task-id="${task.id}" id="timer-btn-${task.id}" class="control-button ${btnClass}">${btnText}</button>`;
        default:
            return `<button data-action="triggerCompletion" data-task-id="${task.id}" class="control-button control-button-green">Complete</button>`;
    }
}
function generateCommonButtonsHtml(task) {
    if (task.confirmationState) return '';
    const isCompletedNonRepeating = task.repetitionType === 'none' && task.completed;

    if (isCompletedNonRepeating) {
        return `<button data-action="triggerDelete" data-task-id="${task.id}" class="control-button control-button-red" title="Delete Task">Delete</button>`;
    }
    return `
        <div class="flex space-x-1">
            <button data-action="edit" data-task-id="${task.id}" class="control-button control-button-yellow" title="Edit Task">Edit</button>
            <button data-action="triggerDelete" data-task-id="${task.id}" class="control-button control-button-red" title="Delete Task">Delete</button>
        </div>
    `;
}
function formatTimeRemaining(ms) {
    try {
        if (ms <= DUE_THRESHOLD_MS && ms > -DUE_THRESHOLD_MS) return "Due!";
        const isOverdue = ms < 0;
        const absMs = Math.abs(ms);
        const s = Math.floor(absMs / 1000) % 60;
        const m = Math.floor(absMs / MS_PER_MINUTE) % 60;
        const h = Math.floor(absMs / MS_PER_HOUR) % 24;
        const d = Math.floor(absMs / MS_PER_DAY);
        let parts = [];
        if (d > 0) parts.push(`${d} day${d > 1 ? 's' : ''}`);
        if (h > 0) parts.push(`${h} hr${h > 1 ? 's' : ''}`);
        if ((d === 0 || parts.length < 2) && m > 0) parts.push(`${m} min${m > 1 ? 's' : ''}`);
        if (d === 0 && h === 0 && (parts.length < 2 || m === 0) && s > 0) parts.push(`${s} sec${s > 1 ? 's' : ''}`);
        const timeStr = parts.slice(0, 2).join(' ') || (isOverdue ? 'just now' : 'Less than a minute');
        return isOverdue ? `Overdue by: ${timeStr}` : timeStr;
    } catch (e) {
        console.error("Error formatting time remaining:", ms, e);
        return "Error";
    }
}
function updateCountdown(taskId) {
    try {
        const task = tasks.find(t => t.id === taskId);
        const countdownElement = document.getElementById(`countdown-${taskId}`);
        if (!task || !countdownElement) { stopCountdownTimer(taskId); return; }
        if (task.repetitionType === 'none' && task.completed) {
            countdownElement.textContent = '';
            stopCountdownTimer(taskId);
            return;
        }
        const nowMs = Date.now();
        let targetDateMs = null;
        let prefix = '';
        if (task.status === 'blue' && task.cycleEndDate && !isNaN(task.cycleEndDate)) {
            targetDateMs = task.cycleEndDate.getTime();
            prefix = 'Unlocks in: ';
            if (targetDateMs - nowMs <= 0) {
                countdownElement.textContent = '';
                stopCountdownTimer(taskId);
                return;
            }
        } else if (task.dueDate && !isNaN(task.dueDate)) {
            targetDateMs = task.dueDate.getTime();
        } else {
            countdownElement.textContent = '';
            stopCountdownTimer(taskId);
            return;
        }
        const timeRemaining = targetDateMs - nowMs;
        if (task.confirmationState && timeRemaining < 0) prefix = '';
        countdownElement.textContent = prefix + formatTimeRemaining(timeRemaining);
    } catch (e) {
        console.error("Error updating countdown for task:", taskId, e);
        stopCountdownTimer(taskId);
    }
}
function startAllCountdownTimers() {
    stopAllCountdownTimers();
    tasks.forEach(task => {
        try {
            if (task.repetitionType === 'none' && task.completed) return;
            let targetDate = null;
            if (task.status === 'blue' && task.cycleEndDate && !isNaN(task.cycleEndDate)) {
                targetDate = task.cycleEndDate;
            } else if (task.dueDate && !isNaN(task.dueDate)) {
                targetDate = task.dueDate;
            }
            if (targetDate) {
                updateCountdown(task.id);
                const timeRemaining = targetDate.getTime() - Date.now();
                if ((task.status === 'blue' && timeRemaining > 0) || task.status !== 'blue') {
                    if (!countdownIntervals[task.id]) {
                        countdownIntervals[task.id] = setInterval(() => updateCountdown(task.id), 1000);
                    }
                }
            }
        } catch(e) {
            console.error("Error starting countdown timer for task:", task?.id, e);
        }
    });
}
function openModal(taskId = null, options = {}) {
    try {
        taskForm.reset();
        editingTaskId = taskId;

        // Reset all dynamic fields to their default state
        dueDateGroup.classList.remove('hidden');
        startDateGroup.classList.add('hidden');
        relativeDueDateGroup.classList.add('hidden');
        repetitionRelativeGroup.classList.add('hidden');
        repetitionAbsoluteGroup.classList.add('hidden');
        repeatingOptionsGroup.classList.add('hidden');
        completionCountGroup.classList.add('hidden');
        completionTimeGroup.classList.add('hidden');
        estimatedDurationGroup.classList.remove('hidden');
        newCategoryGroup.classList.add('hidden');

        while (taskCategorySelect.options.length > 2) {
            taskCategorySelect.remove(2);
        }
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            taskCategorySelect.appendChild(option);
        });

        if (taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (!task) { console.error("Task not found for editing:", taskId); return; }
            modalTitle.textContent = 'Edit Task';
            taskIdInput.value = task.id;
            taskNameInput.value = task.name;
            taskIconInput.value = task.icon || '';

            // Set Time Input Type and corresponding date fields
            timeInputTypeSelect.value = task.timeInputType || 'due';
            const dateToUse = options.occurrenceDate || task.dueDate;

            if (task.timeInputType === 'start') {
                dueDateGroup.classList.add('hidden');
                startDateGroup.classList.remove('hidden');
                const durationMs = getDurationMs(task.estimatedDurationAmount, task.estimatedDurationUnit);
                const startDate = new Date(dateToUse.getTime() - durationMs);
                taskStartDateInput.value = formatDateForInput(startDate);
            } else {
                dueDateGroup.classList.remove('hidden');
                startDateGroup.classList.add('hidden');
                taskDueDateInput.value = formatDateForInput(dateToUse);
            }

            dueDateTypeSelect.value = task.dueDateType || 'absolute';
            relativeDueDateGroup.classList.toggle('hidden', task.dueDateType !== 'relative');
            if (task.dueDateType === 'relative') {
                relativeAmountInput.value = task.relativeAmount || 1;
                relativeUnitSelect.value = task.relativeUnit || 'days';
            }

            taskRepetitionSelect.value = task.repetitionType || 'none';
            repetitionRelativeGroup.classList.toggle('hidden', task.repetitionType !== 'relative');
            repetitionAbsoluteGroup.classList.toggle('hidden', task.repetitionType !== 'absolute');
            repeatingOptionsGroup.classList.toggle('hidden', task.repetitionType === 'none');
            if (task.repetitionType === 'relative') {
                repetitionAmountInput.value = task.repetitionAmount || 1;
                repetitionUnitSelect.value = task.repetitionUnit || 'days';
            } else if (task.repetitionType === 'absolute') {
                absoluteFrequencySelect.value = task.repetitionAbsoluteFrequency || 'weekly';
                toggleAbsoluteRepetitionFields(absoluteFrequencySelect.value);
                if (task.repetitionAbsoluteFrequency === 'weekly') {
                    (task.repetitionAbsoluteWeeklyDays || []).forEach(day => {
                        const cb = taskForm.querySelector(`input[name="weekday"][value="${day}"]`);
                        if (cb) cb.checked = true;
                    });
                } else if (task.repetitionAbsoluteFrequency === 'monthly') {
                    taskForm.monthlyOption.value = task.repetitionAbsoluteMonthlyMode || 'day_number';
                    toggleMonthlyOptions(taskForm.monthlyOption.value);
                    if (task.repetitionAbsoluteMonthlyMode === 'day_of_week') {
                        (task.repetitionAbsoluteNthWeekdayOccurrence || []).forEach(occ => { const cb = taskForm.querySelector(`input[name="monthlyOccurrence"][value="${occ}"]`); if (cb) cb.checked = true; });
                        (task.repetitionAbsoluteNthWeekdayDays || []).forEach(day => { const cb = taskForm.querySelector(`input[name="monthlyWeekday"][value="${day}"]`); if (cb) cb.checked = true; });
                    } else {
                        (task.repetitionAbsoluteDaysOfMonth || []).forEach(day => { const cb = taskForm.querySelector(`input[name="monthlyDay"][value="${day}"]`); if (cb) cb.checked = true; });
                    }
                } else if (task.repetitionAbsoluteFrequency === 'yearly') {
                    (task.repetitionAbsoluteYearlyMonths || []).forEach(month => { const cb = taskForm.querySelector(`input[name="yearlyMonth"][value="${month}"]`); if (cb) cb.checked = true; });
                    taskForm.yearlyOption.value = task.repetitionAbsoluteYearlyMode || 'day_number';
                    toggleYearlyOptions(taskForm.yearlyOption.value);
                    if (task.repetitionAbsoluteYearlyMode === 'day_of_week') {
                        (task.repetitionAbsoluteNthWeekdayOccurrence || []).forEach(occ => { const cb = taskForm.querySelector(`input[name="yearlyOccurrence"][value="${occ}"]`); if (cb) cb.checked = true; });
                        (task.repetitionAbsoluteNthWeekdayDays || []).forEach(day => { const cb = taskForm.querySelector(`input[name="yearlyWeekday"][value="${day}"]`); if (cb) cb.checked = true; });
                    } else {
                        (task.repetitionAbsoluteYearlyDaysOfMonth || []).forEach(day => { const cb = taskForm.querySelector(`input[name="yearlyDay"][value="${day}"]`); if (cb) cb.checked = true; });
                    }
                }
            }
            maxMissesInput.value = task.maxMisses || '';
            trackMissesInput.checked = typeof task.trackMisses === 'boolean' ? task.trackMisses : true;
            countsAsBusyInput.checked = typeof task.countsAsBusy === 'boolean' ? task.countsAsBusy : true;
            completionTypeSelect.value = task.completionType || 'simple';
            estimatedDurationAmountInput.value = task.estimatedDurationAmount || '';
            estimatedDurationUnitSelect.value = task.estimatedDurationUnit || 'minutes';
            countTargetInput.value = task.countTarget || '';
            timeTargetAmountInput.value = task.timeTargetAmount || '';
            timeTargetUnitSelect.value = task.timeTargetUnit || 'minutes';
            taskCategorySelect.value = task.categoryId || '';
        } else {
            modalTitle.textContent = 'Add New Task';
            taskIdInput.value = '';
        }

        // Ensure estimated duration requirement is set based on time input type
        if (estimatedDurationAmountInput) {
            estimatedDurationAmountInput.required = (timeInputTypeSelect.value === 'start');
        }

        toggleCompletionFields(completionTypeSelect.value);
        taskModal.classList.add('active');
    } catch (e) {
        console.error("Error opening modal:", e);
    }
}
function closeModal() {
    taskModal.classList.remove('active');
    editingTaskId = null;
}
function toggleCompletionFields(type) {
    completionCountGroup.classList.toggle('hidden', type !== 'count');
    completionTimeGroup.classList.toggle('hidden', type !== 'time');
    estimatedDurationGroup.classList.toggle('hidden', type === 'time');
}
function toggleAbsoluteRepetitionFields(frequency) {
    absoluteWeeklyOptions.classList.toggle('hidden', frequency !== 'weekly');
    absoluteMonthlyOptions.classList.toggle('hidden', frequency !== 'monthly');
    absoluteYearlyOptions.classList.toggle('hidden', frequency !== 'yearly');
    if(frequency === 'monthly') toggleMonthlyOptions(taskForm.monthlyOption.value);
    if(frequency === 'yearly') toggleYearlyOptions(taskForm.yearlyOption.value);
}
function toggleMonthlyOptions(mode) {
    monthlyDayNumberOptions.classList.toggle('hidden', mode !== 'day_number');
    monthlyDayOfWeekOptions.classList.toggle('hidden', mode !== 'day_of_week');
}
function toggleYearlyOptions(mode) {
    yearlyDayNumberOptions.classList.toggle('hidden', mode !== 'day_number');
    yearlyDayOfWeekOptions.classList.toggle('hidden', mode !== 'day_of_week');
}
function renderCategoryManager() {
    const list = document.getElementById('category-manager-list');
    if (!list) return;
    list.innerHTML = '';
    if (categories.length === 0) {
        list.innerHTML = '<p class="text-gray-500 italic">No categories created yet.</p>';
    }
    categories.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-2 border-b';
        item.id = `category-item-${cat.id}`;

        item.innerHTML = `
            <div id="category-display-${cat.id}" class="flex-grow flex items-center" data-action="triggerCategoryEdit" data-category-id="${cat.id}">
                <span class="font-medium cursor-pointer">${cat.name}</span>
            </div>
            <div class="flex items-center space-x-2">
                <input type="color" value="${cat.color}" data-category-id="${cat.id}" class="category-color-picker h-8 w-12 border-none cursor-pointer rounded">
                <button data-action="deleteCategory" data-category-id="${cat.id}" class="text-red-500 hover:text-red-700 font-bold text-lg" aria-label="Delete category ${cat.name}">&times;</button>
            </div>
        `;
        list.appendChild(item);
    });
    const addButton = document.createElement('button');
    addButton.className = 'control-button control-button-blue mt-4';
    addButton.textContent = 'Add New Category';
    addButton.dataset.action = 'addCategory';
    list.appendChild(addButton);
}
function renderPlannerSettings() {
    if (!plannerDefaultCategorySelect) return;

    plannerDefaultCategorySelect.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = 'Planner';
    defaultOption.textContent = 'Planner (Default)';
    plannerDefaultCategorySelect.appendChild(defaultOption);

    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        plannerDefaultCategorySelect.appendChild(option);
    });

    plannerDefaultCategorySelect.value = plannerSettings.defaultCategoryId || 'Planner';
}

function renderTaskDisplaySettings() {
    const container = document.getElementById('task-card-display-options');
    if (!container) return;
    for (const key in taskDisplaySettings) {
        const checkbox = container.querySelector(`input[name="${key}"]`);
        if (checkbox) {
            checkbox.checked = taskDisplaySettings[key];
        }
    }
}

function openAdvancedOptionsModal() {
    renderCategoryManager();
    renderCategoryFilters();
    renderNotificationManager();
    renderThemeControls();
    renderStatusManager();
    renderPlannerSettings();
    renderTaskDisplaySettings();
    advancedOptionsModal.classList.add('active');
}
function renderCategoryFilters() {
    if (!categoryFilterList) return;
    categoryFilterList.innerHTML = '';
    if (categories.length === 0) {
        categoryFilterList.innerHTML = '<p class="text-gray-500 italic">No categories to filter.</p>';
        return;
    }
    const allLabel = document.createElement('label');
    allLabel.className = 'flex items-center space-x-2';
    allLabel.innerHTML = `
        <input type="checkbox" class="category-filter-checkbox" value="all" ${categoryFilter.length === 0 ? 'checked' : ''}>
        <span>Show All</span>
    `;
    categoryFilterList.appendChild(allLabel);
    const uncategorizedLabel = document.createElement('label');
    uncategorizedLabel.className = 'flex items-center space-x-2';
    uncategorizedLabel.innerHTML = `
        <input type="checkbox" class="category-filter-checkbox" value="null" ${categoryFilter.includes(null) ? 'checked' : ''}>
        <span>Uncategorized</span>
    `;
    categoryFilterList.appendChild(uncategorizedLabel);
    categories.forEach(cat => {
        const label = document.createElement('label');
        label.className = 'flex items-center space-x-2';
        label.innerHTML = `
            <input type="checkbox" class="category-filter-checkbox" value="${cat.id}" ${categoryFilter.includes(cat.id) ? 'checked' : ''}>
            <span>${cat.name}</span>
        `;
        categoryFilterList.appendChild(label);
    });
}

function renderStatusManager() {
    const manager = document.getElementById('status-manager-list');
    if (!manager) return;
    manager.innerHTML = '';

    // Use defaultStatusNames to iterate, ensuring a consistent order.
    Object.keys(defaultStatusNames).forEach(statusKey => {
        const displayName = statusNames[statusKey] || defaultStatusNames[statusKey];
        const color = statusColors[statusKey] || '#ccc';

        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-2 border-b';
        item.id = `status-item-${statusKey}`;

        item.innerHTML = `
            <div id="status-display-${statusKey}" class="flex-grow flex items-center space-x-3">
                <div class="w-4 h-4 rounded-full" style="background-color: ${color};"></div>
                <span class="font-medium cursor-pointer" data-action="triggerStatusNameEdit" data-status-key="${statusKey}">${displayName}</span>
            </div>
            <div class="flex items-center space-x-2">
                <input type="color" value="${color}" data-status-key="${statusKey}" class="status-color-picker h-8 w-12 border-none cursor-pointer rounded">
            </div>
        `;
        manager.appendChild(item);
    });
}

function renderNotificationManager() {
    const container = document.getElementById('notification-manager-content');
    if (!container) return;

    container.innerHTML = `
        <div class="flex items-center justify-between">
            <label for="master-notification-toggle" class="form-label mb-0">Enable All Notifications:</label>
            <input type="checkbox" id="master-notification-toggle" data-action="toggleAllNotifications" class="h-6 w-12 rounded-full p-1 bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 appearance-none cursor-pointer ${notificationSettings.enabled ? 'bg-green-500' : ''}" ${notificationSettings.enabled ? 'checked' : ''}>
        </div>
        <div id="notification-details" class="${notificationSettings.enabled ? '' : 'hidden'} space-y-4">
            <div>
                <label class="form-label">Notify no more than once per:</label>
                <div class="flex space-x-2 items-center">
                    <input type="number" id="notification-rate-amount" value="${notificationSettings.rateLimit.amount}" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 duration-input">
                    <select id="notification-rate-unit" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white flex-grow">
                        <option value="minutes" ${notificationSettings.rateLimit.unit === 'minutes' ? 'selected' : ''}>Minute(s)</option>
                        <option value="hours" ${notificationSettings.rateLimit.unit === 'hours' ? 'selected' : ''}>Hour(s)</option>
                        <option value="days" ${notificationSettings.rateLimit.unit === 'days' ? 'selected' : ''}>Day(s)</option>
                    </select>
                </div>
            </div>
            <div>
                <label class="form-label">Notify for categories:</label>
                <div id="notification-category-list" class="space-y-2">
                    <!-- Per-category toggles will be rendered here -->
                </div>
            </div>
        </div>
    `;

    const categoryList = container.querySelector('#notification-category-list');
    if (categories.length === 0) {
        categoryList.innerHTML = '<p class="text-gray-500 italic text-sm">No categories to configure.</p>';
    } else {
        categories.forEach(cat => {
            // Ensure the category exists in settings, default to true if master is enabled
            if (notificationSettings.categories[cat.id] === undefined) {
                notificationSettings.categories[cat.id] = true;
            }
            const isEnabled = notificationSettings.categories[cat.id];
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between p-2 border rounded-md';
            item.innerHTML = `
                <span class="font-medium">${cat.name}</span>
                <input type="checkbox" data-action="toggleCategoryNotification" data-category-id="${cat.id}" class="h-6 w-12 rounded-full p-1 bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 appearance-none cursor-pointer" ${isEnabled ? 'checked' : ''}>
            `;
            categoryList.appendChild(item);
        });
    }
}

function renderThemeControls() {
    const dayNightToggle = document.getElementById('day-night-toggle');
    const themeToggle = document.getElementById('theme-enabled-toggle');
    const themeControls = document.getElementById('theme-controls');
    const themeColorPicker = document.getElementById('theme-base-color');

    if (dayNightToggle) dayNightToggle.checked = theming.mode === 'night';
    if (themeToggle) themeToggle.checked = theming.enabled;
    if (themeColorPicker) themeColorPicker.value = theming.baseColor;

    if (themeControls) themeControls.classList.toggle('hidden', !theming.enabled);
}














// =================================================================================
// SECTION 4: User Action Handlers
// =================================================================================

function startTimerInterval(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.isTimerRunning || task.completionType !== 'time') return;

    stopTaskTimer(taskId);

    const targetMs = getDurationMs(task.timeTargetAmount, task.timeTargetUnit);
    const progressBeforeStart = (task.currentProgress || 0);
    const timerLastStartedTimestamp = (task.timerLastStarted ? new Date(task.timerLastStarted).getTime() : Date.now());


    taskTimers[taskId] = setInterval(() => {
        const currentTask = tasks.find(t => t.id === taskId);
        if (!currentTask || !currentTask.isTimerRunning) {
            stopTaskTimer(taskId);
            return;
        }

        const elapsedSinceStart = Date.now() - timerLastStartedTimestamp;
        const totalCurrentProgress = progressBeforeStart + elapsedSinceStart;

        const progressElement = document.getElementById(`progress-${taskId}`);
        if (progressElement) {
            progressElement.textContent = `${formatMsToTime(Math.min(totalCurrentProgress, targetMs))} / ${formatMsToTime(targetMs)}`;
        }

        if (totalCurrentProgress >= targetMs) {
            toggleTimer(taskId);
        }
    }, 1000);
}


function handlePlannerSlotClick(slotElement) {
    const key = slotElement.dataset.key;
    if (!key) return;

    const [day, hour] = key.split('-').map(Number);

    const week = appState.weeks[appState.viewingIndex];
    const weekStartDate = new Date(week.startDate);

    const taskStartDate = new Date(weekStartDate);
    taskStartDate.setDate(taskStartDate.getDate() + day);
    taskStartDate.setHours(hour);

    const taskDueDate = new Date(taskStartDate);
    taskDueDate.setHours(taskStartDate.getHours() + 1);

    const defaultCategoryName = plannerSettings.defaultCategoryId || 'Planner';
    let plannerCategory = categories.find(c => c.id === defaultCategoryName);
    if (!plannerCategory) {
        plannerCategory = {
            id: defaultCategoryName,
            name: defaultCategoryName,
            color: getRandomColor()
        };
        categories.push(plannerCategory);
        renderCategoryManager(); // Update advanced options UI
        renderCategoryFilters(); // Update filter UI
    }

    const newTaskData = {
        id: generateId(),
        name: 'New Planner Event',
        dueDate: taskDueDate,
        estimatedDurationAmount: 1,
        estimatedDurationUnit: 'hours',
        categoryId: plannerCategory.id,
        createdAt: new Date(),
        repetitionType: 'none',
        misses: 0,
        completed: false,
        status: 'green',
    };

    const sanitizedTask = sanitizeAndUpgradeTask(newTaskData);
    tasks.push(sanitizedTask);

    saveData();
    renderPlanner();
    renderTasks();
}

function handleFormSubmit(event) {
    event.preventDefault();
    try {
        const now = new Date();

        const taskData = {
            name: taskNameInput.value.trim(),
            icon: taskIconInput.value.trim(),
            timeInputType: timeInputTypeSelect.value,
            dueDateType: dueDateTypeSelect.value,
            dueDate: null,
            repetitionType: taskRepetitionSelect.value,
            maxMisses: null,
            trackMisses: true,
            countsAsBusy: countsAsBusyInput.checked,
            completionType: completionTypeSelect.value,
            currentProgress: 0,
            isTimerRunning: false,
            confirmationState: null,
            overdueStartDate: null,
            pendingCycles: null,
            categoryId: null
        };

        if (taskData.dueDateType === 'absolute') {
            if (taskData.timeInputType === 'start') {
                const startDate = taskStartDateInput.value ? new Date(taskStartDateInput.value) : null;
                if (startDate) {
                    const durationMs = getDurationMs(estimatedDurationAmountInput.value, estimatedDurationUnitSelect.value);
                    taskData.dueDate = new Date(startDate.getTime() + durationMs);
                }
            } else {
                taskData.dueDate = taskDueDateInput.value ? new Date(taskDueDateInput.value) : null;
            }
        } else if (taskData.dueDateType === 'relative') {
            const amount = parseInt(relativeAmountInput.value, 10);
            const unit = relativeUnitSelect.value;
            taskData.dueDate = calculateFutureDate(amount, unit, now);
            taskData.relativeAmount = amount;
            taskData.relativeUnit = unit;
        }

        if (taskData.repetitionType === 'relative') {
            taskData.repetitionAmount = parseInt(repetitionAmountInput.value, 10);
            taskData.repetitionUnit = repetitionUnitSelect.value;
            taskData.maxMisses = maxMissesInput.value ? parseInt(maxMissesInput.value, 10) : null;
            taskData.trackMisses = trackMissesInput.checked;
        } else if (taskData.repetitionType === 'absolute') {
            taskData.repetitionAbsoluteFrequency = absoluteFrequencySelect.value;
            if (taskData.repetitionAbsoluteFrequency === 'weekly') {
                taskData.repetitionAbsoluteWeeklyDays = Array.from(weekdayCheckboxes).filter(cb => cb.checked).map(cb => parseInt(cb.value, 10));
            } else if (taskData.repetitionAbsoluteFrequency === 'monthly') {
                taskData.repetitionAbsoluteMonthlyMode = taskForm.monthlyOption.value;
                if (taskData.repetitionAbsoluteMonthlyMode === 'day_of_week') {
                    taskData.repetitionAbsoluteNthWeekdayOccurrence = Array.from(monthlyOccurrenceCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
                    taskData.repetitionAbsoluteNthWeekdayDays = Array.from(monthlyWeekdayCheckboxes).filter(cb => cb.checked).map(cb => parseInt(cb.value, 10));
                } else {
                    taskData.repetitionAbsoluteDaysOfMonth = Array.from(monthlyDayCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
                }
            } else if (taskData.repetitionAbsoluteFrequency === 'yearly') {
                taskData.repetitionAbsoluteYearlyMonths = Array.from(yearlyMonthCheckboxes).filter(cb => cb.checked).map(cb => parseInt(cb.value, 10));
                taskData.repetitionAbsoluteYearlyMode = taskForm.yearlyOption.value;
                if (taskData.repetitionAbsoluteYearlyMode === 'day_of_week') {
                    taskData.repetitionAbsoluteYearlyNthWeekdayOccurrence = Array.from(yearlyOccurrenceCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
                    taskData.repetitionAbsoluteNthWeekdayDays = Array.from(yearlyWeekdayCheckboxes).filter(cb => cb.checked).map(cb => parseInt(cb.value, 10));
                } else {
                    taskData.repetitionAbsoluteYearlyDaysOfMonth = Array.from(yearlyDayCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
                }
            }
            taskData.maxMisses = maxMissesInput.value ? parseInt(maxMissesInput.value, 10) : null;
            taskData.trackMisses = trackMissesInput.checked;
        }
        const categoryValue = taskCategorySelect.value;
        if (categoryValue === 'new_category') {
            const newCategoryName = newCategoryNameInput.value.trim();
            if (newCategoryName && !categories.find(c => c.name.toLowerCase() === newCategoryName.toLowerCase())) {
                const newCategory = {
                    id: newCategoryName,
                    name: newCategoryName,
                    color: getRandomColor()
                };
                categories.push(newCategory);
                taskData.categoryId = newCategory.id;
            } else if (newCategoryName) {
                taskData.categoryId = categories.find(c => c.name.toLowerCase() === newCategoryName.toLowerCase()).id;
            }
        } else if (categoryValue) {
            taskData.categoryId = categoryValue;
        }
        if (taskData.completionType === 'count') {
            taskData.countTarget = countTargetInput.value ? parseInt(countTargetInput.value, 10) : null;
            taskData.estimatedDurationAmount = estimatedDurationAmountInput.value ? parseInt(estimatedDurationAmountInput.value, 10) : null;
            taskData.estimatedDurationUnit = estimatedDurationUnitSelect.value;
        } else if (taskData.completionType === 'time') {
            taskData.timeTargetAmount = timeTargetAmountInput.value ? parseInt(timeTargetAmountInput.value, 10) : null;
            taskData.timeTargetUnit = timeTargetUnitSelect.value;
            taskData.estimatedDurationAmount = taskData.timeTargetAmount;
            taskData.estimatedDurationUnit = taskData.timeTargetUnit;
        } else {
            taskData.estimatedDurationAmount = estimatedDurationAmountInput.value ? parseInt(estimatedDurationAmountInput.value, 10) : null;
            taskData.estimatedDurationUnit = estimatedDurationUnitSelect.value;
        }
        if (editingTaskId) {
            const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
            if (taskIndex > -1) {
                const originalTask = tasks[taskIndex];
                const mergedTask = { ...originalTask, ...taskData };
                let updatedTask = sanitizeAndUpgradeTask(mergedTask);
                if (originalTask.repetitionType !== 'none' && updatedTask.repetitionType !== 'none') {
                    updatedTask.misses = originalTask.misses;
                } else {
                    updatedTask.misses = 0;
                }
                if (originalTask.completionType === updatedTask.completionType) {
                    updatedTask.currentProgress = originalTask.currentProgress;
                } else {
                    updatedTask.currentProgress = 0;
                }
                const otherTasks = tasks.filter(t => t.id !== editingTaskId);
                const newStatus = calculateStatus(updatedTask, now.getTime(), otherTasks);
                updatedTask.status = (originalTask.status === 'blue' && originalTask.cycleEndDate?.getTime() > now.getTime()) ? 'blue' : newStatus.name;
                tasks[taskIndex] = updatedTask;
            }
        } else {
            taskData.id = generateId();
            taskData.createdAt = now;
            taskData.misses = 0;
            taskData.completed = false;
            taskData.status = 'green';
            const newTask = sanitizeAndUpgradeTask(taskData);
            const otherTasks = [...tasks];
            newTask.status = calculateStatus(newTask, now.getTime(), otherTasks).name;
            tasks.push(newTask);
        }
        saveData();
        updateAllTaskStatuses(true);
        renderPlanner();
        closeModal();
    } catch (e) {
        console.error("Error handling form submit:", e);
    }
}
function editTask(taskId) { openModal(taskId); }
function triggerDelete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.confirmationState = 'confirming_delete';
        saveData();
        renderTasks();
    }
}
function triggerUndoConfirmation(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status === 'blue' && task.repetitionType !== 'none') {
        task.confirmationState = 'confirming_undo';
        saveData();
        renderTasks();
    }
}
function confirmDeleteAction(taskId, confirmed) {
    if (confirmed) {
        stopAllTimers();
        tasks = tasks.filter(t => t.id !== taskId);
        saveData();
        renderTasks();
    } else {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.confirmationState = null;
            saveData();
            renderTasks();
        }
    }
}
function triggerCompletion(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    if (task.isTimerRunning) toggleTimer(taskId);
    task.confirmationState = 'confirming_complete';
    const nowMs = Date.now();
    if (task.dueDate && nowMs >= task.dueDate.getTime()) {
        if (!task.overdueStartDate) task.overdueStartDate = task.dueDate.toISOString();
        task.pendingCycles = calculatePendingCycles(task, nowMs);
    } else {
        task.pendingCycles = 1;
        delete task.overdueStartDate;
    }
    saveData();
    renderTasks();
}
function confirmCompletionAction(taskId, confirmed) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    const task = tasks[taskIndex];
    const cyclesToComplete = task.pendingCycles || 1;
    const wasOverdue = !!task.overdueStartDate;
    const baseDate = task.overdueStartDate ? new Date(task.overdueStartDate) : (task.dueDate || null);
    if (confirmed) {
        stopTaskTimer(taskId);
        let missCountReduced = false;
        if (task.repetitionType !== 'none' && baseDate) {
            // Create historical record before changing the date
            if (appState.historicalTasks) {
                const historicalTask = {
                    originalTaskId: task.id,
                    name: task.name,
                    completionDate: baseDate,
                    status: 'completed',
                    categoryId: task.categoryId,
                    durationAmount: task.estimatedDurationAmount,
                    durationUnit: task.estimatedDurationUnit,
                };
                appState.historicalTasks.push(historicalTask);
            }

            const missesBefore = task.misses || 0;
            task.misses = Math.max(0, missesBefore - cyclesToComplete);
            if (task.misses < missesBefore) missCountReduced = true;
            let nextDueDate = null;
            if (task.repetitionType === 'relative') {
                let current = new Date(baseDate);
                for (let i = 0; i < cyclesToComplete; i++) current = calculateFutureDate(task.repetitionAmount, task.repetitionUnit, current);
                nextDueDate = current;
            } else { // absolute
                const futureOccurrences = generateAbsoluteOccurrences(task, new Date(baseDate.getTime() + 1), new Date(baseDate.getFullYear() + 5, 0, 1));
                if (futureOccurrences.length >= cyclesToComplete) nextDueDate = futureOccurrences[cyclesToComplete - 1];
            }
            if (nextDueDate) {
                task.dueDate = nextDueDate;
                if (wasOverdue) {
                    task.status = calculateStatus(task, Date.now(), tasks).name;
                    task.cycleEndDate = null;
                } else {
                    task.status = 'blue';
                    task.cycleEndDate = baseDate;
                }
                task.completionReducedMisses = missCountReduced;
            } else {
                task.status = calculateStatus(task, Date.now(), tasks).name;
                delete task.completionReducedMisses;
            }
            task.currentProgress = 0;
            task.completed = false;
            task.confirmationState = null;
        } else {
            task.completed = true;
            task.status = 'blue';
            task.misses = 0;
            task.confirmationState = null;
            delete task.completionReducedMisses;
        }
    } else {
        if (task.overdueStartDate) {
            task.confirmationState = 'awaiting_overdue_input';
        } else {
            task.confirmationState = null;
            const target = (task.completionType === 'count') ? task.countTarget : getDurationMs(task.timeTargetAmount, task.timeTargetUnit);
            if (target && task.currentProgress >= target) {
                task.currentProgress = target - (task.completionType === 'time' ? 1000 : 1);
            }
        }
    }
    delete task.pendingCycles;
    if (!confirmed && !task.overdueStartDate) delete task.overdueStartDate;
    if (confirmed) delete task.overdueStartDate;

    saveData();
    updateAllTaskStatuses(true);
}
function confirmUndoAction(taskId, confirmed) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    if (confirmed) {
        if (task.status !== 'blue' || task.repetitionType === 'none') return;
        task.dueDate = task.cycleEndDate ? new Date(task.cycleEndDate) : new Date();
        task.cycleEndDate = null;
        if (task.completionReducedMisses && task.trackMisses && task.maxMisses > 0) {
            task.misses = Math.min(task.maxMisses, (task.misses || 0) + 1);
        }
        delete task.completionReducedMisses;
    }
    task.confirmationState = null;
    saveData();
    updateAllTaskStatuses(true);
}
function confirmMissAction(taskId, confirmed) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    if (confirmed) {
        const totalCycles = task.pendingCycles || 1;
        const inputEl = document.getElementById(`miss-count-input-${taskId}`);
        const missesToApply = (inputEl && totalCycles > 1) ? parseInt(inputEl.value, 10) : totalCycles;
        const completionsToApply = totalCycles - missesToApply;
        const baseDate = task.overdueStartDate ? new Date(task.overdueStartDate) : (task.dueDate || null);
        if (task.repetitionType !== 'none' && baseDate) {
            if (missesToApply > 0 && appState.historicalTasks) {
                 const historicalTask = {
                    originalTaskId: task.id,
                    name: task.name,
                    completionDate: baseDate,
                    status: 'missed',
                    categoryId: task.categoryId,
                    durationAmount: task.estimatedDurationAmount,
                    durationUnit: task.estimatedDurationUnit,
                };
                appState.historicalTasks.push(historicalTask);
            }
            if (completionsToApply > 0) task.misses = Math.max(0, (task.misses || 0) - completionsToApply);
            if (missesToApply > 0 && task.trackMisses) {
                task.misses = Math.min(task.maxMisses || Infinity, (task.misses || 0) + missesToApply);
            }
            let nextDueDate = null;
            if (task.repetitionType === 'relative') {
                let current = new Date(baseDate);
                for (let i = 0; i < totalCycles; i++) current = calculateFutureDate(task.repetitionAmount, task.repetitionUnit, current);
                nextDueDate = current;
            } else { // absolute
                const futureOccurrences = generateAbsoluteOccurrences(task, new Date(baseDate.getTime() + 1), new Date(baseDate.getFullYear() + 5, 0, 1));
                if (futureOccurrences.length >= totalCycles) nextDueDate = futureOccurrences[totalCycles - 1];
            }
            task.dueDate = nextDueDate;
            task.cycleEndDate = null;
            task.currentProgress = 0;
        } else if (task.repetitionType === 'none') {
            task.status = 'black';
            task.misses = 1;
            task.maxMisses = 1;
        }
        delete task.pendingCycles;
        delete task.overdueStartDate;
    } else {
        task.confirmationState = 'awaiting_overdue_input';
    }
    saveData();
    updateAllTaskStatuses(true);
}
function handleOverdueChoice(taskId, choice) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    if (!task.overdueStartDate) task.overdueStartDate = task.dueDate ? task.dueDate.toISOString() : null;
    task.pendingCycles = calculatePendingCycles(task, Date.now());
    task.confirmationState = (choice === 'completed') ? 'confirming_complete' : 'confirming_miss';
    saveData();
    renderTasks();
}
function incrementCount(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completionType !== 'count' || !task.countTarget) return;
    task.currentProgress = (task.currentProgress || 0) + 1;
    if (task.currentProgress >= task.countTarget) {
        task.currentProgress = task.countTarget;
        triggerCompletion(taskId);
    } else {
        saveData();
        renderTasks();
    }
}
function decrementCount(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completionType !== 'count') return;
    task.currentProgress = Math.max(0, (task.currentProgress || 0) - 1);
    saveData();
    renderTasks();
}
function toggleTimer(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completionType !== 'time') return;
    const targetMs = getDurationMs(task.timeTargetAmount, task.timeTargetUnit);

    if (task.isTimerRunning) {
        const elapsed = Date.now() - (new Date(task.timerLastStarted).getTime() || Date.now());
        stopTaskTimer(taskId);

        task.currentProgress = (task.currentProgress || 0) + elapsed;
        if (task.currentProgress >= targetMs) {
            task.currentProgress = targetMs;
        }
        task.isTimerRunning = false;
        task.timerLastStarted = null;

        saveData();
        renderTasks();

        if (task.currentProgress >= targetMs) {
            triggerCompletion(taskId);
        }

    } else {
        if (task.currentProgress >= targetMs) {
            triggerCompletion(taskId);
            return;
        }
        task.isTimerRunning = true;
        task.timerLastStarted = new Date().toISOString();

        startTimerInterval(taskId);

        const timerButton = document.getElementById(`timer-btn-${taskId}`);
        if (timerButton) {
            timerButton.textContent = 'Pause';
            timerButton.classList.remove('control-button-green');
            timerButton.classList.add('control-button-yellow');
        }
        saveData();
    }
}
function editProgress(taskId) {
    const task = tasks.find(t => t.id === taskId);
    const container = document.getElementById(`progress-container-${taskId}`);
    if (!task || !container) return;

    if (task.isTimerRunning) {
        toggleTimer(taskId);
    }

    let currentValue, max;
    if (task.completionType === 'count') {
        currentValue = task.currentProgress || 0;
        max = task.countTarget || Infinity;
    } else if (task.completionType === 'time') {
        currentValue = Math.round((task.currentProgress || 0) / MS_PER_MINUTE);
        max = Math.round(getDurationMs(task.timeTargetAmount, task.timeTargetUnit) / MS_PER_MINUTE);
    } else return;
    container.innerHTML = `
        <input type="number" id="edit-progress-input-${taskId}" value="${currentValue}" min="0" ${max !== Infinity ? `max="${max}"` : ''} class="progress-input">
        <button data-action="saveProgress" data-task-id="${taskId}" class="control-button control-button-green text-xs ml-1">Save</button>
        <button data-action="cancelProgress" data-task-id="${taskId}" class="control-button control-button-gray text-xs ml-1">Cancel</button>
    `;
    document.getElementById(`edit-progress-input-${taskId}`).focus();
}
function saveProgressEdit(taskId) {
    const task = tasks.find(t => t.id === taskId);
    const input = document.getElementById(`edit-progress-input-${taskId}`);
    if (!task || !input) return;
    let newValue = parseInt(input.value, 10);
    if (isNaN(newValue)) { renderTasks(); return; }
    if (task.completionType === 'count') {
        const target = task.countTarget || Infinity;
        task.currentProgress = Math.max(0, Math.min(newValue, target));
        if (task.currentProgress >= target) { triggerCompletion(taskId); }
    } else if (task.completionType === 'time') {
        const targetMs = getDurationMs(task.timeTargetAmount, task.timeTargetUnit);
        task.currentProgress = Math.max(0, Math.min(parseMinutesToMs(newValue), targetMs));
        if (task.currentProgress >= targetMs) { triggerCompletion(taskId); }
    }
    saveData();
    renderTasks();
}
function cancelProgressEdit(taskId) { renderTasks(); }
function deleteCategory(categoryId) {
    tasks.forEach(task => {
        if (task.categoryId === categoryId) {
            task.categoryId = null;
        }
    });
    categories = categories.filter(cat => cat.id !== categoryId);
    saveData();
    renderCategoryManager();
    renderTasks();
}
function addCategoryFromManager() {
    const newCategoryName = prompt("Enter new category name:");
    if (newCategoryName && !categories.find(c => c.name.toLowerCase() === newCategoryName.toLowerCase())) {
        const newCategory = {
            id: newCategoryName,
            name: newCategoryName,
            color: getRandomColor()
        };
        categories.push(newCategory);
        saveData();
        renderCategoryManager();
        renderCategoryFilters();
    } else if (newCategoryName) {
        alert("A category with that name already exists.");
    }
}

function triggerCategoryEdit(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    renderCategoryManager();

    const displayDiv = document.getElementById(`category-display-${categoryId}`);
    if (!displayDiv) return;

    displayDiv.innerHTML = `
        <input type="text" id="edit-category-input-${categoryId}" value="${category.name}" class="progress-input flex-grow">
        <button data-action="saveCategoryEdit" data-category-id="${categoryId}" class="control-button control-button-green text-xs ml-1">Save</button>
        <button data-action="cancelCategoryEdit" data-category-id="${categoryId}" class="control-button control-button-gray text-xs ml-1">Cancel</button>
    `;
    document.getElementById(`edit-category-input-${categoryId}`).focus();
}

function saveCategoryEdit(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    const input = document.getElementById(`edit-category-input-${categoryId}`);
    if (!category || !input) return;

    const newName = input.value.trim();
    if (newName && newName !== '' && !categories.find(c => c.name.toLowerCase() === newName.toLowerCase() && c.id !== categoryId)) {
        const oldId = category.id;
        category.name = newName;
        category.id = newName;
        tasks.forEach(task => {
            if (task.categoryId === oldId) {
                task.categoryId = category.id;
            }
        });
        saveData();
        renderCategoryManager();
        renderTasks();
        renderCategoryFilters();
    } else if (newName) {
        alert("A category with that name already exists or the name is invalid.");
        renderCategoryManager();
    }
}

function cancelCategoryEdit(categoryId) {
    renderCategoryManager();
}

function triggerStatusNameEdit(statusKey) {
    const status = statusNames[statusKey];
    if (status === undefined) return;
    renderStatusManager();
    const displayDiv = document.getElementById(`status-display-${statusKey}`);
    if (!displayDiv) return;
    displayDiv.innerHTML = `
        <input type="text" id="edit-status-input-${statusKey}" value="${status}" class="progress-input flex-grow">
        <button data-action="saveStatusNameEdit" data-status-key="${statusKey}" class="control-button control-button-green text-xs ml-1">Save</button>
        <button data-action="cancelStatusNameEdit" data-status-key="${statusKey}" class="control-button control-button-gray text-xs ml-1">Cancel</button>
    `;
    document.getElementById(`edit-status-input-${statusKey}`).focus();
}

function saveStatusNameEdit(statusKey) {
    const input = document.getElementById(`edit-status-input-${statusKey}`);
    if (!input) return;
    const newName = input.value.trim();
    if (newName && newName !== '') {
        statusNames[statusKey] = newName;
        saveData();
        renderStatusManager();
        renderTasks();
    } else {
        alert("Status name cannot be empty.");
        renderStatusManager();
    }
}

function cancelStatusNameEdit(statusKey) {
    renderStatusManager();
}


function triggerRestoreDefaults() {
    const container = document.getElementById('restore-defaults-container');
    if (container) {
        container.innerHTML = `<span class="action-area-text">Reset all colors and sorting?</span> <button data-action="confirmRestoreDefaults" data-confirmed="true" class="control-button control-button-red">Yes</button> <button data-action="confirmRestoreDefaults" data-confirmed="false" class="control-button control-button-gray">No</button>`;
    }
}

function confirmRestoreDefaultsAction(confirmed) {
    const container = document.getElementById('restore-defaults-container');
    if (confirmed) {
        statusColors = { ...defaultStatusColors };
        statusNames = { ...defaultStatusNames };
        sortBy = 'status';
        sortDirection = 'asc';
        theming.enabled = false;

        saveData();
        sortBySelect.value = sortBy;
        sortDirectionSelect.value = sortDirection;
        applyTheme();
        openAdvancedOptionsModal();
    }

    if (container) {
        container.innerHTML = `<button data-action="restoreDefaults" class="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">Restore All Defaults</button>`;
    }
}

// --- Notification Handlers ---

function handleMasterNotificationToggle(event) {
    const isEnabled = event.target.checked;

    const updateState = (enabled) => {
        notificationSettings.enabled = enabled;
        event.target.checked = enabled;
        event.target.classList.toggle('bg-green-500', enabled);
        document.getElementById('notification-details').classList.toggle('hidden', !enabled);
        saveData();
    };

    if (isEnabled) {
        if (Notification.permission === 'granted') {
            updateState(true);
        } else if (Notification.permission === 'denied') {
            alert("Notifications are blocked by your browser. Please update your site settings to allow them.");
            updateState(false);
        } else {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    updateState(true);
                    new Notification("Task Manager", { body: "Notifications have been enabled!" });
                } else {
                    alert("You have denied permission for notifications.");
                    updateState(false);
                }
            });
        }
    } else {
        updateState(false);
    }
}

function toggleCategoryNotification(categoryId, isEnabled) {
    if (notificationSettings.categories.hasOwnProperty(categoryId)) {
        notificationSettings.categories[categoryId] = isEnabled;
        saveData();
    }
}

function updateNotificationRateLimit() {
    const amountInput = document.getElementById('notification-rate-amount');
    const unitInput = document.getElementById('notification-rate-unit');
    if (amountInput && unitInput) {
        notificationSettings.rateLimit.amount = parseInt(amountInput.value, 10) || 5;
        notificationSettings.rateLimit.unit = unitInput.value;
        saveData();
    }
}







// =================================================================================
// SECTION 5: Initialization & Notification Engine
// =================================================================================

// --- Notification Engine ---

/**
 * Schedules a single notification to be sent in the future.
 * @param {object} task - The task object for the notification.
 * @param {string} futureStatus - The status the task is changing to (e.g., 'yellow', 'red').
 * @param {number} triggerTimestamp - The future timestamp (in ms) when the notification should be sent.
 */
function scheduleNotification(task, futureStatus, triggerTimestamp) {
    const now = Date.now();
    const delay = triggerTimestamp - now;

    if (delay <= 0) return; // Don't schedule notifications for the past.

    // 1. Check if notifications are globally enabled.
    if (!notificationSettings.enabled) return;

    // 2. Check if the task's category is enabled for notifications.
    const categoryId = task.categoryId || 'null'; // Use 'null' for uncategorized
    if (notificationSettings.categories[categoryId] === false) return;

    // 3. Check the rate limit.
    const rateLimitMs = getDurationMs(notificationSettings.rateLimit.amount, notificationSettings.rateLimit.unit);
    const lastNotified = notificationEngine.lastNotificationTimestamps[task.id] || 0;
    if (now - lastNotified < rateLimitMs) {
        console.log(`Notification for task "${task.name}" suppressed due to rate limit.`);
        return;
    }

    const timeoutId = setTimeout(() => {
        const notificationBody = `Task "${task.name}" is now ${futureStatus}.`;
        new Notification("Task Status Change", {
            body: notificationBody,
            tag: task.id // Using a tag prevents multiple notifications for the same task.
        });
        // Update the timestamp after sending the notification.
        notificationEngine.lastNotificationTimestamps[task.id] = Date.now();
        saveData(); // Save the updated timestamps.
    }, delay);

    // Store the timeout ID so we can cancel it if the user returns to the page.
    notificationEngine.timeouts.push(timeoutId);
}

/**
 * Calculates all future status changes for active tasks and schedules notifications.
 */
function calculateAndScheduleAllNotifications() {
    const now = Date.now();

    tasks.forEach(task => {
        // Skip completed, locked, or tasks with pending user actions.
        if (task.completed || task.status === 'blue' || task.confirmationState) return;
        if (!task.dueDate || isNaN(task.dueDate)) return;

        const dueDateMs = task.dueDate.getTime();
        const estimateMs = getDurationMs(task.estimatedDurationAmount, task.estimatedDurationUnit) || (30 * MS_PER_MINUTE);

        // Define potential trigger points for status changes.
        const triggerPoints = [
            { status: 'yellow', timestamp: dueDateMs - (estimateMs * 2) },
            { status: 'red', timestamp: dueDateMs - estimateMs },
            { status: 'red', timestamp: dueDateMs } // Becomes overdue
        ];

        triggerPoints.forEach(point => {
            if (point.timestamp > now) {
                scheduleNotification(task, point.status, point.timestamp);
            }
        });
    });

    console.log(`Scheduled ${notificationEngine.timeouts.length} potential notifications.`);
}

/**
 * Starts the notification engine when the page becomes hidden.
 */
function startNotificationEngine() {
    console.log("Page hidden. Starting notification engine...");
    // Ensure the engine is clean before starting.
    stopNotificationEngine();
    calculateAndScheduleAllNotifications();
}

/**
 * Stops the notification engine and clears all scheduled notifications.
 */
function stopNotificationEngine() {
    console.log(`Page visible. Stopping notification engine and clearing ${notificationEngine.timeouts.length} scheduled notifications.`);
    notificationEngine.timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    notificationEngine.timeouts = [];
}


// --- Initialization ---

function initializeDOMElements() {
    // Task Manager
    taskModal = document.getElementById('task-modal'); taskForm = document.getElementById('task-form'); taskListDiv = document.getElementById('task-list'); modalTitle = document.getElementById('modal-title'); taskIdInput = document.getElementById('task-id'); taskNameInput = document.getElementById('task-name');
    taskIconInput = document.getElementById('task-icon');
    timeInputTypeSelect = document.getElementById('time-input-type');
    dueDateGroup = document.getElementById('due-date-group');
    taskDueDateInput = document.getElementById('task-due-date');
    startDateGroup = document.getElementById('start-date-group');
    taskStartDateInput = document.getElementById('task-start-date');
    dueDateTypeSelect = document.getElementById('due-date-type');
    relativeDueDateGroup = document.getElementById('relative-due-date-group');
    relativeAmountInput = document.getElementById('relative-amount');
    relativeUnitSelect = document.getElementById('relative-unit');
    taskRepetitionSelect = document.getElementById('task-repetition');
    repetitionRelativeGroup = document.getElementById('repetition-relative-group');
    repetitionAmountInput = document.getElementById('repetition-amount');
    repetitionUnitSelect = document.getElementById('repetition-unit');
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
    taskCategorySelect = document.getElementById('task-category');
    newCategoryGroup = document.getElementById('new-category-group');
    newCategoryNameInput = document.getElementById('new-category-name');
    advancedOptionsModal = document.getElementById('advanced-options-modal');
    sortBySelect = document.getElementById('sort-by');
    sortDirectionSelect = document.getElementById('sort-direction');
    categoryFilterList = document.getElementById('category-filter-list');
    plannerDefaultCategorySelect = document.getElementById('planner-default-category');
    dayNightToggle = document.getElementById('day-night-toggle');

    // Pilot Planner
    app = document.getElementById('app');
    weeklyGoalsEl = document.getElementById('weeklyGoals');
    indicatorListEl = document.getElementById('indicatorList');
    newIndicatorInput = document.getElementById('newIndicatorInput');
    addIndicatorBtn = document.getElementById('addIndicatorBtn');
    plannerContainer = document.getElementById('plannerContainer');
    weeklyViewContainer = document.getElementById('weeklyViewContainer');
    dailyViewContainer = document.getElementById('dailyViewContainer');
    progressTrackerContainer = document.getElementById('progressTrackerContainer');
    viewBtns = document.querySelectorAll('.view-btn');
    startNewWeekBtn = document.getElementById('startNewWeekBtn');
    confirmModal = document.getElementById('confirmModal');
    cancelNewWeekBtn = document.getElementById('cancelNewWeek');
    confirmNewWeekBtn = document.getElementById('confirmNewWeek');
    prevWeekBtn = document.getElementById('prevWeekBtn');
    nextWeekBtn = document.getElementById('nextWeekBtn');
    weekStatusEl = document.getElementById('weekStatus');
    weekDateRangeEl = document.getElementById('weekDateRange');
}
function setupEventListeners() {
    // Task Manager
    const toggleTaskManagerBtn = document.getElementById('toggleTaskManagerBtn');
    if (toggleTaskManagerBtn) {
        toggleTaskManagerBtn.addEventListener('click', () => {
            document.getElementById('taskManagerModal').classList.toggle('hidden');
        });
    }
    const closeTaskManagerBtn = document.getElementById('closeTaskManagerBtn');
    if (closeTaskManagerBtn) {
        closeTaskManagerBtn.addEventListener('click', () => {
            document.getElementById('taskManagerModal').classList.add('hidden');
        });
    }

    const addTaskBtn = document.getElementById('add-task-btn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => openModal());
    }
    const advancedOptionsBtn = document.getElementById('advanced-options-btn');
    if(advancedOptionsBtn) {
        advancedOptionsBtn.addEventListener('click', openAdvancedOptionsModal);
    }
    const advOptionsCloseButton = advancedOptionsModal.querySelector('.close-button');
    if(advOptionsCloseButton) {
        advOptionsCloseButton.addEventListener('click', () => {
            advancedOptionsModal.classList.remove('active');
        });
    }
    if (taskForm) {
        taskForm.addEventListener('submit', handleFormSubmit);
    }

    const closeButton = taskModal.querySelector('.close-button');
    const cancelButton = taskModal.querySelector('button[type="button"]');
    if (closeButton) closeButton.addEventListener('click', closeModal);
    if (cancelButton) cancelButton.addEventListener('click', closeModal);

    timeInputTypeSelect.addEventListener('change', (e) => {
        const isStart = e.target.value === 'start';
        dueDateGroup.classList.toggle('hidden', isStart);
        startDateGroup.classList.toggle('hidden', !isStart);
        if (estimatedDurationAmountInput) {
            estimatedDurationAmountInput.required = isStart;
        }
    });

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
        relativeDueDateGroup.classList.toggle('hidden', e.target.value !== 'relative');
    });
    completionTypeSelect.addEventListener('change', (e) => {
        toggleCompletionFields(e.target.value);
    });
    taskCategorySelect.addEventListener('change', (e) => {
        const isNew = e.target.value === 'new_category';
        newCategoryGroup.classList.toggle('hidden', !isNew);
        if (isNew) {
            newCategoryNameInput.focus();
        }
    });
    window.addEventListener('mousedown', (event) => {
        if (event.target === taskModal || event.target === advancedOptionsModal) {
            closeModal();
            advancedOptionsModal.classList.remove('active');
        }
    });
    taskListDiv.addEventListener('click', (event) => {
        if (event.target.closest('.collapsible-header')) {
            const header = event.target.closest('.collapsible-header');
            const group = header.dataset.group;
            const tasksToToggle = taskListDiv.querySelectorAll(`.task-item[data-group="${group}"]`);
            const icon = header.querySelector('span');
            header.classList.toggle('collapsed');
            if (header.classList.contains('collapsed')) {
                icon.style.transform = 'rotate(-90deg)';
                tasksToToggle.forEach(t => t.style.display = 'none');
            } else {
                icon.style.transform = 'rotate(0deg)';
                tasksToToggle.forEach(t => t.style.display = 'flex');
            }
            return;
        }
        const target = event.target.closest('[data-action]');
        if (!target) return;
        const action = target.dataset.action;
        const taskId = target.dataset.taskId;

        switch (action) {
            case 'edit': editTask(taskId); break;
            case 'triggerDelete': triggerDelete(taskId); break;
            case 'triggerCompletion': triggerCompletion(taskId); break;
            case 'confirmCompletion': confirmCompletionAction(taskId, target.dataset.confirmed === 'true'); break;
            case 'handleOverdue': handleOverdueChoice(taskId, target.dataset.choice); break;
            case 'confirmMiss': confirmMissAction(taskId, target.dataset.confirmed === 'true'); break;
            case 'confirmDelete': confirmDeleteAction(taskId, target.dataset.confirmed === 'true'); break;
            case 'triggerUndo': triggerUndoConfirmation(taskId); break;
            case 'confirmUndo': confirmUndoAction(taskId, target.dataset.confirmed === 'true'); break;
            case 'incrementCount': incrementCount(taskId); break;
            case 'decrementCount': decrementCount(taskId); break;
            case 'toggleTimer': toggleTimer(taskId); break;
            case 'editProgress': editProgress(taskId); break;
            case 'saveProgress': saveProgressEdit(taskId); break;
            case 'cancelProgress': cancelProgressEdit(taskId); break;
        }
    });
    const advancedOptionsContent = document.getElementById('advanced-options-content');
    if (advancedOptionsContent) {
        advancedOptionsContent.addEventListener('click', (event) => {
            const target = event.target.closest('[data-action]');
            if (!target) return;
            const action = target.dataset.action;
            const categoryId = target.dataset.categoryId;
            const statusKey = target.dataset.statusKey;

            switch(action) {
                case 'deleteCategory': deleteCategory(categoryId); break;
                case 'addCategory': addCategoryFromManager(); break;
                case 'triggerCategoryEdit': triggerCategoryEdit(categoryId); break;
                case 'saveCategoryEdit': saveCategoryEdit(categoryId); break;
                case 'cancelCategoryEdit': cancelCategoryEdit(categoryId); break;
                case 'triggerStatusNameEdit': triggerStatusNameEdit(statusKey); break;
                case 'saveStatusNameEdit': saveStatusNameEdit(statusKey); break;
                case 'cancelStatusNameEdit': cancelStatusNameEdit(); break;
                case 'restoreDefaults': triggerRestoreDefaults(); break;
                case 'confirmRestoreDefaults': confirmRestoreDefaultsAction(target.dataset.confirmed === 'true'); break;
                case 'toggleAllNotifications': handleMasterNotificationToggle(event); break;
                case 'toggleCategoryNotification':
                    toggleCategoryNotification(target.dataset.categoryId, event.target.checked);
                    break;
                case 'toggleDayNight':
                    theming.mode = event.target.checked ? 'night' : 'day';
                    applyTheme();
                    saveData();
                    break;
                case 'toggleTheme':
                    theming.enabled = event.target.checked;
                    applyTheme();
                    renderThemeControls();
                    saveData();
                    break;
                case 'randomizeTheme':
                    theming.baseColor = getRandomColor();
                    applyTheme();
                    renderThemeControls();
                    saveData();
                    break;
            }
        });
        advancedOptionsContent.addEventListener('change', (event) => {
            const target = event.target;
            if (target.classList.contains('category-color-picker')) {
                const categoryId = target.dataset.categoryId;
                const newColor = target.value;
                const category = categories.find(cat => cat.id === categoryId);
                if (category) {
                    category.color = newColor;
                    saveData();
                    renderCategoryManager();
                    renderTasks();
                }
            } else if (target.classList.contains('category-filter-checkbox')) {
                const allCheckbox = categoryFilterList.querySelector('input[value="all"]');
                const otherCheckboxes = categoryFilterList.querySelectorAll('input:not([value="all"])');
                if (target.value === 'all') {
                    otherCheckboxes.forEach(cb => cb.checked = false);
                    categoryFilter = [];
                } else {
                    allCheckbox.checked = false;
                    categoryFilter = Array.from(otherCheckboxes)
                        .filter(cb => cb.checked)
                        .map(cb => cb.value === 'null' ? null : cb.value);
                }

                if (categoryFilter.length === 0) {
                    allCheckbox.checked = true;
                }
                renderTasks();
            } else if (target.classList.contains('status-color-picker')) {
                 const statusKey = target.dataset.statusKey;
                 const newColor = target.value;
                 if (statusColors.hasOwnProperty(statusKey)) {
                     statusColors[statusKey] = newColor;
                     saveData();
                     renderTasks();
                     renderStatusManager(); // Re-render the manager to show the change
                 }
            } else if (target.id === 'notification-rate-amount' || target.id === 'notification-rate-unit') {
                updateNotificationRateLimit();
            } else if (target.id === 'theme-base-color') {
                theming.baseColor = target.value;
                applyTheme();
                saveData();
            } else if (target.id === 'planner-default-category') {
                plannerSettings.defaultCategoryId = target.value;
                saveData();
            } else if (target.classList.contains('task-display-toggle')) {
                const key = target.name;
                if (taskDisplaySettings.hasOwnProperty(key)) {
                    taskDisplaySettings[key] = target.checked;
                    saveData();
                    renderTasks();
                }
            }
        });
        sortBySelect.addEventListener('change', (e) => {
            sortBy = e.target.value;
            saveData();
            renderTasks();
        });
        sortDirectionSelect.addEventListener('change', (e) => {
            sortDirection = e.target.value;
            saveData();
            renderTasks();
        });
    }

    // Pilot Planner
    const plannerClickHandler = (e) => {
        const target = e.target;
        const slot = target.closest('.planner-slot');
        const taskItem = target.closest('.planner-task-item');
        const moreLink = target.closest('.planner-more-link');

        if (moreLink) {
            const dayIndex = parseInt(moreLink.dataset.dayIndex, 10);
            if (!isNaN(dayIndex)) {
                appState.currentView = 'daily';
                appState.currentDayIndex = dayIndex;
                saveViewState();
                renderPlanner();
            }
        } else if (taskItem && slot) {
            e.stopPropagation();
            const taskId = taskItem.dataset.taskId;
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            const occurrenceDate = taskItem.dataset.occurrenceDate ? new Date(taskItem.dataset.occurrenceDate) : null;
            openModal(taskId, { occurrenceDate: occurrenceDate });

        } else if (slot) {
            handlePlannerSlotClick(slot);
        }
    };
    plannerContainer.addEventListener('click', plannerClickHandler);
    dailyViewContainer.addEventListener('click', e => {
        let dayChanged = false;
        if (e.target.id === 'prevDayBtn') { appState.currentDayIndex = (appState.currentDayIndex - 1 + 7) % 7; dayChanged = true; }
        if (e.target.id === 'nextDayBtn') { appState.currentDayIndex = (appState.currentDayIndex + 1) % 7; dayChanged = true; }
        if(dayChanged) { saveViewState(); renderDailyView(); }
        else { plannerClickHandler(e) }
    });

    prevWeekBtn.addEventListener('click', () => { if (appState.viewingIndex > 0) { appState.viewingIndex--; saveViewState(); renderPlanner(); } });
    nextWeekBtn.addEventListener('click', () => { appState.viewingIndex++; saveViewState(); renderPlanner(); });
    viewBtns.forEach(btn => btn.addEventListener('click', () => { appState.currentView = btn.dataset.view; saveViewState(); renderPlanner(); }));
    addIndicatorBtn.addEventListener('click', () => { const name = newIndicatorInput.value.trim(); if (name) { const newId = appState.indicators.length > 0 ? Math.max(...appState.indicators.map(i => i.id)) + 1 : 1; appState.indicators.push({ id: newId, name: name }); newIndicatorInput.value = ''; savePlannerData(); renderPlanner(); }});
    indicatorListEl.addEventListener('click', e => { if(e.target.matches('.remove-indicator-btn')) { appState.indicators = appState.indicators.filter(i => i.id !== parseInt(e.target.dataset.id)); savePlannerData(); renderPlanner(); } });

    app.addEventListener('blur', e => {
        if (e.target.matches('[contenteditable][data-key]')) {
            const week = appState.weeks[appState.viewingIndex]; const key = e.target.dataset.key;
            const newContent = e.target.innerHTML.replace(/<span.*?<\/span>/g, '').trim();
            if (checkAmendment(week, 'schedule', key, null, newContent)) renderPlanner();
            week.schedule[key] = newContent;
            savePlannerData();
        }
    }, true);

    app.addEventListener('input', e => {
         if (e.target.matches('input[type="number"][data-key]')) {
            const { key, type } = e.target.dataset; const week = appState.weeks[appState.viewingIndex];
            if (!week.kpiData[key]) week.kpiData[key] = { goal: 0, actual: 0 };
            const newValue = parseFloat(e.target.value) || 0;
            if (checkAmendment(week, 'kpi', key, type, newValue)) renderPlanner();
            week.kpiData[key][type] = newValue;
            savePlannerData();
            renderProgressTracker();
        }
    });

    weeklyGoalsEl.addEventListener('blur', () => {
        const week = appState.weeks[appState.viewingIndex]; const newGoals = weeklyGoalsEl.innerHTML;
        if (checkAmendment(week, 'weeklyGoals', 'weeklyGoals', null, newGoals)) renderPlanner();
        week.weeklyGoals = newGoals;
        savePlannerData();
    });

    startNewWeekBtn.addEventListener('click', () => confirmModal.classList.remove('hidden'));
    cancelNewWeekBtn.addEventListener('click', () => confirmModal.classList.add('hidden'));
    confirmNewWeekBtn.addEventListener('click', () => {
        const weekToSnapshot = appState.weeks[CURRENT_WEEK_INDEX];
        if (!weekToSnapshot.originalState) {
            weekToSnapshot.originalState = {
                weeklyGoals: weekToSnapshot.weeklyGoals,
                schedule: deepClone(weekToSnapshot.schedule),
                kpiData: deepClone(weekToSnapshot.kpiData)
            };
        }
        const lastWeek = appState.weeks[appState.weeks.length - 1];
        const nextWeekStartDate = new Date(lastWeek.startDate); nextWeekStartDate.setDate(nextWeekStartDate.getDate() + 7);
        appState.weeks.push(createNewWeek(nextWeekStartDate)); appState.weeks.shift();
        appState.viewingIndex = CURRENT_WEEK_INDEX;
        savePlannerData();
        saveViewState();
        renderPlanner();
        confirmModal.classList.add('hidden');
    });

    // Add the listener for page visibility changes.
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            startNotificationEngine();
        } else {
            stopNotificationEngine();
        }
    });
}

function saveData() {
    try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        localStorage.setItem('categories', JSON.stringify(categories));
        localStorage.setItem('statusColors', JSON.stringify(statusColors));
        localStorage.setItem('statusNames', JSON.stringify(statusNames));
        localStorage.setItem('sortBy', sortBy);
        localStorage.setItem('sortDirection', sortDirection);
        localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
        localStorage.setItem('notificationTimestamps', JSON.stringify(notificationEngine.lastNotificationTimestamps));
        localStorage.setItem('theming', JSON.stringify(theming));
        localStorage.setItem('calendarSettings', JSON.stringify(calendarSettings));
        localStorage.setItem('categoryFilter', JSON.stringify(categoryFilter));
        localStorage.setItem('plannerSettings', JSON.stringify(plannerSettings));
        localStorage.setItem('taskDisplaySettings', JSON.stringify(taskDisplaySettings));
        savePlannerData();
    } catch (error) {
        console.error("Error saving data to localStorage:", error);
    }
}

function loadData() {
    const storedTasks = localStorage.getItem('tasks');
    const storedCategories = localStorage.getItem('categories');
    const storedColors = localStorage.getItem('statusColors');
    const storedNames = localStorage.getItem('statusNames');
    const storedSortBy = localStorage.getItem('sortBy');
    const storedSortDirection = localStorage.getItem('sortDirection');
    const storedNotifications = localStorage.getItem('notificationSettings');
    const storedNotificationTimestamps = localStorage.getItem('notificationTimestamps');
    const storedTheming = localStorage.getItem('theming');
    const storedCalendarSettings = localStorage.getItem('calendarSettings');
    const storedCategoryFilter = localStorage.getItem('categoryFilter');
    const storedPlannerSettings = localStorage.getItem('plannerSettings');
    const storedTaskDisplaySettings = localStorage.getItem('taskDisplaySettings');

    tasks = [];
    categories = [];

    if (storedColors) {
        try {
            const parsedColors = JSON.parse(storedColors);
            statusColors = { ...statusColors, ...parsedColors };
        } catch (e) {
            console.error("Error parsing status colors:", e);
        }
    }
    if (storedNames) {
        try {
            const parsedNames = JSON.parse(storedNames);
            statusNames = { ...statusNames, ...parsedNames };
        } catch (e) {
            console.error("Error parsing status names:", e);
        }
    }

    if (storedSortBy) sortBy = storedSortBy;
    if (storedSortDirection) sortDirection = storedSortDirection;
    sortBySelect.value = sortBy;
    sortDirectionSelect.value = sortDirection;

    if (storedNotifications) {
        try {
            const parsedSettings = JSON.parse(storedNotifications);
            // Deep merge to handle nested objects
            notificationSettings.rateLimit = { ...notificationSettings.rateLimit, ...parsedSettings.rateLimit };
            notificationSettings.categories = { ...notificationSettings.categories, ...parsedSettings.categories };
            notificationSettings.enabled = typeof parsedSettings.enabled === 'boolean' ? parsedSettings.enabled : false;
        } catch(e) {
            console.error("Error parsing notification settings:", e);
        }
    }

    if (storedNotificationTimestamps) {
        try {
            notificationEngine.lastNotificationTimestamps = JSON.parse(storedNotificationTimestamps);
        } catch(e) {
            console.error("Error parsing notification timestamps:", e);
        }
    }

    if (storedTheming) {
        try {
            const parsedTheming = JSON.parse(storedTheming);
            theming = { ...theming, ...parsedTheming };
            if (theming.mode !== 'day' && theming.mode !== 'night') {
                theming.mode = 'night';
            }
        } catch (e) {
            console.error("Error parsing theming settings:", e);
        }
    }

    if (storedCalendarSettings) {
        try {
            const parsedSettings = JSON.parse(storedCalendarSettings);
            calendarSettings = { ...calendarSettings, ...parsedSettings };
        } catch (e) {
            console.error("Error parsing calendar settings:", e);
        }
    }

    if (storedCategoryFilter) {
        try {
            categoryFilter = JSON.parse(storedCategoryFilter);
        } catch (e) {
            console.error("Error parsing category filter:", e);
        }
    }

    if (storedPlannerSettings) {
        try {
            const parsedSettings = JSON.parse(storedPlannerSettings);
            plannerSettings = { ...plannerSettings, ...parsedSettings };
        } catch (e) {
            console.error("Error parsing planner settings:", e);
        }
    }

    if (storedTaskDisplaySettings) {
        try {
            const parsedSettings = JSON.parse(storedTaskDisplaySettings);
            taskDisplaySettings = { ...taskDisplaySettings, ...parsedSettings };
        } catch (e) {
            console.error("Error parsing task display settings:", e);
        }
    }


    if (storedCategories) {
        try {
            categories = JSON.parse(storedCategories);
        } catch (error) {
            console.error("Error parsing categories from localStorage:", error);
        }
    }
    if (storedTasks) {
        try {
            const parsedTasks = JSON.parse(storedTasks);
            tasks = parsedTasks.map(task => {
                let tempTask = { ...task };
                tempTask.dueDate = task.dueDate ? new Date(task.dueDate) : null;
                tempTask.createdAt = task.createdAt ? new Date(task.createdAt) : new Date();
                tempTask.cycleEndDate = task.cycleEndDate ? new Date(task.cycleEndDate) : null;
                tempTask.timerLastStarted = task.timerLastStarted ? new Date(task.timerLastStarted) : null;
                if (isNaN(tempTask.dueDate)) tempTask.dueDate = null;
                if (isNaN(tempTask.createdAt)) tempTask.createdAt = new Date();
                if (isNaN(tempTask.cycleEndDate)) tempTask.cycleEndDate = null;
                if (isNaN(tempTask.timerLastStarted)) tempTask.timerLastStarted = null;

                return sanitizeAndUpgradeTask(tempTask);
            });

            tasks.forEach(task => {
                if (task.isTimerRunning && task.timerLastStarted) {
                    const elapsedWhileAway = Date.now() - task.timerLastStarted.getTime();
                    const targetMs = getDurationMs(task.timeTargetAmount, task.timeTargetUnit);
                    task.currentProgress = (task.currentProgress || 0) + elapsedWhileAway;

                    if (task.currentProgress >= targetMs) {
                        task.currentProgress = targetMs;
                        task.isTimerRunning = false;
                        task.timerLastStarted = null;
                    } else {
                        task.timerLastStarted = new Date().toISOString();
                    }
                }
            });
        } catch (error) {
            console.error("Error parsing tasks from localStorage:", error);
        }
    }

    updateAllTaskStatuses(true);
    startMainUpdateLoop();
}

function updateAllTaskStatuses(forceRender = false) {
    let changed = false;
    const nowMs = Date.now();
    const currentTasks = [...tasks];
    tasks.forEach(task => {
        try {
            if (task.repetitionType === 'none' && task.completed) return;

            const oldStatus = task.status;
            const oldConfirmationState = task.confirmationState;

            // Step 1: Always calculate the definitive current status based on timing and misses.
            const newStatusResult = calculateStatus(task, nowMs, currentTasks);
            task.status = newStatusResult.name;

            const dueDateMs = task.dueDate ? task.dueDate.getTime() : null;
            const isPastDue = dueDateMs !== null && dueDateMs <= nowMs;

            // Step 2: Determine if a confirmation state is needed, or if it should be cleared.
            if (isPastDue && task.status !== 'blue' && !task.confirmationState) {
                // Task just became overdue. Set prompt and force status to black.
                task.confirmationState = 'awaiting_overdue_input';
                task.status = 'black'; // <-- NEW: Overdue tasks now immediately become black.
                if (!task.overdueStartDate) {
                    task.overdueStartDate = task.dueDate.toISOString();
                }
                task.pendingCycles = calculatePendingCycles(task, nowMs);
                if (task.isTimerRunning) { toggleTimer(task.id); }
            } else if (!isPastDue && (task.confirmationState === 'awaiting_overdue_input' || task.confirmationState === 'confirming_miss')) {
                // This clears the 'Done/Missed' prompt if the task is no longer past due (e.g., date was edited).
                task.confirmationState = null;
                delete task.overdueStartDate;
                delete task.pendingCycles;
            }

            // Step 3: If the status OR the confirmation state changed, flag the UI for a full update.
            // This ensures the color changes without losing the confirmation prompt.
            if (task.status !== oldStatus || task.confirmationState !== oldConfirmationState) {
                changed = true;
            }

            if (task.isTimerRunning && !taskTimers[task.id]) {
                startTimerInterval(task.id);
            }

        } catch (e) {
            console.error("Error updating status for task:", task?.id, e);
        }
    });
    if (changed || forceRender) {
        saveData();
        renderTasks();
    }
}
function startMainUpdateLoop() {
    if (mainUpdateInterval) clearInterval(mainUpdateInterval);
    // The initial update is handled in loadData(), so the immediate timeout is removed.
    mainUpdateInterval = setInterval(() => updateAllTaskStatuses(false), STATUS_UPDATE_INTERVAL);
}

// =================================================================================
// --- PILOT MISSION PLANNER SCRIPT ---
// =================================================================================
const getStartOfWeek = (date = new Date()) => { const d = new Date(date); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d; };
const getISOStringAtMidnight = (date) => { const d = new Date(date); d.setHours(0, 0, 0, 0); return d.toISOString(); };
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

const createNewWeek = (startDate) => ({
    startDate: getISOStringAtMidnight(startDate),
    weeklyGoals: 'Set new goals for the week...',
    schedule: {},
    kpiData: {},
    amendedItems: { weeklyGoals: false, schedule: {}, kpi: {} },
    originalState: null
});

const savePlannerData = () => {
    // Cleanup historical tasks older than 4 weeks
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    if (appState.historicalTasks && appState.historicalTasks.length > 0) {
        appState.historicalTasks = appState.historicalTasks.filter(ht => new Date(ht.completionDate) >= fourWeeksAgo);
    }

    localStorage.setItem(DATA_KEY, JSON.stringify({
        weeks: appState.weeks,
        indicators: appState.indicators,
        historicalTasks: appState.historicalTasks
    }));
};
const saveViewState = () => localStorage.setItem(VIEW_STATE_KEY, JSON.stringify({ viewingIndex: appState.viewingIndex, currentView: appState.currentView, currentDayIndex: appState.currentDayIndex }));

const loadPlannerData = () => {
    const savedData = localStorage.getItem(DATA_KEY);
    if (!savedData) return;
    try {
        const parsedData = JSON.parse(savedData);
        appState.weeks = parsedData.weeks || [];
        appState.weeks.forEach(week => {
            if (!week.amendedItems) week.amendedItems = { weeklyGoals: false, schedule: {}, kpi: {} };
            if (week.originalState === undefined) week.originalState = null;
        });
        appState.indicators = parsedData.indicators || appState.indicators;
        appState.historicalTasks = parsedData.historicalTasks || [];
    } catch (error) { console.error("Failed to parse saved data:", error); }
};

const loadViewState = () => {
    const savedState = localStorage.getItem(VIEW_STATE_KEY);
    if (!savedState) return;
    try {
        const parsedState = JSON.parse(savedState);
        appState.viewingIndex = parsedState.viewingIndex ?? CURRENT_WEEK_INDEX;
        appState.currentView = parsedState.currentView ?? 'weekly';
        appState.currentDayIndex = parsedState.currentDayIndex ?? 0;
    } catch (error) { console.error("Failed to parse view state:", error); }
};

const getFutureWeekStartDate = (viewingIndex) => {
    const lastKnownWeek = appState.weeks[appState.weeks.length - 1];
    const lastKnownStartDate = new Date(lastKnownWeek.startDate);
    const weeksAhead = viewingIndex - (appState.weeks.length - 1);
    const futureStartDate = new Date(lastKnownStartDate);
    futureStartDate.setDate(futureStartDate.getDate() + (weeksAhead * 7));
    return futureStartDate;
};

const renderFutureWeeklyView = (startDate) => {
    const weekStartDate = startDate;
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);

    plannerContainer.innerHTML = ''; // Clear previous content

    // --- Render Header ---
    plannerContainer.insertAdjacentHTML('beforeend', `<div class="table-cell font-semibold bg-gray-800 sticky top-0 z-10">Time</div>`);
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStartDate);
        dayDate.setDate(weekStartDate.getDate() + i);
        plannerContainer.insertAdjacentHTML('beforeend', `<div class="table-cell font-semibold bg-gray-800 sticky top-0 z-10">${dayDate.toLocaleDateString(undefined, { weekday: 'short' })}<br>${dayDate.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}</div>`);
    }

    // --- Render Time Slots (read-only) ---
    for (let hour = 6; hour <= 22; hour++) {
        plannerContainer.insertAdjacentHTML('beforeend', `<div class="table-cell font-semibold bg-gray-800">${hour}:00</div>`);
        for (let day = 0; day < 7; day++) {
            plannerContainer.insertAdjacentHTML('beforeend', `<div class="table-cell planner-slot" data-key="${day}-${hour}"></div>`);
        }
    }

    // --- Render Task Manager Tasks onto the Grid ---
    if (typeof tasks !== 'undefined' && tasks.length > 0) {
        tasks.forEach(task => {
            const occurrences = getTaskOccurrences(task, weekStartDate, weekEndDate);
            occurrences.forEach(occurrenceDate => {
                const dayOfWeek = occurrenceDate.getDay();
                const hour = occurrenceDate.getHours();

                if (hour >= 6 && hour <= 22) {
                    const cell = plannerContainer.querySelector(`.planner-slot[data-key="${dayOfWeek}-${hour}"]`);
                    if (cell) {
                        const taskElement = document.createElement('div');
                        taskElement.className = 'planner-task-item';
                        taskElement.textContent = task.name;
                        taskElement.style.backgroundColor = statusColors['green']; // Future tasks are neutral
                        const textStyle = getContrastingTextColor(taskElement.style.backgroundColor);
                        taskElement.style.color = textStyle.color;
                        taskElement.style.textShadow = textStyle.textShadow;
                        taskElement.dataset.taskId = task.id;
                        // Store occurrence date on the element to be picked up by the event listener
                        taskElement.dataset.occurrenceDate = occurrenceDate.toISOString();
                        cell.appendChild(taskElement);
                    }
                }
            });
        });
    }
};


// =================================================================================
// --- PILOT MISSION PLANNER SCRIPT (RECONSTRUCTED RENDER FUNCTIONS) ---
// =================================================================================

// Jules' note: Avast! It seems these functions went walkin' the plank. I've recreated them based on the clues in the code.

function checkAmendment(week, area, key, type, newValue) {
    const originalState = week.originalState;
    if (!originalState) return false;

    let originalValue;
    switch(area) {
        case 'weeklyGoals':
            originalValue = originalState.weeklyGoals;
            break;
        case 'schedule':
            originalValue = originalState.schedule[key] || '';
            break;
        case 'kpi':
            originalValue = (originalState.kpiData[key] && originalState.kpiData[key][type]) || 0;
            break;
        default:
            return false;
    }

    const isAmended = String(newValue) !== String(originalValue);

    if (area === 'weeklyGoals') {
        week.amendedItems.weeklyGoals = isAmended;
    } else if (area === 'schedule') {
        week.amendedItems.schedule[key] = isAmended;
    } else if (area === 'kpi') {
        if (!week.amendedItems.kpi) week.amendedItems.kpi = {};
        week.amendedItems.kpi[key] = isAmended;
    }

    return isAmended;
}

function renderNavigation() {
    const isFutureView = appState.viewingIndex >= appState.weeks.length;
    let startDate, endDate;

    if (isFutureView) {
        startDate = getFutureWeekStartDate(appState.viewingIndex);
    } else {
        const week = appState.weeks[appState.viewingIndex];
        if (!week) return;
        startDate = new Date(week.startDate);
    }

    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    weekDateRangeEl.textContent = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

    if (isFutureView) {
        weekStatusEl.textContent = 'Future (Read-Only)';
    } else if (appState.viewingIndex === CURRENT_WEEK_INDEX) {
        weekStatusEl.textContent = 'Current Week';
    } else if (appState.viewingIndex < CURRENT_WEEK_INDEX) {
        weekStatusEl.textContent = 'Past Week';
    } else {
        weekStatusEl.textContent = 'Future Week';
    }

    prevWeekBtn.disabled = appState.viewingIndex === 0;
    nextWeekBtn.disabled = false;

    if (startNewWeekBtn) {
        startNewWeekBtn.style.display = (appState.viewingIndex === CURRENT_WEEK_INDEX && !isFutureView) ? 'block' : 'none';
    }
}

function renderGoals() {
    if (appState.viewingIndex >= appState.weeks.length) {
        weeklyGoalsEl.innerHTML = '<i>Future planning not available.</i>';
        weeklyGoalsEl.contentEditable = 'false';
        return;
    }
    const week = appState.weeks[appState.viewingIndex];
    weeklyGoalsEl.innerHTML = week.weeklyGoals;
    weeklyGoalsEl.contentEditable = (appState.viewingIndex === CURRENT_WEEK_INDEX).toString();
    if (week.amendedItems.weeklyGoals) {
        weeklyGoalsEl.classList.add('amended');
    } else {
        weeklyGoalsEl.classList.remove('amended');
    }
}

function renderIndicators() {
    indicatorListEl.innerHTML = '';
    if (appState.viewingIndex >= appState.weeks.length) {
        return;
    }
    appState.indicators.forEach(indicator => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center bg-gray-700 p-2 rounded';
        li.innerHTML = `
            <span>${indicator.name}</span>
            <button data-id="${indicator.id}" class="remove-indicator-btn text-red-500 hover:text-red-700">&times;</button>
        `;
        indicatorListEl.appendChild(li);
    });
}

function updateViewButtons() {
    viewBtns.forEach(btn => {
        btn.classList.toggle('bg-blue-700', btn.dataset.view === appState.currentView);
        btn.classList.toggle('text-white', btn.dataset.view === appState.currentView);
    });
}

function renderWeeklyView() {
    const week = appState.weeks[appState.viewingIndex];
    if (!week) return; // Guard clause
    plannerContainer.innerHTML = ''; // Clear previous content

    // --- Render Header ---
    plannerContainer.insertAdjacentHTML('beforeend', `<div class="table-cell day-header-cell font-semibold bg-gray-800 sticky top-0 z-10" style="grid-column: 1;">Time</div>`);
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(week.startDate);
        dayDate.setDate(new Date(week.startDate).getDate() + i);
        plannerContainer.insertAdjacentHTML('beforeend', `<div class="table-cell day-header-cell font-semibold bg-gray-800 sticky top-0 z-10" style="grid-column: ${i + 2};">${dayDate.toLocaleDateString(undefined, { weekday: 'short' })}<br>${dayDate.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}</div>`);
    }

    // --- Render Time Labels and Grid Cells ---
    for (let hour = 6; hour <= 22; hour++) {
        const rowStart = (hour - 6) * 4 + 2;
        plannerContainer.insertAdjacentHTML('beforeend', `<div class="table-cell time-label-cell font-semibold bg-gray-800" style="grid-row: ${rowStart} / span 4;">${hour}:00</div>`);
        for (let day = 0; day < 7; day++) {
            for (let i = 0; i < 4; i++) {
                const slotRow = rowStart + i;
                plannerContainer.insertAdjacentHTML('beforeend', `<div class="planner-slot" style="grid-column: ${day + 2}; grid-row: ${slotRow};"></div>`);
            }
        }
    }

    // --- Process and Render Tasks ---
    const weekStartDate = new Date(week.startDate);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);

    const dailyTasks = Array.from({ length: 7 }, () => []);

    if (typeof tasks !== 'undefined' && tasks.length > 0) {
        tasks.forEach(task => {
            const occurrences = getTaskOccurrences(task, weekStartDate, weekEndDate);
            occurrences.forEach(occurrenceDate => {
                const dayOfWeek = occurrenceDate.getDay();
                dailyTasks[dayOfWeek].push({ task, occurrenceDate });
            });
        });
    }

    dailyTasks.forEach((tasksForDay, dayIndex) => {
        layoutDay(tasksForDay, dayIndex, plannerContainer);
    });
}

function layoutDay(tasksForDay, dayIndex, container) {
    const MAX_LANES = 3;
    if (tasksForDay.length === 0) return;

    // Sort tasks by start time, then duration
    tasksForDay.sort((a, b) => {
        const startDiff = a.occurrenceDate.getTime() - b.occurrenceDate.getTime();
        if (startDiff !== 0) return startDiff;
        const durationA = getDurationMs(a.task.estimatedDurationAmount, a.task.estimatedDurationUnit) || 0;
        const durationB = getDurationMs(b.task.estimatedDurationAmount, b.task.estimatedDurationUnit) || 0;
        return durationB - durationA; // Longer tasks first
    });

    const lanes = []; // Each lane is an array of tasks

    tasksForDay.forEach(({ task, occurrenceDate }) => {
        let placed = false;
        for (let i = 0; i < lanes.length; i++) {
            const lastTaskInLane = lanes[i][lanes[i].length - 1];
            const lastTaskEndTime = new Date(lastTaskInLane.occurrenceDate.getTime() + (getDurationMs(lastTaskInLane.task.estimatedDurationAmount, lastTaskInLane.task.estimatedDurationUnit) || 0));
            if (occurrenceDate.getTime() >= lastTaskEndTime.getTime()) {
                lanes[i].push({ task, occurrenceDate });
                placed = true;
                break;
            }
        }
        if (!placed) {
            lanes.push([{ task, occurrenceDate }]);
        }
    });

    if (lanes.length > MAX_LANES) {
        const totalTasks = tasksForDay.length;
        const row = Math.floor((tasksForDay[0].occurrenceDate.getHours() - 6) * 4 + (tasksForDay[0].occurrenceDate.getMinutes() / 15)) + 2;
        renderMoreLink(totalTasks, dayIndex, row, container);
    } else {
        lanes.forEach((lane, laneIndex) => {
            lane.forEach(({ task, occurrenceDate }) => {
                renderTaskOnGrid(task, occurrenceDate, dayIndex, laneIndex, lanes.length, container);
            });
        });
    }
}

function renderTaskOnGrid(task, occurrenceDate, dayIndex, laneIndex, totalLanes, container) {
    const durationMs = getDurationMs(task.estimatedDurationAmount, task.estimatedDurationUnit) || 60 * 60 * 1000;
    const startTime = occurrenceDate;
    const endTime = new Date(startTime.getTime() + durationMs);

    const startRow = Math.max(0, (startTime.getHours() - 6) * 4 + Math.floor(startTime.getMinutes() / 15)) + 2;
    const endRow = Math.min(68, (endTime.getHours() - 6) * 4 + Math.ceil(endTime.getMinutes() / 15)) + 2;
    const rowSpan = Math.max(1, endRow - startRow);

    const taskElement = document.createElement('div');
    taskElement.className = 'planner-task-item';
    taskElement.textContent = task.name;

    const category = categories.find(c => c.id === task.categoryId);
    taskElement.style.backgroundColor = category ? category.color : (statusColors[task.status] || '#374151');

    const textStyle = getContrastingTextColor(taskElement.style.backgroundColor);
    taskElement.style.color = textStyle.color;
    taskElement.style.textShadow = textStyle.textShadow;

    taskElement.dataset.taskId = task.id;
    taskElement.dataset.occurrenceDate = occurrenceDate.toISOString();

    const width = 100 / totalLanes;
    const left = laneIndex * width;

    taskElement.style.gridColumn = `${dayIndex + 2}`;
    taskElement.style.gridRow = `${startRow} / span ${rowSpan}`;
    taskElement.style.width = `calc(${width}% - 4px)`;
    taskElement.style.left = `${left}%`;

    container.appendChild(taskElement);
}


function renderMoreLink(count, dayIndex, startRow, container) {
    const moreLink = document.createElement('div');
    moreLink.className = 'planner-more-link';
    moreLink.textContent = `+${count} more`;
    moreLink.dataset.action = 'showMore';
    moreLink.dataset.dayIndex = dayIndex;

    moreLink.style.gridColumn = `${dayIndex + 2}`;
    moreLink.style.gridRow = `${startRow} / span 4`;
    moreLink.style.position = 'relative';
    moreLink.style.top = 'auto';
    moreLink.style.left = 'auto';
    moreLink.style.width = '100%';
    moreLink.style.textAlign = 'center';

    container.appendChild(moreLink);
}


function renderDailyView() {
    const week = appState.weeks[appState.viewingIndex];
    const dayIndex = appState.currentDayIndex;
    const dayDate = new Date(week.startDate);
    dayDate.setDate(new Date(week.startDate).getDate() + dayIndex);

    dailyViewContainer.innerHTML = `
        <div class="flex justify-between items-center p-2 bg-gray-800 rounded-t-lg">
            <button id="prevDayBtn" class="px-2 py-1 bg-gray-600 rounded">&lt; Prev</button>
            <h3 class="text-lg font-bold">${dayDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
            <button id="nextDayBtn" class="px-2 py-1 bg-gray-600 rounded">Next &gt;</button>
        </div>
        <div id="daily-planner-grid" class="daily-planner-grid p-2"></div>
    `;

    const grid = dailyViewContainer.querySelector('#daily-planner-grid');
    for (let hour = 6; hour <= 22; hour++) {
        const key = `${dayIndex}-${hour}`;
        const scheduleContent = week.schedule[key] || '';
        const isEditable = appState.viewingIndex === CURRENT_WEEK_INDEX;
        const amendedClass = week.amendedItems.schedule[key] ? 'amended' : '';

        const slot = document.createElement('div');
        slot.className = 'daily-slot';
        slot.innerHTML = `<div class="time-label">${hour}:00</div>`;

        const contentDiv = document.createElement('div');
        contentDiv.className = `planner-slot ${amendedClass}`;
        contentDiv.dataset.key = key;
        contentDiv.contentEditable = isEditable;
        contentDiv.innerHTML = scheduleContent;
        slot.appendChild(contentDiv);
        grid.appendChild(slot);
    }

    const dayStart = new Date(dayDate);
    dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(dayDate);
    dayEnd.setHours(23,59,59,999);

    if (typeof tasks !== 'undefined' && tasks.length > 0) {
        tasks.forEach(task => {
            const occurrences = getTaskOccurrences(task, dayStart, dayEnd);
            occurrences.forEach(occurrenceDate => {
                const hour = occurrenceDate.getHours();
                if (hour >= 6 && hour <= 22) {
                    const cell = grid.querySelector(`.planner-slot[data-key="${dayIndex}-${hour}"]`);
                    if (cell) {
                         const taskElement = document.createElement('div');
                        taskElement.className = 'planner-task-item';
                        taskElement.textContent = task.name;

                        const category = categories.find(c => c.id === task.categoryId);
                        taskElement.style.backgroundColor = category ? category.color : (statusColors[task.status] || '#374151');

                        const textStyle = getContrastingTextColor(taskElement.style.backgroundColor);
                        taskElement.style.color = textStyle.color;
                        taskElement.style.textShadow = textStyle.textShadow;
                        taskElement.dataset.taskId = task.id;
                        taskElement.dataset.occurrenceDate = occurrenceDate.toISOString();
                        cell.appendChild(taskElement);
                    }
                }
            });
        });
    }
}

function renderProgressTracker() {
    progressTrackerContainer.innerHTML = '';
    if (appState.viewingIndex >= appState.weeks.length) return;

    const week = appState.weeks[appState.viewingIndex];
    const isEditable = appState.viewingIndex === CURRENT_WEEK_INDEX;

    appState.indicators.forEach(indicator => {
        const { id, name } = indicator;
        const dayKeys = Array.from({length: 7}, (_, i) => `${id}-${i}`);
        const kpiData = dayKeys.map(key => week.kpiData[key] || { goal: 0, actual: 0 });

        const totalGoal = kpiData.reduce((sum, data) => sum + (data.goal || 0), 0);
        const totalActual = kpiData.reduce((sum, data) => sum + (data.actual || 0), 0);
        const progress = totalGoal > 0 ? (totalActual / totalGoal) * 100 : 0;

        const amendedClass = dayKeys.some(key => week.amendedItems.kpi[key]) ? 'amended-container' : '';

        const trackerHTML = `
            <div class="kpi-indicator ${amendedClass}">
                <h4 class="font-semibold">${name}</h4>
                <div class="flex justify-between text-sm">
                    <span>Actual: ${totalActual}</span>
                    <span>Goal: ${totalGoal}</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar" style="width: ${Math.min(progress, 100)}%;"></div>
                </div>
                <div class="daily-inputs ${isEditable ? '' : 'hidden'}">
                    ${[...Array(7)].map((_, day) => `
                        <div class="daily-input-group">
                            <label>${['S','M','T','W','T','F','S'][day]}</label>
                            <input type="number" class="kpi-goal-input" data-key="${id}-${day}" data-type="goal" value="${kpiData[day].goal}" ${isEditable ? '' : 'disabled'}>
                            <input type="number" class="kpi-actual-input" data-key="${id}-${day}" data-type="actual" value="${kpiData[day].actual}" ${isEditable ? '' : 'disabled'}>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        progressTrackerContainer.insertAdjacentHTML('beforeend', trackerHTML);
    });
}


const renderPlanner = () => {
    const isFutureView = appState.viewingIndex >= appState.weeks.length;

    if (isFutureView) {
        const futureStartDate = getFutureWeekStartDate(appState.viewingIndex);
        renderNavigation();
        weeklyGoalsEl.innerHTML = '<i>Future planning not available.</i>';
        indicatorListEl.innerHTML = '';
        progressTrackerContainer.innerHTML = '';
        weeklyViewContainer.classList.remove('hidden');
        dailyViewContainer.classList.add('hidden');
        renderFutureWeeklyView(futureStartDate);
        return;
    }

    if (!appState.weeks[appState.viewingIndex]) return;

    renderNavigation();
    renderGoals();
    renderIndicators();
    updateViewButtons();

    if (appState.currentView === 'weekly') {
        weeklyViewContainer.classList.remove('hidden');
        dailyViewContainer.classList.add('hidden');
        renderWeeklyView();
    } else {
        weeklyViewContainer.classList.add('hidden');
        dailyViewContainer.classList.remove('hidden');
        renderDailyView();
    }
    renderProgressTracker();
};

const initializePlannerState = () => {
    loadPlannerData();
    const today = new Date();
    const currentWeekStartDate = getStartOfWeek(today);
    if (appState.weeks.length === 0) {
        for (let i = -CURRENT_WEEK_INDEX; i < MAX_WEEKS_STORED - CURRENT_WEEK_INDEX; i++) {
            const weekStartDate = new Date(currentWeekStartDate);
            weekStartDate.setDate(weekStartDate.getDate() + (i * 7));
            appState.weeks.push(createNewWeek(weekStartDate));
        }
    } else {
        const storedCurrentWeekStart = new Date(appState.weeks[CURRENT_WEEK_INDEX].startDate);
        let weekDiff = Math.round((currentWeekStartDate.getTime() - storedCurrentWeekStart.getTime()) / (1000 * 60 * 60 * 24 * 7));
        if (weekDiff > 0) {
            for (let i = 0; i < weekDiff; i++) {
                const weekToSnapshot = appState.weeks[CURRENT_WEEK_INDEX];
                if (!weekToSnapshot.originalState) {
                    weekToSnapshot.originalState = {
                        weeklyGoals: weekToSnapshot.weeklyGoals,
                        schedule: deepClone(weekToSnapshot.schedule),
                        kpiData: deepClone(weekToSnapshot.kpiData)
                    };
                }
                const lastWeek = appState.weeks[appState.weeks.length - 1];
                const nextWeekStartDate = new Date(lastWeek.startDate); nextWeekStartDate.setDate(nextWeekStartDate.getDate() + 7);
                appState.weeks.push(createNewWeek(nextWeekStartDate)); appState.weeks.shift();
            }
        }
    }
    while(appState.weeks.length > MAX_WEEKS_STORED) appState.weeks.shift();
    loadViewState();
    if(appState.viewingIndex < 0 || appState.viewingIndex >= MAX_WEEKS_STORED) {
        appState.viewingIndex = CURRENT_WEEK_INDEX;
    }
    savePlannerData();
};

// =================================================================================
// --- UNIFIED INITIALIZATION ---
// =================================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("Unified DOMContentLoaded event fired.");

    // --- Initialize Task Manager ---
    try {
        console.log("Initializing Task Manager...");
        initializeDOMElements(); // From Task Manager
        setupEventListeners();   // From Task Manager
        loadData();              // From Task Manager
        console.log("Task Manager initialized.");
    } catch (e) {
        console.error("Error during Task Manager initialization:", e);
        const listDiv = document.getElementById('task-list');
        if(listDiv) listDiv.innerHTML = '<p class="text-red-600 font-bold text-center">Error initializing Task Manager. Please check console.</p>';
    }

    // --- Initialize Pilot Mission Planner ---
    try {
        console.log("Initializing Pilot Mission Planner...");
        initializePlannerState(); // Renamed from initializeOrSyncState
        applyTheme(); // Apply theme after state is initialized
        // setupPlannerEventListeners(); // This is already called in the main setupEventListeners
        renderPlanner(); // Initial render for the planner
        console.log("Pilot Mission Planner initialized.");
    } catch (e) {
        console.error("Error during Pilot Mission Planner initialization:", e);
    }
});
