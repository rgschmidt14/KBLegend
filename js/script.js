import { getDurationMs, calculateStatus, calculateScheduledTimes } from './task-logic.js';
import { taskTemplate, categoryManagerTemplate, taskViewTemplate, notificationManagerTemplate, taskStatsTemplate, actionAreaTemplate, commonButtonsTemplate, statusManagerTemplate, categoryFilterTemplate, iconPickerTemplate, editProgressTemplate, editCategoryTemplate, editStatusNameTemplate, restoreDefaultsConfirmationTemplate, taskGroupHeaderTemplate, bulkEditFormTemplate, dataMigrationModalTemplate, sensitivityControlsTemplate } from './templates.js';
import { Calendar } from 'https://esm.sh/@fullcalendar/core@6.1.19';
import dayGridPlugin from 'https://esm.sh/@fullcalendar/daygrid@6.1.19';
import timeGridPlugin from 'https://esm.sh/@fullcalendar/timegrid@6.1.19';
import interactionPlugin from 'https://esm.sh/@fullcalendar/interaction@6.1.19';
import { Chart, registerables } from 'https://esm.sh/chart.js@4.4.3';
import { startOfWeek, format } from 'https://esm.sh/date-fns@3.6.0';
// =================================================================================
// SCRIPT.JS - COMBINED AND CLEANED
// =================================================================================

Chart.register(...registerables);

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
let theming = { enabled: false, baseColor: '#3b82f6', mode: 'auto', useThemeForStatus: true };
let appSettings = { title: "Task & Mission Planner", use24HourFormat: false };
let calendarSettings = { categoryFilter: [], syncFilter: true, lastView: 'timeGridWeek' };
let lastBulkEditSettings = {};
let oldTasksData = [];
let editingTaskId = null;
let editingCategoryIdForIcon = null;
let kpiChart = null; // For single chart view
let kpiCharts = []; // For stacked chart view
// isSimpleMode is now part of uiSettings
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
let uiSettings = {
    isSimpleMode: true,
    activeView: 'calendar-view', // Default view
    kpiChartMode: 'single', // 'single' or 'stacked'
    kpiChartDateRange: '8d', // '8d', '30d', etc.
    kpiWeekOffset: 0,
};
let sensitivitySettings = { sValue: 0.5, isAdaptive: true };
const STATUS_UPDATE_INTERVAL = 15000;
const MS_PER_SECOND = 1000;

const iconCategories = {
    'General': ['fa-solid fa-star', 'fa-solid fa-heart', 'fa-solid fa-check', 'fa-solid fa-xmark', 'fa-solid fa-flag', 'fa-solid fa-bell', 'fa-solid fa-bolt', 'fa-solid fa-gift', 'fa-solid fa-key', 'fa-solid fa-lightbulb', 'fa-solid fa-moon', 'fa-solid fa-sun'],
    'Productivity': ['fa-solid fa-briefcase', 'fa-solid fa-bullseye', 'fa-solid fa-calendar-days', 'fa-solid fa-clock', 'fa-solid fa-file-signature', 'fa-solid fa-laptop-file', 'fa-solid fa-list-check', 'fa-solid fa-pencil', 'fa-solid fa-book-open', 'fa-solid fa-graduation-cap'],
    'Communication': ['fa-solid fa-at', 'fa-solid fa-envelope', 'fa-solid fa-phone', 'fa-solid fa-comments', 'fa-solid fa-users'],
    'Finance': ['fa-solid fa-dollar-sign', 'fa-solid fa-euro-sign', 'fa-solid fa-pound-sign', 'fa-solid fa-yen-sign', 'fa-solid fa-credit-card', 'fa-solid fa-wallet', 'fa-solid fa-piggy-bank'],
    'Health & Fitness': ['fa-solid fa-heart-pulse', 'fa-solid fa-dumbbell', 'fa-solid fa-person-running', 'fa-solid fa-apple-whole', 'fa-solid fa-pills', 'fa-solid fa-stethoscope'],
    'Travel': ['fa-solid fa-plane', 'fa-solid fa-car', 'fa-solid fa-train', 'fa-solid fa-bus', 'fa-solid fa-ship', 'fa-solid fa-earth-americas', 'fa-solid fa-map-location-dot', 'fa-solid fa-suitcase'],
    'Food & Drink': ['fa-solid fa-utensils', 'fa-solid fa-mug-hot', 'fa-solid fa-martini-glass', 'fa-solid fa-ice-cream', 'fa-solid fa-pizza-slice'],
};

const MS_PER_MINUTE = 60000;
const MS_PER_HOUR = 3600000;
const MS_PER_DAY = 86400000;
const DUE_THRESHOLD_MS = 1000;
const MAX_CYCLE_CALCULATION = 100;

// DOM Element References (Task Manager)
let taskModal, taskForm, taskListDiv, modalTitle, taskIdInput, taskNameInput, taskDescriptionInput, taskIconInput,
    iconPickerModal, dataMigrationModal,
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
    requiresFullAttentionInput, isAppointmentInput,
    taskCategorySelect, newCategoryGroup, newCategoryNameInput,
    advancedOptionsModal,
    sortBySelect, sortDirectionSelect, categoryFilterList,
    plannerDefaultCategorySelect, dayNightToggle;

// DOM Element References (Planner)
let app, weeklyGoalsEl, indicatorListEl, newIndicatorInput, newIndicatorFrequency, addNewKpiBtn,
    calendarEl, // New element for FullCalendar
    progressTrackerContainer, viewBtns, startNewWeekBtn, confirmModal,
    cancelNewWeekBtn, confirmNewWeekBtn, prevWeekBtn, nextWeekBtn, todayBtn,
    weekStatusEl, weekDateRangeEl,
    showTaskManagerBtn, showCalendarBtn, showDashboardBtn, taskManagerView, calendarView, dashboardView,
    taskViewModal, taskViewContent, taskStatsContent, setKpiBtn, kpiTaskSelect;

// FullCalendar instance
let calendar;

// Planner State
const MAX_WEEKS_STORED = 6;
const CURRENT_WEEK_INDEX = 4;
const DATA_KEY = 'pilotPlannerDataV8';
const VIEW_STATE_KEY = 'pilotPlannerViewStateV8';

const appState = {
    weeks: [],
    indicators: [],
    historicalTasks: [],
    viewingIndex: CURRENT_WEEK_INDEX, currentView: 'weekly', currentDayIndex: 0,
};


// =================================================================================
// SECTION 2: Logic & Utility Functions
// =================================================================================
function generateId() { return '_' + Math.random().toString(36).substr(2, 9); }
const pad = (num, length = 2) => String(num).padStart(length, '0');

function formatTime(date) {
    if (!date || isNaN(date)) return 'N/A';
    const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: !appSettings.use24HourFormat };
    return date.toLocaleTimeString('en-US', timeOptions);
}

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
        requiresFullAttention: true,
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
        description: '',
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
        isKpi: false,
        isAppointment: false,
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
    if (theming.enabled) {
        const palette = generateComplementaryPalette(theming.baseColor);
        const accentColors = [palette.accent1, palette.accent2, palette.accent3];
        return accentColors[Math.floor(Math.random() * accentColors.length)];
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
// New helper function to get the luminance of a color
function getLuminance(hexColor) {
    const rgb = parseInt(hexColor.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// New helper function to adjust the lightness of a color
function adjustColor(hex, percent) {
    const f = parseInt(hex.slice(1), 16),
        t = percent < 0 ? 0 : 255,
        p = percent < 0 ? percent * -1 : percent,
        R = f >> 16,
        G = (f >> 8) & 0x00FF,
        B = f & 0x0000FF;
    return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
}

function getContrastingTextColor(hexcolor) {
    if (!hexcolor) {
        // Return a default set of colors if no hex color is provided
        return {
            '--text-color-primary': 'var(--text-color-dark-primary)',
            '--text-color-secondary': 'var(--text-color-dark-secondary)',
            '--text-color-tertiary': 'var(--text-color-dark-tertiary)',
            '--text-color-quaternary': 'var(--text-color-dark-quaternary)',
            '--text-shadow': 'none'
        };
    }

    const luminance = getLuminance(hexcolor);
    const isDark = luminance < 0.5;

    // Define the base colors for light and dark text
    const baseLight = '#FFFFFF';
    const baseDark = '#000000';

    // Determine the primary text color and its opposite for adjustments
    const primaryTextColor = isDark ? baseLight : baseDark;
    const adjustDirection = isDark ? -1 : 1; // -1 for darkening (making it more gray from white), 1 for lightening (making it more gray from black)

    // Generate the 4 shades for the determined text color
    const shades = {
        '--text-color-primary': primaryTextColor,
        '--text-color-secondary': adjustColor(primaryTextColor, adjustDirection * 0.15), // 85%
        '--text-color-tertiary': adjustColor(primaryTextColor, adjustDirection * 0.30), // 70%
        '--text-color-quaternary': adjustColor(primaryTextColor, adjustDirection * 0.45), // 55%
    };

    // Add a text shadow for mid-range colors to improve readability
    const distanceFromMiddle = Math.abs(luminance - 0.5);
    if (distanceFromMiddle < 0.25) { // If the color is in the "danger zone"
        const shadowColor = isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)';
        shades['--text-shadow'] = `0 0 5px ${shadowColor}`;
    } else {
        shades['--text-shadow'] = 'none';
    }

    return shades;
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

function updateAdaptiveSensitivity() {
    if (!sensitivitySettings.isAdaptive) return;

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const taskLoad = tasks.filter(t => {
        if (!t.dueDate || t.completed) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate > now && dueDate <= sevenDaysFromNow;
    }).length;

    const minLoad = 70;
    const maxLoad = 490;

    let calculatedS = (taskLoad - minLoad) / (maxLoad - minLoad);
    // Clamp the value
    const newS = Math.max(0.0, Math.min(1.0, calculatedS));

    if (sensitivitySettings.sValue !== newS) {
        sensitivitySettings.sValue = newS;
        saveData();
    }
}


function getSensitivityParameters() {
    let s = sensitivitySettings.sValue;

    // This calculation is now done in updateAdaptiveSensitivity
    // and the value is stored. We just use it here.

    const yellowWindow = 16 + s * (1176 - 16); // in hours
    const yellowBuffer = 2 + s * (10 - 2);
    const redBuffer = 1 + s * (5 - 1);
    const missRatio = 0.50 - s * (0.50 - 0.10);

    return {
        yellowWindowMs: yellowWindow * MS_PER_HOUR,
        yellowBuffer,
        redBuffer,
        missRatio
    };
}


function getTaskOccurrences(task, viewStartDate, viewEndDate) {
    if (!task.dueDate) return [];

    const durationMs = getDurationMs(task.estimatedDurationAmount, task.estimatedDurationUnit) || 0;

    // We need to search for due dates in a slightly expanded window to catch tasks that start before the view
    const expandedViewStartDate = new Date(viewStartDate.getTime() - (24 * MS_PER_HOUR)); // Look back 24h as a safe buffer

    let dueDatesInExpandedWindow = [];
    const initialDueDate = new Date(task.dueDate);

    if (task.repetitionType === 'none') {
        dueDatesInExpandedWindow.push(initialDueDate);
    } else if (task.repetitionType === 'absolute') {
        // Generate all occurrences in the expanded window
        dueDatesInExpandedWindow = generateAbsoluteOccurrences(task, expandedViewStartDate, viewEndDate);
    } else if (task.repetitionType === 'relative') {
        const intervalMs = getDurationMs(task.repetitionAmount, task.repetitionUnit);
        if (intervalMs > 0) {
            let currentDate = new Date(initialDueDate);
            // Move backward from the initial due date to find the first potential occurrence before our expanded view.
            while (currentDate.getTime() > expandedViewStartDate.getTime()) {
                currentDate = new Date(currentDate.getTime() - intervalMs);
            }
            // Now, `currentDate` is before or at the start of our search window.
            // Move forward and collect all due dates that fall within the search window up to the view's end.
            let i = 0; // Safety break
            while (currentDate.getTime() < viewEndDate.getTime() && i < 500) {
                // We only need to add it if it's after the start of our search window.
                if (currentDate.getTime() >= expandedViewStartDate.getTime()) {
                    dueDatesInExpandedWindow.push(new Date(currentDate));
                }
                currentDate = new Date(currentDate.getTime() + intervalMs);
                i++;
            }
        }
    }

    // Now, map the candidate due dates to occurrence objects { start, due }
    // and filter for the ones that actually overlap with the *original* view window.
    const occurrences = dueDatesInExpandedWindow.map(dueDate => {
        // If the task has a scheduled time, and this is the first occurrence, use it.
        if (task.scheduledStartTime && dueDate.getTime() === new Date(task.dueDate).getTime()) {
            return {
                occurrenceDueDate: new Date(task.scheduledEndTime),
                occurrenceStartDate: new Date(task.scheduledStartTime)
            };
        }
        return {
            occurrenceDueDate: dueDate,
            occurrenceStartDate: new Date(dueDate.getTime() - durationMs)
        };
    }).filter(occ => {
        // Overlap condition: The task's start is before the view's end, AND the task's end is after the view's start.
        return occ.occurrenceStartDate < viewEndDate && occ.occurrenceDueDate > viewStartDate;
    });

    return occurrences;
}

function processTaskHistoryForChart(history) {
    if (!history || history.length === 0) {
        return { labels: [], completions: [], misses: [] };
    }

    const weeklyData = {}; // Key: YYYY-MM-DD of the start of the week

    history.forEach(item => {
        const date = new Date(item.completionDate);
        if (isNaN(date)) return;

        const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
        const weekKey = format(weekStart, 'yyyy-MM-dd');

        if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = { completions: 0, misses: 0 };
        }

        if (item.status === 'completed') {
            weeklyData[weekKey].completions++;
        } else if (item.status === 'missed') {
            weeklyData[weekKey].misses++;
        }
    });

    const sortedWeeks = Object.keys(weeklyData).sort();

    const labels = sortedWeeks;
    const completions = sortedWeeks.map(week => weeklyData[week].completions);
    const misses = sortedWeeks.map(week => weeklyData[week].misses);

    return { labels, completions, misses };
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
    const isDarkMode = theming.mode !== 'light'; // Night or Auto are considered dark

    // Define the gradient stops from dark to light
    const stops = [
        { l: -45, s: 0 },   // Black
        { l: -30, s: 25 },  // Red
        { l: -15, s: 15 },  // Yellow
        { l: 0, s: 0 },     // Green (base)
        { l: 15, s: 10 }    // Blue
    ];

    // If in light mode, reverse the stops to go from light to dark
    if (!isDarkMode) {
        stops.reverse();
    }

    const palette = {
        black:  HSLToHex(baseHSL.h, Math.min(100, baseHSL.s + stops[0].s), Math.max(0, Math.min(100, baseHSL.l + stops[0].l))),
        red:    HSLToHex(baseHSL.h, Math.min(100, baseHSL.s + stops[1].s), Math.max(0, Math.min(100, baseHSL.l + stops[1].l))),
        yellow: HSLToHex(baseHSL.h, Math.min(100, baseHSL.s + stops[2].s), Math.max(0, Math.min(100, baseHSL.l + stops[2].l))),
        green:  HSLToHex(baseHSL.h, Math.min(100, baseHSL.s + stops[3].s), Math.max(0, Math.min(100, baseHSL.l + stops[3].l))),
        blue:   HSLToHex(baseHSL.h, Math.min(100, baseHSL.s + stops[4].s), Math.max(0, Math.min(100, baseHSL.l + stops[4].l))),
    };

    return palette;
}

function generateComplementaryPalette(baseColor) {
    const baseHSL = hexToHSL(baseColor);
    const isDarkMode = theming.mode !== 'light';

    // 1. Main Background Color
    // Adjust lightness based on the base color's lightness and the theme mode
    let mainBgLightness;
    if (isDarkMode) {
        // For dark mode, if the color is light, make it much darker. If it's already dark, make it slightly darker.
        mainBgLightness = baseHSL.l > 50 ? 20 : Math.max(10, baseHSL.l - 10);
    } else {
        // For light mode, ensure the background is always light.
        mainBgLightness = baseHSL.l < 70 ? 95 : Math.min(100, baseHSL.l + 20);
    }
    const main = HSLToHex(baseHSL.h, baseHSL.s * 0.8, mainBgLightness); // Desaturate slightly for background

    // 2. Secondary Color (Main Buttons) - This is now the role of the original 'primary'
    const secondaryLightness = isDarkMode ? Math.max(40, baseHSL.l) : Math.min(60, baseHSL.l);
    const secondary = HSLToHex(baseHSL.h, baseHSL.s, secondaryLightness);

    // 3. Tertiary Color (Accent Buttons)
    // A complementary or triadic color for high contrast
    const tertiaryHue = (baseHSL.h + 150) % 360; // Use a shifted complementary
    const tertiaryLightness = isDarkMode ? Math.max(50, baseHSL.l) : Math.min(55, baseHSL.l);
    const tertiary = HSLToHex(tertiaryHue, Math.min(100, baseHSL.s * 1.1), tertiaryLightness);

    // Accent colors for other things, like new categories
    const accent1 = HSLToHex((baseHSL.h + 60) % 360, baseHSL.s - 10, isDarkMode ? 60 : 40);
    const accent2 = HSLToHex((baseHSL.h + 180) % 360, baseHSL.s - 10, isDarkMode ? 65 : 35);
    const accent3 = HSLToHex((baseHSL.h + 300) % 360, baseHSL.s, isDarkMode ? 55 : 45);

    // 4. Selected/Active Gradient for Main Buttons
    const secondarySelectedLightness = isDarkMode ? secondaryLightness + 10 : secondaryLightness - 10;
    const secondary_highlight = HSLToHex(baseHSL.h, baseHSL.s, Math.max(0, Math.min(100, secondarySelectedLightness)));
    const secondary_selected = `linear-gradient(to bottom, ${secondary}, ${secondary_highlight})`;

    // 5. Gradient for Modal Backgrounds
    const mainGradientLightness2 = isDarkMode ? mainBgLightness + 5 : mainBgLightness - 5;
    const main_gradient_color2 = HSLToHex(baseHSL.h, baseHSL.s * 0.8, Math.max(0, Math.min(100, mainGradientLightness2)));
    const main_gradient = `linear-gradient(180deg, ${main}, ${main_gradient_color2})`;


    return { main, secondary, tertiary, accent1, accent2, accent3, secondary_selected, main_gradient };
}

function applyThemeMode() {
    document.body.classList.remove('light-mode', 'auto-theme');
    if (theming.mode === 'light') {
        document.body.classList.add('light-mode');
    } else if (theming.mode === 'auto') {
        document.body.classList.add('auto-theme');
    }
    // For 'night' mode, no class is needed as it's the default.
}

function setAppTitle(newTitle) {
    if (!newTitle || newTitle.trim() === '') {
        newTitle = "Task & Mission Planner"; // Default title
    }
    appSettings.title = newTitle;
    const headerTitle = document.querySelector('#app header h1');
    if (headerTitle) {
        headerTitle.textContent = newTitle;
    }
    document.title = newTitle;
    saveData();
}

function applyTheme() {
    applyThemeMode(); // Apply day/night/auto mode first

    const root = document.documentElement;

    // Define a function to set CSS variables for text colors
    const setTextTheme = (textStyles) => {
        for (const [key, value] of Object.entries(textStyles)) {
            root.style.setProperty(key, value);
        }
    };

    // Define a function to style buttons, now setting CSS variables
    const styleButton = (btn, bg, palette) => {
        let baseColorForText;
        if (typeof bg === 'string' && bg.includes('gradient')) {
            const match = bg.match(/#([a-fA-F0-9]{6})/);
            baseColorForText = match ? match[0] : '#ffffff';
        } else {
            baseColorForText = bg;
        }

        const textStyles = getContrastingTextColor(baseColorForText);
        // Set button-specific text styles directly on the button for isolation
        for (const [key, value] of Object.entries(textStyles)) {
            btn.style.setProperty(key, value);
        }

        // Set button-specific CSS variables
        btn.style.setProperty('--btn-bg', bg);
        btn.style.setProperty('--btn-text-color', 'var(--text-color-primary)');
        btn.style.setProperty('--btn-text-shadow', 'var(--text-shadow)');

        if (palette) {
            // Use a generic way to calculate hover/active for any given background
            const baseForInteraction = bg.includes('gradient') ? palette.secondary : bg;
            const hsl = hexToHSL(baseForInteraction);
            const hoverBg = HSLToHex(hsl.h, hsl.s, Math.min(100, hsl.l + 10));
            const activeBg = HSLToHex(hsl.h, hsl.s, Math.max(0, hsl.l - 5));

            btn.style.setProperty('--btn-hover-bg', hoverBg);
            btn.style.setProperty('--btn-active-bg', activeBg);
        }
    };

    const unstyleButton = (btn) => {
        btn.style.cssText = ''; // Clear all inline styles
    };

    if (theming.enabled) {
        if (theming.useThemeForStatus) {
            const gradientPalette = generateGradientPalette(theming.baseColor);
            statusColors = gradientPalette;
        } else {
            statusColors = { ...defaultStatusColors };
        }

        const buttonPalette = generateComplementaryPalette(theming.baseColor);
        const { main, secondary, tertiary, secondary_selected, main_gradient } = buttonPalette;

        // Set global background and text colors
        document.body.style.backgroundColor = main;
        const mainTextStyles = getContrastingTextColor(main);
        setTextTheme(mainTextStyles);

        // Apply gradient to calendar background
        const calendarGradient = `linear-gradient(to bottom, ${statusColors.blue}, ${statusColors.green}, ${statusColors.yellow}, ${statusColors.red}, ${statusColors.black})`;
        root.style.setProperty('--calendar-background', calendarGradient);

        // Theme buttons based on their functional color class
        document.querySelectorAll('.themed-button-primary, .themed-button-secondary').forEach(btn => {
            if (btn.classList.contains('themed-button-clear')) {
                unstyleButton(btn);
                return;
            }
            const isActive = btn.classList.contains('active-view-btn');
            let baseColor;
            if (btn.classList.contains('themed-button-primary')) {
                baseColor = secondary;
            } else { // secondary
                baseColor = tertiary;
            }
            // Use the selected gradient for active buttons, otherwise use the base color
            styleButton(btn, isActive ? secondary_selected : baseColor, buttonPalette);
        });
        document.querySelectorAll('.themed-button-tertiary').forEach(btn => {
            if (btn.classList.contains('themed-button-clear')) {
                unstyleButton(btn);
                return;
            }
            styleButton(btn, tertiary, buttonPalette);
        });

        // Theme other elements
        document.querySelectorAll('.themed-modal-primary').forEach(modal => {
            modal.style.background = main_gradient;
        });
        document.querySelectorAll('.themed-modal-tertiary').forEach(modal => {
            modal.style.backgroundColor = tertiary;
        });

        // New: Set the background and text color for the current day in FullCalendar
        const todayBgRgb = hexToRgb(secondary);
        if (todayBgRgb) {
            const headerBg = `rgba(${todayBgRgb.r}, ${todayBgRgb.g}, ${todayBgRgb.b}, 0.4)`;
            const bodyBg = `rgba(${todayBgRgb.r}, ${todayBgRgb.g}, ${todayBgRgb.b}, 0.2)`;
            root.style.setProperty('--fc-today-header-bg', headerBg);
            root.style.setProperty('--fc-today-body-bg', bodyBg);

            // Also set a contrasting text color for the date number
            const todayTextStyles = getContrastingTextColor(secondary);
            root.style.setProperty('--fc-today-text-color', todayTextStyles['--text-color-primary']);
        }

    } else {
        // Revert to default colors based on the current mode
        document.body.style.backgroundColor = ''; // Remove inline style to let CSS classes take over
        root.style.removeProperty('--calendar-background');
        root.style.removeProperty('--fc-today-header-bg');
        root.style.removeProperty('--fc-today-body-bg');
        root.style.removeProperty('--fc-today-text-color');
        statusColors = { ...defaultStatusColors };

        // Set text colors based on the mode, but don't set background here
        if (theming.mode === 'light') {
            setTextTheme({
                '--text-color-primary': 'var(--text-color-light-primary)',
                '--text-color-secondary': 'var(--text-color-light-secondary)',
                '--text-color-tertiary': 'var(--text-color-light-tertiary)',
                '--text-color-quaternary': 'var(--text-color-light-quaternary)',
                '--text-shadow': 'none'
            });
        } else { // night or auto
            setTextTheme({
                '--text-color-primary': 'var(--text-color-dark-primary)',
                '--text-color-secondary': 'var(--text-color-dark-secondary)',
                '--text-color-tertiary': 'var(--text-color-dark-tertiary)',
                '--text-color-quaternary': 'var(--text-color-dark-quaternary)',
                '--text-shadow': 'none'
            });
        }

        // Remove inline styles from all themed buttons to revert to CSS
        document.querySelectorAll('.themed-button-primary, .themed-button-secondary, .themed-button-tertiary').forEach(unstyleButton);
        document.querySelectorAll('.themed-modal-primary, .themed-modal-tertiary').forEach(modal => {
            modal.style.background = '';
            modal.style.backgroundColor = '';
        });
    }
    renderTasks();
    if (calendar) {
        calendar.refetchEvents();
        calendar.updateSize();
    }
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

    const renderTaskItem = (task, groupName) => {
        const taskElement = document.createElement('div');
        const isCompletedNonRepeating = task.repetitionType === 'none' && task.completed;

        taskElement.className = `task-item p-2 rounded-lg shadow flex justify-between items-start`;
        taskElement.dataset.taskId = task.id;
        taskElement.dataset.action = 'viewTask'; // Make the whole card clickable
        taskElement.dataset.status = task.status;
        if (groupName) {
            taskElement.dataset.group = groupName;
        }
        taskElement.dataset.confirming = !!task.confirmationState;

        const statusColor = statusColors[task.status] || statusColors.green;
        taskElement.style.backgroundColor = statusColor;
        const category = categories.find(c => c.id === task.categoryId);
        const categoryColor = category ? category.color : 'transparent';
        taskElement.style.borderLeft = `5px solid ${categoryColor}`;

        // Apply the full suite of text color variables to the task element
        const textStyles = getContrastingTextColor(statusColor);
        for (const [key, value] of Object.entries(textStyles)) {
            taskElement.style.setProperty(key, value);
        }

        if (isCompletedNonRepeating) taskElement.classList.add('task-completed');
        if (task.confirmationState === 'confirming_delete') taskElement.classList.add('task-confirming-delete');

        // The template will now inherit the CSS variables set on taskElement
        taskElement.innerHTML = taskTemplate(task, { categories, taskDisplaySettings, appSettings });

        taskListDiv.appendChild(taskElement);

        const actionArea = taskElement.querySelector(`#action-area-${task.id}`);
        const commonButtonsArea = taskElement.querySelector(`#common-buttons-${task.id}`);
        if (actionArea) actionArea.innerHTML = actionAreaTemplate(task);
        if (commonButtonsArea) commonButtonsArea.innerHTML = commonButtonsTemplate(task);
    };

    if (sortBy === 'dueDate') {
        const groupedByDate = {};
        sortedTasks.forEach(task => {
            const group = getDueDateGroup(task.dueDate);
            if (!groupedByDate[group.index]) {
                groupedByDate[group.index] = { name: group.name, tasks: [] };
            }
            groupedByDate[group.index].tasks.push(task);
        });

        const groupOrder = Object.keys(groupedByDate).sort((a, b) => a - b);
        if (sortDirection === 'desc') groupOrder.reverse();

        groupOrder.forEach((groupIndex, i) => {
            const group = groupedByDate[groupIndex];
            const percent = groupOrder.length <= 1 ? 0 : (sortDirection === 'asc' ? i / (groupOrder.length - 1) : (groupOrder.length - 1 - i) / (groupOrder.length - 1));
            const bgColor = interpolateFiveColors(percent);
            const textStyles = getContrastingTextColor(bgColor);
            const styleString = Object.entries(textStyles).map(([key, value]) => `${key}: ${value};`).join(' ');
            taskListDiv.insertAdjacentHTML('beforeend', taskGroupHeaderTemplate(group.name, bgColor, styleString));
            group.tasks.forEach(task => renderTaskItem(task, group.name));
        });

    } else { // Handles 'status' and 'category' sorting
        let lastGroup = null;
        sortedTasks.forEach(task => {
            let currentGroup = '';
            let groupColor = '#e5e7eb';

            if (sortBy === 'status') {
                currentGroup = statusNames[task.status] || task.status;
                groupColor = statusColors[task.status] || '#e5e7eb';
            } else if (sortBy === 'category') {
                const category = categories.find(c => c.id === task.categoryId);
                currentGroup = category ? category.name : 'Uncategorized';
                groupColor = category ? category.color : '#FFFFFF';
            }

            if (currentGroup !== lastGroup) {
                const textStyles = getContrastingTextColor(groupColor);
                const styleString = Object.entries(textStyles).map(([key, value]) => `${key}: ${value};`).join(' ');
                taskListDiv.insertAdjacentHTML('beforeend', taskGroupHeaderTemplate(currentGroup, groupColor, styleString));
                lastGroup = currentGroup;
            }
            renderTaskItem(task, currentGroup);
        });
    }

    startAllCountdownTimers();
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
function activateModal(modalElement) {
    if (!modalElement) return;
    modalElement.classList.add('active');
    document.body.classList.add('modal-open');
}

function deactivateModal(modalElement) {
    if (!modalElement) return;
    modalElement.classList.remove('active');
    document.body.classList.remove('modal-open');
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
            taskDescriptionInput.value = task.description || '';
            taskIconInput.value = task.icon || '';

            // Set Time Input Type and corresponding date fields
            timeInputTypeSelect.value = task.timeInputType || 'due';
            const dateToUse = options.occurrenceDate || task.dueDate;

            // Always populate the main due date input for simplicity
            taskDueDateInput.value = formatDateForInput(dateToUse);

            // Populate start date if applicable, but visibility is handled later
            if (task.timeInputType === 'start') {
                const durationMs = getDurationMs(task.estimatedDurationAmount, task.estimatedDurationUnit);
                const startDate = new Date(dateToUse.getTime() - durationMs);
                taskStartDateInput.value = formatDateForInput(startDate);
            }

            // Show/hide based on saved values
            startDateGroup.classList.toggle('hidden', task.timeInputType !== 'start');

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
            requiresFullAttentionInput.checked = typeof task.requiresFullAttention === 'boolean' ? task.requiresFullAttention : true;
            isAppointmentInput.checked = typeof task.isAppointment === 'boolean' ? task.isAppointment : false;
            completionTypeSelect.value = task.completionType || 'simple';
            estimatedDurationAmountInput.value = task.estimatedDurationAmount || '';
            estimatedDurationUnitSelect.value = task.estimatedDurationUnit || 'minutes';
            countTargetInput.value = task.countTarget || '';
            timeTargetAmountInput.value = task.timeTargetAmount || '';
            timeTargetUnitSelect.value = task.timeTargetUnit || 'minutes';
            taskCategorySelect.value = task.categoryId || '';
            document.getElementById('is-kpi').checked = task.isKpi || false;

        } else {
            modalTitle.textContent = 'Add New Task';
            taskIdInput.value = '';
            // When adding a new task, we respect the user's saved preference for simple/advanced mode,
            // which is already in uiSettings.isSimpleMode.

            // Set default values for new tasks
            const now = new Date();
            const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
            taskDueDateInput.value = formatDateForInput(oneHourFromNow);

            if (estimatedDurationAmountInput) estimatedDurationAmountInput.value = 1;
            if (estimatedDurationUnitSelect) estimatedDurationUnitSelect.value = 'hours';
        }

        toggleSimpleMode(); // Set the view based on the current uiSettings.isSimpleMode

        // Ensure estimated duration requirement is set based on time input type
        if (estimatedDurationAmountInput) {
            estimatedDurationAmountInput.required = (timeInputTypeSelect.value === 'start');
        }

        toggleCompletionFields(completionTypeSelect.value);
        activateModal(taskModal);
    } catch (e) {
        console.error("Error opening modal:", e);
    }
}
function closeModal() {
    deactivateModal(taskModal);
    editingTaskId = null;
}

function toggleSimpleMode() {
    const advancedFields = document.getElementById('advanced-task-fields');
    const simpleModeToggle = document.getElementById('simple-mode-toggle');

    if (advancedFields && simpleModeToggle) {
        advancedFields.classList.toggle('hidden', uiSettings.isSimpleMode);
        simpleModeToggle.checked = !uiSettings.isSimpleMode;

        // In simple mode, the main due date input is part of the advanced form now, so it's always hidden.
        // In advanced mode, its visibility is controlled by the new updateDateTimeFieldsVisibility function.
        updateDateTimeFieldsVisibility();
    }
}

function updateDateTimeFieldsVisibility() {
    if (!dueDateGroup || !relativeDueDateGroup || !startDateGroup || !dueDateTypeSelect || !timeInputTypeSelect) {
        return;
    }

    const isRelative = dueDateTypeSelect.value === 'relative';
    const isStartInput = timeInputTypeSelect.value === 'start';
    const relativeLabel = document.getElementById('relative-due-date-label');

    // Show relative group only if due date type is relative
    relativeDueDateGroup.classList.toggle('hidden', !isRelative);

    // Show absolute due date group only if type is absolute AND input is 'due'
    dueDateGroup.classList.toggle('hidden', isRelative || isStartInput);

    // Show start date group only if type is 'start' AND type is 'absolute'
    startDateGroup.classList.toggle('hidden', !isStartInput || isRelative);

    // Update the label for the relative time input
    if (relativeLabel) {
        relativeLabel.textContent = isStartInput ? 'Start In:' : 'Due In:';
    }
}


function toggleCompletionFields(type) {
    completionCountGroup.classList.toggle('hidden', type !== 'count');
    completionTimeGroup.classList.toggle('hidden', type !== 'time');
    const isTimeType = type === 'time';
    estimatedDurationGroup.classList.toggle('hidden', isTimeType);

    // If completion type is 'time', the duration is derived from the time target,
    // so the separate estimated duration input is not needed and should not be required.
    if (isTimeType) {
        if (estimatedDurationAmountInput) {
            estimatedDurationAmountInput.required = false;
        }
    } else {
        // Otherwise, the requirement depends on the time input type (due vs start)
        if (estimatedDurationAmountInput && timeInputTypeSelect) {
             estimatedDurationAmountInput.required = (timeInputTypeSelect.value === 'start');
        }
    }
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
    list.innerHTML = categoryManagerTemplate(categories);
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

function renderAppSettings() {
    const titleInput = document.getElementById('app-title-input');
    if (titleInput) {
        titleInput.value = appSettings.title;
    }
    const timeFormatToggle = document.getElementById('time-format-toggle');
    if (timeFormatToggle) {
        timeFormatToggle.checked = appSettings.use24HourFormat;
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
    renderAppSettings();
    renderSensitivityControls();
    activateModal(advancedOptionsModal);
}

function openTaskView(taskId, occurrenceDate) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
        console.error("Task not found for view:", taskId);
        return;
    }

    // Ensure stats content is hidden and view content is visible initially
    taskViewContent.innerHTML = taskViewTemplate(task, { categories, appSettings });
    taskViewContent.classList.remove('hidden');
    taskStatsContent.classList.add('hidden');
    taskStatsContent.innerHTML = ''; // Clear old stats

    // Add event listeners for the buttons inside the view
    const viewStatsBtn = taskViewContent.querySelector('[data-action="viewTaskStats"]');
    const editTaskBtn = taskViewContent.querySelector('[data-action="editTaskFromView"]');

    if (viewStatsBtn) {
        viewStatsBtn.addEventListener('click', () => renderTaskStats(taskId), { once: true });
    }
    if (editTaskBtn) {
        editTaskBtn.addEventListener('click', () => {
            deactivateModal(taskViewModal);
            openModal(taskId, { occurrenceDate });
        });
    }


    activateModal(taskViewModal);
}

function renderTaskStats(taskId) {
    const task = tasks.find(t => t.id === taskId);
    const history = appState.historicalTasks.filter(ht => ht.originalTaskId === taskId).sort((a, b) => new Date(b.completionDate) - new Date(a.completionDate));

    if (!task) return;

    taskViewContent.classList.add('hidden');
    taskStatsContent.classList.remove('hidden');

    const completions = history.filter(h => h.status === 'completed').length;
    const misses = history.filter(h => h.status === 'missed').length;
    const total = completions + misses;
    const stats = {
        completions,
        misses,
        total,
        completionRate: total > 0 ? ((completions / total) * 100).toFixed(1) : 'N/A'
    };

    const historyHtml = history.length > 0
        ? history.map(h => `<li>${new Date(h.completionDate).toLocaleDateString()}: <span class="${h.status === 'completed' ? 'text-green-600' : 'text-red-600'} font-semibold">${h.status}</span></li>`).join('')
        : '<li>No history yet.</li>';

    const chartData = processTaskHistoryForChart(history);
    const hasChartData = chartData.labels.length > 0;

    taskStatsContent.innerHTML = taskStatsTemplate(task, stats, historyHtml, hasChartData);

    if (hasChartData) {
        const ctx = document.getElementById('task-history-chart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'Completions',
                        data: chartData.completions,
                        backgroundColor: 'rgba(34, 197, 94, 0.2)', // green-500 with lower opacity
                        borderColor: 'rgba(22, 163, 74, 1)', // green-600
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1
                    },
                    {
                        label: 'Misses',
                        data: chartData.misses,
                        backgroundColor: 'rgba(220, 38, 38, 0.2)', // red-600 with lower opacity
                        borderColor: 'rgba(185, 28, 28, 1)', // red-700
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1
                    }
                ]
            },
            options: {
                scales: {
                    x: {
                        title: { display: true, text: 'Week Of' }
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Count' },
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    if (indicatorListEl) {
        indicatorListEl.addEventListener('click', e => {
            if (e.target.matches('[data-action="removeKpi"]')) {
                const taskId = e.target.dataset.taskId;
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                    task.isKpi = false;
                    saveData();
                    renderKpiList();
                    renderKpiTaskSelect();
                }
            }
        });
    }


    const backBtn = taskStatsContent.querySelector('[data-action="backToTaskView"]');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            taskStatsContent.innerHTML = ''; // Clear content to destroy chart instance
            taskStatsContent.classList.add('hidden');
            taskViewContent.classList.remove('hidden');
        }, { once: true });
    }
}
function renderCategoryFilters() {
    if (!categoryFilterList) return;
    categoryFilterList.innerHTML = categoryFilterTemplate(categories, categoryFilter);
}

function renderStatusManager() {
    const manager = document.getElementById('status-color-manager');
    if (!manager) return;
    manager.innerHTML = statusManagerTemplate(statusNames, statusColors, defaultStatusNames, theming);
}

function renderNotificationManager() {
    const container = document.getElementById('notification-manager-content');
    if (!container) return;

    // Ensure all categories have a setting. Default to true.
    categories.forEach(cat => {
        if (notificationSettings.categories[cat.id] === undefined) {
            notificationSettings.categories[cat.id] = true;
        }
    });

    container.innerHTML = notificationManagerTemplate(notificationSettings, categories);
}

function renderThemeControls() {
    const themeModeSelector = document.getElementById('theme-mode-selector');
    if (themeModeSelector) {
        themeModeSelector.querySelectorAll('.theme-mode-btn').forEach(btn => {
            btn.classList.remove('active-theme-btn');
            if (btn.dataset.mode === theming.mode) {
                btn.classList.add('active-theme-btn');
            }
        });
    }

    const themeToggle = document.getElementById('theme-enabled-toggle');
    const themeControls = document.getElementById('theme-controls');
    const themeColorPicker = document.getElementById('theme-base-color');

    if (themeToggle) themeToggle.checked = theming.enabled;
    if (themeColorPicker) themeColorPicker.value = theming.baseColor;
    if (themeControls) themeControls.classList.toggle('hidden', !theming.enabled);
}

function renderSensitivityControls() {
    const container = document.getElementById('sensitivity-controls-container');
    if (!container) return;
    container.innerHTML = sensitivityControlsTemplate(sensitivitySettings);
}

function renderKpiTaskSelect() {
    if (!kpiTaskSelect) return;

    const kpiCount = tasks.filter(t => t.isKpi).length;
    const limitReached = kpiCount >= 49;

    // Disable buttons and set tooltip if limit is reached
    if (addNewKpiBtn) {
        addNewKpiBtn.disabled = limitReached;
        addNewKpiBtn.title = limitReached ? 'Delete one of your KPIs before adding another' : 'Add a new task and set it as a KPI';
    }
    if (setKpiBtn) {
        setKpiBtn.disabled = limitReached;
        setKpiBtn.title = limitReached ? 'Delete one of your KPIs before adding another' : 'Set the selected task as a KPI';
    }


    kpiTaskSelect.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Select a task --';
    kpiTaskSelect.appendChild(defaultOption);

    const nonKpiTasks = tasks.filter(task => !task.isKpi);

    const groupedTasks = nonKpiTasks.reduce((acc, task) => {
        const category = categories.find(c => c.id === task.categoryId);
        const categoryName = category ? category.name : 'Uncategorized';
        if (!acc[categoryName]) {
            acc[categoryName] = [];
        }
        acc[categoryName].push(task);
        return acc;
    }, {});

    Object.keys(groupedTasks).sort().forEach(categoryName => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = categoryName;
        groupedTasks[categoryName].sort((a, b) => a.name.localeCompare(b.name)).forEach(task => {
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = task.name;
            optgroup.appendChild(option);
        });
        kpiTaskSelect.appendChild(optgroup);
    });
}

function renderKpiList() {
    const kpiControls = document.getElementById('kpi-controls');
    const kpiChartContainer = document.getElementById('kpi-chart-container');

    if (!kpiControls || !kpiChartContainer) return;

    // 1. Clear previous content and destroy old charts
    kpiControls.innerHTML = '';
    kpiChartContainer.innerHTML = '';
    if (kpiChart) {
        kpiChart.destroy();
        kpiChart = null;
    }
    if (kpiCharts.length > 0) {
        kpiCharts.forEach(chart => chart.destroy());
        kpiCharts = [];
    }

    // 2. Render Controls
    const controlsHtml = `
        <div class="flex items-center space-x-2">
            <label for="kpi-range-select" class="text-sm font-medium text-gray-300">Range:</label>
            <select id="kpi-range-select" class="bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-white focus:ring-blue-500 focus:border-blue-500">
                <option value="8d" ${uiSettings.kpiChartDateRange === '8d' ? 'selected' : ''}>Last 8 Days</option>
                <option value="30d" ${uiSettings.kpiChartDateRange === '30d' ? 'selected' : ''}>Last 30 Days</option>
                <option value="90d" ${uiSettings.kpiChartDateRange === '90d' ? 'selected' : ''}>Last 90 Days</option>
            </select>
        </div>
        <div class="flex items-center space-x-2">
            <label class="text-sm font-medium text-gray-300">View:</label>
            <div class="flex rounded-md bg-gray-700 p-0.5">
                <button data-mode="single" class="kpi-view-toggle-btn px-2 py-0.5 text-sm rounded-md themed-button-secondary ${uiSettings.kpiChartMode === 'single' ? 'active-view-btn' : ''}">Combined</button>
                <button data-mode="stacked" class="kpi-view-toggle-btn px-2 py-0.5 text-sm rounded-md themed-button-secondary ${uiSettings.kpiChartMode === 'stacked' ? 'active-view-btn' : ''}">Stacked</button>
            </div>
        </div>
    `;
    kpiControls.innerHTML = controlsHtml;

    // 3. Add Event Listeners to Controls
    document.getElementById('kpi-range-select').addEventListener('change', (e) => {
        uiSettings.kpiChartDateRange = e.target.value;
        saveData();
        renderKpiList();
    });

    kpiControls.querySelectorAll('.kpi-view-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            uiSettings.kpiChartMode = e.target.dataset.mode;
            saveData();
            renderKpiList();
        });
    });

    // 4. Data Fetching and Processing
    const kpiTasks = tasks.filter(task => task.isKpi);
    if (kpiTasks.length === 0) {
        kpiChartContainer.innerHTML = '<p class="text-gray-500 italic text-center mt-4">No KPIs set. Add a task and mark it as a KPI to see progress here.</p>';
        // Hide controls if there are no KPIs
        kpiControls.classList.add('hidden');
        return;
    }
     kpiControls.classList.remove('hidden');


    const now = new Date();
    // Apply the week offset for viewing different weeks
    if (uiSettings.kpiWeekOffset !== 0) {
        now.setDate(now.getDate() + (uiSettings.kpiWeekOffset * 7));
    }
    now.setHours(23, 59, 59, 999); // End of the target day

    const days = parseInt(uiSettings.kpiChartDateRange.replace('d', ''));
    const startDate = new Date(now.getTime() - (days - 1) * MS_PER_DAY);
    startDate.setHours(0, 0, 0, 0);

    const dateLabels = [];
    for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * MS_PER_DAY);
        dateLabels.push(date.toLocaleDateString('en-CA')); // YYYY-MM-DD format
    }

    const datasets = kpiTasks.map(task => {
        const history = appState.historicalTasks.filter(h =>
            h.originalTaskId === task.id &&
            new Date(h.completionDate) >= startDate &&
            new Date(h.completionDate) <= now
        );

        const dailyData = new Map();
        history.forEach(h => {
            const dateKey = new Date(h.completionDate).toLocaleDateString('en-CA');
            if (!dailyData.has(dateKey)) {
                dailyData.set(dateKey, { completions: 0, misses: 0 });
            }
            if (h.status === 'completed') {
                dailyData.get(dateKey).completions++;
            } else if (h.status === 'missed') {
                dailyData.get(dateKey).misses++;
            }
        });

        const accuracyData = dateLabels.map(label => {
            if (dailyData.has(label)) {
                const { completions, misses } = dailyData.get(label);
                const total = completions + misses;
                return total > 0 ? (completions / total) * 100 : 0;
            }
            return 0; // No data for this day
        });

        const category = categories.find(c => c.id === task.categoryId);
        const color = category ? category.color : '#808080';

        return {
            label: task.name,
            data: accuracyData,
            borderColor: color,
            backgroundColor: `${color}33`, // Add alpha for fill
            fill: false,
            tension: 0.1
        };
    });

    // 5. Chart Rendering
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    callback: value => `${value}%`,
                    color: '#9ca3af'
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                title: {
                    display: true,
                    text: 'Completion Accuracy',
                    color: '#d1d5db'
                }
            },
            x: {
                ticks: {
                    color: '#9ca3af',
                    maxRotation: 45,
                    minRotation: 45
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: '#d1d5db'
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += `${context.parsed.y.toFixed(1)}%`;
                        }
                        return label;
                    }
                }
            }
        }
    };

    if (uiSettings.kpiChartMode === 'single') {
        kpiChartContainer.innerHTML = '<canvas id="kpi-main-chart"></canvas>';
        const ctx = document.getElementById('kpi-main-chart').getContext('2d');
        kpiChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dateLabels.map(d => new Date(d).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})),
                datasets: datasets
            },
            options: chartOptions
        });
    } else { // stacked
        kpiChartContainer.classList.add('space-y-4', 'overflow-y-auto');
        datasets.forEach((dataset, index) => {
            const chartWrapper = document.createElement('div');
            chartWrapper.className = 'h-64'; // Set a fixed height for each small chart
            const canvas = document.createElement('canvas');
            canvas.id = `kpi-chart-${index}`;
            chartWrapper.appendChild(canvas);
            kpiChartContainer.appendChild(chartWrapper);

            const ctx = canvas.getContext('2d');
            const singleChartOptions = JSON.parse(JSON.stringify(chartOptions)); // Deep clone
            singleChartOptions.plugins.legend.display = false; // Hide legend for individual charts
            singleChartOptions.plugins.title = {
                display: true,
                text: dataset.label,
                color: '#d1d5db',
                font: {
                    size: 16
                }
            };


            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dateLabels.map(d => new Date(d).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})),
                    datasets: [dataset]
                },
                options: singleChartOptions
            });
            kpiCharts.push(chart);
        });
    }
}

function renderIconPicker() {
    const content = document.getElementById('icon-picker-content');
    if (!content) return;
    content.innerHTML = iconPickerTemplate(iconCategories);
}

function openIconPicker() {
    renderIconPicker();
    activateModal(iconPickerModal);
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

function handleFormSubmit(event) {
    event.preventDefault();
    try {
        const now = new Date();

        const taskData = {
            name: taskNameInput.value.trim(),
            description: taskDescriptionInput.value.trim(),
            icon: taskIconInput.value.trim(),
            timeInputType: timeInputTypeSelect.value,
            dueDateType: dueDateTypeSelect.value,
            dueDate: null,
            repetitionType: taskRepetitionSelect.value,
            maxMisses: null,
            trackMisses: true,
            requiresFullAttention: requiresFullAttentionInput.checked,
            isAppointment: isAppointmentInput.checked,
            completionType: completionTypeSelect.value,
            currentProgress: 0,
            isTimerRunning: false,
            confirmationState: null,
            overdueStartDate: null,
            pendingCycles: null,
            categoryId: null,
            isKpi: document.getElementById('is-kpi').checked
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
                    taskData.repetitionAbsoluteNthWeekdayOccurrence = Array.from(yearlyOccurrenceCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
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
                color: getRandomColor(),
                icon: null
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
                const sensitivityParams = getSensitivityParameters();
                const newStatus = calculateStatus(updatedTask, now.getTime(), otherTasks, sensitivityParams);
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
            const sensitivityParams = getSensitivityParameters();
            newTask.status = calculateStatus(newTask, now.getTime(), otherTasks, sensitivityParams).name;
            tasks.push(newTask);
        }
        saveData();
        updateAllTaskStatuses(true);
        if (calendar) calendar.refetchEvents();
        renderKpiTaskSelect();
        renderKpiList();
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
        renderKpiTaskSelect();
        renderKpiList();
        if (calendar) calendar.refetchEvents();
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

    let task = tasks[taskIndex];
    const cyclesToComplete = task.pendingCycles || 1;
    const wasOverdue = !!task.overdueStartDate;
    const baseDate = task.overdueStartDate ? new Date(task.overdueStartDate) : (task.dueDate || new Date());

    if (confirmed) {
        stopTaskTimer(taskId);

        if (task.repetitionType !== 'none') {
            // Logic for repeating tasks
            const historicalTask = {
                originalTaskId: task.id, name: task.name, completionDate: new Date(), status: 'completed',
                categoryId: task.categoryId, durationAmount: task.estimatedDurationAmount, durationUnit: task.estimatedDurationUnit,
                progress: 1, // Full completion
                originalDueDate: new Date(baseDate)
            };
            appState.historicalTasks.push(historicalTask);

            const missesBefore = task.misses || 0;
            task.misses = Math.max(0, missesBefore - cyclesToComplete);
            let missCountReduced = task.misses < missesBefore;

            let nextDueDate = null;
            if (task.repetitionType === 'relative') {
                let current = new Date(baseDate);
                for (let i = 0; i < cyclesToComplete; i++) current = calculateFutureDate(task.repetitionAmount, task.repetitionUnit, current);
                nextDueDate = current;
            } else { // absolute
                const futureOccurrences = generateAbsoluteOccurrences(task, new Date(baseDate.getTime() + 1), new Date(baseDate.getFullYear() + 5, 0, 1));
                if (futureOccurrences.length >= cyclesToComplete) nextDueDate = futureOccurrences[cyclesToComplete - 1];
            }

            const sensitivityParams = getSensitivityParameters();
            if (nextDueDate) {
                task.dueDate = nextDueDate;
                task.status = wasOverdue ? calculateStatus(task, Date.now(), tasks, sensitivityParams).name : 'blue';
                task.cycleEndDate = wasOverdue ? null : baseDate;
                task.completionReducedMisses = missCountReduced;
            } else {
                task.status = calculateStatus(task, Date.now(), tasks, sensitivityParams).name;
                delete task.completionReducedMisses;
            }
            task.currentProgress = 0;
            task.completed = false;
            task.confirmationState = null;
            delete task.pendingCycles;
            delete task.overdueStartDate;
            saveData();
            updateAllTaskStatuses(true);

        } else { // Logic for non-repeating tasks
            const historicalTask = {
                originalTaskId: task.id, name: task.name, completionDate: new Date(), status: 'completed',
                categoryId: task.categoryId, durationAmount: task.estimatedDurationAmount, durationUnit: task.estimatedDurationUnit,
                progress: 1,
                originalDueDate: new Date(baseDate)
            };
            appState.historicalTasks.push(historicalTask);
            tasks = tasks.filter(t => t.id !== taskId);
            saveData();
            updateAllTaskStatuses(true);
            return;
        }
    } else { // User clicked "No"
        if (wasOverdue) {
            task.confirmationState = 'awaiting_overdue_input';
        } else {
            task.confirmationState = null;
            const target = (task.completionType === 'count') ? task.countTarget : getDurationMs(task.timeTargetAmount, task.timeTargetUnit);
            if (target && task.currentProgress >= target) {
                task.currentProgress = target - (task.completionType === 'time' ? 1000 : 1);
            }
        }
        delete task.pendingCycles;
        delete task.overdueStartDate;
        // Do not nullify confirmationState here if it was just set
        if (task.confirmationState !== 'awaiting_overdue_input') {
            task.confirmationState = null;
        }
        saveData();
        updateAllTaskStatuses(true);
    }
}
function confirmUndoAction(taskId, confirmed) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    if (confirmed) {
        if (task.status !== 'blue' || task.repetitionType === 'none') return;

        // Find and remove the last completed instance from history
        const lastCompletedIndex = appState.historicalTasks.map(t => t.originalTaskId).lastIndexOf(taskId);
        if (lastCompletedIndex > -1 && appState.historicalTasks[lastCompletedIndex].status === 'completed') {
            appState.historicalTasks.splice(lastCompletedIndex, 1);
        }

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
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    let task = tasks[taskIndex];

    if (confirmed) {
        const totalCycles = task.pendingCycles || 1;
        const inputEl = document.getElementById(`miss-count-input-${taskId}`);
        const missesToApply = (inputEl && totalCycles > 1) ? parseInt(inputEl.value, 10) : totalCycles;
        const completionsToApply = totalCycles - missesToApply;
        const baseDate = task.overdueStartDate ? new Date(task.overdueStartDate) : (task.dueDate || new Date());

        let progress = 0;
        if (task.completionType === 'count' && task.countTarget > 0) {
            progress = (task.currentProgress || 0) / task.countTarget;
        } else if (task.completionType === 'time') {
            const targetMs = getDurationMs(task.timeTargetAmount, task.timeTargetUnit);
            if (targetMs > 0) {
                progress = (task.currentProgress || 0) / targetMs;
            }
        }
        progress = Math.min(1, Math.max(0, progress)); // Clamp between 0 and 1

        if (task.repetitionType !== 'none') {
            // Logic for repeating tasks
            if (missesToApply > 0) {
                const historicalTask = {
                    originalTaskId: task.id, name: task.name, completionDate: new Date(), status: 'missed',
                    categoryId: task.categoryId, durationAmount: task.estimatedDurationAmount, durationUnit: task.estimatedDurationUnit,
                    progress: progress,
                    originalDueDate: new Date(baseDate)
                };
                appState.historicalTasks.push(historicalTask);
            }

            if (completionsToApply > 0) task.misses = Math.max(0, (task.misses || 0) - completionsToApply);
            if (missesToApply > 0 && task.trackMisses) {
                const partialMiss = 1 - progress;
                const missesToAdd = (missesToApply - 1) + partialMiss;

                if(missesToAdd > 0) {
                    task.misses = Math.min(task.maxMisses || Infinity, (task.misses || 0) + missesToAdd);
                }
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
            task.confirmationState = null;
            delete task.pendingCycles;
            delete task.overdueStartDate;
        } else { // Logic for non-repeating tasks
            const historicalTask = {
                originalTaskId: task.id, name: task.name, completionDate: new Date(), status: 'missed',
                categoryId: task.categoryId, durationAmount: task.estimatedDurationAmount, durationUnit: task.estimatedDurationUnit,
                progress: progress,
                originalDueDate: new Date(baseDate)
            };
            appState.historicalTasks.push(historicalTask);
            tasks = tasks.filter(t => t.id !== taskId);
            // Save and render immediately, then exit function.
            saveData();
            updateAllTaskStatuses(true);
            return;
        }
    } else {
        task.confirmationState = 'awaiting_overdue_input';
        delete task.pendingCycles;
        delete task.overdueStartDate;
    }

    task.confirmationState = null;
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

    container.innerHTML = editProgressTemplate(taskId, currentValue, max);
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
    // Filter out tasks that belong to the category being deleted
    tasks = tasks.filter(task => task.categoryId !== categoryId);
    // Filter out the category itself
    categories = categories.filter(cat => cat.id !== categoryId);
    saveData();
    renderCategoryManager();
    renderTasks();
    if (calendar) calendar.refetchEvents();
}
function renderAddCategoryForm() {
    const container = document.getElementById('add-category-form-container');
    if (!container) return;

    container.innerHTML = `
        <div class="flex items-center space-x-2">
            <input type="text" id="new-category-inline-name" placeholder="New Category Name" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white text-black">
            <button data-action="addCategoryFromInline" class="control-button control-button-green themed-button-secondary">Add</button>
        </div>
    `;
    document.getElementById('new-category-inline-name').focus();
}

function addCategoryFromInline() {
    const input = document.getElementById('new-category-inline-name');
    if (!input) return;

    const newCategoryName = input.value.trim();
    if (newCategoryName && !categories.find(c => c.name.toLowerCase() === newCategoryName.toLowerCase())) {
        const newCategory = {
            id: newCategoryName,
            name: newCategoryName,
            color: getRandomColor(),
            icon: null
        };
        categories.push(newCategory);
        saveData();
        renderCategoryManager();
        renderCategoryFilters();
        // Clear the form after adding
        const container = document.getElementById('add-category-form-container');
        if (container) {
            container.innerHTML = '';
        }
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

    displayDiv.innerHTML = editCategoryTemplate(categoryId, category.name);
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

function deleteCategoryTasks(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const tasksToDelete = tasks.filter(task => task.categoryId === categoryId);

    if (tasksToDelete.length === 0) {
        alert(`There are no tasks in the "${category.name}" category to delete.`);
        return;
    }

    if (confirm(`Are you sure you want to delete all ${tasksToDelete.length} task(s) in the "${category.name}" category? This action cannot be undone.`)) {
        const idsToDelete = tasksToDelete.map(t => t.id);
        tasks = tasks.filter(task => !idsToDelete.includes(task.id));
        saveData();
        renderTasks();
        if (calendar) calendar.refetchEvents();
        alert('All tasks in the category have been deleted.');
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
    displayDiv.innerHTML = editStatusNameTemplate(statusKey, status);
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

function handleBulkEditSubmit(categoryId, form) {
    const formData = new FormData(form);
    const updates = {};
    const durationAmount = formData.get('durationAmount');
    if (durationAmount) {
        updates.estimatedDurationAmount = parseInt(durationAmount, 10);
        updates.estimatedDurationUnit = formData.get('durationUnit');
    }
    const completionType = formData.get('completionType');
    if (completionType) {
        updates.completionType = completionType;
    }

    if (Object.keys(updates).length === 0) {
        alert("No changes specified. Please fill out at least one field to apply changes.");
        return;
    }

    let updatedCount = 0;
    tasks.forEach(task => {
        if (task.categoryId === categoryId) {
            Object.assign(task, updates);
            updatedCount++;
        }
    });

    // Save the settings for next time
    lastBulkEditSettings = {
        durationAmount: formData.get('durationAmount'),
        durationUnit: formData.get('durationUnit'),
        completionType: formData.get('completionType'),
    };

    saveData();
    updateAllTaskStatuses(true);
    if (calendar) calendar.refetchEvents();

    alert(`${updatedCount} task(s) in the category have been updated.`);
    const container = document.getElementById(`bulk-edit-container-${categoryId}`);
    if(container) {
        container.innerHTML = '';
        container.classList.add('hidden');
    }
}


function triggerRestoreDefaults() {
    const container = document.getElementById('restore-defaults-container');
    if (container) {
        container.innerHTML = restoreDefaultsConfirmationTemplate();
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

// --- Data Migration Tool Functions ---

function analyzeAndPrepareMigrationModal() {
    const historyAnalysisSection = document.getElementById('history-analysis-section');
    const historyIssuesSummary = document.getElementById('history-issues-summary');
    if (!historyAnalysisSection || !historyIssuesSummary) return;

    const taskIds = new Set(tasks.map(t => t.id));
    const orphanedHistory = appState.historicalTasks.filter(h => h.originalTaskId && !taskIds.has(h.originalTaskId));

    if (orphanedHistory.length > 0) {
        historyIssuesSummary.textContent = `Found ${orphanedHistory.length} orphaned history record(s). These are records from tasks that no longer exist.`;
        historyAnalysisSection.classList.remove('hidden');
    } else {
        historyAnalysisSection.classList.add('hidden');
    }
}

function cleanHistoryAction() {
    if (confirm("Are you sure you want to remove all orphaned history records? This cannot be undone.")) {
        const taskIds = new Set(tasks.map(t => t.id));
        const originalCount = appState.historicalTasks.length;
        appState.historicalTasks = appState.historicalTasks.filter(h => h.originalTaskId && taskIds.has(h.originalTaskId));
        const removedCount = originalCount - appState.historicalTasks.length;
        saveData();
        analyzeAndPrepareMigrationModal(); // Re-run analysis to update the UI
        alert(`${removedCount} orphaned history record(s) have been cleaned.`);
    }
}

function openDataMigrationModal(tasksData = null) {
    if (!dataMigrationModal) return;
    dataMigrationModal.innerHTML = dataMigrationModalTemplate();

    // Add event listeners for the new modal
    const closeButton = dataMigrationModal.querySelector('.close-button');
    if (closeButton) {
        closeButton.addEventListener('click', () => deactivateModal(dataMigrationModal));
    }
    const fileInput = document.getElementById('migration-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleMigrationFileSelect);
    }
    const cleanHistoryBtn = document.getElementById('clean-history-btn');
    if (cleanHistoryBtn) {
        cleanHistoryBtn.addEventListener('click', cleanHistoryAction);
    }

    // Step 2 buttons
    const cancelBtn = document.getElementById('cancel-migration-btn');
    if(cancelBtn) {
        cancelBtn.addEventListener('click', () => deactivateModal(dataMigrationModal));
    }
    const runBtn = document.getElementById('run-migration-btn');
    if(runBtn) {
        runBtn.addEventListener('click', runMigration);
    }

    // Step 3 (Confirm) buttons
    const cancelConfirmBtn = document.getElementById('cancel-confirm-btn');
    if (cancelConfirmBtn) {
        cancelConfirmBtn.addEventListener('click', () => deactivateModal(dataMigrationModal));
    }
    const runConfirmBtn = document.getElementById('run-confirm-btn');
    if (runConfirmBtn) {
        runConfirmBtn.addEventListener('click', runMigration);
    }

    analyzeAndPrepareMigrationModal();

    if (tasksData) {
        prepareMigrationUI(tasksData);
        const step1Prompt = dataMigrationModal.querySelector('#migration-step-1 p');
        if (step1Prompt) {
            step1Prompt.textContent = 'Outdated task format detected. Please map your old task fields to the new format below to continue.';
        }
    }

    activateModal(dataMigrationModal);
}

function prepareMigrationUI(data) {
    try {
        if (!Array.isArray(data) || data.length === 0) {
            alert('Error: The provided data is not a valid array of tasks.');
            return;
        }
        oldTasksData = data; // Store the raw data
        const oldTaskFields = new Set(Object.keys(data[0] || {}));
        const newTaskFields = Object.keys(sanitizeAndUpgradeTask({ id: 'test' }));
        const newTaskFieldsLower = new Set(newTaskFields.map(f => f.toLowerCase()));

        const differences = [];
        const identicals = [];

        // Find identical fields and old fields that don't match
        oldTaskFields.forEach(oldField => {
            const oldFieldLower = oldField.toLowerCase();
            if (newTaskFieldsLower.has(oldFieldLower)) {
                const newField = newTaskFields.find(f => f.toLowerCase() === oldFieldLower);
                identicals.push({ oldField, newField });
            } else {
                differences.push({ oldField, newField: null, type: 'unmapped' });
            }
        });

        // Find new fields that weren't in the old data
        const mappedOldFieldsLower = new Set(identicals.map(i => i.oldField.toLowerCase()));
        newTaskFields.forEach(newField => {
            if (!mappedOldFieldsLower.has(newField.toLowerCase())) {
                const isPresentInOld = Array.from(oldTaskFields).some(oldField => oldField.toLowerCase() === newField.toLowerCase());
                if (!isPresentInOld) {
                     differences.push({ oldField: null, newField, type: 'new' });
                }
            }
        });

        if (differences.length === 0) {
            document.getElementById('migration-step-1').classList.add('hidden');
            document.getElementById('migration-step-2').classList.add('hidden');
            const confirmStep = document.getElementById('migration-step-confirm');
            confirmStep.classList.remove('hidden');
            const confirmMessage = document.getElementById('migration-confirm-message');
            confirmMessage.textContent = 'All task fields match perfectly. Confirm to proceed with migration.';
        } else {
            const summaryEl = document.getElementById('migration-summary');
            summaryEl.textContent = `Found ${identicals.length} identical fields (auto-mapped) and ${differences.length} differences that need your attention.`;

            const differencesArea = document.getElementById('migration-differences-area');
            differencesArea.innerHTML = '';
            const identicalArea = document.getElementById('migration-identical-area');
            identicalArea.innerHTML = '';

            differences.forEach(({ oldField, newField, type }) => {
                const row = document.createElement('div');
                row.className = 'grid grid-cols-2 gap-4 items-center';
                let label = '';
                if (type === 'unmapped') {
                    label = `<label class="text-right font-medium text-yellow-800">Old Field: ${oldField}</label>`;
                } else { // 'new'
                    label = `<label class="text-right font-medium text-green-800">New Field: ${newField}</label>`;
                }

                const select = document.createElement('select');
                select.className = 'w-full p-1 border rounded';
                select.dataset.oldField = oldField || '';
                select.dataset.newField = newField || '';

                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = '-- Ignore this field --';
                select.appendChild(defaultOption);

                newTaskFields.forEach(nf => {
                    const option = document.createElement('option');
                    option.value = nf;
                    option.textContent = nf;
                    // Pre-select if it's a new field
                    if (type === 'new' && nf === newField) {
                         option.selected = true;
                    }
                    select.appendChild(option);
                });
                row.innerHTML = label;
                row.appendChild(select);
                differencesArea.appendChild(row);
            });

            identicals.forEach(({ oldField, newField }) => {
                const row = document.createElement('div');
                row.className = 'grid grid-cols-2 gap-4 items-center';
                row.innerHTML = `
                    <label class="text-right font-medium">${oldField}:</label>
                    <input type="text" value="${newField}" disabled class="w-full p-1 border rounded bg-gray-200">
                `;
                row.dataset.oldField = oldField;
                row.dataset.newField = newField;
                identicalArea.appendChild(row);
            });

            document.getElementById('migration-step-1').classList.add('hidden');
            document.getElementById('migration-step-2').classList.remove('hidden');
            document.getElementById('migration-step-confirm').classList.add('hidden');
        }
    } catch (error) {
        alert('An error occurred while preparing the migration interface.');
        console.error("Migration UI preparation error:", error);
    }
}

function handleMigrationFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            prepareMigrationUI(data);
        } catch (error) {
            alert('Error parsing JSON file. Please ensure it is a valid JSON file.');
            console.error("Migration file parse error:", error);
        }
    };
    reader.readAsText(file);
}

function runMigration() {
    if (oldTasksData.length === 0) {
        alert("No data to migrate.");
        return;
    }

    const fieldMapping = {};

    // Get mappings from the differences area (user-selected)
    const differenceSelectors = document.querySelectorAll('#migration-differences-area select');
    differenceSelectors.forEach(select => {
        const oldField = select.dataset.oldField;
        const newField = select.value;
        if (oldField && newField) { // Only map if there was an old field and a new one is selected
            fieldMapping[oldField] = newField;
        }
    });

    // Get mappings from the identicals area (pre-approved)
    const identicalRows = document.querySelectorAll('#migration-identical-area > div');
    identicalRows.forEach(row => {
        if (row.dataset.oldField && row.dataset.newField) {
            fieldMapping[row.dataset.oldField] = row.dataset.newField;
        }
    });

    const newTasks = oldTasksData.map(oldTask => {
        let newTask = { id: generateId(), createdAt: new Date() };
        for (const oldField in fieldMapping) {
            const newField = fieldMapping[oldField];
            if (oldTask.hasOwnProperty(oldField)) {
                // Basic type coercion for dates
                if (newField.toLowerCase().includes('date') && typeof oldTask[oldField] === 'string') {
                    const parsedDate = new Date(oldTask[oldField]);
                    if (!isNaN(parsedDate)) {
                        newTask[newField] = parsedDate;
                    }
                } else {
                    newTask[newField] = oldTask[oldField];
                }
            }
        }
        return sanitizeAndUpgradeTask(newTask);
    });

    // Merge with existing tasks, avoiding duplicates by checking a property like 'name'
    const existingTaskNames = new Set(tasks.map(t => t.name));
    const tasksToAdd = newTasks.filter(nt => !existingTaskNames.has(nt.name));

    tasks.push(...tasksToAdd);
    saveData();
    updateAllTaskStatuses(true);
    if (calendar) calendar.refetchEvents();

    alert(`Migration complete! ${tasksToAdd.length} new tasks were added. The page will now reload.`);
    deactivateModal(dataMigrationModal);
    location.reload();
}


// --- Data Portability Functions ---

function exportData(exportType) {
    const dataToExport = {
        exportFormatVersion: '1.0',
        exportDate: new Date().toISOString(),
        dataType: exportType,
        data: {}
    };

    const allSettings = {
        statusColors, statusNames, sortBy, sortDirection, notificationSettings, theming,
        calendarSettings, categoryFilter, plannerSettings, taskDisplaySettings, appSettings,
        uiSettings, sensitivitySettings
    };

    switch (exportType) {
        case 'all':
            dataToExport.data = {
                tasks,
                categories,
                appState,
                settings: allSettings
            };
            break;
        case 'tasks':
            const taskCategoryIds = new Set(tasks.map(t => t.categoryId).filter(id => id));
            const relevantCategories = categories.filter(c => taskCategoryIds.has(c.id));
            dataToExport.data = { tasks, categories: relevantCategories };
            break;
        case 'categories':
            dataToExport.data = { categories };
            break;
        case 'history':
            dataToExport.data = { appState: { historicalTasks: appState.historicalTasks } };
            break;
        case 'settings':
            dataToExport.data = { settings: allSettings };
            break;
        default:
            console.error("Unknown export type:", exportType);
            return;
    }

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.download = `task-planner-backup-${exportType}-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}


function importData() {
    const fileInput = document.getElementById('import-file-input');
    fileInput.click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);

            if (!importedData.exportFormatVersion || !importedData.dataType || !importedData.data) {
                alert('Error: Invalid or corrupted backup file.');
                return;
            }

            const importMode = prompt("Choose import mode: 'overwrite' to replace all existing data, or 'merge' to add new tasks and categories.", "merge");

            if (!importMode) {
                event.target.value = '';
                return; // User cancelled the prompt
            }

            if (importMode.toLowerCase() === 'overwrite') {
                if (!confirm('This will overwrite existing data. Are you sure you want to continue?')) {
                    event.target.value = '';
                    return;
                }
                 const importContent = importedData.data;

                if (importedData.dataType === 'all') {
                    if(importContent.tasks) localStorage.setItem('tasks', JSON.stringify(importContent.tasks));
                    if(importContent.categories) localStorage.setItem('categories', JSON.stringify(importContent.categories));
                    if(importContent.appState) localStorage.setItem(DATA_KEY, JSON.stringify(importContent.appState));
                    if(importContent.settings) {
                        Object.keys(importContent.settings).forEach(key => {
                            localStorage.setItem(key, JSON.stringify(importContent.settings[key]));
                        });
                    }
                } else if (importedData.dataType === 'tasks' && importContent.tasks) {
                    let existingCategories = JSON.parse(localStorage.getItem('categories') || '[]');
                    if (importContent.categories && Array.isArray(importContent.categories)) {
                        importContent.categories.forEach(importedCat => {
                            const existingIndex = existingCategories.findIndex(c => c.id === importedCat.id);
                            if (existingIndex > -1) {
                                existingCategories[existingIndex] = importedCat;
                            } else {
                                existingCategories.push(importedCat);
                            }
                        });
                    }
                    localStorage.setItem('categories', JSON.stringify(existingCategories));
                    localStorage.setItem('tasks', JSON.stringify(importContent.tasks));
                } else if (importedData.dataType === 'categories' && importContent.categories) {
                     localStorage.setItem('categories', JSON.stringify(importContent.categories));
                } else if (importedData.dataType === 'history' && importContent.appState) {
                    const existingPlannerData = JSON.parse(localStorage.getItem(DATA_KEY)) || {};
                    existingPlannerData.historicalTasks = importContent.appState.historicalTasks;
                    localStorage.setItem(DATA_KEY, JSON.stringify(existingPlannerData));
                } else if (importedData.dataType === 'settings' && importContent.settings) {
                     Object.keys(importContent.settings).forEach(key => {
                        localStorage.setItem(key, JSON.stringify(importContent.settings[key]));
                    });
                } else {
                    alert('Error: The data type in the file is not recognized or data is missing.');
                    return;
                }
            } else if (importMode.toLowerCase() === 'merge') {
                const importContent = importedData.data;

                const merge = (existing, incoming, idKey) => {
                    const existingIds = new Set(existing.map(item => item[idKey]));
                    incoming.forEach(item => {
                        if (!existingIds.has(item[idKey])) {
                            existing.push(item);
                        }
                    });
                    return existing;
                };

                if (importedData.dataType === 'all') {
                    if (importContent.tasks) {
                        let existingTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
                        localStorage.setItem('tasks', JSON.stringify(merge(existingTasks, importContent.tasks, 'id')));
                    }
                    if (importContent.categories) {
                        let existingCategories = JSON.parse(localStorage.getItem('categories') || '[]');
                        localStorage.setItem('categories', JSON.stringify(merge(existingCategories, importContent.categories, 'id')));
                    }
                } else if (importedData.dataType === 'tasks' && importContent.tasks) {
                     if (importContent.categories) {
                        let existingCategories = JSON.parse(localStorage.getItem('categories') || '[]');
                        localStorage.setItem('categories', JSON.stringify(merge(existingCategories, importContent.categories, 'id')));
                    }
                    let existingTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
                    localStorage.setItem('tasks', JSON.stringify(merge(existingTasks, importContent.tasks, 'id')));
                } else if (importedData.dataType === 'categories' && importContent.categories) {
                    let existingCategories = JSON.parse(localStorage.getItem('categories') || '[]');
                    localStorage.setItem('categories', JSON.stringify(merge(existingCategories, importContent.categories, 'id')));
                }

                alert('Merge successful! The application will now reload.');
                location.reload();

            } else {
                alert("Invalid import mode. Please choose 'overwrite' or 'merge'.");
                event.target.value = '';
                return;
            }

        } catch (error) {
            console.error('Error importing data:', error);
            alert('Error: Could not parse the file. Please ensure it is a valid JSON backup file.');
        } finally {
            // Reset the file input so the user can import the same file again if needed
            event.target.value = '';
        }
    };
    reader.readAsText(file);
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
    taskDescriptionInput = document.getElementById('task-description');
    taskIconInput = document.getElementById('task-icon');
    iconPickerModal = document.getElementById('icon-picker-modal');
    dataMigrationModal = document.getElementById('data-migration-modal');
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
    requiresFullAttentionInput = document.getElementById('requires-full-attention');
    isAppointmentInput = document.getElementById('is-appointment');
    taskCategorySelect = document.getElementById('task-category');
    newCategoryGroup = document.getElementById('new-category-group');
    newCategoryNameInput = document.getElementById('new-category-name');
    advancedOptionsModal = document.getElementById('advanced-options-modal');
    sortBySelect = document.getElementById('sort-by');
    sortDirectionSelect = document.getElementById('sort-direction');
    categoryFilterList = document.getElementById('category-filter-list');
    plannerDefaultCategorySelect = document.getElementById('planner-default-category');
    dayNightToggle = document.getElementById('day-night-toggle');
    taskViewModal = document.getElementById('task-view-modal');
    taskViewContent = document.getElementById('task-view-content');
    taskStatsContent = document.getElementById('task-stats-content');

    // Pilot Planner
    app = document.getElementById('app');
    weeklyGoalsEl = document.getElementById('weeklyGoals');
    indicatorListEl = document.getElementById('indicatorList');
    addNewKpiBtn = document.getElementById('add-new-kpi-btn');
    setKpiBtn = document.getElementById('set-kpi-btn');
    kpiTaskSelect = document.getElementById('kpi-task-select');
    calendarEl = document.getElementById('calendar');
    progressTrackerContainer = document.getElementById('progressTrackerContainer');
    viewBtns = document.querySelectorAll('.view-btn');
    startNewWeekBtn = document.getElementById('startNewWeekBtn');
    confirmModal = document.getElementById('confirmModal');
    cancelNewWeekBtn = document.getElementById('cancelNewWeek');
    confirmNewWeekBtn = document.getElementById('confirmNewWeek');
    prevWeekBtn = document.getElementById('prevWeekBtn');
    nextWeekBtn = document.getElementById('nextWeekBtn');
    todayBtn = document.getElementById('todayBtn');
    weekStatusEl = document.getElementById('weekStatus');
    weekDateRangeEl = document.getElementById('weekDateRange');

    // View-switching elements
    showTaskManagerBtn = document.getElementById('show-task-manager-btn');
    showCalendarBtn = document.getElementById('show-calendar-btn');
    showDashboardBtn = document.getElementById('show-dashboard-btn');
    taskManagerView = document.getElementById('task-manager-view');
    calendarView = document.getElementById('calendar-view');
    dashboardView = document.getElementById('dashboard-view');
}
function setupEventListeners() {
    // Task Manager
    const addTaskBtn = document.getElementById('add-task-btn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => openModal());
    }
    const advancedOptionsBtn = document.getElementById('advanced-options-btn');
    if(advancedOptionsBtn) {
        advancedOptionsBtn.addEventListener('click', openAdvancedOptionsModal);
    }
    const advancedOptionsBtnMain = document.getElementById('advancedOptionsBtnMain');
    if(advancedOptionsBtnMain) {
        advancedOptionsBtnMain.addEventListener('click', openAdvancedOptionsModal);
    }
    const advOptionsCloseButton = advancedOptionsModal.querySelector('.close-button');
    if(advOptionsCloseButton) {
        advOptionsCloseButton.addEventListener('click', () => {
            deactivateModal(advancedOptionsModal);
        });
    }

    const taskViewCloseButton = taskViewModal.querySelector('.close-button');
    if (taskViewCloseButton) {
        taskViewCloseButton.addEventListener('click', () => deactivateModal(taskViewModal));
    }

    if (taskForm) {
        taskForm.addEventListener('submit', handleFormSubmit);
    }

    const closeButton = taskModal.querySelector('.close-button');
    const cancelButton = taskModal.querySelector('.cancel-task-button');
    if (closeButton) closeButton.addEventListener('click', closeModal);
    if (cancelButton) cancelButton.addEventListener('click', closeModal);

    const simpleModeToggle = document.getElementById('simple-mode-toggle');
    if (simpleModeToggle) {
        simpleModeToggle.addEventListener('change', (e) => {
            uiSettings.isSimpleMode = !e.target.checked;
            toggleSimpleMode();
            saveData();
        });
    }

    const openIconPickerBtn = document.getElementById('open-icon-picker');
    if (openIconPickerBtn) {
        openIconPickerBtn.addEventListener('click', openIconPicker);
    }

    if (iconPickerModal) {
        const closeBtn = iconPickerModal.querySelector('.close-button');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => deactivateModal(iconPickerModal));
        }

        const content = document.getElementById('icon-picker-content');
        content.addEventListener('click', (e) => {
            // Handle category header clicks for accordion behavior
            const header = e.target.closest('.icon-picker-category-header');
            if (header) {
                const grid = header.nextElementSibling;
                const icon = header.querySelector('span');
                grid.classList.toggle('hidden');
                icon.style.transform = grid.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
                return;
            }

            // Handle icon selection
            const iconWrapper = e.target.closest('[data-icon]');
            if (iconWrapper) {
                const iconClass = iconWrapper.dataset.icon;
                if (editingCategoryIdForIcon) {
                    const category = categories.find(c => c.id === editingCategoryIdForIcon);
                    if (category) {
                        category.icon = iconClass;
                        saveData();
                        renderCategoryManager();
                    }
                    editingCategoryIdForIcon = null;
                } else if (taskIconInput) {
                    taskIconInput.value = iconClass;
                }
                deactivateModal(iconPickerModal);
            }
        });
    }

    timeInputTypeSelect.addEventListener('change', (e) => {
        updateDateTimeFieldsVisibility();
        if (estimatedDurationAmountInput) {
            estimatedDurationAmountInput.required = (e.target.value === 'start');
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
        updateDateTimeFieldsVisibility();
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
        if (event.target === taskModal) {
            closeModal();
        }
        if (event.target === advancedOptionsModal) {
            deactivateModal(advancedOptionsModal);
        }
    });
    taskListDiv.addEventListener('click', (event) => {
        const collapsibleHeader = event.target.closest('.collapsible-header');
        if (collapsibleHeader) {
            const group = collapsibleHeader.dataset.group;
            const tasksToToggle = taskListDiv.querySelectorAll(`.task-item[data-group="${group}"]`);
            const icon = collapsibleHeader.querySelector('span');
            collapsibleHeader.classList.toggle('collapsed');
            if (collapsibleHeader.classList.contains('collapsed')) {
                icon.style.transform = 'rotate(-90deg)';
                tasksToToggle.forEach(t => t.style.display = 'none');
            } else {
                icon.style.transform = 'rotate(0deg)';
                tasksToToggle.forEach(t => t.style.display = 'flex');
            }
            return;
        }

        const taskItem = event.target.closest('.task-item');
        if (!taskItem) return;

        const actionTarget = event.target.closest('[data-action]');
        const taskId = taskItem.dataset.taskId;

        if (!actionTarget || actionTarget.dataset.action === 'viewTask') {
            // If the click is on the task item itself but not on a button, or it's explicitly the view action
             if (!event.target.closest('button, a, input, .edit-progress-button')) {
                openTaskView(taskId);
                return;
            }
        }

        // If an action button was clicked, handle it
        if (actionTarget) {
            const action = actionTarget.dataset.action;
            const taskIdForAction = actionTarget.dataset.taskId; // Use the taskId from the button
            switch (action) {
                case 'edit':
                    editTask(taskIdForAction);
                    break;
                case 'triggerDelete':
                    triggerDelete(taskIdForAction);
                    break;
                case 'triggerCompletion':
                    triggerCompletion(taskIdForAction);
                    break;
                case 'confirmCompletion':
                    confirmCompletionAction(taskIdForAction, actionTarget.dataset.confirmed === 'true');
                    break;
                case 'handleOverdue':
                    handleOverdueChoice(taskIdForAction, actionTarget.dataset.choice);
                    break;
                case 'confirmMiss':
                    confirmMissAction(taskIdForAction, actionTarget.dataset.confirmed === 'true');
                    break;
                case 'confirmDelete':
                    confirmDeleteAction(taskIdForAction, actionTarget.dataset.confirmed === 'true');
                    break;
                case 'triggerUndo':
                    triggerUndoConfirmation(taskIdForAction);
                    break;
                case 'confirmUndo':
                    confirmUndoAction(taskIdForAction, actionTarget.dataset.confirmed === 'true');
                    break;
                case 'incrementCount':
                    incrementCount(taskIdForAction);
                    break;
                case 'decrementCount':
                    decrementCount(taskIdForAction);
                    break;
                case 'toggleTimer':
                    toggleTimer(taskIdForAction);
                    break;
                case 'editProgress':
                    editProgress(taskIdForAction);
                    break;
                case 'saveProgress':
                    saveProgressEdit(taskIdForAction);
                    break;
                case 'cancelProgress':
                    cancelProgressEdit(taskIdForAction);
                    break;
            }
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
                case 'toggleStatusTheme':
                    theming.useThemeForStatus = !theming.useThemeForStatus;
                    applyTheme();
                    renderStatusManager(); // Re-render to update disabled state
                    saveData();
                    break;
                case 'setCategoryIcon':
                    editingCategoryIdForIcon = categoryId;
                    openIconPicker();
                    break;
                case 'toggleAdaptiveSensitivity':
                    sensitivitySettings.isAdaptive = event.target.checked;
                    if (sensitivitySettings.isAdaptive) {
                        updateAdaptiveSensitivity(); // Recalculate S immediately
                    }
                    saveData();
                    renderSensitivityControls();
                    updateAllTaskStatuses(true); // Force a re-render of tasks with new settings
                    break;
                case 'bulkEdit':
                    const container = document.getElementById(`bulk-edit-container-${categoryId}`);
                    if (container) {
                        const isHidden = container.classList.contains('hidden');
                        document.querySelectorAll('[id^="bulk-edit-container-"]').forEach(c => c.classList.add('hidden'));

                        if (isHidden) {
                            container.innerHTML = bulkEditFormTemplate(categoryId, lastBulkEditSettings);
                            container.classList.remove('hidden');
                            const form = document.getElementById(`bulk-edit-form-${categoryId}`);
                            form.addEventListener('submit', (e) => {
                                e.preventDefault();
                                handleBulkEditSubmit(categoryId, form);
                            });
                        }
                    }
                    break;
                case 'deleteAllInCategory':
                     if (confirm(`Are you sure you want to permanently delete all tasks in this category? This cannot be undone.`)) {
                        tasks = tasks.filter(t => t.categoryId !== categoryId);
                        saveData();
                        renderTasks();
                        if (calendar) calendar.refetchEvents();
                        alert('All tasks in the category have been deleted.');
                    }
                    break;
                case 'deleteCategory':
                    if (confirm("Are you sure you want to delete this category and ALL of its associated tasks? The history for these tasks will NOT be deleted. This action cannot be undone.")) {
                        deleteCategory(categoryId);
                    }
                    break;
                case 'deleteCategoryTasks': deleteCategoryTasks(categoryId); break;
                case 'renderCategoryAdd': renderAddCategoryForm(); break;
                case 'addCategoryFromInline': addCategoryFromInline(); break;
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
                case 'toggleTimeFormat':
                    appSettings.use24HourFormat = event.target.checked;
                    saveData();
                    renderTasks();
                    if (calendar) calendar.refetchEvents();
                    break;
                case 'exportData':
                    exportData(target.dataset.exportType);
                    break;
                case 'importData':
                    importData();
                    break;
                case 'openMigrationTool':
                    openDataMigrationModal();
                    break;
            }
        });

        const importFileInput = document.getElementById('import-file-input');
        if (importFileInput) {
            importFileInput.addEventListener('change', handleFileImport);
        }

        const themeModeSelector = document.getElementById('theme-mode-selector');
        if (themeModeSelector) {
            themeModeSelector.addEventListener('click', (event) => {
                const target = event.target.closest('.theme-mode-btn');
                if (!target) return;
                const mode = target.dataset.mode;
                if (mode) {
                    theming.mode = mode;
                    applyTheme();
                    renderThemeControls();
                    saveData();
                }
            });
        }
        advancedOptionsContent.addEventListener('input', (event) => {
            const target = event.target;
            if (target.id === 'sensitivity-slider') {
                sensitivitySettings.sValue = parseFloat(target.value);
                // No need to re-render, just save.
                saveData();
                updateAllTaskStatuses(true); // Force a re-render of tasks with new settings
            }
        });

        advancedOptionsContent.addEventListener('change', (event) => {
            const target = event.target;
            if (target.id === 'app-title-input') {
                setAppTitle(target.value);
                return; // Prevent other handlers from running
            }
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
                renderPlanner();
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

    // Planner Navigation
    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => {
            if (calendar) calendar.prev();
        });
    }
    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => {
            if (calendar) calendar.next();
        });
    }
    if (todayBtn) {
        todayBtn.addEventListener('click', () => {
            if (calendar) calendar.today();
        });
    }
    if (viewBtns) {
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (calendar) {
                    const viewName = btn.dataset.view === 'month' ? 'dayGridMonth' :
                                     btn.dataset.view === 'daily' ? 'timeGridDay' : 'timeGridWeek';
                    calendar.changeView(viewName);
                }
            });
        });
    }

    // KPI Listeners
    const kpiPrevWeekBtn = document.getElementById('kpi-prev-week-btn');
    const kpiNextWeekBtn = document.getElementById('kpi-next-week-btn');
    const kpiTodayBtn = document.getElementById('kpi-today-btn');

    if (kpiPrevWeekBtn) {
        kpiPrevWeekBtn.addEventListener('click', () => {
            uiSettings.kpiWeekOffset--;
            saveData();
            renderKpiList();
        });
    }

    if (kpiNextWeekBtn) {
        kpiNextWeekBtn.addEventListener('click', () => {
            uiSettings.kpiWeekOffset++;
            saveData();
            renderKpiList();
        });
    }

    if (kpiTodayBtn) {
        kpiTodayBtn.addEventListener('click', () => {
            uiSettings.kpiWeekOffset = 0;
            saveData();
            renderKpiList();
        });
    }

    if (addNewKpiBtn) {
        addNewKpiBtn.addEventListener('click', () => {
            openModal(null, { isKpi: true });
        });
    }

    if (setKpiBtn) {
        setKpiBtn.addEventListener('click', () => {
            const taskId = kpiTaskSelect.value;
            if (!taskId) return;
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.isKpi = true;
                saveData();
                renderKpiList();
                renderKpiTaskSelect();
            }
        });
    }

    if (weeklyGoalsEl) {
        weeklyGoalsEl.addEventListener('blur', () => {
            const week = appState.weeks[appState.viewingIndex];
            if (week) {
                const newGoals = weeklyGoalsEl.innerHTML;
                // Amendment checking removed as it was part of the old planner
                week.weeklyGoals = newGoals;
                savePlannerData();
            }
        });
    }

    const addNewTaskBtnPlanner = document.getElementById('addNewTaskBtnPlanner');
    if (addNewTaskBtnPlanner) {
        addNewTaskBtnPlanner.addEventListener('click', () => openModal());
    }

    // Main View Toggles
    const mainViewNav = document.getElementById('main-view-nav');
    if (mainViewNav) {
        mainViewNav.addEventListener('click', (event) => {
            const target = event.target.closest('.view-toggle-btn');
            if (!target) return;

            const views = [
                { btn: showTaskManagerBtn, view: taskManagerView, id: 'task-manager-view' },
                { btn: showCalendarBtn, view: calendarView, id: 'calendar-view' },
                { btn: showDashboardBtn, view: dashboardView, id: 'dashboard-view' }
            ];

            views.forEach(item => {
                if (item.btn === target) {
                    item.view.classList.remove('hidden');
                    item.btn.classList.add('active-view-btn', 'themed-button-primary');
                    item.btn.classList.remove('themed-button-secondary');
                    uiSettings.activeView = item.id;
                    // If switching to calendar view, ensure it resizes correctly
                    if (item.view === calendarView && calendar) {
                        calendar.updateSize();
                    }
                } else {
                    item.view.classList.add('hidden');
                    item.btn.classList.remove('active-view-btn', 'themed-button-primary');
                    item.btn.classList.add('themed-button-secondary');
                }
            });
            applyTheme(); // Re-apply styles after changing classes
            saveData();
        });
    }

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
        localStorage.setItem('appSettings', JSON.stringify(appSettings));
        localStorage.setItem('sensitivitySettings', JSON.stringify(sensitivitySettings));
        localStorage.setItem('uiSettings', JSON.stringify(uiSettings));
        // New: Explicitly save historical tasks to their own key
        localStorage.setItem('historicalTasksV1', JSON.stringify(appState.historicalTasks));
        savePlannerData();
    } catch (error) {
        console.error("Error saving data to localStorage:", error);
    }
}

function loadData() {
    // New: Load historical tasks from their own dedicated key first.
    const storedHistory = localStorage.getItem('historicalTasksV1');
    if (storedHistory) {
        try {
            const parsedHistory = JSON.parse(storedHistory);
            appState.historicalTasks = Array.isArray(parsedHistory) ? parsedHistory : [];
        } catch(e) {
            console.error("Error parsing historical tasks from new storage:", e);
            appState.historicalTasks = [];
        }
    }

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
    const storedAppSettings = localStorage.getItem('appSettings');
    const storedSensitivitySettings = localStorage.getItem('sensitivitySettings');
    const storedUiSettings = localStorage.getItem('uiSettings');

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
            if (theming.mode !== 'light' && theming.mode !== 'night' && theming.mode !== 'auto') {
                theming.mode = 'night'; // Default to night if stored value is invalid
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

    if (storedAppSettings) {
        try {
            const parsedSettings = JSON.parse(storedAppSettings);
            appSettings = { ...appSettings, ...parsedSettings };
        } catch (e) {
            console.error("Error parsing app settings:", e);
        }
    }

    if (storedSensitivitySettings) {
        try {
            const parsedSettings = JSON.parse(storedSensitivitySettings);
            sensitivitySettings = { ...sensitivitySettings, ...parsedSettings };
        } catch (e) {
            console.error("Error parsing sensitivity settings:", e);
        }
    }

    if (storedUiSettings) {
        try {
            const parsedSettings = JSON.parse(storedUiSettings);
            uiSettings = { ...uiSettings, ...parsedSettings };
        } catch (e) {
            console.error("Error parsing UI settings:", e);
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
            let wasUpgraded = false;
            const parsedTasks = JSON.parse(storedTasks);
            tasks = parsedTasks.map(task => {
                const originalTaskJSON = JSON.stringify(task);
                let tempTask = { ...task };
                tempTask.dueDate = task.dueDate ? new Date(task.dueDate) : null;
                tempTask.createdAt = task.createdAt ? new Date(task.createdAt) : new Date();
                tempTask.cycleEndDate = task.cycleEndDate ? new Date(task.cycleEndDate) : null;
                tempTask.timerLastStarted = task.timerLastStarted ? new Date(task.timerLastStarted) : null;
                if (isNaN(tempTask.dueDate)) tempTask.dueDate = null;
                if (isNaN(tempTask.createdAt)) tempTask.createdAt = new Date();
                if (isNaN(tempTask.cycleEndDate)) tempTask.cycleEndDate = null;
                if (isNaN(tempTask.timerLastStarted)) tempTask.timerLastStarted = null;

                const sanitizedTask = sanitizeAndUpgradeTask(tempTask);
                if (JSON.stringify(sanitizedTask) !== originalTaskJSON) {
                    wasUpgraded = true;
                }
                return sanitizedTask;
            });

            const lastCheck = localStorage.getItem('lastMigrationCheck');
            const today = new Date().toDateString();
            if (wasUpgraded && lastCheck !== today) {
                // Pass the original parsed tasks to the migration tool automatically
                openDataMigrationModal(parsedTasks);
                localStorage.setItem('lastMigrationCheck', today);
            }


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
    renderKpiTaskSelect();
    renderKpiList();
    startMainUpdateLoop();
}

function updateAllTaskStatuses(forceRender = false) {
    let changed = false;
    const nowMs = Date.now();
    const currentTasks = [...tasks];
    const sensitivityParams = getSensitivityParameters();
    tasks.forEach(task => {
        try {
            if (task.repetitionType === 'none' && task.completed) return;

            const oldStatus = task.status;
            const oldConfirmationState = task.confirmationState;

            // Step 1: Always calculate the definitive current status based on timing and misses.
            const newStatusResult = calculateStatus(task, nowMs, currentTasks, sensitivityParams);
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
    mainUpdateInterval = setInterval(() => {
        updateAdaptiveSensitivity();
        updateAllTaskStatuses(false);
    }, STATUS_UPDATE_INTERVAL);
}

// =================================================================================
// --- MISSION PLANNER SCRIPT ---
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
        indicators: appState.indicators
        // historicalTasks is now saved separately
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

        // One-time migration for historical tasks from old storage format.
        if (parsedData.historicalTasks && Array.isArray(parsedData.historicalTasks) && parsedData.historicalTasks.length > 0) {
            // Only migrate if the new storage is empty, to avoid overwriting good data.
            const newHistoryStorage = localStorage.getItem('historicalTasksV1');
            if (!newHistoryStorage || newHistoryStorage === '[]') {
                console.log('Migrating historical tasks from old storage location...');
                // The history loaded in loadData() would be empty, so we can just assign it.
                appState.historicalTasks = parsedData.historicalTasks.filter(item =>
                    item && typeof item === 'object' && item.originalTaskId && item.completionDate && item.status
                );
                // Save immediately to the new location
                localStorage.setItem('historicalTasksV1', JSON.stringify(appState.historicalTasks));
            }
            // After migration (or if new storage already exists), remove history from the old object and re-save it.
            delete parsedData.historicalTasks;
            localStorage.setItem(DATA_KEY, JSON.stringify(parsedData));
            console.log('Old history key removed from planner data.');
        }

    } catch (error) {
        console.error("Failed to parse saved planner data.", error);
    }
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

    // --- Render Header (copied from renderWeeklyView) ---
    plannerContainer.insertAdjacentHTML('beforeend', `<div class="table-cell day-header-cell font-semibold bg-gray-800 sticky top-0 z-10" style="grid-column: 1;">Time</div>`);
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStartDate);
        dayDate.setDate(weekStartDate.getDate() + i);
        plannerContainer.insertAdjacentHTML('beforeend', `<div class="table-cell day-header-cell font-semibold bg-gray-800 sticky top-0 z-10" style="grid-column: ${i + 2};">${dayDate.toLocaleDateString(undefined, { weekday: 'short' })}<br>${dayDate.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}</div>`);
    }

    // --- Render Time Labels and Grid Cells (copied from renderWeeklyView) ---
    for (let hour = 0; hour <= 23; hour++) {
        const rowStart = hour * 4 + 2;
        const d = new Date();
        d.setHours(hour, 0);
        const timeStr = formatTime(d);
        plannerContainer.insertAdjacentHTML('beforeend', `<div class="table-cell time-label-cell font-semibold bg-gray-800" style="grid-row: ${rowStart} / span 4;">${timeStr}</div>`);
        for (let day = 0; day < 7; day++) {
            for (let i = 0; i < 4; i++) {
                const slotRow = rowStart + i;
                // Note: In a read-only view, these slots are not interactive for creating new tasks.
                // We still need them for the grid structure.
                plannerContainer.insertAdjacentHTML('beforeend', `<div class="planner-slot" style="grid-column: ${day + 2}; grid-row: ${slotRow};"></div>`);
            }
        }
    }

    // --- Process and Render Tasks (copied from renderWeeklyView) ---
    const dailyTasks = Array.from({ length: 7 }, () => []);

    if (typeof tasks !== 'undefined' && tasks.length > 0) {
        const filteredTasks = tasks.filter(task => {
            if (categoryFilter.length === 0) return true;
            if (!task.categoryId) return categoryFilter.includes(null);
            return categoryFilter.includes(task.categoryId);
        });

        filteredTasks.forEach(task => {
            const occurrences = getTaskOccurrences(task, weekStartDate, weekEndDate);
            occurrences.forEach(({ occurrenceStartDate, occurrenceDueDate }) => {
                const dayOfWeek = occurrenceStartDate.getDay();
                dailyTasks[dayOfWeek].push({ task, occurrenceDate: occurrenceStartDate, dueDate: occurrenceDueDate });
            });
        });
    }

    dailyTasks.forEach((tasksForDay, dayIndex) => {
        const lanes = accommodate(tasksForDay);
        lanes.forEach((lane, laneIndex) => {
            lane.forEach(({ task, occurrenceDate, dueDate }) => {
                renderTaskOnGrid(task, occurrenceDate, dueDate, dayIndex, laneIndex, lanes.length, plannerContainer);
            });
        });
    });
};


// All the old planner rendering functions have been removed.

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
            // promptToAdvanceWeeks(weekDiff); // This functionality is removed.
        }
    }
    while(appState.weeks.length > MAX_WEEKS_STORED) appState.weeks.shift();
    loadViewState();
    if(appState.viewingIndex < 0 || appState.viewingIndex >= MAX_WEEKS_STORED) {
        appState.viewingIndex = CURRENT_WEEK_INDEX;
    }
    savePlannerData();
};

function applyActiveView() {
    const views = [
        { btn: showTaskManagerBtn, view: taskManagerView, id: 'task-manager-view' },
        { btn: showCalendarBtn, view: calendarView, id: 'calendar-view' },
        { btn: showDashboardBtn, view: dashboardView, id: 'dashboard-view' }
    ];

    const activeViewId = uiSettings.activeView || 'calendar-view'; // Default to calendar
    let foundActive = false;

    views.forEach(item => {
        if (item.id === activeViewId) {
            item.view.classList.remove('hidden');
            item.btn.classList.add('active-view-btn', 'themed-button-primary');
            item.btn.classList.remove('themed-button-secondary');
            if (item.view === calendarView && calendar) {
                calendar.updateSize();
            }
            foundActive = true;
        } else {
            item.view.classList.add('hidden');
            item.btn.classList.remove('active-view-btn', 'themed-button-primary');
            item.btn.classList.add('themed-button-secondary');
        }
    });

    // Fallback if the saved view ID is invalid for some reason
    if (!foundActive && views.length > 0) {
        views[1].view.classList.remove('hidden'); // Default to calendar view
        views[1].btn.classList.add('active-view-btn', 'themed-button-primary');
        views[1].btn.classList.remove('themed-button-secondary');
    }
}

function initializeCalendar() {
    if (!calendarEl) {
        console.error("Calendar element not found!");
        return;
    }

    calendar = new Calendar(calendarEl, {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: 'timeGridWeek',
        headerToolbar: false,
        editable: true,
        slotEventOverlap: true,
        eventOrder: (a, b) => {
            const durationA = a.end - a.start;
            const durationB = b.end - b.start;
            if (durationA !== durationB) {
                return durationB - durationA;
            }
            return a.start - b.start;
        },
        eventContent: function(arg) {
            let eventEl = document.createElement('div');
            eventEl.classList.add('fc-event-main-inner');

            const durationMs = arg.event.end - arg.event.start;
            const isShort = durationMs < (30 * 60 * 1000); // Less than 30 minutes

            if (isShort) {
                arg.el.classList.add('fc-event-short');
            }

            // Check if the event is in a timegrid view and appears narrow
            const view = arg.view;
            if (view.type.includes('timeGrid')) {
                 // A simple proxy for "half-width" is to check the element's actual width.
                 // This is brittle as it runs before the element might be fully rendered and sized.
                 // A more robust way might be to check for overlapping events, but that's complex.
                 // Let's try a simple, direct approach first.
                 // NOTE: arg.el.offsetWidth is not reliable here as the layout might not be complete.
                 // We will rely on the short duration for now as the primary driver of style change.
            }

            let timeText = arg.timeText;
            let titleText = arg.event.title;

            // In weekly view, if the event is short, omit the time
            if (view.type === 'timeGridWeek' && isShort) {
                eventEl.innerHTML = `<div class="fc-event-title-container"><div class="fc-event-title fc-sticky">${titleText}</div></div>`;
            } else {
                 eventEl.innerHTML = `<div class="fc-event-time">${timeText}</div><div class="fc-event-title-container"><div class="fc-event-title fc-sticky">${titleText}</div></div>`;
            }

            return { domNodes: [eventEl] };
        },
        events: (fetchInfo, successCallback, failureCallback) => {
            try {
                const viewStartDate = fetchInfo.start;
                const viewEndDate = fetchInfo.end;
                const calendarEvents = [];

                // Extend the view by one week for the scheduling algorithm to handle rollovers
                const extendedViewEndDate = new Date(viewEndDate.getTime());
                extendedViewEndDate.setDate(extendedViewEndDate.getDate() + 7);

                // 1. Process Active Tasks using the extended date range
                const scheduledTasks = calculateScheduledTimes(tasks, viewStartDate, extendedViewEndDate);
                const filteredTasks = scheduledTasks.filter(task => {
                    if (categoryFilter.length === 0) return true;
                    if (!task.categoryId) return categoryFilter.includes(null);
                    return categoryFilter.includes(task.categoryId);
                });

                filteredTasks.forEach(task => {
                    const occurrences = getTaskOccurrences(task, viewStartDate, viewEndDate);
                    occurrences.forEach(({ occurrenceStartDate, occurrenceDueDate }) => {
                        const category = categories.find(c => c.id === task.categoryId);
                        const eventColor = category ? category.color : (statusColors[task.status] || '#374151');
                        const borderColor = statusColors[task.status] || '#FFFFFF';

                        calendarEvents.push({
                            id: task.id + '_' + occurrenceStartDate.toISOString(),
                            title: task.name,
                            start: occurrenceStartDate,
                            end: occurrenceDueDate,
                            backgroundColor: eventColor,
                            borderColor: borderColor,
                            extendedProps: {
                                taskId: task.id,
                                occurrenceDueDate: occurrenceDueDate.toISOString(),
                                isHistorical: false
                            }
                        });
                    });
                });

                // 2. Process Historical Tasks
                const filteredHistory = appState.historicalTasks.filter(ht => {
                    const completionDate = new Date(ht.completionDate);
                    if (isNaN(completionDate)) return false;

                    const durationMs = getDurationMs(ht.durationAmount, ht.durationUnit) || MS_PER_HOUR;
                    const startDate = new Date(completionDate.getTime() - durationMs);

                    // Check if the event overlaps with the view window
                    if (startDate > viewEndDate || completionDate < viewStartDate) {
                        return false;
                    }

                    if (categoryFilter.length === 0) return true;
                    if (!ht.categoryId) return categoryFilter.includes(null);
                    return categoryFilter.includes(ht.categoryId);
                });

                filteredHistory.forEach(ht => {
                    const category = categories.find(c => c.id === ht.categoryId);
                    let baseColor = category ? category.color : '#808080';

                    // Duller color for historical tasks
                    const luminance = getLuminance(baseColor);
                    const dullFactor = luminance < 0.5 ? 0.2 : -0.2;
                    const eventColor = adjustColor(baseColor, dullFactor);

                    let borderColor = statusColors.green; // Default to green
                    if (ht.status === 'completed') {
                        const originalDueDate = new Date(ht.originalDueDate);
                        const completionDate = new Date(ht.completionDate);
                        if (!isNaN(originalDueDate) && !isNaN(completionDate) && completionDate < originalDueDate) {
                            borderColor = statusColors.blue; // Ahead of schedule
                        } else {
                            borderColor = statusColors.green; // Completed
                        }
                    } else if (ht.status === 'missed') {
                        if (ht.progress === 0) {
                            borderColor = statusColors.black; // Missed completely
                        } else if (ht.progress > 0 && ht.progress <= 0.5) {
                            borderColor = statusColors.red; // Partially missed
                        } else { // progress > 0.5
                            borderColor = statusColors.yellow; // Partially completed
                        }
                    }

                    const durationMs = getDurationMs(ht.durationAmount, ht.durationUnit) || MS_PER_HOUR;
                    const endDate = new Date(ht.completionDate);
                    const startDate = new Date(endDate.getTime() - durationMs);

                    calendarEvents.push({
                        id: 'hist_' + ht.originalTaskId + '_' + ht.completionDate,
                        title: ht.name,
                        start: startDate,
                        end: endDate,
                        backgroundColor: eventColor,
                        borderColor: borderColor,
                        extendedProps: {
                            taskId: ht.originalTaskId,
                            isHistorical: true
                        }
                    });
                });

                successCallback(calendarEvents);
            } catch (e) {
                console.error("Error fetching events for FullCalendar:", e);
                failureCallback(e);
            }
        },
        datesSet: (info) => {
            // Update the custom header title
            if (weekStatusEl) {
                weekStatusEl.textContent = info.view.title;
            }

            // Update prev/next button labels and view button highlights
            const viewType = info.view.type;
            let prevText = '&lt; Prev';
            let nextText = 'Next &gt;';
            let activeView = 'weekly'; // default

            if (viewType === 'dayGridMonth') {
                prevText = '&lt; Prev Month';
                nextText = 'Next Month &gt;';
                activeView = 'month';
            } else if (viewType === 'timeGridWeek') {
                prevText = '&lt; Prev Week';
                nextText = 'Next Week &gt;';
                activeView = 'weekly';
            } else if (viewType === 'timeGridDay') {
                prevText = '&lt; Prev Day';
                nextText = 'Next Day &gt;';
                activeView = 'daily';
            }

            if (prevWeekBtn) prevWeekBtn.innerHTML = prevText;
            if (nextWeekBtn) nextWeekBtn.innerHTML = nextText;

            // Update active state on view buttons
            viewBtns.forEach(btn => {
                btn.classList.remove('active-view-btn');
                if (btn.dataset.view === activeView) {
                    btn.classList.add('active-view-btn');
                }
            });
            applyTheme(); // Re-apply theme to update button styles
        },
        eventClick: (info) => {
            const taskId = info.event.extendedProps.taskId;
            const occurrenceDueDate = new Date(info.event.extendedProps.occurrenceDueDate);
            openTaskView(taskId, occurrenceDueDate);
        },
        dateClick: (info) => {
            const taskStartDate = new Date(info.date);
            const taskDueDate = new Date(taskStartDate.getTime() + (60 * 60 * 1000)); // Add 1 hour

            const defaultCategoryName = plannerSettings.defaultCategoryId || 'Planner';
            let plannerCategory = categories.find(c => c.id === defaultCategoryName);
            if (!plannerCategory) {
                plannerCategory = { id: defaultCategoryName, name: defaultCategoryName, color: getRandomColor() };
                categories.push(plannerCategory);
                renderCategoryManager();
                renderCategoryFilters();
            }

            const newTaskData = {
                id: generateId(),
                name: 'New Event',
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
            calendar.refetchEvents();
            openModal(sanitizedTask.id, { occurrenceDate: taskDueDate });
        }
    });

    calendar.render();
}

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
        setAppTitle(appSettings.title); // Set the title on load
        console.log("Task Manager initialized.");
    } catch (e) {
        console.error("Error during Task Manager initialization:", e);
        const listDiv = document.getElementById('task-list');
        if(listDiv) listDiv.innerHTML = '<p class="text-red-600 font-bold text-center">Error initializing Task Manager. Please check console.</p>';
    }

    // --- Initialize Mission Planner ---
    try {
        console.log("Initializing Mission Planner...");
        initializePlannerState(); // Renamed from initializeOrSyncState
        applyTheme(); // Apply theme after state is initialized
        initializeCalendar(); // New function to set up FullCalendar
        applyActiveView(); // Apply the saved view
        console.log("Mission Planner initialized.");
    } catch (e) {
        console.error("Error during Mission Planner initialization:", e);
    }
});
