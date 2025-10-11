import { getDurationMs, runCalculationPipeline, getOccurrences, adjustDateForVacation } from './task-logic.js';
import { taskTemplate, categoryManagerTemplate, taskViewTemplate, notificationManagerTemplate, taskStatsTemplate, actionAreaTemplate, commonButtonsTemplate, statusManagerTemplate, categoryFilterTemplate, iconPickerTemplate, editProgressTemplate, editCategoryTemplate, editStatusNameTemplate, restoreDefaultsConfirmationTemplate, taskGroupHeaderTemplate, bulkEditFormTemplate, dataMigrationModalTemplate, historyDeleteConfirmationTemplate, taskViewDeleteConfirmationTemplate, vacationManagerTemplate, taskViewHistoryDeleteConfirmationTemplate, journalSettingsTemplate, vacationChangeConfirmationModalTemplate, appointmentConflictModalTemplate, kpiAutomationSettingsTemplate, historicalTaskCardTemplate, hintManagerTemplate, calendarCategoryFilterTemplate, welcomeModalTemplate, importModalTemplate, conflictResolutionModalTemplate } from './templates.js';
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
let isInitializing = true; // Flag to prevent premature saves
let tasks = [];
let categories = [];
const defaultStatusColors = { blue: '#00BFFF', green: '#22c55e', yellow: '#facc15', red: '#991b1b', black: '#4b5563' };
const defaultStatusNames = { blue: 'Locked', green: 'Ready', yellow: 'Start Soon', red: 'Do Right Now', black: 'Overdue' };
let statusColors = { ...defaultStatusColors };
let statusNames = { ...defaultStatusNames };
let notificationSettings = { enabled: false, rateLimit: { amount: 5, unit: 'minutes' }, categories: {} };
let notificationEngine = { timeouts: [], lastNotificationTimestamps: {} };
let theming = { enabled: false, baseColor: '#3b82f6', mode: 'auto', useThemeForStatus: true, calendarGradientSource: 'status' };
let appSettings = {
    title: "Task & Mission Planner",
    subtitle: "Organize your tasks, plan your week, and track your progress.",
    weeklyGoalLabel: "Mission/Goals for this Week",
    use24HourFormat: false,
    autoKpiEnabled: false,
    autoKpiRemovable: false,
    gpaSystem: 'standard', // 'standard' or 'extended'
};
let calendarSettings = { categoryFilter: [], syncFilter: true, lastView: 'timeGridWeek', allowCreationOnClick: false };
let lastBulkEditSettings = {};
let oldTasksData = [];
let editingTaskId = null;
let editingCategoryIdForIcon = null;
let kpiChart = null; // For single chart view
let kpiCharts = []; // For stacked chart view
let calendarMonthEvents = [];
let calendarTimeGridEvents = [];
// let taskViewBorderInterval = null; // This is no longer needed
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
    activeView: 'dashboard-view', // Default view
    kpiChartMode: 'single', // 'single' or 'stacked'
    kpiChartDateRange: '8d', // '8d', '30d', etc.
    kpiWeekOffset: 0,
    journalIconCollapseState: {},
    advancedOptionsCollapseState: {},
    calculationHorizonAmount: 1,
    calculationHorizonUnit: 'years',
    hintsDisabled: false,
    closeModalAfterAction: false,
    calendarCategoryFilters: {},
    showCalendarFilters: true, // New setting
    monthView: { // New settings for month view
        showIcon: true,
        showTime: false,
        showName: true,
        groupTasks: true,
    },
    lastIconStyle: 'fa-solid',
    welcomeScreenShown: false,
    earlyOnTimeSettings: {
        enabled: false,
        displaceCalendar: false,
        onlyAppointments: false,
    },
};
let journalSettings = {
    weeklyGoalIcon: 'fa-solid fa-bullseye',
};
let sensitivitySettings = { sValue: 0.5, isAdaptive: false };
const STATUS_UPDATE_INTERVAL = 15000;
const MS_PER_SECOND = 1000;

const iconCategories = {
    'General': ['fa-star', 'fa-heart', 'fa-check', 'fa-xmark', 'fa-flag', 'fa-bell', 'fa-bolt', 'fa-gift', 'fa-key', 'fa-lightbulb', 'fa-moon', 'fa-sun', 'fa-fire', 'fa-trophy', 'fa-shield-halved', 'fa-bookmark', 'fa-eye', 'fa-eye-slash', 'fa-thumbs-up', 'fa-thumbs-down', 'fa-circle-info', 'fa-circle-question', 'fa-circle-exclamation', 'fa-award', 'fa-magnet', 'fa-bomb', 'fa-recycle'],
    'Productivity & Work': ['fa-briefcase', 'fa-bullseye', 'fa-calendar-days', 'fa-clock', 'fa-file-signature', 'fa-laptop-file', 'fa-list-check', 'fa-pencil', 'fa-book-open', 'fa-graduation-cap', 'fa-chart-pie', 'fa-magnifying-glass-chart', 'fa-paperclip', 'fa-building', 'fa-sitemap', 'fa-network-wired', 'fa-calculator', 'fa-gears', 'fa-timeline', 'fa-clipboard-list'],
    'Communication': ['fa-at', 'fa-envelope', 'fa-phone', 'fa-comments', 'fa-users', 'fa-bullhorn', 'fa-address-book', 'fa-mobile-screen-button', 'fa-fax', 'fa-wifi', 'fa-rss', 'fa-satellite-dish'],
    'Finance & Shopping': ['fa-dollar-sign', 'fa-euro-sign', 'fa-pound-sign', 'fa-yen-sign', 'fa-credit-card', 'fa-wallet', 'fa-piggy-bank', 'fa-money-bill-wave', 'fa-receipt', 'fa-chart-line', 'fa-basket-shopping', 'fa-cart-shopping', 'fa-store', 'fa-tag', 'fa-barcode'],
    'Health & Fitness': ['fa-heart-pulse', 'fa-dumbbell', 'fa-person-running', 'fa-apple-whole', 'fa-pills', 'fa-stethoscope', 'fa-brain', 'fa-weight-scale', 'fa-spa', 'fa-dna', 'fa-first-aid', 'fa-notes-medical', 'fa-bicycle', 'fa-person-swimming', 'fa-fire-flame-curved'],
    'Travel & Transport': ['fa-plane', 'fa-car', 'fa-train', 'fa-bus', 'fa-ship', 'fa-earth-americas', 'fa-map-location-dot', 'fa-suitcase', 'fa-passport', 'fa-bed', 'fa-motorcycle', 'fa-rocket', 'fa-anchor', 'fa-taxi', 'fa-gas-pump'],
    'Food & Drink': ['fa-utensils', 'fa-mug-hot', 'fa-martini-glass', 'fa-ice-cream', 'fa-pizza-slice', 'fa-burger', 'fa-seedling', 'fa-carrot', 'fa-cookie-bite', 'fa-fish', 'fa-wine-bottle', 'fa-cheese', 'fa-pepper-hot', 'fa-lemon'],
    'Nature & Weather': ['fa-tree', 'fa-leaf', 'fa-mountain-sun', 'fa-water', 'fa-cloud-sun', 'fa-cloud-rain', 'fa-snowflake', 'fa-wind', 'fa-tornado', 'fa-volcano', 'fa-seedling', 'fa-frog', 'fa-feather'],
    'Animals': ['fa-cat', 'fa-dog', 'fa-hippo', 'fa-fish-fins', 'fa-crow', 'fa-spider', 'fa-otter', 'fa-dragon', 'fa-horse', 'fa-cow', 'fa-dove', 'fa-shrimp', 'fa-bugs', 'fa-worm', 'fa-paw'],
    'Hobbies & Entertainment': ['fa-gamepad', 'fa-dice-d20', 'fa-ghost', 'fa-puzzle-piece', 'fa-music', 'fa-guitar', 'fa-paintbrush', 'fa-book', 'fa-film', 'fa-camera-retro', 'fa-theater-masks', 'fa-bowling-ball', 'fa-chess-knight', 'fa-wand-magic-sparkles'],
    'Technology & Devices': ['fa-computer', 'fa-laptop', 'fa-mobile-alt', 'fa-tablet-alt', 'fa-keyboard', 'fa-mouse', 'fa-headphones', 'fa-server', 'fa-database', 'fa-code', 'fa-microchip', 'fa-robot', 'fa-vr-cardboard'],
    'Symbols & Shapes': ['fa-shapes', 'fa-diamond', 'fa-circle', 'fa-square', 'fa-bahai', 'fa-atom', 'fa-certificate', 'fa-anchor', 'fa-asterisk', 'fa-cube', 'fa-clover', 'fa-crosshairs', 'fa-genderless', 'fa-yin-yang'],
    'Brands': ['fa-brands fa-apple', 'fa-brands fa-windows', 'fa-brands fa-android', 'fa-brands fa-google', 'fa-brands fa-amazon', 'fa-brands fa-facebook', 'fa-brands fa-twitter', 'fa-brands fa-instagram', 'fa-brands fa-linkedin', 'fa-brands fa-github', 'fa-brands fa-youtube', 'fa-brands fa-discord', 'fa-brands fa-slack', 'fa-brands fa-figma']
};

const MS_PER_MINUTE = 60000;
const MS_PER_HOUR = 3600000;
const MS_PER_DAY = 86400000;
const DUE_THRESHOLD_MS = 1000;
const MAX_CYCLE_CALCULATION = 100;

// DOM Element References (Task Manager)
let taskModal, taskForm, taskListDiv, modalTitle, taskIdInput, taskNameInput, taskDescriptionInput, taskIconInput,
    iconPickerModal, dataMigrationModal, journalModal, journalForm, journalModalTitle, journalEntryIdInput,
    journalEntryTitleInput, journalEntryIconInput, journalEntryContentInput,
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
let app, weeklyGoalsEl,
    addNewKpiBtn, setKpiBtn, kpiTaskSelect,
    calendarEl, // New element for FullCalendar
    progressTrackerContainer, viewBtns, startNewWeekBtn, confirmModal,
    cancelNewWeekBtn, confirmNewWeekBtn, prevWeekBtn, nextWeekBtn, todayBtn,
    weekStatusEl, weekDateRangeEl,
    showTaskManagerBtn, showCalendarBtn, showDashboardBtn, showJournalBtn, taskManagerView, calendarView, dashboardView, journalView,
    taskViewModal, taskViewContent, taskStatsContent;

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
    archivedTasks: [], // New: To store full task objects that are no longer active.
    journal: [],
    vacations: [], // New: To store vacation periods {id, name, startDate, endDate}
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
            case 'years': date.setFullYear(date.getFullYear() + amount); break;
            default: console.warn("Unknown unit:", unit);
        }
        return date;
    } catch (e) { console.error("Error calculating future date:", e); return new Date(baseDate); }
}

function getCalculationHorizonDate() {
    const amount = uiSettings.calculationHorizonAmount || 1;
    const unit = uiSettings.calculationHorizonUnit || 'years';
    return calculateFutureDate(amount, unit, new Date());
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
                    cycles = Math.floor((nowMs - originalDueDateMs) / intervalMs) + 1;
            } else {
                console.warn(`Invalid relative interval for task ${task.id}. Defaulting to 1 cycle.`);
                cycles = 1;
            }
        } else if (task.repetitionType === 'absolute') {
            try {
                // Use the new, centralized function to find all occurrences between the start and now.
                const occurrences = getOccurrences(task, new Date(originalDueDate), new Date(nowDate));
                // The number of cycles is simply the number of dates found.
                cycles = occurrences.length;
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
        isAutoKpi: false,
        isAppointment: false,
        prepTimeAmount: null,
        prepTimeUnit: 'minutes',
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
    // Get the current base color's HSL value.
    // If no base color exists, start with a random hue.
    const currentHue = theming.baseColor ? hexToHSL(theming.baseColor).h : Math.floor(Math.random() * 360);

    let newHue;
    let attempts = 0;
    do {
        newHue = Math.floor(Math.random() * 360);
        attempts++;
        // After 10 attempts, just accept the color to prevent an infinite loop in the unlikely case it's hard to find a distant color.
    } while (Math.min(Math.abs(currentHue - newHue), 360 - Math.abs(currentHue - newHue)) < 90 && attempts < 10);

    // Generate a color with the new hue, but with a controlled saturation and lightness for a pleasant look.
    // High saturation and mid-to-high lightness generally produce vibrant but not jarring colors.
    const newSaturation = 70 + Math.random() * 20; // Saturation between 70% and 90%
    const newLightness = 60 + Math.random() * 10; // Lightness between 60% and 70%

    return HSLToHex(newHue, newSaturation, newLightness);
}
// New helper function to get the luminance of a color (WCAG compliant)
function getLuminance(hexColor) {
    if (!hexColor || hexColor.length < 4) return 0; // Invalid color
    const rgbInt = parseInt(hexColor.slice(1), 16);
    let r = (rgbInt >> 16) & 0xff;
    let g = (rgbInt >> 8) & 0xff;
    let b = (rgbInt >> 0) & 0xff;

    const sRGB = [r / 255, g / 255, b / 255];
    const linearRGB = sRGB.map(val => {
        if (val <= 0.03928) {
            return val / 12.92;
        }
        return Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * linearRGB[0] + 0.7152 * linearRGB[1] + 0.0722 * linearRGB[2];
}

function getContrastRatio(color1, color2) {
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const lighterLum = Math.max(lum1, lum2);
    const darkerLum = Math.min(lum1, lum2);
    return (lighterLum + 0.05) / (darkerLum + 0.05);
}

function rgbStringToHex(rgbString) {
    if (!rgbString || !rgbString.startsWith('rgb')) return null;
    const rgb = rgbString.match(/\d+/g);
    if (!rgb || rgb.length < 3) return null;
    const [r, g, b] = rgb.map(Number);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0');
}

// This function is now obsolete. The new `applyTheme` engine generates
// accessible themes by design, making this after-the-fact check unnecessary.
// function checkAllElementsContrast() { ... }


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

    const black = '#000000';
    const white = '#FFFFFF';

    const contrastWithBlack = getContrastRatio(hexcolor, black);
    const contrastWithWhite = getContrastRatio(hexcolor, white);

    // Choose the text color with the highest contrast
    const primaryTextColor = contrastWithWhite > contrastWithBlack ? white : black;
    // The background is considered "dark" if white text provides better contrast
    const isBgDark = primaryTextColor === white;

    // When text is white (on dark bg), we want to make it darker (more gray) for secondary shades.
    // When text is black (on light bg), we want to make it lighter (more gray) for secondary shades.
    const adjustDirection = isBgDark ? -1 : 1;

    const shades = {
        '--text-color-primary': primaryTextColor,
        '--text-color-secondary': adjustColor(primaryTextColor, adjustDirection * 0.25), // 75%
        '--text-color-tertiary': adjustColor(primaryTextColor, adjustDirection * 0.45),  // 55%
        '--text-color-quaternary': adjustColor(primaryTextColor, adjustDirection * 0.60),// 40%
    };

    // Add a text shadow for colors with poor contrast against both black and white
    const maxContrast = Math.max(contrastWithWhite, contrastWithBlack);
    if (maxContrast < 4.5) { // If even the best option is poor, add a shadow
        const shadowColor = isBgDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)';
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

function gpaToLetterGrade(gpa) {
    if (appSettings.gpaSystem === 'extended') {
        if (gpa === 4.0) return 'S+';
        if (gpa >= 3.7) return 'S';
        if (gpa >= 3.5) return 'S-';
        if (gpa >= 3.2) return 'A+';
        if (gpa >= 2.8) return 'A';
        if (gpa >= 2.5) return 'A-';
        if (gpa >= 2.2) return 'B+';
        if (gpa >= 1.8) return 'B';
        if (gpa >= 1.5) return 'B-';
        if (gpa >= 1.2) return 'C+';
        if (gpa >= 0.8) return 'C';
        if (gpa >= 0.5) return 'C-';
        if (gpa >= 0.2) return 'D';
        if (gpa > 0) return 'D-';
        return 'F';
    } else { // Standard
        if (gpa >= 4.0) return 'A+';
        if (gpa >= 3.7) return 'A';
        if (gpa >= 3.3) return 'A-';
        if (gpa >= 3.0) return 'B+';
        if (gpa >= 2.7) return 'B';
        if (gpa >= 2.3) return 'B-';
        if (gpa >= 2.0) return 'C+';
        if (gpa >= 1.7) return 'C';
        if (gpa >= 1.3) return 'C-';
        if (gpa >= 1.0) return 'D+';
        if (gpa >= 0.7) return 'D';
        if (gpa > 0) return 'D-';
        return 'F';
    }
}


function processTaskHistoryForChart(task, history) {
    if ((!history || history.length === 0) && !task) {
        return { labels: [], completions: [], misses: [] };
    }

    // 1. Group history items by day
    const dailyData = new Map();
    if (history) {
        history.forEach(item => {
            const date = new Date(item.completionDate);
            if (isNaN(date)) return;

            const dayKey = format(date, 'yyyy-MM-dd');
            if (!dailyData.has(dayKey)) {
                dailyData.set(dayKey, { completions: 0, misses: 0 });
            }
            const stats = dailyData.get(dayKey);
            const completionStatuses = ['blue', 'green', 'yellow'];
            if (completionStatuses.includes(item.status)) {
                stats.completions++;
            } else {
                stats.misses++;
            }
        });
    }

    // 2. Determine the date range for the chart
    const today = new Date();
    let chartStartDate;
    if (history && history.length > 0) {
        chartStartDate = new Date(history.reduce((min, h) => Math.min(min, new Date(h.completionDate).getTime()), Date.now()));
    } else {
        chartStartDate = new Date(task.createdAt || today);
    }
    chartStartDate.setHours(0,0,0,0);


    let lastEventDate;
     if (history && history.length > 0) {
        lastEventDate = new Date(history.reduce((max, h) => Math.max(max, new Date(h.completionDate).getTime()), 0));
    } else {
        lastEventDate = today;
    }
    const chartEndDate = today > lastEventDate ? today : lastEventDate;
    chartEndDate.setHours(23,59,59,999);


    // 3. Decide on the X-axis generation strategy
    const repetitionIntervalMs = (task && task.repetitionType === 'relative') ? getDurationMs(task.repetitionAmount, task.repetitionUnit) : 0;
    const isSparse = (task && task.repetitionType === 'absolute') || repetitionIntervalMs > MS_PER_DAY;

    let labels = [];
    if (isSparse && task.repetitionType !== 'none') {
        const occurrences = getOccurrences(task, chartStartDate, chartEndDate);
        labels = occurrences.map(d => format(d, 'yyyy-MM-dd'));
        const todayKey = format(today, 'yyyy-MM-dd');
        if (!labels.includes(todayKey) && chartEndDate.toDateString() === today.toDateString()) {
             labels.push(todayKey);
             labels.sort();
        }
    } else {
        let currentDate = new Date(chartStartDate);
        while (currentDate <= chartEndDate) {
            labels.push(format(currentDate, 'yyyy-MM-dd'));
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    if (labels.length === 0 && task) {
        labels.push(format(today, 'yyyy-MM-dd'));
    }

    // 4. Populate datasets based on labels
    const completions = [];
    const misses = [];
    labels.forEach(label => {
        const dataForDay = dailyData.get(label) || { completions: 0, misses: 0 };
        completions.push(dataForDay.completions);
        misses.push(dataForDay.misses);
    });

    if (history && history.length === 0 && task) {
        const todayKey = format(new Date(), 'yyyy-MM-dd');
        if (!labels.includes(todayKey)) {
             labels.push(todayKey);
             completions.push(0);
             misses.push(0);
        }
    }

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

function generateGradientPalette(baseColor, isDarkMode) {
    const baseHSL = hexToHSL(baseColor);

    // Stop reversal is removed. The direction of the gradient will be handled in applyTheme.
    const stops = [
        { l: -45, s: 0 },   // Black
        { l: -30, s: 25 },  // Red
        { l: -15, s: 15 },  // Yellow
        { l: 0, s: 0 },     // Green (base)
        { l: 15, s: 10 }    // Blue
    ];

    const palette = {
        black:  HSLToHex(baseHSL.h, Math.min(100, baseHSL.s + stops[0].s), Math.max(0, Math.min(100, baseHSL.l + stops[0].l))),
        red:    HSLToHex(baseHSL.h, Math.min(100, baseHSL.s + stops[1].s), Math.max(0, Math.min(100, baseHSL.l + stops[1].l))),
        yellow: HSLToHex(baseHSL.h, Math.min(100, baseHSL.s + stops[2].s), Math.max(0, Math.min(100, baseHSL.l + stops[2].l))),
        green:  HSLToHex(baseHSL.h, Math.min(100, baseHSL.s + stops[3].s), Math.max(0, Math.min(100, baseHSL.l + stops[3].l))),
        blue:   HSLToHex(baseHSL.h, Math.min(100, baseHSL.s + stops[4].s), Math.max(0, Math.min(100, baseHSL.l + stops[4].l))),
    };

    return palette;
}

function generateComplementaryPalette(baseColor, isDarkMode) {
    const baseHSL = hexToHSL(baseColor);
    const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

    let mainBgLightness;
    if (isDarkMode) {
        mainBgLightness = baseHSL.l > 50 ? 20 : Math.max(10, baseHSL.l - 10);
    } else {
        mainBgLightness = baseHSL.l < 70 ? 95 : Math.min(100, baseHSL.l + 20);
    }
    const main = HSLToHex(baseHSL.h, clamp(baseHSL.s * 0.8, 0, 100), mainBgLightness);

    const secondaryLightness = isDarkMode ? Math.max(40, baseHSL.l) : Math.min(60, baseHSL.l);
    const secondary = HSLToHex(baseHSL.h, clamp(baseHSL.s, 0, 100), secondaryLightness);

    const tertiaryHue = (baseHSL.h + 150) % 360;
    const tertiaryLightness = isDarkMode ? Math.max(50, baseHSL.l) : Math.min(55, baseHSL.l);
    const tertiary = HSLToHex(tertiaryHue, clamp(baseHSL.s * 1.1, 0, 100), tertiaryLightness);

    const accent1 = HSLToHex((baseHSL.h + 60) % 360, clamp(baseHSL.s - 10, 0, 100), isDarkMode ? 60 : 40);
    const accent2 = HSLToHex((baseHSL.h + 180) % 360, clamp(baseHSL.s - 10, 0, 100), isDarkMode ? 65 : 35);
    const accent3 = HSLToHex((baseHSL.h + 300) % 360, clamp(baseHSL.s, 0, 100), isDarkMode ? 55 : 45);

    const secondarySelectedLightness = isDarkMode ? secondaryLightness + 10 : secondaryLightness - 10;
    const secondary_highlight = HSLToHex(baseHSL.h, clamp(baseHSL.s, 0, 100), clamp(secondarySelectedLightness, 0, 100));
    const secondary_selected = `linear-gradient(to bottom, ${secondary}, ${secondary_highlight})`;

    // A more pronounced gradient for the "Theme Spectrum" option, respecting the light source direction.
    const main_gradient = `linear-gradient(to bottom, ${main}, ${secondary})`;

    return { main, secondary, tertiary, accent1, accent2, accent3, secondary_selected, main_gradient };
}

function applyThemeMode(effectiveMode) {
    document.body.classList.remove('light-mode', 'auto-theme');
    if (effectiveMode === 'light') {
        document.body.classList.add('light-mode');
    }
    // For 'night' mode, no class is needed as it's the default. 'auto-theme' is now handled by JS.
}

function setAppBranding() {
    const { title, subtitle, weeklyGoalLabel } = appSettings;

    // Set document title
    document.title = title || "Task & Mission Planner";

    // Set header title
    const headerTitle = document.querySelector('#app header h1');
    if (headerTitle) {
        headerTitle.textContent = title || "Task & Mission Planner";
    }

    // Set header subtitle
    const headerSubtitle = document.querySelector('#app header p');
    if (headerSubtitle) {
        headerSubtitle.textContent = subtitle || "Organize your tasks, plan your week, and track your progress.";
    }

    // Set weekly goal label on the dashboard
    const goalLabel = document.getElementById('weekly-goal-label');
    if (goalLabel) {
        goalLabel.textContent = weeklyGoalLabel || "Mission/Goals for this Week";
    }

    saveData();
}

function applyTheme() {
    // Determine the effective mode (light/night) based on user settings
    let effectiveMode = theming.mode;
    if (theming.mode === 'auto') {
        const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        effectiveMode = isSystemDark ? 'night' : 'light';
    }
    const isDarkMode = effectiveMode === 'night';
    applyThemeMode(effectiveMode); // Apply .light-mode class if needed

    // First, determine which status colors are active for this render cycle.
    const activeStatusColors = (theming.enabled && theming.useThemeForStatus)
        ? generateGradientPalette(theming.baseColor, isDarkMode)
        : { ...defaultStatusColors };

    // Update the global statusColors object so all other functions use the correct set.
    statusColors = activeStatusColors;

    // Generate a subtle background color from the base theme color
    const baseHSL = hexToHSL(theming.baseColor);
    const mainBgLightness = isDarkMode ? 8 : 97; // Very dark (8%) or very light (97%)
    const mainBgSaturation = isDarkMode ? baseHSL.s * 0.4 : baseHSL.s * 0.6; // Desaturate for subtlety
    const subtleBgColor = HSLToHex(baseHSL.h, Math.min(100, Math.max(0, mainBgSaturation)), mainBgLightness);

    // Generate color palettes
    const palette = generateComplementaryPalette(theming.baseColor, isDarkMode);

    // --- Gradient Logic ---
    const gradientDirection = isDarkMode ? 'to top' : 'to bottom';

    // 1. Status Spectrum Gradient
    // The initial order from the palette function is dark-to-light. We reverse it to get light-to-dark.
    const statusColorsForGradient = [activeStatusColors.black, activeStatusColors.red, activeStatusColors.yellow, activeStatusColors.green, activeStatusColors.blue];
    statusColorsForGradient.reverse(); // Now it's always [blue, green, yellow, red, black] (light to dark)
    const statusGradient = `linear-gradient(${gradientDirection}, ${statusColorsForGradient.join(', ')})`;

    // 2. Theme Gradient
    // The theme gradient also respects the light source direction.
    const themeGradient = `linear-gradient(${gradientDirection}, ${palette.main}, ${palette.secondary})`;

    let activeGradient;
    if (theming.calendarGradientSource === 'theme') {
        activeGradient = themeGradient;
    } else { // 'status' or default
        activeGradient = statusGradient;
    }

    const calendarBorderGradient = theming.enabled ? activeGradient : 'transparent';
    const chartBgColor = theming.enabled ? (isDarkMode ? '#1F2937' : '#FFFFFF') : (isDarkMode ? '#1F2937' : '#FFFFFF'); // gray-800 or white

    // Define theme properties
    const themeProperties = {
        // Use the new subtle theme color for the main background for a more cohesive look.
        '--bg-main': theming.enabled ? subtleBgColor : (isDarkMode ? '#111827' : '#F9FAFB'),
        '--bg-secondary': isDarkMode ? '#1F2937' : '#FFFFFF',   // e.g., gray-800 | white
        '--bg-chart': chartBgColor,
        '--chart-gradient-border': theming.enabled ? activeGradient : 'transparent',

        // Modals and interactive elements can retain the theme color for accent.
        '--bg-modal': theming.enabled ? palette.main : (isDarkMode ? '#2d3748' : '#FFFFFF'),
        '--bg-calendar-border': calendarBorderGradient,
        '--bg-calendar-header': theming.enabled ? adjustColor(palette.secondary, isDarkMode ? -0.2 : -0.2) : (isDarkMode ? '#111827' : '#E5E7EB'),
        '--bg-input': isDarkMode ? '#374151' : '#FFFFFF',
        // Use a slightly lighter/darker shade for journal entries to make them stand out
        '--bg-journal-entry': isDarkMode ? '#2d3748' : '#F9FAFB',

        '--btn-primary-bg': theming.enabled ? palette.secondary : (isDarkMode ? '#4B5563' : '#E5E7EB'),
        '--btn-secondary-bg': theming.enabled ? palette.tertiary : (isDarkMode ? '#374151' : '#D1D5DB'),
        '--btn-tertiary-bg': theming.enabled ? palette.accent1 : (isDarkMode ? '#4A5568' : '#9CA3AF'),
        '--btn-confirm-bg': theming.enabled ? palette.accent2 : '#22C55E', // Green-500
        '--btn-deny-bg': theming.enabled ? palette.accent3 : '#EF4444', // Red-500

        '--text-color-on-primary': getContrastingTextColor(theming.enabled ? palette.secondary : (isDarkMode ? '#4B5563' : '#E5E7EB'))['--text-color-primary'],
        '--text-color-on-secondary': getContrastingTextColor(theming.enabled ? palette.tertiary : (isDarkMode ? '#374151' : '#D1D5DB'))['--text-color-primary'],
        '--text-color-on-tertiary': getContrastingTextColor(theming.enabled ? palette.accent1 : (isDarkMode ? '#4A5568' : '#9CA3AF'))['--text-color-primary'],
        '--text-color-on-confirm': getContrastingTextColor(theming.enabled ? palette.accent2 : '#22C55E')['--text-color-primary'],
        '--text-color-on-deny': getContrastingTextColor(theming.enabled ? palette.accent3 : '#EF4444')['--text-color-primary'],
        '--text-color-on-input': getContrastingTextColor(isDarkMode ? '#374151' : '#FFFFFF')['--text-color-primary'],


        '--border-color-primary': isDarkMode ? '#4A5568' : '#D1D5DB',
        '--border-color-secondary': isDarkMode ? '#374151' : '#E5E7EB',
        '--focus-ring-color': theming.enabled ? palette.tertiary : '#63B3ED',
        '--toggle-peg-color': isDarkMode ? '#FFFFFF' : '#1F2937', // White in dark mode, gray-800 in light
    };

    // Calculate main text styles and add them to the root properties for global availability
    const mainTextStyles = getContrastingTextColor(themeProperties['--bg-main']);
    Object.assign(themeProperties, mainTextStyles);


    // Generate CSS rules string
    let css = ':root {\n';
    for (const [key, value] of Object.entries(themeProperties)) {
        css += `  ${key}: ${value};\n`;
    }
    css += '}\n\n';

    // Add rules for button states
    const buttonTypes = ['primary', 'secondary', 'tertiary', 'confirm', 'deny'];
    buttonTypes.forEach(type => {
        const baseBgVar = `--btn-${type}-bg`;
        const baseBg = themeProperties[baseBgVar];
        if (!baseBg) return;
        const hsl = hexToHSL(baseBg);
        const hoverBg = HSLToHex(hsl.h, hsl.s, Math.max(0, Math.min(100, hsl.l + (isDarkMode ? 5 : -5))));
        const activeBg = HSLToHex(hsl.h, hsl.s, Math.max(0, Math.min(100, hsl.l + (isDarkMode ? 8 : -8))));

        css += `
            .btn-${type} {
                background-color: var(${baseBgVar});
                color: var(--text-color-on-${type});
            }
            .btn-${type}:hover {
                background-color: ${hoverBg};
            }
            .btn-${type}:active, .btn-${type}.active-view-btn {
                background-color: ${activeBg};
            }
        `;
    });

    // Add rules for backgrounds and text
    css += `
        body.bg-main {
            background: var(--bg-main);
            color: var(--text-color-primary);
        }
        .bg-secondary {
            background-color: var(--bg-secondary);
            box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
        }
        .bg-modal {
            background: var(--bg-modal);
        }
        .fc-col-header-cell {
            background-color: var(--bg-calendar-header) !important;
        }
        .journal-entry {
            background-color: var(--bg-journal-entry);
            border-radius: 0.5rem;
            padding: 1rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.08);
            border: 1px solid var(--border-color-secondary);
        }
        input, textarea, select {
            background-color: var(--bg-input) !important;
            color: var(--text-color-on-input) !important;
            border: 1px solid var(--border-color-primary) !important;
        }
        .collapsible-section {
            border-radius: 0.5rem;
            overflow: hidden;
            margin-bottom: 0.75rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .collapsible-header {
            background-color: var(--bg-secondary);
            padding: 0.75rem 1rem;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .collapsible-header i {
            transition: transform 0.3s ease-in-out;
        }
        .collapsible-content {
            background-color: var(--bg-main);
            padding: 0 1rem; /* No padding when collapsed */
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.4s ease-out, padding 0.4s ease-out;
        }
        .collapsible-section.open .collapsible-header i {
            transform: rotate(180deg);
        }
        .collapsible-section.open .collapsible-content {
            max-height: 1500px; /* A generous height to ensure content is not clipped, avoids vh conflict inside modal */
            padding: 1rem;
        }
        .gradient-bordered-content {
            background: var(--chart-gradient-border);
            padding: 14px;
            border-radius: 0.5rem;
        }
        .gradient-bordered-content > canvas {
            background-color: var(--bg-chart);
            border-radius: 0.25rem; /* Inner radius for the chart itself */
        }

        #advanced-options-content fieldset {
            background-color: var(--bg-secondary);
            border: 1px solid var(--border-color-secondary);
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 1rem;
        }

        /* Styles for month view events */
        .month-view-event-item {
            display: flex;
            align-items: center;
            gap: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            width: 100%;
            font-size: 0.75rem;
        }
        .month-view-icon {
            /* The icon color is now set by the textColor property of the event */
            flex-shrink: 0;
        }
        .month-view-name {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .fc-timegrid-event.fc-event-short {
            min-height: 22px !important; /* Give it a minimum height to be visible */
            padding: 1px 4px !important;    /* Adjust padding to fit content */
        }

        .fc-event-short .fc-event-main-inner {
            align-items: center; /* Vertically center the title */
        }

    `;

    // Inject styles into the document head
    const styleSheet = document.getElementById('dynamic-theme-styles');
    if (styleSheet) {
        styleSheet.textContent = css;
    }

    // Re-render components that depend on theme changes
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

function formatMsToTime(ms) {
    if (isNaN(ms) || ms < 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
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
            const dateToUse = (options.occurrenceDate instanceof Date) ? options.occurrenceDate : (task.dueDate ? new Date(task.dueDate) : null);

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
            document.getElementById('prep-time-amount').value = task.prepTimeAmount || '';
            document.getElementById('prep-time-unit').value = task.prepTimeUnit || 'minutes';

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
    const taskModalEl = document.getElementById('task-modal');
    if (taskModalEl) {
        deactivateModal(taskModalEl);
    }
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

function archiveNonRepeatingTask(task, status, progress = 1) {
    const originalDueDate = new Date(task.originalDueDate || task.dueDate);

    let historicalStatus;
    if (status === 'missed') {
        // For non-repeating tasks, a miss is 'yellow' if partial, 'black' otherwise.
        if (progress > 0 && progress < 1) {
            historicalStatus = 'yellow';
        } else {
            historicalStatus = 'black';
        }
    } else {
        // This case should not happen based on current calls, but as a fallback:
        historicalStatus = status;
    }

    const historicalTask = {
        originalTaskId: task.id,
        name: task.name,
        completionDate: originalDueDate, // The time for calendar placement
        actionDate: new Date(),         // The actual time of action
        status: historicalStatus,
        categoryId: task.categoryId,
        durationAmount: task.estimatedDurationAmount,
        durationUnit: task.estimatedDurationUnit,
        progress: progress,
        originalDueDate: originalDueDate // The scheduled due date
    };
    appState.historicalTasks.push(historicalTask);

    // Instead of deleting, move the full task object to the new archived array.
    if (!appState.archivedTasks) { appState.archivedTasks = []; }
    appState.archivedTasks.push(task);
    tasks = tasks.filter(t => t.id !== task.id); // Remove from active tasks
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

    // Handle the new sensitivity controls
    const sensitivityDefaultToggle = document.getElementById('planner-sensitivity-default-toggle');
    const sensitivitySlider = document.getElementById('planner-sensitivity-slider');

    if (sensitivityDefaultToggle && sensitivitySlider) {
        // A value of exactly 0.5 is considered 'default'
        const isDefault = sensitivitySettings.sValue === 0.5;
        sensitivityDefaultToggle.checked = isDefault;
        sensitivitySlider.disabled = isDefault;
        sensitivitySlider.value = sensitivitySettings.sValue;
    }


    const creationOnClickToggle = document.getElementById('allow-creation-on-click-toggle');
    if (creationOnClickToggle) {
        creationOnClickToggle.checked = calendarSettings.allowCreationOnClick;
    }

    const plannerDefaultIconInput = document.getElementById('planner-default-icon');
    if (plannerDefaultIconInput && plannerSettings) {
        plannerDefaultIconInput.value = plannerSettings.defaultIcon || 'fa-solid fa-map-pin';
    }


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
    const subtitleInput = document.getElementById('app-subtitle-input');
    if (subtitleInput) {
        subtitleInput.value = appSettings.subtitle;
    }
    const goalLabelInput = document.getElementById('app-goal-label-input');
    if (goalLabelInput) {
        goalLabelInput.value = appSettings.weeklyGoalLabel;
    }
    const timeFormatToggle = document.getElementById('time-format-toggle');
    if (timeFormatToggle) {
        timeFormatToggle.checked = appSettings.use24HourFormat;
    }
}

function renderJournalSettings() {
    const container = document.getElementById('journal-settings-content');
    if (!container) return;
    container.innerHTML = journalSettingsTemplate(journalSettings);
}

function renderPerformanceSettings() {
    const amountInput = document.getElementById('calculation-horizon-amount');
    const unitInput = document.getElementById('calculation-horizon-unit');
    if (amountInput && unitInput) {
        amountInput.value = uiSettings.calculationHorizonAmount;
        unitInput.value = uiSettings.calculationHorizonUnit;
    }

    const gpaSystemSelect = document.getElementById('gpa-system-select');
    if (gpaSystemSelect) {
        gpaSystemSelect.value = appSettings.gpaSystem || 'standard';
    }
}

function renderKpiAutomationSettings() {
    const container = document.getElementById('kpi-automation-settings');
    if (!container) return;
    container.innerHTML = kpiAutomationSettingsTemplate(appSettings);
}

function renderHintManager() {
    const container = document.getElementById('hint-manager-content');
    if (!container) return;
    if (!uiSettings.userInteractions) {
        uiSettings.userInteractions = {};
    }
    container.innerHTML = hintManagerTemplate(hints, uiSettings);
}

function renderOtherFeaturesSettings() {
    const closeModalToggle = document.getElementById('close-modal-after-action-toggle');
    if (closeModalToggle) {
        closeModalToggle.checked = uiSettings.closeModalAfterAction;
    }
    // Any other settings for this section would be rendered here
}

function renderEarlyOnTimeSettings() {
    const settings = uiSettings.earlyOnTimeSettings || { enabled: false, displaceCalendar: false, onlyAppointments: false };
    const masterToggle = document.getElementById('early-on-time-toggle');
    const optionsDiv = document.getElementById('early-on-time-options');
    const calendarToggle = document.getElementById('early-on-time-calendar-toggle');
    const appointmentsToggle = document.getElementById('early-on-time-appointments-toggle');

    if (masterToggle) {
        masterToggle.checked = settings.enabled;
    }
    if (optionsDiv) {
        optionsDiv.classList.toggle('hidden', !settings.enabled);
    }
    if (calendarToggle) {
        calendarToggle.checked = settings.displaceCalendar;
    }
    if (appointmentsToggle) {
        appointmentsToggle.checked = settings.onlyAppointments;
    }
}

function renderMonthViewSettings() {
    const container = document.getElementById('month-view-display-options');
    if (!container) return;
    if (!uiSettings.monthView) { // Ensure the object exists
        uiSettings.monthView = { showIcon: true, showTime: false, showName: true, groupTasks: true };
    }
    for (const key in uiSettings.monthView) {
        const checkbox = container.querySelector(`input[name="${key}"]`);
        if (checkbox) {
            checkbox.checked = uiSettings.monthView[key];
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
    renderAppSettings();
    renderVacationManager();
    renderJournalSettings();
    renderPerformanceSettings();
    renderKpiAutomationSettings();
    renderHintManager();
    renderOtherFeaturesSettings(); // Render the new settings
    renderEarlyOnTimeSettings(); // Render the "Early is on Time" settings
    renderMonthViewSettings(); // Render the new month view settings

    // Render the toggle for showing/hiding calendar filters
    const showFiltersToggle = document.getElementById('show-calendar-filters-toggle');
    if (showFiltersToggle) {
        showFiltersToggle.checked = uiSettings.showCalendarFilters;
    }


    // Apply saved collapse states
    const sections = advancedOptionsModal.querySelectorAll('.collapsible-section');
    sections.forEach(section => {
        const key = section.dataset.sectionKey;
        // A section is open ONLY if its state is explicitly saved as false (i.e., isCollapsed: false).
        // Otherwise (if the state is true or undefined), it remains collapsed.
        const shouldBeOpen = uiSettings.advancedOptionsCollapseState[key] === false;
        section.classList.toggle('open', shouldBeOpen);
    });

    activateModal(advancedOptionsModal);
}

function renderVacationManager() {
    const container = document.getElementById('vacation-manager-content');
    if (!container) return;
    if (!appState.vacations) {
        appState.vacations = [];
    }
    // Sort vacations by start date before rendering
    appState.vacations.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    container.innerHTML = vacationManagerTemplate(appState.vacations, categories);

    const form = document.getElementById('add-vacation-form');
    if (form) {
        form.addEventListener('submit', handleAddVacation);
    }
}

function openTaskView(eventId, isHistorical, occurrenceDate) {
    let taskOrHistoryItem;
    const getBaseId = (id) => {
        if (!id || !id.includes('_')) return id;
        const lastUnderscoreIndex = id.lastIndexOf('_');
        return id.substring(0, lastUnderscoreIndex);
    };

    if (isHistorical) {
        taskOrHistoryItem = appState.historicalTasks.find(h => 'hist_' + h.originalTaskId + '_' + h.completionDate === eventId);
        if (!taskOrHistoryItem) {
            taskOrHistoryItem = tasks.find(t => t.id === eventId) || (appState.archivedTasks && appState.archivedTasks.find(t => t.id === eventId));
        }
    } else {
        taskOrHistoryItem = tasks.find(t => t.id === eventId);
        if (!taskOrHistoryItem && eventId && eventId.includes('_')) {
            const baseTaskId = getBaseId(eventId);
            taskOrHistoryItem = tasks.find(t => t.id === baseTaskId);
        }
    }

    if (!taskOrHistoryItem && !isHistorical) {
        const baseTaskId = getBaseId(eventId);
        if (baseTaskId) {
            const matchingHistory = appState.historicalTasks
                .filter(h => h.originalTaskId === baseTaskId)
                .sort((a, b) => new Date(b.actionDate) - new Date(a.actionDate));
            if (matchingHistory.length > 0) {
                if (occurrenceDate) {
                    const exactMatch = matchingHistory.find(h => new Date(h.completionDate).getTime() === new Date(occurrenceDate).getTime());
                    if (exactMatch) taskOrHistoryItem = exactMatch;
                }
                if (!taskOrHistoryItem) taskOrHistoryItem = matchingHistory[0];
                isHistorical = true;
            }
        }
    }

    if (!taskOrHistoryItem) {
        console.error("Task or history item not found for opening view:", eventId);
        return;
    }

    if (isHistorical && !taskOrHistoryItem.id) {
        taskOrHistoryItem.id = eventId.replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    const taskViewContentEl = document.getElementById('task-view-content');
    const taskStatsContentEl = document.getElementById('task-stats-content');
    const taskViewModalEl = document.getElementById('task-view-modal');
    const borderWrapper = document.getElementById('task-view-modal-border-wrapper');

    if (!taskViewContentEl || !taskStatsContentEl || !taskViewModalEl || !borderWrapper) {
        console.error("Could not find task view modal elements in the DOM.");
        return;
    }

    const updateBorder = (task) => {
        if (!borderWrapper) return;
        let gpaPercent = 0;
        const gpaMap = { blue: 4.0, green: 3.0, yellow: 2.0, red: 1.0, black: 0.0 };
        if (isHistorical) {
            gpaPercent = (gpaMap[task.status] || 0) / 4.0;
        } else {
            const currentTask = tasks.find(t => t.id === task.id);
            if (currentTask) {
                gpaPercent = typeof currentTask.coloringGpa === 'number' ? currentTask.coloringGpa : (gpaMap[currentTask.status] || 0) / 4.0;
            }
        }
        const baseColor = interpolateFiveColors(gpaPercent);
        const isDarkMode = !document.body.classList.contains('light-mode');
        const topColor = adjustColor(baseColor, isDarkMode ? 0.2 : -0.2);
        const bottomColor = adjustColor(baseColor, isDarkMode ? -0.2 : 0.2);
        const gradient = `linear-gradient(to bottom, ${topColor}, ${bottomColor})`;
        borderWrapper.style.background = gradient;
    };

    updateBorder(taskOrHistoryItem);

    if (!isHistorical) {
        taskViewModalEl.dataset.viewingTaskId = taskOrHistoryItem.id;
    } else {
        delete taskViewModalEl.dataset.viewingTaskId;
    }

    taskViewContentEl.innerHTML = taskViewTemplate(taskOrHistoryItem, { categories, appSettings, isHistorical });
    taskViewContentEl.classList.remove('hidden');
    taskStatsContentEl.classList.add('hidden');
    taskStatsContentEl.innerHTML = '';

    const newContentView = taskViewContentEl.cloneNode(true);
    taskViewContentEl.parentNode.replaceChild(newContentView, taskViewContentEl);

    const afterAction = (andRefreshCalendar = true) => {
        if (uiSettings.closeModalAfterAction) {
            deactivateModal(taskViewModalEl);
            delete taskViewModalEl.dataset.viewingTaskId;
        }
        if (andRefreshCalendar && calendar) calendar.refetchEvents();
    };

    newContentView.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const taskId = target.dataset.taskId || (isHistorical ? taskOrHistoryItem.originalTaskId : taskOrHistoryItem.id);
        const historyEventId = target.dataset.historyEventId;
        let task = tasks.find(t => t.id === taskId);

        const refreshModal = () => {
            // Re-find the task in case it was modified by the action
            const currentTask = tasks.find(t => t.id === taskId);
            if (currentTask) {
                openTaskView(taskId, false, occurrenceDate);
            } else {
                // If task is no longer in active list, it must have been completed/archived.
                // Close the modal and refresh the calendar.
                afterAction(true);
            }
        };

        const checkCompletionAndRefresh = () => {
            task = tasks.find(t => t.id === taskId); // Re-fetch task state
            if (task && !task.confirmationState) {
                refreshModal();
            } else if (task && task.confirmationState) {
                refreshModal(); // show confirmation
            } else {
                afterAction(true); // closed because task was completed/archived
            }
        };

        switch (action) {
            case 'editTaskFromView':
                deactivateModal(taskViewModalEl);
                openModal(taskId);
                break;
            case 'triggerDeleteFromView':
                triggerDelete(taskId);
                openTaskView(eventId, isHistorical, occurrenceDate);
                break;
            case 'confirmCompletion':
                confirmCompletionAction(taskId, target.dataset.confirmed === 'true');
                // Re-open the view to reflect the new state. This handles both "Yes" and "No" paths.
                openTaskView(eventId, isHistorical, occurrenceDate);
                break;
            case 'confirmMiss':
                confirmMissAction(taskId, target.dataset.confirmed === 'true');
                openTaskView(eventId, isHistorical, occurrenceDate);
                break;
            case 'confirmUndo':
                confirmUndoAction(taskId, target.dataset.confirmed === 'true');
                openTaskView(eventId, isHistorical, occurrenceDate);
                break;
            case 'confirmDeleteFromView':
            case 'confirmDeleteHistoryRecordFromView':
                if (action === 'confirmDeleteFromView') {
                    confirmDeleteAction(taskId, true); // This will remove the task
                }
                if (action === 'confirmDeleteHistoryRecordFromView') {
                    appState.historicalTasks = appState.historicalTasks.filter(h => 'hist_' + h.originalTaskId + '_' + h.completionDate !== historyEventId);
                    saveData();
                }
                afterAction(); // Correct for delete actions, as the view should close or calendar should update
                break;

            case 'triggerCompletion':
                if (task) { triggerCompletion(taskId); refreshModal(); }
                break;
            case 'handleOverdue':
                if (task) { handleOverdueChoice(taskId, target.dataset.choice); refreshModal(); }
                break;
            case 'triggerDeleteFromView':
                if (task) { triggerDelete(taskId); refreshModal(); }
                break;
            case 'triggerUndo':
                if (task) { triggerUndoConfirmation(taskId); refreshModal(); }
                break;
            case 'incrementCount':
                if (task) { incrementCount(taskId); checkCompletionAndRefresh(); }
                break;
            case 'decrementCount':
                if (task) { decrementCount(taskId); refreshModal(); }
                break;
            case 'toggleTimer':
                if (task) { toggleTimer(taskId); checkCompletionAndRefresh(); }
                break;
            case 'editProgress':
                if (task) { editProgress(taskId); }
                break;
            case 'saveProgress':
                if (task) { saveProgressEdit(taskId); checkCompletionAndRefresh(); }
                break;
            case 'cancelProgress':
                if (task) { cancelProgressEdit(taskId); refreshModal(); }
                break;
            case 'cancelDeleteFromView':
                if (task) {
                    task.confirmationState = null;
                    const taskInList = tasks.find(t => t.id === taskId);
                    if(taskInList) taskInList.confirmationState = null;
                    saveData();
                    refreshModal();
                }
                break;
            case 'cancelDeleteHistoryRecordFromView':
                openTaskView(historyEventId, true);
                break;
            case 'viewTaskStats':
                renderTaskStats(taskId);
                break;
            case 'editTaskFromView':
                afterAction(false);
                openModal(taskId, { occurrenceDate });
                break;
            case 'triggerDeleteHistoryRecordFromView':
                const confirmationDiv = newContentView.querySelector(`#task-view-confirmation-${taskOrHistoryItem.id}`);
                const actionsDiv = newContentView.querySelector('.responsive-button-grid');
                if (confirmationDiv && actionsDiv) {
                    actionsDiv.classList.add('hidden');
                    confirmationDiv.innerHTML = taskViewHistoryDeleteConfirmationTemplate(historyEventId, taskId);
                }
                break;
        }
    });
    activateModal(taskViewModalEl);
}

function renderTaskStats(taskId) {
    const taskViewContentEl = document.getElementById('task-view-content');
    const taskStatsContentEl = document.getElementById('task-stats-content');

    const isActive = tasks.some(t => t.id === taskId);
    const isFullyCompleted = !isActive;

    let task = tasks.find(t => t.id === taskId);
    if (!task && appState.archivedTasks) {
        task = appState.archivedTasks.find(t => t.id === taskId);
    }

    const history = appState.historicalTasks
        .map((h, index) => ({ ...h, historyId: `hist-${index}` }))
        .filter(ht => ht.originalTaskId === taskId)
        .sort((a, b) => new Date(b.completionDate) - new Date(a.completionDate));

    if (!task && history.length > 0) {
        task = { id: taskId, name: history[0].name, isKpi: false };
    }

    if (!task) {
        console.error("Cannot find task or history for stats view:", taskId);
        return;
    }

    if (taskViewContentEl) taskViewContentEl.classList.add('hidden');
    if (taskStatsContentEl) taskStatsContentEl.classList.remove('hidden');

    const gpaMap = { blue: 4.0, green: 3.0, yellow: 2.0, red: 1.0, black: 0.0 };
    const completions = history.filter(h => (gpaMap[h.status] || 0) >= 2.0).length;
    const misses = history.length - completions;
    const total = history.length;
    const stats = {
        completions,
        misses,
        total,
        completionRate: total > 0 ? ((completions / total) * 100).toFixed(1) : 'N/A',
        overallGpa: null
    };

    if (total > 0) {
        const totalGpaPoints = history.reduce((sum, h) => sum + (gpaMap[h.status] || 0), 0);
        const averageGpa = totalGpaPoints / total;
        const gpaPercent = averageGpa / 4.0;
        const gpaColor = interpolateFiveColors(gpaPercent);
        const textStyles = getContrastingTextColor(gpaColor);

        stats.overallGpa = {
            grade: gpaToLetterGrade(averageGpa),
            color: gpaColor,
            textColor: textStyles['--text-color-primary'],
            textShadow: textStyles['--text-shadow']
        };
    }

    const historyHtml = history.length > 0
        ? history.map(h => {
            const formattedDate = new Date(h.completionDate).toLocaleDateString();
            const gpa = gpaMap[h.status] || 0;
            const grade = gpaToLetterGrade(gpa);
            const gpaPercent = gpa / 4.0;
            const gradeColor = interpolateFiveColors(gpaPercent);
            const textColorStyles = getContrastingTextColor(gradeColor);
            const textColor = textColorStyles['--text-color-primary'];
            const textShadow = textColorStyles['--text-shadow'];
            const historyEventId = `hist_${h.originalTaskId}_${h.completionDate}`;

            return `<div id="history-item-${h.historyId}"
                         class="flex justify-between items-center text-sm p-2 rounded-md cursor-pointer hover:bg-secondary"
                         data-action="viewHistoryRecord"
                         data-history-event-id="${historyEventId}">
                        <span>${formattedDate}:
                            <span class="font-bold inline-block text-center w-8 rounded py-1"
                                  style="background-color: ${gradeColor}; color: ${textColor}; text-shadow: ${textShadow};">
                                ${grade}
                            </span>
                        </span>
                        <button data-action="triggerHistoryDelete" data-history-id="${h.historyId}" data-task-id="${taskId}" class="btn btn-clear text-lg font-bold" title="Delete this record">&times;</button>
                    </div>`;
        }).join('')
        : '<div class="italic p-2">No history yet.</div>';

    const chartData = processTaskHistoryForChart(task, history);
    const hasChartData = chartData.labels.length > 0;

    taskStatsContentEl.innerHTML = taskStatsTemplate(task, stats, historyHtml, hasChartData, isFullyCompleted);

    if (hasChartData) {
        const ctx = document.getElementById('task-history-chart').getContext('2d');
        const showLines = chartData.labels.length > 1;
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'Completions',
                        data: chartData.completions,
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        borderColor: 'rgba(22, 163, 74, 1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1,
                        showLine: showLines
                    },
                    {
                        label: 'Misses',
                        data: chartData.misses,
                        backgroundColor: 'rgba(220, 38, 38, 0.2)',
                        borderColor: 'rgba(185, 28, 28, 1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1,
                        showLine: showLines
                    }
                ]
            },
            options: {
                scales: {
                    x: { title: { display: true, text: 'Date' } },
                    y: { beginAtZero: true, title: { display: true, text: 'Count' }, ticks: { stepSize: 1 } }
                },
                plugins: { tooltip: { mode: 'index', intersect: false } },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    const backBtn = taskStatsContentEl.querySelector('[data-action="backToTaskView"]');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (taskStatsContentEl) taskStatsContentEl.innerHTML = '';
            if (taskStatsContentEl) taskStatsContentEl.classList.add('hidden');
            if (taskViewContentEl) taskViewContentEl.classList.remove('hidden');
        }, { once: true });
    }

    const reinstateBtn = taskStatsContentEl.querySelector('[data-action="reinstateTask"]');
    if (reinstateBtn) {
        reinstateBtn.addEventListener('click', () => {
            const archivedTask = appState.archivedTasks.find(t => t.id === taskId);
            if (archivedTask) {
                appState.archivedTasks = appState.archivedTasks.filter(t => t.id !== taskId);
                archivedTask.completed = false;
                archivedTask.status = 'green';
                archivedTask.confirmationState = null;
                archivedTask.cycleEndDate = null;
                archivedTask.dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                tasks.push(archivedTask);
                saveData();
                updateAllTaskStatuses(true);
                if (calendar) calendar.refetchEvents();
                const taskViewModalEl = document.getElementById('task-view-modal');
                if (taskViewModalEl) deactivateModal(taskViewModalEl);
                alert(`Task "${archivedTask.name}" has been reinstated!`);
            }
        });
    }

    const historyList = document.getElementById('detailed-history-list');
    if (historyList) {
        historyList.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            const historyId = target.dataset.historyId;
            const historyEventId = target.dataset.historyEventId;
            const historyItemEl = document.getElementById(`history-item-${historyId}`);

            if (action === 'viewHistoryRecord') {
                openTaskView(historyEventId, true);
            } else if (action === 'triggerHistoryDelete') {
                e.stopPropagation();
                if (historyItemEl) {
                    historyItemEl.innerHTML = historyDeleteConfirmationTemplate(historyId, taskId);
                }
            } else if (action === 'cancelHistoryDelete') {
                renderTaskStats(taskId);
            } else if (action === 'confirmHistoryDelete') {
                confirmHistoryDelete(historyId, taskId, target.dataset.deleteType);
            }
        });
    }
}

function renderCalendarCategoryFilters() {
    const container = document.getElementById('calendar-category-filters');
    if (!container) return;

    if (!uiSettings.showCalendarFilters) {
        container.innerHTML = '';
        return;
    }

    // Ensure all categories have a default setting
    if (!uiSettings.calendarCategoryFilters) {
        uiSettings.calendarCategoryFilters = {};
    }
    categories.forEach(cat => {
        if (!uiSettings.calendarCategoryFilters[cat.id]) {
            uiSettings.calendarCategoryFilters[cat.id] = { show: true, schedule: true };
        }
    });
    // Ensure 'uncategorized' has a default setting
    if (!uiSettings.calendarCategoryFilters['null']) {
        uiSettings.calendarCategoryFilters['null'] = { show: true, schedule: true };
    }

    container.innerHTML = calendarCategoryFilterTemplate(categories, uiSettings.calendarCategoryFilters, calendarSettings.filterTargetView);
}

function renderHistoricalOverview(sortBy = 'lastCompleted', sortDir = 'desc') {
    const listContainer = document.getElementById('historical-overview-list');
    if (!listContainer) return;

    // 1. Group history by original task ID
    const historyByTask = {};
    appState.historicalTasks.forEach(h => {
        if (!historyByTask[h.originalTaskId]) {
            historyByTask[h.originalTaskId] = [];
        }
        historyByTask[h.originalTaskId].push(h);
    });

    // 2. Process each group to get stats
    const gpaMap = { blue: 4.0, green: 3.0, yellow: 2.0, red: 1.0, black: 0.0 };
    let processedTasks = Object.keys(historyByTask).map(taskId => {
        const history = historyByTask[taskId];
        const lastEntry = history.sort((a, b) => new Date(b.completionDate) - new Date(a.completionDate))[0];

        const totalGpa = history.reduce((sum, h) => sum + (gpaMap[h.status] || 0), 0);
        const averageGpa = history.length > 0 ? totalGpa / history.length : 0;
        const gpaPercent = averageGpa / 4.0; // Scale 0-4 GPA to 0-1 for color interpolation

        const category = categories.find(c => c.id === lastEntry.categoryId);

        return {
            id: taskId,
            name: lastEntry.name,
            lastCompleted: lastEntry.completionDate,
            gpa: averageGpa,
            gpaColor: interpolateFiveColors(gpaPercent),
            categoryColor: category ? category.color : '#374151'
        };
    });

    // 3. Sort the processed tasks
    processedTasks.sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') {
            comparison = a.name.localeCompare(b.name);
        } else if (sortBy === 'lastCompleted') {
            comparison = new Date(b.lastCompleted) - new Date(a.lastCompleted);
        } else if (sortBy === 'gpa') {
            comparison = b.gpa - a.gpa;
        }
        return sortDir === 'asc' ? -comparison : comparison;
    });

    // 4. Render the cards
    if (processedTasks.length === 0) {
        listContainer.innerHTML = '<p class="italic text-center col-span-full">No historical tasks found.</p>';
        return;
    }
    listContainer.innerHTML = processedTasks.map(historicalTaskCardTemplate).join('');
}


function openHistoricalOverviewModal() {
    const modal = document.getElementById('historical-overview-modal');
    if (!modal) return;

    renderHistoricalOverview(); // Initial render with default sort

    const sortBySelect = modal.querySelector('#historical-sort-by');
    const sortDirSelect = modal.querySelector('#historical-sort-direction');

    const sortHandler = () => {
        renderHistoricalOverview(sortBySelect.value, sortDirSelect.value);
    };

    sortBySelect.removeEventListener('change', sortHandler); // Remove old listener
    sortDirSelect.removeEventListener('change', sortHandler); // Remove old listener
    sortBySelect.addEventListener('change', sortHandler);
    sortDirSelect.addEventListener('change', sortHandler);

    const listContainer = modal.querySelector('#historical-overview-list');
    const clickHandler = (e) => {
        const card = e.target.closest('.historical-task-card');
        if (card) {
            const taskId = card.dataset.taskId;
            deactivateModal(modal); // Close this modal before opening the next one
            openTaskView(taskId, true); // Open in historical mode
        }
    };
    listContainer.removeEventListener('click', clickHandler); // Remove old listener
    listContainer.addEventListener('click', clickHandler);

    const closeButton = modal.querySelector('.close-button');
    const closeHandler = () => deactivateModal(modal);
    closeButton.removeEventListener('click', closeHandler); // Remove old listener
    closeButton.addEventListener('click', closeHandler);

    activateModal(modal);
}

function confirmHistoryDelete(historyId, taskId, deleteType) {
    if (deleteType === 'single') {
        // The historyId is in the format `hist-${index}`
        const indexToDelete = parseInt(historyId.split('-')[1], 10);
        if (!isNaN(indexToDelete)) {
            appState.historicalTasks.splice(indexToDelete, 1);
        }
    } else if (deleteType === 'all') {
        appState.historicalTasks = appState.historicalTasks.filter(h => h.originalTaskId !== taskId);
    }

    saveData();
    if (calendar) calendar.refetchEvents();
    renderTaskStats(taskId); // Re-render the stats view to show the change
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
            // The 'active-view-btn' class provides the "lit up" effect.
            btn.classList.remove('active-view-btn');
            if (btn.dataset.mode === theming.mode) {
                btn.classList.add('active-view-btn');
            }
        });
    }

    const calendarGradientSelector = document.getElementById('calendar-gradient-selector');
    if (calendarGradientSelector) {
        calendarGradientSelector.querySelectorAll('.calendar-gradient-btn').forEach(btn => {
            btn.classList.remove('active-view-btn');
            if (btn.dataset.source === theming.calendarGradientSource) {
                btn.classList.add('active-view-btn');
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
    // Reset container classes
    kpiChartContainer.className = 'relative';

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
            <label for="kpi-range-select" class="form-label mb-0">Range:</label>
            <select id="kpi-range-select">
                <option value="8d" ${uiSettings.kpiChartDateRange === '8d' ? 'selected' : ''}>Last 8 Days</option>
                <option value="30d" ${uiSettings.kpiChartDateRange === '30d' ? 'selected' : ''}>Last 30 Days</option>
                <option value="90d" ${uiSettings.kpiChartDateRange === '90d' ? 'selected' : ''}>Last 90 Days</option>
            </select>
        </div>
        <div class="flex items-center space-x-2">
            <label class="form-label mb-0">View:</label>
            <div class="flex space-x-1 rounded-md p-1 bg-secondary">
                <button data-mode="single" class="btn btn-secondary btn-sm kpi-view-toggle-btn ${uiSettings.kpiChartMode === 'single' ? 'active-view-btn' : ''}">Combined</button>
                <button data-mode="stacked" class="btn btn-secondary btn-sm kpi-view-toggle-btn ${uiSettings.kpiChartMode === 'stacked' ? 'active-view-btn' : ''}">Stacked</button>
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
            // Use new status categories to correctly identify completions and misses
            const completionStatuses = ['blue', 'green', 'yellow'];
            const missStatuses = ['red', 'black'];

            if (completionStatuses.includes(h.status)) {
                dailyData.get(dateKey).completions++;
            } else if (missStatuses.includes(h.status)) {
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
        kpiChartContainer.classList.add('gradient-bordered-content');
        kpiChartContainer.style.height = '400px';
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
        kpiChartContainer.classList.add('kpi-chart-stack-wrapper');
        kpiChartContainer.style.height = ''; // Let it grow

        datasets.forEach((dataset, index) => {
            const chartWrapper = document.createElement('div');
            chartWrapper.className = 'gradient-bordered-content'; // Apply border to each chart
            chartWrapper.style.height = '250px'; // Give each chart a height

            const canvas = document.createElement('canvas');
            canvas.id = `kpi-chart-${index}`;
            chartWrapper.appendChild(canvas);
            kpiChartContainer.appendChild(chartWrapper);

            const ctx = canvas.getContext('2d');
            const singleChartOptions = JSON.parse(JSON.stringify(chartOptions));
            singleChartOptions.plugins.legend.display = false;
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

function renderDashboardContent() {
    if (weeklyGoalsEl) {
        const currentWeek = appState.weeks[CURRENT_WEEK_INDEX];
        const weeklyGoal = currentWeek ? (currentWeek.weeklyGoals || 'Set new goals for the week...') : 'Set new goals for the week...';

        const contentLength = weeklyGoal.length;
        const truncateLength = 500;
        let goalHtml;
        let toggleButtonHtml = '';

        if (contentLength > truncateLength) {
            const truncatedContent = weeklyGoal.substring(0, truncateLength).replace(/\n/g, '<br>');
            goalHtml = `<div class="prose prose-sm mt-2 max-w-none">${truncatedContent}...</div>`;
            toggleButtonHtml = `<button data-action="toggleDashboardGoalContent" class="btn btn-clear text-xs mt-1">Show More</button>`;
        } else {
            goalHtml = `<div class="prose prose-sm mt-2 max-w-none">${weeklyGoal.replace(/\n/g, '<br>')}</div>`;
        }

        weeklyGoalsEl.innerHTML = goalHtml + toggleButtonHtml;
        weeklyGoalsEl.dataset.fullGoal = encodeURIComponent(weeklyGoal);
    }
    renderCategoryPieChart();
    renderKpiList();
}

function renderCategoryPieChart() {
    const pieChartContainer = document.getElementById('category-pie-chart-container');
    const pieChartCanvas = document.getElementById('category-pie-chart');
    const pieChartLegend = document.getElementById('category-pie-chart-legend');

    if (!pieChartCanvas || !pieChartLegend || !pieChartContainer) {
        return;
    }

    // 1. Determine the date range (same as KPI chart)
    const now = new Date();
    if (uiSettings.kpiWeekOffset !== 0) {
        now.setDate(now.getDate() + (uiSettings.kpiWeekOffset * 7));
    }
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // 2. Aggregate data
    const categoryTime = {}; // { categoryId: { name, color, totalMinutes } }

    const processTask = (task, date) => {
        if (!task.estimatedDurationAmount) return;

        const taskDate = new Date(date);
        if (taskDate >= weekStart && taskDate < weekEnd) {
            const categoryId = task.categoryId || 'uncategorized';
            const durationMs = getDurationMs(task.estimatedDurationAmount, task.estimatedDurationUnit);
            const durationMinutes = durationMs / MS_PER_MINUTE;

            if (!categoryTime[categoryId]) {
                const category = categories.find(c => c.id === categoryId);
                categoryTime[categoryId] = {
                    name: category ? category.name : 'Uncategorized',
                    color: category ? category.color : '#808080',
                    totalMinutes: 0
                };
            }
            categoryTime[categoryId].totalMinutes += durationMinutes;
        }
    };

    // Process active tasks (considering their occurrences)
    tasks.forEach(task => {
        const occurrences = getOccurrences(task, weekStart, weekEnd);
        occurrences.forEach(occurrenceDate => {
            processTask(task, occurrenceDate);
        });
    });

    // Process historical tasks
    appState.historicalTasks.forEach(historicalTask => {
        processTask({
            categoryId: historicalTask.categoryId,
            estimatedDurationAmount: historicalTask.durationAmount,
            estimatedDurationUnit: historicalTask.durationUnit
        }, historicalTask.completionDate);
    });

    const labels = Object.values(categoryTime).map(c => c.name);
    const data = Object.values(categoryTime).map(c => c.totalMinutes);
    const backgroundColors = Object.values(categoryTime).map(c => c.color);
    const totalMinutes = data.reduce((sum, value) => sum + value, 0);

    if (totalMinutes === 0) {
        pieChartContainer.innerHTML = '<p class="text-gray-500 italic text-center p-4">No task time recorded for this week.</p>';
        return;
    }

    if (!document.getElementById('category-pie-chart')) {
        pieChartContainer.innerHTML = `
            <h2 class="text-lg font-semibold mb-3 border-b pb-2 text-center">Weekly Time by Category</h2>
            <div class="relative" style="min-height: 400px;">
                <canvas id="category-pie-chart"></canvas>
            </div>
            <div id="category-pie-chart-legend" class="flex flex-wrap justify-center gap-4 mt-4"></div>
        `;
    }

    const existingChart = Chart.getChart(pieChartCanvas);
    if (existingChart) {
        existingChart.destroy();
    }

    new Chart(pieChartCanvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1,
                borderColor: document.body.classList.contains('light-mode') ? '#fff' : '#111827',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // We are creating a custom legend
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            const value = context.parsed;
                            const hours = Math.floor(value / 60);
                            const minutes = Math.round(value % 60);
                            label += `${hours}h ${minutes}m`;
                            const percentage = ((value / totalMinutes) * 100).toFixed(1);
                            label += ` (${percentage}%)`;
                            return label;
                        }
                    }
                }
            }
        }
    });

    pieChartLegend.innerHTML = '';
    labels.forEach((label, index) => {
        const minutes = data[index];
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.round(minutes % 60);
        const percentage = totalMinutes > 0 ? ((minutes / totalMinutes) * 100).toFixed(1) : 0;
        const timeString = `${hours}h ${remainingMinutes}m`;

        const legendItem = `
            <div class="flex items-center text-sm">
                <span class="w-4 h-4 mr-2 rounded-full" style="background-color: ${backgroundColors[index]}"></span>
                <span>${label}: ${timeString} (${percentage}%)</span>
            </div>
        `;
        pieChartLegend.insertAdjacentHTML('beforeend', legendItem);
    });
}

function renderIconPicker(selectedStyle) {
    const content = document.getElementById('icon-picker-content');
    if (!content) return;
    content.innerHTML = iconPickerTemplate(iconCategories, selectedStyle);
}

function openIconPicker(context = 'task') {
    if (!uiSettings.lastIconStyle) {
        uiSettings.lastIconStyle = 'fa-solid'; // Ensure a default if it's somehow missing
    }
    renderIconPicker(uiSettings.lastIconStyle);
    iconPickerModal.dataset.context = context; // Store the context
    activateModal(iconPickerModal);
}

function renderJournalEntry(entry) {
    const buttonsHtml = entry.isWeeklyGoal ? '' : `
        <div class="flex justify-end space-x-2 mt-2">
            <button data-action="editJournal" data-id="${entry.id}" class="btn btn-clear text-xs">Edit</button>
            <button data-action="deleteJournal" data-id="${entry.id}" class="btn btn-clear text-xs">Delete</button>
        </div>
    `;

    const contentLength = entry.content.length;
    const truncateLength = 500;
    let contentHtml;
    let toggleButtonHtml = '';

    // Use a unique ID for the content display area for easier targeting
    const contentDisplayId = `journal-content-${entry.id}`;

    if (contentLength > truncateLength) {
        const truncatedContent = entry.content.substring(0, truncateLength);
        contentHtml = `<div id="${contentDisplayId}" class="prose mt-2 max-w-none journal-content-display">${truncatedContent}...</div>`;
        // Pass the content display ID to the button
        toggleButtonHtml = `<button data-action="toggleJournalContent" data-entry-id="${entry.id}" data-content-id="${contentDisplayId}" class="btn btn-clear text-xs mt-2">Show More</button>`;
    } else {
        contentHtml = `<div id="${contentDisplayId}" class="prose mt-2 max-w-none journal-content-display">${entry.content}</div>`;
    }

    return `
        <div class="journal-entry p-4 rounded-lg shadow" data-id="${entry.id}" data-full-content="${encodeURIComponent(entry.content)}">
            <div class="flex justify-between items-start">
                <h3 class="text-xl font-semibold">${entry.icon ? `<i class="${entry.icon} mr-2"></i>` : ''}${entry.title}</h3>
                <span class="text-xs text-gray-400">${new Date(entry.createdAt).toLocaleString()}</span>
            </div>
            ${contentHtml}
            ${toggleButtonHtml}
            <div class="text-xs text-gray-500 mt-2 text-right">${entry.editedAt ? `(Edited: ${new Date(entry.editedAt).toLocaleString()})` : ''}</div>
            ${buttonsHtml}
        </div>
    `;
}

function renderJournal() {
    const list = document.getElementById('journal-list');
    if (!list) return;

    list.innerHTML = '';

    const hasJournalEntries = appState.journal.length > 0;
    const hasWeeklyGoals = appState.weeks.some(w => w.weeklyGoals && w.weeklyGoals !== 'Set new goals for the week...');

    if (!hasJournalEntries && !hasWeeklyGoals) {
        list.innerHTML = '<p class="text-gray-500 text-center italic">No journal entries or weekly goals yet.</p>';
        return;
    }

    const sortBy = document.getElementById('journal-sort-by').value;
    const sortDir = document.getElementById('journal-sort-direction').value;

    if (sortBy === 'date') {
        // Group all journal entries by their week's start date for efficient lookup.
        const entriesByWeek = {};
        appState.journal.forEach(entry => {
            const entryDate = new Date(entry.createdAt);
            const weekStart = startOfWeek(entryDate, { weekStartsOn: 0 }).toISOString();
            if (!entriesByWeek[weekStart]) {
                entriesByWeek[weekStart] = [];
            }
            entriesByWeek[weekStart].push(entry);
        });

        // Filter and sort the weeks that should be displayed.
        const weeksToDisplay = appState.weeks.filter(week => {
            const hasGoal = week.weeklyGoals && week.weeklyGoals !== 'Set new goals for the week...';
            const hasEntries = entriesByWeek[week.startDate] && entriesByWeek[week.startDate].length > 0;
            return hasGoal || hasEntries;
        }).sort((a, b) => {
            const dateA = new Date(a.startDate);
            const dateB = new Date(b.startDate);
            return sortDir === 'asc' ? dateA - dateB : dateB - dateA;
        });

        if (weeksToDisplay.length === 0) {
             list.innerHTML = '<p class="text-gray-500 text-center italic">No journal entries or weekly goals yet.</p>';
             return;
        }

        weeksToDisplay.forEach(weekData => {
            const weekStartDate = new Date(weekData.startDate);
            const weekEndDate = new Date(weekStartDate);
            weekEndDate.setDate(weekEndDate.getDate() + 6);

            // Render a simple header for the week
            const headerHtml = `
                <div class="journal-week-header my-4 p-3 rounded-lg">
                    <h3 class="text-lg font-bold">Week of ${weekStartDate.toLocaleDateString()} - ${weekEndDate.toLocaleDateString()}</h3>
                </div>
            `;
            list.insertAdjacentHTML('beforeend', headerHtml);

            // If the week has a goal, render it as a special journal entry.
            const hasGoal = weekData.weeklyGoals && weekData.weeklyGoals !== 'Set new goals for the week...';
            if (hasGoal) {
                 const goalEntry = {
                    id: `weekly-goal-${weekData.startDate}`,
                    title: appSettings.weeklyGoalLabel || "Mission/Goals for this Week",
                    content: weekData.weeklyGoals,
                    createdAt: weekData.startDate,
                    icon: journalSettings.weeklyGoalIcon || 'fa-solid fa-bullseye',
                    isWeeklyGoal: true
                };
                list.insertAdjacentHTML('beforeend', renderJournalEntry(goalEntry));
            }

            // Get and sort the regular journal entries for this specific week.
            const entries = entriesByWeek[weekData.startDate] || [];
            entries.sort((a, b) => {
                const dateA = new Date(a.createdAt);
                const dateB = new Date(b.createdAt);
                return sortDir === 'asc' ? dateA - dateB : dateB - dateA;
            });

            // Render the sorted entries.
            entries.forEach(entry => list.insertAdjacentHTML('beforeend', renderJournalEntry(entry)));
        });

    } else if (sortBy === 'icon') {
        const entriesByIcon = {};
        appState.journal.forEach(entry => {
            const icon = entry.icon || 'No Icon';
            if (!entriesByIcon[icon]) {
                entriesByIcon[icon] = [];
            }
            entriesByIcon[icon].push(entry);
        });

        // Gather weekly goals and add them to the 'entriesByIcon' object
        const weeklyGoalIcon = journalSettings.weeklyGoalIcon || 'fa-solid fa-bullseye';
        if (!entriesByIcon[weeklyGoalIcon]) {
            entriesByIcon[weeklyGoalIcon] = [];
        }

        appState.weeks.forEach(week => {
            if (week.weeklyGoals && week.weeklyGoals !== 'Set new goals for the week...') {
                const goalEntry = {
                    id: `weekly-goal-${week.startDate}`,
                    title: `Weekly Goal`,
                    content: week.weeklyGoals,
                    createdAt: week.startDate,
                    icon: weeklyGoalIcon,
                    isWeeklyGoal: true
                };
                entriesByIcon[weeklyGoalIcon].push(goalEntry);
            }
        });

        if (entriesByIcon[weeklyGoalIcon] && entriesByIcon[weeklyGoalIcon].length === 0) {
            delete entriesByIcon[weeklyGoalIcon];
        }

        // Cleanup stale collapse states
        const currentIcons = new Set(Object.keys(entriesByIcon));
        if (uiSettings.journalIconCollapseState) {
            for (const iconKey in uiSettings.journalIconCollapseState) {
                if (!currentIcons.has(iconKey)) {
                    delete uiSettings.journalIconCollapseState[iconKey];
                }
            }
        } else {
            uiSettings.journalIconCollapseState = {};
        }


        const sortedIcons = Object.keys(entriesByIcon).sort((a, b) => a.localeCompare(b));
        if (sortDir === 'desc') sortedIcons.reverse();

        sortedIcons.forEach(icon => {
            const displayName = icon.replace('fa-solid', '').replace('fa-brands', '').replace('fa-', '').replace(/-/g, ' ').trim().replace(/\b\w/g, l => l.toUpperCase());

            const isCollapsed = uiSettings.journalIconCollapseState[icon] === true;
            const chevronClass = isCollapsed ? 'fa-chevron-right' : 'fa-chevron-down';
            const entriesContainerDisplay = isCollapsed ? 'display: none;' : '';

            const groupHtml = `
                <div class="journal-icon-group">
                    <div class="journal-icon-header my-4 p-2 bg-gray-800 rounded-md flex justify-between items-center cursor-pointer" data-action="toggleJournalIconGroup" data-icon-group="${icon}">
                        <h3 class="font-bold text-white">${icon === 'No Icon' ? 'No Icon' : `<i class="${icon} mr-2"></i> ${displayName}`}</h3>
                        <i class="fa-solid ${chevronClass} text-white transition-transform"></i>
                    </div>
                    <div class="journal-entries-container space-y-4" data-icon-entries="${icon}" style="${entriesContainerDisplay}">
                        ${entriesByIcon[icon]
                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Always sort by date within icon group
                            .map(entry => renderJournalEntry(entry))
                            .join('')
                        }
                    </div>
                </div>
            `;
            list.insertAdjacentHTML('beforeend', groupHtml);
        });
    }
}


function openJournalModal(entryId = null) {
    // JIT lookup of DOM elements to prevent null reference errors.
    const journalModalEl = document.getElementById('journal-modal');
    const journalFormEl = document.getElementById('journal-form');
    const journalModalTitleEl = document.getElementById('journal-modal-title');
    const journalEntryIdInputEl = document.getElementById('journal-entry-id');
    const journalEntryTitleInputEl = document.getElementById('journal-entry-title');
    const journalEntryIconInputEl = document.getElementById('journal-entry-icon');
    const journalEntryContentInputEl = document.getElementById('journal-entry-content');

    if (!journalModalEl || !journalFormEl || !journalModalTitleEl || !journalEntryIdInputEl || !journalEntryTitleInputEl || !journalEntryIconInputEl || !journalEntryContentInputEl) {
        console.error("Could not find all required journal modal elements in the DOM.");
        return;
    }

    journalFormEl.reset();
    if (entryId) {
        const entry = appState.journal.find(e => e.id === entryId);
        if (!entry) return;
        journalModalTitleEl.textContent = 'Edit Journal Entry';
        journalEntryIdInputEl.value = entry.id;
        journalEntryTitleInputEl.value = entry.title;
        journalEntryIconInputEl.value = entry.icon || '';
        journalEntryContentInputEl.value = entry.content;
    } else {
        journalModalTitleEl.textContent = 'New Journal Entry';
        journalEntryIdInputEl.value = '';
    }
    activateModal(journalModalEl);
}

function closeJournalModal() {
    const journalModalEl = document.getElementById('journal-modal');
    if (journalModalEl) {
        deactivateModal(journalModalEl);
    }
}

function handleJournalFormSubmit(event) {
    event.preventDefault();
    const id = journalEntryIdInput.value;
    const now = new Date().toISOString();
    const entryData = {
        title: journalEntryTitleInput.value.trim(),
        icon: journalEntryIconInput.value.trim(),
        content: journalEntryContentInput.value,
    };

    if (id) { // Editing
        const entryIndex = appState.journal.findIndex(e => e.id === id);
        if (entryIndex > -1) {
            appState.journal[entryIndex] = {
                ...appState.journal[entryIndex],
                ...entryData,
                editedAt: now
            };
        }
    } else { // Creating
        entryData.id = generateId();
        entryData.createdAt = now;
        entryData.editedAt = null;
        appState.journal.push(entryData);
        if (uiSettings.userInteractions) {
            uiSettings.userInteractions.addedJournalEntry = true;
        }
    }

    savePlannerData();
    renderJournal();
    closeJournalModal();
}

function openVacationChangeModal(changedTasks, onConfirm, onCancel) {
    // Remove any existing modal first
    const existingModal = document.getElementById('vacation-change-confirm-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create and append the new modal
    const modalHtml = vacationChangeConfirmationModalTemplate(changedTasks);
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalElement = document.getElementById('vacation-change-confirm-modal');

    const confirmBtn = document.getElementById('confirm-vacation-change-btn');
    const cancelBtn = document.getElementById('cancel-vacation-change-btn');
    const closeBtn = document.getElementById('vacation-change-close-btn');

    const closeModal = () => {
        deactivateModal(modalElement);
        setTimeout(() => modalElement.remove(), 300); // Remove after transition
    };

    confirmBtn.addEventListener('click', () => {
        onConfirm();
        closeModal();
    });

    cancelBtn.addEventListener('click', () => {
        onCancel();
        closeModal();
    });

    closeBtn.addEventListener('click', () => {
        onCancel(); // Closing also cancels the change
        closeModal();
    });

    activateModal(modalElement);
}


function openAppointmentConflictModal(conflictedTasks) {
    // Remove any existing modal first to prevent duplicates
    const existingModal = document.getElementById('appointment-conflict-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create a new div for the modal
    const modalDiv = document.createElement('div');
    modalDiv.id = 'appointment-conflict-modal';
    modalDiv.className = 'modal';
    modalDiv.innerHTML = appointmentConflictModalTemplate(conflictedTasks);
    document.body.appendChild(modalDiv);

    const closeModal = () => {
        deactivateModal(modalDiv);
        setTimeout(() => modalDiv.remove(), 300);
    };

    const keepBtn = document.getElementById('keep-appointments-btn');
    const rescheduleBtn = document.getElementById('reschedule-appointments-btn');
    const closeBtn = document.getElementById('appointment-conflict-close-btn');

    keepBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);

    rescheduleBtn.addEventListener('click', () => {
        conflictedTasks.forEach(taskToFix => {
            const task = tasks.find(t => t.id === taskToFix.id);
            if (task && task.dueDate) {
                task.dueDate = adjustDateForVacation(new Date(task.dueDate), appState.vacations, task.categoryId, categories);
            }
        });
        saveData();
        updateAllTaskStatuses(true);
        if (calendar) calendar.refetchEvents();
        closeModal();
    });

    activateModal(modalDiv);
}

function checkForAppointmentConflicts() {
    const conflictedTasks = [];
    const appointments = tasks.filter(t => t.isAppointment && t.dueDate);

    for (const appt of appointments) {
        const category = categories.find(c => c.id === appt.categoryId);
        const bypassesVacation = category ? category.bypassVacation : false;
        if (bypassesVacation) {
            continue;
        }

        if (isDateInVacation(new Date(appt.dueDate), appState.vacations)) {
            conflictedTasks.push(appt);
        }
    }

    if (conflictedTasks.length > 0) {
        openAppointmentConflictModal(conflictedTasks);
    }
}

function handleVacationChange(changeAction) {
    // 1. Snapshot the current state
    const originalTasksState = JSON.parse(JSON.stringify(tasks));
    const originalVacationsState = JSON.parse(JSON.stringify(appState.vacations));
    const originalCategoriesState = JSON.parse(JSON.stringify(categories));

    // 2. Perform the action that changes the vacation state
    changeAction();

    // 3. Recalculate all due dates based on the new state
    const changedTasks = [];
    originalTasksState.forEach(originalTask => {
        const task = tasks.find(t => t.id === originalTask.id);
        const originalDueDate = originalTask.dueDate ? new Date(originalTask.dueDate) : null;
        if (!task || !originalDueDate) return;

        // Calculate the new due date based on the *potentially modified* vacation/category state
        const newDueDate = adjustDateForVacation(new Date(originalDueDate), appState.vacations, task.categoryId, categories);

        // Compare time values to see if the date actually changed
        if (newDueDate.getTime() !== originalDueDate.getTime()) {
            changedTasks.push({
                id: task.id,
                name: task.name,
                oldDueDate: originalDueDate,
                newDueDate: newDueDate
            });
        }
    });

    const onConfirm = () => {
        // Apply the new due dates to the actual tasks array
        changedTasks.forEach(change => {
            const taskToUpdate = tasks.find(t => t.id === change.id);
            if (taskToUpdate) {
                taskToUpdate.dueDate = change.newDueDate;
            }
        });
        // Save data and update UI
        saveData();
        updateAllTaskStatuses(true);
        if (calendar) calendar.refetchEvents();
        console.log('Vacation changes confirmed and applied.');
        checkForAppointmentConflicts();
    };

    const onCancel = () => {
        // Restore the original state of tasks, vacations, and categories from the deep copies
        tasks = JSON.parse(JSON.stringify(originalTasksState)).map(t => {
            t.dueDate = t.dueDate ? new Date(t.dueDate) : null;
            return t;
        });
        appState.vacations = JSON.parse(JSON.stringify(originalVacationsState));
        categories = JSON.parse(JSON.stringify(originalCategoriesState));

        // Re-render the UI to reflect the cancelled state
        renderVacationManager();
        updateAllTaskStatuses(true);
        if (calendar) calendar.refetchEvents();
        console.log('Vacation changes cancelled.');
    };

    // 4. If there are changes, open the confirmation modal
    if (changedTasks.length > 0) {
        openVacationChangeModal(changedTasks, onConfirm, onCancel);
    } else {
        // If no tasks were affected, just save the data (e.g., an empty vacation was deleted)
        saveData();
        if (calendar) calendar.refetchEvents();
        checkForAppointmentConflicts();
    }
}

function handleAddVacation(event) {
    event.preventDefault();
    const nameInput = document.getElementById('vacation-name');
    const startDateInput = document.getElementById('vacation-start-date');
    const endDateInput = document.getElementById('vacation-end-date');

    if (!nameInput || !startDateInput || !endDateInput) return;

    const name = nameInput.value.trim();
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (name && startDate && endDate) {
        if (new Date(endDate) < new Date(startDate)) {
            alert('End date cannot be before the start date.');
            return;
        }

        const newVacation = {
            id: generateId(),
            name,
            startDate,
            endDate,
        };

        if (uiSettings.userInteractions) {
            uiSettings.userInteractions.addedVacation = true;
        }

        handleVacationChange(() => {
            appState.vacations.push(newVacation);
            renderVacationManager();
        });

        // Clear the form
        nameInput.value = '';
        startDateInput.value = '';
        endDateInput.value = '';
    } else {
        alert('Please fill out all fields for the vacation.');
    }
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
        const id = document.getElementById('task-id').value; // Get ID directly from the form
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
            isKpi: document.getElementById('is-kpi').checked,
            prepTimeAmount: document.getElementById('prep-time-amount').value ? parseInt(document.getElementById('prep-time-amount').value, 10) : null,
            prepTimeUnit: document.getElementById('prep-time-unit').value
        };

        if (uiSettings.userInteractions && taskData.prepTimeAmount > 0) {
            uiSettings.userInteractions.usedPrepTime = true;
        }

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
                    icon: null,
                    applyIconToNewTasks: false,
                    bypassVacation: false
                };
                categories.push(newCategory);
                categories.sort((a, b) => a.name.localeCompare(b.name));
                taskData.categoryId = newCategory.id;
            } else if (newCategoryName) {
                taskData.categoryId = categories.find(c => c.name.toLowerCase() === newCategoryName.toLowerCase()).id;
            }
        } else if (categoryValue) {
            taskData.categoryId = categoryValue;
        }

        // Adjust due date for vacations after category is determined
        taskData.dueDate = adjustDateForVacation(taskData.dueDate, appState.vacations, taskData.categoryId, categories);

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
        if (id) {
            const taskIndex = tasks.findIndex(t => t.id === id);
            if (taskIndex > -1) {
                const originalTask = tasks[taskIndex];
                const mergedTask = { ...originalTask, ...taskData, id: id };
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
                tasks[taskIndex] = updatedTask;
            }
        } else {
            taskData.id = generateId();
            taskData.createdAt = now;
            taskData.misses = 0;
            taskData.completed = false;
            taskData.status = 'green'; // Start as green, pipeline will correct it
            const newTask = sanitizeAndUpgradeTask(taskData);
            tasks.push(newTask);
        }

        closeModal(); // Now it's safe to close the modal

        // After adding or updating, immediately run the pipeline to get the correct status
        // and save before rendering.
        saveData();
        updateAllTaskStatuses(true);
        if (calendar) calendar.refetchEvents();
        renderKpiTaskSelect();
        renderKpiList();
        checkForAppointmentConflicts();
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
        const taskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.add('task-confirming-delete');
            taskElement.dataset.confirming = 'true';
            const actionArea = taskElement.querySelector(`#action-area-${taskId}`);
            if (actionArea) {
                actionArea.innerHTML = actionAreaTemplate(task);
            }
        }
    }
}
function triggerUndoConfirmation(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status === 'blue' && task.repetitionType !== 'none') {
        task.confirmationState = 'confirming_undo';
        saveData();
        const taskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.dataset.confirming = 'true';
            const commonButtonsArea = taskElement.querySelector(`#common-buttons-${taskId}`);
            if (commonButtonsArea) {
                commonButtonsArea.innerHTML = commonButtonsTemplate(task);
            }
        }
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
    const taskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
    if (taskElement) {
        taskElement.dataset.confirming = 'true';
        const actionArea = taskElement.querySelector(`#action-area-${taskId}`);
        if (actionArea) {
            actionArea.innerHTML = actionAreaTemplate(task);
        }
    }
}
function confirmCompletionAction(taskId, confirmed) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    let task = tasks[taskIndex];
    const now = new Date();
    const wasOverdue = !!task.overdueStartDate;
    const baseDate = wasOverdue ? new Date(task.overdueStartDate) : (task.dueDate || now);

    if (confirmed) {
        stopTaskTimer(taskId);

        // --- Calculate Progress ---
        let progressToSave = 1;
        if (task.completionType === 'count' && task.countTarget > 0) {
            progressToSave = (task.currentProgress || 0) / task.countTarget;
        } else if (task.completionType === 'time') {
            const targetMs = getDurationMs(task.timeTargetAmount, task.timeTargetUnit);
            if (targetMs > 0) progressToSave = (task.currentProgress || 0) / targetMs;
        }
        progressToSave = Math.min(1, Math.max(0, progressToSave));

        // --- Handle History & Task State ---
        if (task.repetitionType !== 'none') {
            // REPEATING TASK LOGIC
            const pastDueDates = getOccurrences(task, baseDate, now);
            const cyclesToProcess = pastDueDates.length > 0 ? pastDueDates : [baseDate];

            cyclesToProcess.forEach((dueDate, index) => {
                const isLastCycle = index === cyclesToProcess.length - 1;
                const isEarly = now < dueDate;
                // New GPA Logic: 4.0 for early, 3.0 for on-time/late
                const historicalStatus = isEarly ? 'blue' : 'green'; // blue = 4.0, green = 3.0

                appState.historicalTasks.push({
                    originalTaskId: task.id, name: task.name,
                    completionDate: new Date(dueDate),
                    actionDate: now,
                    status: historicalStatus,
                    categoryId: task.categoryId,
                    durationAmount: task.estimatedDurationAmount,
                    durationUnit: task.estimatedDurationUnit,
                    progress: isLastCycle ? progressToSave : 1,
                    originalDueDate: new Date(dueDate)
                });
            });

            const missesBefore = task.misses || 0;
            task.misses = Math.max(0, missesBefore - cyclesToProcess.length);
            task.completionReducedMisses = task.misses < missesBefore;

            if (appSettings.autoKpiRemovable && task.isAutoKpi && task.misses === 0) {
                task.isKpi = false;
                task.isAutoKpi = false;
            }

            const lastDueDate = cyclesToProcess[cyclesToProcess.length - 1];
            const futureOccurrences = getOccurrences(task, new Date(lastDueDate.getTime() + 1), getCalculationHorizonDate());
            let nextDueDate = futureOccurrences.length > 0 ? futureOccurrences[0] : null;
            task.dueDate = adjustDateForVacation(nextDueDate, appState.vacations, task.categoryId, categories);

            task.status = 'blue';
            task.cycleEndDate = new Date(lastDueDate);

        } else {
            // NON-REPEATING TASK LOGIC
            const isEarly = now < baseDate;
            // New GPA Logic: 4.0 for early, 3.0 for on-time/late
            const historicalStatus = isEarly ? 'blue' : 'green'; // blue = 4.0, green = 3.0
            appState.historicalTasks.push({
                originalTaskId: task.id, name: task.name,
                completionDate: new Date(baseDate), actionDate: now,
                status: historicalStatus, categoryId: task.categoryId,
                durationAmount: task.estimatedDurationAmount, durationUnit: task.estimatedDurationUnit,
                progress: progressToSave, originalDueDate: new Date(baseDate)
            });
            task.completed = true;
            task.status = 'blue';
            // Set lock for 5 seconds in the future to allow for an undo grace period.
            task.cycleEndDate = new Date(now.getTime() + 5000);
        }

        // --- Common Cleanup ---
        task.currentProgress = 0;
        task.confirmationState = null;
        delete task.pendingCycles;
        delete task.overdueStartDate;

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
        if (task.confirmationState !== 'awaiting_overdue_input') {
            task.confirmationState = null;
        }
    }

    saveData();
    updateAllTaskStatuses(true);
}
function confirmUndoAction(taskId, confirmed) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (confirmed) {
        if (task.status !== 'blue') return; // Only blue (locked) tasks can be undone.

        // Find the most recent 'completed' history item for this task.
        let lastCompletedIndex = -1;
        for (let i = appState.historicalTasks.length - 1; i >= 0; i--) {
            const h = appState.historicalTasks[i];
            if (h.originalTaskId === taskId && h.status === 'completed') {
                lastCompletedIndex = i;
                break;
            }
        }

        if (lastCompletedIndex > -1) {
            const historyItem = appState.historicalTasks[lastCompletedIndex];
            const savedProgressRatio = historyItem.progress || 0;

            // Restore progress from the historical record
            if (task.completionType === 'count' && task.countTarget > 0) {
                task.currentProgress = Math.round(savedProgressRatio * task.countTarget);
            } else if (task.completionType === 'time') {
                const targetMs = getDurationMs(task.timeTargetAmount, task.timeTargetUnit);
                if (targetMs > 0) {
                    task.currentProgress = Math.round(savedProgressRatio * targetMs);
                }
            }

            // Remove the historical record
            appState.historicalTasks.splice(lastCompletedIndex, 1);
        }

        // Restore task state
        task.dueDate = task.cycleEndDate ? new Date(task.cycleEndDate) : new Date();
        task.cycleEndDate = null;
        if (task.repetitionType === 'none') {
            task.completed = false; // Make non-repeating task active again
        }

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
    const now = new Date();

    if (confirmed) {
        const totalCycles = task.pendingCycles || 1;
        const inputEl = document.getElementById(`miss-count-input-${taskId}`);
        const missesToApply = (inputEl && totalCycles > 1) ? parseInt(inputEl.value, 10) : totalCycles;
        const completionsToApply = totalCycles - missesToApply;
        const baseDate = task.overdueStartDate ? new Date(task.overdueStartDate) : (task.dueDate || now);

        let progressRatio = 0;
        if (task.completionType === 'count' && task.countTarget > 0) {
            progressRatio = (task.currentProgress || 0) / task.countTarget;
        } else if (task.completionType === 'time') {
            const targetMs = getDurationMs(task.timeTargetAmount, task.timeTargetUnit);
            if (targetMs > 0) progressRatio = (task.currentProgress || 0) / targetMs;
        }
        progressRatio = Math.min(1, Math.max(0, progressRatio));

        if (task.repetitionType !== 'none') {
            const allPastDueDates = getOccurrences(task, baseDate, now).slice(0, totalCycles);
            const completionDates = allPastDueDates.slice(0, completionsToApply);
            const missDates = allPastDueDates.slice(completionsToApply);
            let runningMissesCount = task.misses || 0;

            // GPA 3.0: Handle the "catch-up" completions. These are considered on-time/late.
            completionDates.forEach((dueDate, index) => {
                const isFinalRecord = (index === completionDates.length - 1) && (missDates.length === 0);
                appState.historicalTasks.push({
                    originalTaskId: task.id, name: task.name, completionDate: new Date(dueDate), actionDate: new Date(),
                    status: 'green', // GPA 3.0
                    categoryId: task.categoryId, durationAmount: task.estimatedDurationAmount, durationUnit: task.estimatedDurationUnit,
                    progress: isFinalRecord ? progressRatio : 1,
                    originalDueDate: new Date(dueDate)
                });
            });

            // GPA 2.0-0.0: Handle the misses.
            missDates.forEach((dueDate, index) => {
                const isFinalRecordWithProgress = (index === missDates.length - 1) && progressRatio > 0;
                let historicalStatus;

                if (isFinalRecordWithProgress) {
                    // GPA 2.0-2.99: Partial miss on the final recorded action
                    historicalStatus = 'yellow';
                } else {
                    // GPA 1.0 or 0.0: Full miss
                    if (runningMissesCount === 0 && task.trackMisses) {
                        historicalStatus = 'red'; // GPA 1.0: First tracked miss
                    } else {
                        historicalStatus = 'black'; // GPA 0.0: Subsequent or untracked miss
                    }
                    runningMissesCount++;
                }

                appState.historicalTasks.push({
                    originalTaskId: task.id, name: task.name, completionDate: new Date(dueDate), actionDate: new Date(),
                    status: historicalStatus,
                    categoryId: task.categoryId, durationAmount: task.estimatedDurationAmount, durationUnit: task.estimatedDurationUnit,
                    progress: isFinalRecordWithProgress ? progressRatio : 0,
                    originalDueDate: new Date(dueDate)
                });
            });

            if (completionsToApply > 0) task.misses = Math.max(0, (task.misses || 0) - completionsToApply);
            if (missesToApply > 0 && task.trackMisses) {
                const newMisses = missDates.filter((_, index) => !((index === missDates.length - 1) && progressRatio > 0)).length;
                task.misses = Math.min(task.maxMisses || Infinity, (task.misses || 0) + newMisses);
                if (appSettings.autoKpiEnabled && task.maxMisses && task.misses >= task.maxMisses && !task.isKpi) {
                    task.isKpi = true;
                    task.isAutoKpi = true;
                }
            }

            const lastDueDate = allPastDueDates.length > 0 ? allPastDueDates[allPastDueDates.length - 1] : baseDate;
            let nextDueDate = null;
            const futureOccurrences = getOccurrences(task, new Date(lastDueDate.getTime() + 1), getCalculationHorizonDate());
            if (futureOccurrences.length > 0) nextDueDate = futureOccurrences[0];
            task.dueDate = adjustDateForVacation(nextDueDate, appState.vacations, task.categoryId, categories);

        } else { // NON-REPEATING TASK
            let historicalStatus;
            if (progressRatio > 0 && progressRatio < 1) {
                historicalStatus = 'yellow'; // GPA 2.0-2.99: Partial miss
            } else if (progressRatio >= 1) {
                 historicalStatus = 'green'; // GPA 3.0: Full completion (but late)
            } else {
                 historicalStatus = 'red'; // GPA 1.0: Full miss (since it's the first)
            }

            appState.historicalTasks.push({
                originalTaskId: task.id, name: task.name, completionDate: new Date(baseDate), actionDate: now,
                status: historicalStatus, categoryId: task.categoryId,
                durationAmount: task.estimatedDurationAmount, durationUnit: task.estimatedDurationUnit,
                progress: progressRatio, originalDueDate: new Date(baseDate)
            });
            task.completed = true;
            task.status = 'blue';
            task.cycleEndDate = new Date(now.getTime() + 5000);
        }

        task.currentProgress = 0;
        task.confirmationState = null;
        delete task.pendingCycles;
        delete task.overdueStartDate;

    } else {
        task.confirmationState = 'awaiting_overdue_input';
        delete task.pendingCycles;
        delete task.overdueStartDate;
    }

    if (task.confirmationState !== 'awaiting_overdue_input') {
        task.confirmationState = null;
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
    const taskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
    if (taskElement) {
        taskElement.dataset.confirming = 'true';
        const actionArea = taskElement.querySelector(`#action-area-${taskId}`);
        if (actionArea) {
            actionArea.innerHTML = actionAreaTemplate(task);
        }
    }
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
            icon: null,
            applyIconToNewTasks: false
        };
        categories.push(newCategory);
        categories.sort((a, b) => a.name.localeCompare(b.name));
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

    if (uiSettings.userInteractions) {
        uiSettings.userInteractions.usedBulkEdit = true;
    }

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

        // Re-render all necessary components
        applyTheme(); // This will apply the new non-themed state
        renderStatusManager(); // This will update the status manager UI
        renderTasks(); // This will re-render tasks with default colors

        // Also update the sort dropdowns in the UI
        if(sortBySelect) sortBySelect.value = sortBy;
        if(sortDirectionSelect) sortDirectionSelect.value = sortDirection;
    }

    // Always restore the button, whether confirmed or cancelled.
    if (container) {
        container.innerHTML = `<button data-action="restoreDefaults" class="btn btn-tertiary w-full">Restore Status Colors & Names to Default</button>`;
    }
}

// --- Data Migration Tool Functions ---

// Refactored to accept the modal element directly, preventing race conditions.
function analyzeAndPrepareMigrationModal(modalElement) {
    const orphanCleanupSection = modalElement.querySelector('#orphan-cleanup-section');
    const orphanSummary = modalElement.querySelector('#orphan-summary');
    const orphanListContainer = modalElement.querySelector('#orphan-list-container');
    if (!orphanCleanupSection || !orphanSummary || !orphanListContainer) {
        return;
    }

    const taskIds = new Set(tasks.map(t => t.id).concat((appState.archivedTasks || []).map(t => t.id)));
    const orphanedHistory = appState.historicalTasks
        .map((h, index) => ({ ...h, historyId: index })) // Assign a temporary unique ID
        .filter(h => h.originalTaskId && !taskIds.has(h.originalTaskId));

    if (orphanedHistory.length > 0) {
        orphanSummary.textContent = `Found ${orphanedHistory.length} orphaned history record(s).`;

        orphanListContainer.innerHTML = orphanedHistory.map(orphan => {
            const completionDate = new Date(orphan.completionDate).toLocaleString();
            return `
                <div class="flex items-center justify-between text-sm text-gray-800">
                    <label class="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" class="orphan-checkbox" data-history-id="${orphan.historyId}">
                        <span><strong>${orphan.name || 'Unnamed Task'}</strong> (${orphan.status})</span>
                    </label>
                    <span class="text-xs text-gray-500">${completionDate}</span>
                </div>
            `;
        }).join('');

        orphanCleanupSection.classList.remove('hidden');
    } else {
        orphanListContainer.innerHTML = '';
        orphanCleanupSection.classList.add('hidden');
    }
}

function deleteSelectedOrphansAction(modalElement) {
    if (!modalElement) return;
    const selectedIds = new Set();
    modalElement.querySelectorAll('.orphan-checkbox:checked').forEach(checkbox => {
        selectedIds.add(parseInt(checkbox.dataset.historyId, 10));
    });

    if (selectedIds.size === 0) {
        alert("No records selected for deletion.");
        return;
    }

    if (confirm(`Are you sure you want to delete ${selectedIds.size} selected history record(s)? This cannot be undone.`)) {
        const originalCount = appState.historicalTasks.length;
        appState.historicalTasks = appState.historicalTasks.filter((_, index) => !selectedIds.has(index));
        const removedCount = originalCount - appState.historicalTasks.length;

        saveData();
        analyzeAndPrepareMigrationModal(modalElement); // Re-run analysis to update the UI
        if (calendar) calendar.refetchEvents();
        alert(`${removedCount} orphaned history record(s) have been deleted.`);
    }
}


function deleteAllHistory() {
    if (confirm("Are you absolutely sure you want to delete ALL task history? This will permanently erase all completion and miss records for all tasks. This action cannot be undone.")) {
        appState.historicalTasks = [];
        saveData();
        if (calendar) {
            calendar.refetchEvents();
        }
        alert("All task history has been deleted.");
    }
}

function openDataMigrationModal(tasksData = null) {
    const dataMigrationModalEl = document.getElementById('data-migration-modal');
    if (!dataMigrationModalEl) return;

    dataMigrationModalEl.innerHTML = dataMigrationModalTemplate();
    const modalContent = dataMigrationModalEl.querySelector('.modal-content');

    // JIT lookup and background fix
    if (modalContent) {
        const effectiveMode = theming.mode === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'light') : theming.mode;
        modalContent.style.backgroundColor = effectiveMode === 'night' ? '#2d3748' : '#FFFFFF'; // gray-700 or white
    }

    // Add event listeners for the new modal
    const closeButton = dataMigrationModalEl.querySelector('.close-button');
    if (closeButton) {
        closeButton.addEventListener('click', () => deactivateModal(dataMigrationModalEl));
    }
    const fileInput = document.getElementById('migration-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleMigrationFileSelect);
    }

    const deleteSelectedBtn = document.getElementById('delete-selected-orphans-btn');
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', () => {
             // Pass the modal element to the action handler
            deleteSelectedOrphansAction(dataMigrationModalEl);
        });
    }

    const selectAllCheckbox = document.getElementById('select-all-orphans-checkbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
            dataMigrationModalEl.querySelectorAll('.orphan-checkbox').forEach(checkbox => {
                checkbox.checked = e.target.checked;
            });
        });
    }

    const deleteAllHistoryBtn = document.getElementById('delete-all-history-btn');
    if (deleteAllHistoryBtn) {
        deleteAllHistoryBtn.addEventListener('click', deleteAllHistory);
    }

    // Step 2 buttons
    const cancelBtn = document.getElementById('cancel-migration-btn');
    if(cancelBtn) {
        cancelBtn.addEventListener('click', () => deactivateModal(dataMigrationModalEl));
    }
    const runBtn = document.getElementById('run-migration-btn');
    if(runBtn) {
        runBtn.addEventListener('click', () => runMigration(dataMigrationModalEl));
    }

    // Step 3 (Confirm) buttons
    const cancelConfirmBtn = document.getElementById('cancel-confirm-btn');
    if (cancelConfirmBtn) {
        cancelConfirmBtn.addEventListener('click', () => deactivateModal(dataMigrationModalEl));
    }
    const runConfirmBtn = document.getElementById('run-confirm-btn');
    if (runConfirmBtn) {
        runConfirmBtn.addEventListener('click', () => runMigration(dataMigrationModalEl));
    }

    analyzeAndPrepareMigrationModal(dataMigrationModalEl);

    if (tasksData) {
        prepareMigrationUI(tasksData, dataMigrationModalEl);
        const step1Prompt = dataMigrationModalEl.querySelector('#migration-step-1 p');
        if (step1Prompt) {
            step1Prompt.textContent = 'Outdated task format detected. Please map your old task fields to the new format below to continue.';
        }
    }

    activateModal(dataMigrationModalEl);
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

    if (uiSettings.userInteractions) {
        uiSettings.userInteractions.usedDataMigration = true;
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

function runPostImportChecks() {
    // Check for orphaned history records by comparing history with active and archived tasks.
    const taskIds = new Set(tasks.map(t => t.id).concat((appState.archivedTasks || []).map(t => t.id)));
    const orphanedHistory = appState.historicalTasks.filter(h => h.originalTaskId && !taskIds.has(h.originalTaskId));

    if (orphanedHistory.length > 0) {
        alert(`Import complete, but found ${orphanedHistory.length} orphaned history record(s). The data migration tool will now open to help you clean this up.`);
        openDataMigrationModal();
    } else {
        alert('Transfer complete! 🎉 The application will now reload.');
        location.reload();
    }
}

function exportData(exportType) {
    if (uiSettings.userInteractions) {
        uiSettings.userInteractions.exportedData = true;
    }
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
    if (fileInput) {
        fileInput.click();
    }
}

function openImportModal(file) {
    // Ensure no other import modal is open
    const existingModal = document.getElementById('import-modal');
    if (existingModal) {
        existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', importModalTemplate());
    const importModal = document.getElementById('import-modal');
    const replaceBtn = document.getElementById('import-replace-btn');
    const mergeBtn = document.getElementById('import-merge-btn');
    const closeBtn = document.getElementById('import-modal-close-btn');

    const handleImport = (importMode) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (!importedData.exportFormatVersion || !importedData.dataType || !importedData.data) {
                    alert('Error: Invalid or corrupted backup file.');
                    return;
                }

                const finalizeImport = () => {
                    saveData();
                    loadData();
                    runPostImportChecks();
                };

                if (importMode === 'replace') {
                    if (!confirm('This will overwrite all existing data. Are you sure you want to continue?')) {
                        return;
                    }

                    const data = importedData.data;
                    tasks = data.tasks || [];
                    categories = data.categories || [];
                    if (data.appState) {
                        Object.assign(appState, data.appState);
                    }
                    if (data.settings) {
                        Object.assign(statusColors, data.settings.statusColors);
                        Object.assign(statusNames, data.settings.statusNames);
                        sortBy = data.settings.sortBy;
                        sortDirection = data.settings.sortDirection;
                        Object.assign(notificationSettings, data.settings.notificationSettings);
                        Object.assign(theming, data.settings.theming);
                        Object.assign(calendarSettings, data.settings.calendarSettings);
                        categoryFilter = data.settings.categoryFilter;
                        Object.assign(plannerSettings, data.settings.plannerSettings);
                        Object.assign(taskDisplaySettings, data.settings.taskDisplaySettings);
                        Object.assign(appSettings, data.settings.appSettings);
                        Object.assign(sensitivitySettings, data.settings.sensitivitySettings);
                        Object.assign(uiSettings, data.settings.uiSettings);
                        Object.assign(journalSettings, data.settings.journalSettings);
                    }

                    finalizeImport();

                } else if (importMode === 'merge') {
                    const conflicts = [];
                    const importContent = importedData.data;

                    // Detect conflicts in tasks
                    if (importContent.tasks) {
                        const existingTaskIds = new Set(tasks.map(t => t.id));
                        importContent.tasks.forEach(importedTask => {
                            if (existingTaskIds.has(importedTask.id)) {
                                const existingTask = tasks.find(t => t.id === importedTask.id);
                                if (JSON.stringify(existingTask) !== JSON.stringify(importedTask)) {
                                    conflicts.push({ type: 'task', id: importedTask.id, existing: existingTask, imported: importedTask });
                                }
                            }
                        });
                    }

                    // Detect conflicts in categories
                    if (importContent.categories) {
                        const existingCategoryIds = new Set(categories.map(c => c.id));
                        importContent.categories.forEach(importedCategory => {
                            if (existingCategoryIds.has(importedCategory.id)) {
                                const existingCategory = categories.find(c => c.id === importedCategory.id);
                                if (JSON.stringify(existingCategory) !== JSON.stringify(importedCategory)) {
                                    conflicts.push({ type: 'category', id: importedCategory.id, existing: existingCategory, imported: importedCategory });
                                }
                            }
                        });
                    }

                    if (conflicts.length > 0) {
                        openConflictResolutionModal(conflicts, (resolvedData) => {
                            // Apply resolutions
                            resolvedData.tasks.forEach(resolvedTask => {
                                const index = tasks.findIndex(t => t.id === resolvedTask.id);
                                if (index > -1) tasks[index] = resolvedTask;
                            });
                            resolvedData.categories.forEach(resolvedCategory => {
                                const index = categories.findIndex(c => c.id === resolvedCategory.id);
                                if (index > -1) categories[index] = resolvedCategory;
                            });

                            // Add new items
                            const existingTaskIds = new Set(tasks.map(t => t.id));
                            importContent.tasks.forEach(importedTask => {
                                if (!existingTaskIds.has(importedTask.id)) {
                                    tasks.push(importedTask);
                                }
                            });
                            const existingCategoryIds = new Set(categories.map(c => c.id));
                            importContent.categories.forEach(importedCategory => {
                                if (!existingCategoryIds.has(importedCategory.id)) {
                                    categories.push(importedCategory);
                                }
                            });

                            finalizeImport();
                        });
                    } else {
                        // No conflicts, perform a simple merge
                        const existingTaskIds = new Set(tasks.map(t => t.id));
                        (importContent.tasks || []).forEach(importedTask => {
                            if (!existingTaskIds.has(importedTask.id)) {
                                tasks.push(importedTask);
                            }
                        });
                        const existingCategoryIds = new Set(categories.map(c => c.id));
                        (importContent.categories || []).forEach(importedCategory => {
                            if (!existingCategoryIds.has(importedCategory.id)) {
                                categories.push(importedCategory);
                            }
                        });
                        // Also merge history if it exists
                        if (importContent.appState && importContent.appState.historicalTasks) {
                            const existingHistoryIds = new Set(appState.historicalTasks.map(h => h.originalTaskId + h.completionDate));
                            importContent.appState.historicalTasks.forEach(h => {
                                if (!existingHistoryIds.has(h.originalTaskId + h.completionDate)) {
                                    appState.historicalTasks.push(h);
                                }
                            });
                        }
                        finalizeImport();
                    }
                }

                deactivateModal(importModal);
                importModal.remove();

            } catch (error) {
                console.error('Error processing import file:', error);
                alert('Error: Could not parse the file. Please ensure it is a valid JSON backup file.');
            }
        };
        reader.readAsText(file);
    };

    replaceBtn.addEventListener('click', () => handleImport('replace'));
    mergeBtn.addEventListener('click', () => handleImport('merge'));
    closeBtn.addEventListener('click', () => {
        deactivateModal(importModal);
        importModal.remove();
    });

    activateModal(importModal);
}

function openConflictResolutionModal(conflicts, onComplete) {
    const existingModal = document.getElementById('conflict-resolution-modal');
    if (existingModal) {
        existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', conflictResolutionModalTemplate(conflicts));
    const modal = document.getElementById('conflict-resolution-modal');
    const conflictList = document.getElementById('conflict-list');
    const finishBtn = document.getElementById('finish-merge-btn');

    let resolutions = {};

    conflictList.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action="resolve-conflict"]');
        if (!target) return;

        const index = target.dataset.index;
        const choice = target.dataset.choice;
        resolutions[index] = choice;

        // Visually update the UI
        const conflictItem = target.closest('.conflict-item');
        conflictItem.querySelector('button[data-choice="existing"]').classList.remove('btn-confirm');
        conflictItem.querySelector('button[data-choice="imported"]').classList.remove('btn-confirm');
        target.classList.add('btn-confirm');
        conflictItem.style.borderColor = '#22c55e'; // Green border to show it's resolved
    });

    finishBtn.addEventListener('click', () => {
        if (Object.keys(resolutions).length !== conflicts.length) {
            alert('Please resolve all conflicts before finishing the merge.');
            return;
        }

        const finalData = {
            tasks: [],
            categories: [],
            settings: {}
        };

        conflicts.forEach((conflict, index) => {
            const choice = resolutions[index];
            const chosenData = choice === 'existing' ? conflict.existing : conflict.imported;
            finalData[conflict.type + 's'].push(chosenData);
        });

        deactivateModal(modal);
        modal.remove();
        onComplete(finalData);
    });

    activateModal(modal);
}


function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) {
        // Reset the file input so the same file can be selected again
        event.target.value = '';
        return;
    }

    openImportModal(file);

    // Reset the file input so the same file can be selected again
    event.target.value = '';
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

}

/**
 * Starts the notification engine when the page becomes hidden.
 */
function startNotificationEngine() {
    // Ensure the engine is clean before starting.
    stopNotificationEngine();
    calculateAndScheduleAllNotifications();
}

/**
 * Stops the notification engine and clears all scheduled notifications.
 */
function stopNotificationEngine() {
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
    taskViewModal = document.getElementById('task-view-modal');
    taskViewContent = document.getElementById('task-view-content');
    taskStatsContent = document.getElementById('task-stats-content');

    // Journal
    journalModal = document.getElementById('journal-modal');
    journalForm = document.getElementById('journal-form');
    journalModalTitle = document.getElementById('journal-modal-title');
    journalEntryIdInput = document.getElementById('journal-entry-id');
    journalEntryTitleInput = document.getElementById('journal-entry-title');
    journalEntryIconInput = document.getElementById('journal-entry-icon');
    journalEntryContentInput = document.getElementById('journal-entry-content');

    // Pilot Planner
    app = document.getElementById('app');
    weeklyGoalsEl = document.getElementById('weeklyGoals');
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
    showJournalBtn = document.getElementById('show-journal-btn');
    taskManagerView = document.getElementById('task-manager-view');
    calendarView = document.getElementById('calendar-view');
    dashboardView = document.getElementById('dashboard-view');
    journalView = document.getElementById('journal-view');
}
function setupEventListeners() {
    let mouseDownCoords = null; // Variable to track mouse position for drag detection

    // --- Main Page Actions ---
    const addTaskBtn = document.getElementById('add-task-btn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => openModal());
    }
    const viewHistoricalTasksBtn = document.getElementById('view-historical-tasks-btn');
    if (viewHistoricalTasksBtn) {
        viewHistoricalTasksBtn.addEventListener('click', openHistoricalOverviewModal);
    }
    const advancedOptionsBtnMain = document.getElementById('advancedOptionsBtnMain');
    if(advancedOptionsBtnMain) {
        advancedOptionsBtnMain.addEventListener('click', openAdvancedOptionsModal);
    }

    // --- Modal Close Buttons & Global Listeners ---
    const advancedOptionsModalEl = document.getElementById('advanced-options-modal');
    if (advancedOptionsModalEl) {
        const advOptionsCloseButton = advancedOptionsModalEl.querySelector('.close-button');
        if(advOptionsCloseButton) {
            advOptionsCloseButton.addEventListener('click', () => deactivateModal(advancedOptionsModalEl));
        }
    }

    const taskViewModalEl = document.getElementById('task-view-modal');
    if (taskViewModalEl) {
        const taskViewCloseButton = taskViewModalEl.querySelector('.close-button');
        if (taskViewCloseButton) {
            taskViewCloseButton.addEventListener('click', () => {
                deactivateModal(taskViewModalEl);
                // When closing, remove the dataset attribute so the main loop stops updating it.
                delete taskViewModalEl.dataset.viewingTaskId;
            });
        }
    }

    const taskModalEl = document.getElementById('task-modal');
    if (taskModalEl) {
        const taskFormEl = document.getElementById('task-form');
        if(taskFormEl) taskFormEl.addEventListener('submit', handleFormSubmit);

        const closeButton = taskModalEl.querySelector('.close-button');
        if (closeButton) closeButton.addEventListener('click', closeModal);

        const cancelButton = taskModalEl.querySelector('.cancel-task-button');
        if (cancelButton) cancelButton.addEventListener('click', closeModal);
    }

    const iconPickerModalEl = document.getElementById('icon-picker-modal');
    if (iconPickerModalEl) {
        const closeBtn = iconPickerModalEl.querySelector('.close-button');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => deactivateModal(iconPickerModalEl));
        }
    }

    const journalModalEl = document.getElementById('journal-modal');
    if (journalModalEl) {
        const journalFormEl = document.getElementById('journal-form');
        if (journalFormEl) journalFormEl.addEventListener('submit', handleJournalFormSubmit);

        const cancelJournalBtn = journalModalEl.querySelector('.cancel-journal-button');
        if (cancelJournalBtn) cancelJournalBtn.addEventListener('click', closeJournalModal);

        const closeJournalButton = journalModalEl.querySelector('.close-button');
        if (closeJournalButton) closeJournalButton.addEventListener('click', closeJournalModal);
    }


    window.addEventListener('mousedown', (event) => {
        if (event.target === taskModalEl) closeModal();
        if (event.target === advancedOptionsModalEl) deactivateModal(advancedOptionsModalEl);
        if (event.target === journalModalEl) deactivateModal(journalModalEl);
    });


    // --- Task Form Listeners ---
    const taskFormEl = document.getElementById('task-form');
    if (taskFormEl) {
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
            openIconPickerBtn.addEventListener('click', () => openIconPicker('task'));
        }

        const timeInputTypeSelectEl = document.getElementById('time-input-type');
        if(timeInputTypeSelectEl) {
            timeInputTypeSelectEl.addEventListener('change', (e) => {
                updateDateTimeFieldsVisibility();
                const estDurInput = document.getElementById('estimated-duration-amount');
                if (estDurInput) {
                    estDurInput.required = (e.target.value === 'start');
                }
            });
        }

        const taskRepetitionSelectEl = document.getElementById('task-repetition');
        if (taskRepetitionSelectEl) {
            taskRepetitionSelectEl.addEventListener('change', (e) => {
                const type = e.target.value;
                document.getElementById('repetition-relative-group').classList.toggle('hidden', type !== 'relative');
                document.getElementById('repetition-absolute-group').classList.toggle('hidden', type !== 'absolute');
                document.getElementById('repeating-options-group').classList.toggle('hidden', type === 'none');
                if (type === 'relative') {
                    // Set default to hours when switching to relative
                    const repetitionUnitSelect = document.getElementById('repetition-unit');
                    if (repetitionUnitSelect) {
                        repetitionUnitSelect.value = 'hours';
                    }
                }
                if(type === 'absolute') {
                    toggleAbsoluteRepetitionFields(document.getElementById('absolute-frequency').value);
                }
                if (type === 'none') {
                    document.getElementById('max-misses').value = '';
                    document.getElementById('track-misses').checked = true;
                }
            });
        }

        const absoluteFrequencySelectEl = document.getElementById('absolute-frequency');
        if (absoluteFrequencySelectEl) {
            absoluteFrequencySelectEl.addEventListener('change', (e) => toggleAbsoluteRepetitionFields(e.target.value));
        }

        taskFormEl.querySelectorAll('input[name="monthlyOption"]').forEach(radio => {
            radio.addEventListener('change', (e) => toggleMonthlyOptions(e.target.value));
        });
        taskFormEl.querySelectorAll('input[name="yearlyOption"]').forEach(radio => {
            radio.addEventListener('change', (e) => toggleYearlyOptions(e.target.value));
        });

        const dueDateTypeSelectEl = document.getElementById('due-date-type');
        if (dueDateTypeSelectEl) {
            dueDateTypeSelectEl.addEventListener('change', () => updateDateTimeFieldsVisibility());
        }

        const completionTypeSelectEl = document.getElementById('completion-type');
        if(completionTypeSelectEl) {
            completionTypeSelectEl.addEventListener('change', (e) => toggleCompletionFields(e.target.value));
        }

        const taskCategorySelectEl = document.getElementById('task-category');
        if (taskCategorySelectEl) {
            taskCategorySelectEl.addEventListener('change', (e) => {
                const categoryId = e.target.value;
                const isNew = categoryId === 'new_category';
                document.getElementById('new-category-group').classList.toggle('hidden', !isNew);
                if (isNew) {
                    document.getElementById('new-category-name').focus();
                } else {
                    const category = categories.find(c => c.id === categoryId);
                    if (category && category.icon && category.applyIconToNewTasks) {
                        document.getElementById('task-icon').value = category.icon;
                    }
                }
            });
        }
    }


    // --- Icon Picker Listeners ---
    if (iconPickerModalEl) {
        const content = document.getElementById('icon-picker-content');
        if (content) {
            content.addEventListener('click', (e) => {
                const actionTarget = e.target.closest('[data-action]');
                if (actionTarget && actionTarget.dataset.action === 'changeIconStyle') {
                    const newStyle = actionTarget.value;
                    uiSettings.lastIconStyle = newStyle;
                    saveData();
                    renderIconPicker(newStyle); // Re-render the whole picker
                    return;
                }


                const header = e.target.closest('.icon-picker-category-header');
                if (header) {
                    const grid = header.nextElementSibling;
                    const icon = header.querySelector('span'); // The arrow is a span now
                    grid.classList.toggle('hidden');
                    icon.classList.toggle('rotate-180');
                    return;
                }

                const iconWrapper = e.target.closest('[data-icon]');
                if (iconWrapper) {
                    const iconClass = iconWrapper.dataset.icon;
                    const context = iconPickerModalEl.dataset.context;
                    const journalIconInput = document.getElementById('journal-entry-icon');
                    const taskIconInputEl = document.getElementById('task-icon');

                    switch (context) {
                        case 'journal':
                            if (journalIconInput) journalIconInput.value = iconClass;
                            break;
                        case 'journalGoal':
                            const weeklyGoalIconInput = document.getElementById('weekly-goal-icon-input');
                            if (weeklyGoalIconInput) {
                                weeklyGoalIconInput.value = iconClass;
                                journalSettings.weeklyGoalIcon = iconClass;
                                saveData();
                            }
                            break;
                        case 'category':
                             if (editingCategoryIdForIcon) {
                                const category = categories.find(c => c.id === editingCategoryIdForIcon);
                                if (category) {
                                    category.icon = iconClass;
                                    saveData();
                                    renderCategoryManager();
                                }
                                editingCategoryIdForIcon = null;
                            }
                            break;
                        case 'task':
                        default:
                            if (taskIconInputEl) {
                                taskIconInputEl.value = iconClass;
                            }
                            break;
                    }
                    deactivateModal(iconPickerModalEl);
                }
            });
        }
    }


    // --- Task List Listeners ---
    const taskListDivEl = document.getElementById('task-list');
    if (taskListDivEl) {
        taskListDivEl.addEventListener('mousedown', (e) => {
            mouseDownCoords = { x: e.clientX, y: e.clientY };
        });

        taskListDivEl.addEventListener('click', (event) => {
            const wasDrag = mouseDownCoords && (Math.abs(event.clientX - mouseDownCoords.x) > 5 || Math.abs(event.clientY - mouseDownCoords.y) > 5);
            mouseDownCoords = null; // Reset after use

            const collapsibleHeader = event.target.closest('.collapsible-header');
            if (collapsibleHeader) {
                const group = collapsibleHeader.dataset.group;
                const tasksToToggle = taskListDivEl.querySelectorAll(`.task-item[data-group="${group}"]`);
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
                 if (!event.target.closest('button, a, input, .edit-progress-button')) {
                    if (wasDrag) return;
                    openTaskView(taskId);
                    return;
                }
            }

            if (actionTarget) {
                const action = actionTarget.dataset.action;
                const taskIdForAction = actionTarget.dataset.taskId;
                switch (action) {
                    case 'edit': editTask(taskIdForAction); break;
                    case 'triggerDelete': triggerDelete(taskIdForAction); break;
                    case 'triggerCompletion': triggerCompletion(taskIdForAction); break;
                    case 'confirmCompletion': confirmCompletionAction(taskIdForAction, actionTarget.dataset.confirmed === 'true'); break;
                    case 'handleOverdue': handleOverdueChoice(taskIdForAction, actionTarget.dataset.choice); break;
                    case 'confirmMiss': confirmMissAction(taskIdForAction, actionTarget.dataset.confirmed === 'true'); break;
                    case 'confirmDelete': confirmDeleteAction(taskIdForAction, actionTarget.dataset.confirmed === 'true'); break;
                    case 'triggerUndo': triggerUndoConfirmation(taskIdForAction); break;
                    case 'confirmUndo': confirmUndoAction(taskIdForAction, actionTarget.dataset.confirmed === 'true'); break;
                    case 'incrementCount': incrementCount(taskIdForAction); break;
                    case 'decrementCount': decrementCount(taskIdForAction); break;
                    case 'toggleTimer': toggleTimer(taskIdForAction); break;
                    case 'editProgress': editProgress(taskIdForAction); break;
                    case 'saveProgress': saveProgressEdit(taskIdForAction); break;
                    case 'cancelProgress': cancelProgressEdit(taskIdForAction); break;
                }
            }
        });
    }

    // --- Advanced Options Listeners ---
    const advancedOptionsContentEl = document.getElementById('advanced-options-content');
    if (advancedOptionsContentEl) {
        advancedOptionsContentEl.addEventListener('click', (event) => {
            const header = event.target.closest('.collapsible-header');
            if (header) {
                const section = header.parentElement;
                const key = section.dataset.sectionKey;
                const isOpen = section.classList.toggle('open');
                uiSettings.advancedOptionsCollapseState[key] = !isOpen;
                saveData();
                return;
            }

            const target = event.target.closest('[data-action]');
            if (!target) return;
            const action = target.dataset.action;
            const categoryId = target.dataset.categoryId;
            const statusKey = target.dataset.statusKey;

            switch(action) {
                case 'toggleShowCalendarFilters':
                    uiSettings.showCalendarFilters = event.target.checked;
                    saveData();
                    renderCalendarCategoryFilters(); // Re-render to show/hide
                    break;
                case 'toggleApplyIcon':
                    const category = categories.find(c => c.id === categoryId);
                    if (category) {
                        category.applyIconToNewTasks = !category.applyIconToNewTasks;
                        saveData();
                        renderCategoryManager();
                    }
                    break;
                case 'openIconPicker':
                    const context = target.dataset.context || 'task';
                     if (context === 'category') {
                        editingCategoryIdForIcon = target.dataset.categoryId;
                    }
                    openIconPicker(context);
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
                    renderStatusManager(); // Re-render to update the disabled state of the status toggle
                    saveData();
                    break;
                case 'setCalendarGradientSource':
                    const source = target.dataset.source;
                    if (source) {
                        theming.calendarGradientSource = source;
                        applyTheme();
                        renderThemeControls();
                        saveData();
                    }
                    break;
                case 'toggleThemeForStatus':
                    theming.useThemeForStatus = target.checked;
                    applyTheme();
                    renderStatusManager();
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
                case 'toggleCreationOnClick':
                    calendarSettings.allowCreationOnClick = event.target.checked;
                    if (uiSettings.userInteractions) uiSettings.userInteractions.toggledCalendarClick = true;
                    saveData();
                    break;
                case 'deleteVacation':
                    const vacationId = target.dataset.id;
                    handleVacationChange(() => {
                        appState.vacations = appState.vacations.filter(v => v.id !== vacationId);
                        renderVacationManager();
                    });
                    break;
                case 'toggleVacationBypass':
                     const catId = target.dataset.categoryId;
                     handleVacationChange(() => {
                         const categoryToUpdate = categories.find(c => c.id === catId);
                         if(categoryToUpdate) {
                             categoryToUpdate.bypassVacation = target.checked;
                             if (uiSettings.userInteractions) uiSettings.userInteractions.usedVacationBypass = true;
                         }
                     });
                    break;
                case 'toggleAutoKpi':
                    appSettings.autoKpiEnabled = event.target.checked;
                    saveData();
                    break;
                case 'toggleAutoKpiRemovable':
                    appSettings.autoKpiRemovable = event.target.checked;
                    saveData();
                    break;
                case 'toggleAllHints':
                    uiSettings.hintsDisabled = event.target.checked;
                    saveData();
                    renderHintManager(); // Re-render to apply the disabled state
                    // Also hide/show the banner itself immediately
                    const hintsBanner = document.getElementById('hints-banner');
                    if (hintsBanner) {
                        hintsBanner.style.display = uiSettings.hintsDisabled ? 'none' : '';
                    }
                    break;
                case 'resetAllHints':
                    if (confirm("Are you sure you want to reset all hint interactions? You will start seeing hints for features you've already used again.")) {
                        if (!uiSettings.userInteractions) {
                            uiSettings.userInteractions = {};
                        }
                        // Set all known hint interactions to false
                        hints.forEach(hint => {
                            uiSettings.userInteractions[hint.interaction] = false;
                        });
                        // Also re-enable the hints system
                        uiSettings.hintsDisabled = false;
                        saveData();
                        renderHintManager(); // Re-render the manager to show all hints as unchecked and re-enable controls
                        // Ensure banner is visible again
                        const banner = document.getElementById('hints-banner');
                        if (banner) {
                            banner.style.display = '';
                        }
                    }
                    break;
                case 'toggleCloseModalAfterAction':
                    uiSettings.closeModalAfterAction = event.target.checked;
                    saveData();
                    break;
                case 'toggleEarlyOnTime':
                    if (!uiSettings.earlyOnTimeSettings) uiSettings.earlyOnTimeSettings = { enabled: false, displaceCalendar: false, onlyAppointments: false };
                    uiSettings.earlyOnTimeSettings.enabled = event.target.checked;
                    renderEarlyOnTimeSettings();
                    saveData();
                    break;
                case 'toggleEarlyOnTimeCalendar':
                    if (!uiSettings.earlyOnTimeSettings) uiSettings.earlyOnTimeSettings = { enabled: false, displaceCalendar: false, onlyAppointments: false };
                    uiSettings.earlyOnTimeSettings.displaceCalendar = event.target.checked;
                    saveData();
                    break;
                case 'toggleEarlyOnTimeAppointments':
                    if (!uiSettings.earlyOnTimeSettings) uiSettings.earlyOnTimeSettings = { enabled: false, displaceCalendar: false, onlyAppointments: false };
                    uiSettings.earlyOnTimeSettings.onlyAppointments = event.target.checked;
                    saveData();
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
        advancedOptionsContentEl.addEventListener('input', (event) => {
            const target = event.target;
            if (target.id === 'planner-sensitivity-slider') {
                const isDefaultToggle = document.getElementById('planner-sensitivity-default-toggle');
                isDefaultToggle.checked = false;
                sensitivitySettings.sValue = parseFloat(target.value);
                 if (uiSettings.userInteractions) uiSettings.userInteractions.changedSensitivity = true;
                saveData();
                updateAllTaskStatuses(true);
            }
        });

        advancedOptionsContentEl.addEventListener('change', (event) => {
            const target = event.target;

            if (target.classList.contains('month-view-display-toggle')) {
                const key = target.name;
                if (uiSettings.monthView.hasOwnProperty(key)) {
                    uiSettings.monthView[key] = target.checked;
                    saveData();
                    if (calendar) calendar.refetchEvents();
                }
                return;
            }

            if (target.classList.contains('hint-seen-checkbox')) {
                const interaction = target.dataset.interaction;
                if (interaction) {
                    if (!uiSettings.userInteractions) {
                        uiSettings.userInteractions = {};
                    }
                    uiSettings.userInteractions[interaction] = target.checked;
                    saveData();
                }
                return; // Prevent other change handlers from firing
            }

            const categoryFilterListEl = document.getElementById('category-filter-list');

            if (target.id === 'planner-sensitivity-default-toggle') {
                const slider = document.getElementById('planner-sensitivity-slider');
                if (target.checked) {
                    sensitivitySettings.sValue = 0.5;
                    slider.value = 0.5;
                    slider.disabled = true;
                } else {
                    slider.disabled = false;
                }
                saveData();
                updateAllTaskStatuses(true);
                return;
            }

            if (target.id === 'app-title-input') { appSettings.title = target.value.trim(); setAppBranding(); return; }
            if (target.id === 'app-subtitle-input') { appSettings.subtitle = target.value.trim(); setAppBranding(); return; }
            if (target.id === 'app-goal-label-input') { appSettings.weeklyGoalLabel = target.value.trim(); setAppBranding(); return; }
            if (target.id === 'weekly-goal-icon-input') { journalSettings.weeklyGoalIcon = target.value.trim(); saveData(); return; }
            if (target.id === 'planner-default-icon') { if (!plannerSettings) plannerSettings = {}; plannerSettings.defaultIcon = target.value.trim(); saveData(); return; }

            if (target.classList.contains('category-color-picker')) {
                const category = categories.find(cat => cat.id === target.dataset.categoryId);
                if (category) { category.color = target.value; saveData(); renderCategoryManager(); renderTasks(); }
            } else if (target.classList.contains('category-filter-checkbox') && categoryFilterListEl) {
                const allCheckbox = categoryFilterListEl.querySelector('input[value="all"]');
                const otherCheckboxes = categoryFilterListEl.querySelectorAll('input:not([value="all"])');
                if (target.value === 'all') {
                    otherCheckboxes.forEach(cb => cb.checked = false);
                    categoryFilter = [];
                } else {
                    allCheckbox.checked = false;
                    categoryFilter = Array.from(otherCheckboxes).filter(cb => cb.checked).map(cb => cb.value === 'null' ? null : cb.value);
                }
                if (categoryFilter.length === 0) allCheckbox.checked = true;
                renderTasks();
                if (calendar) calendar.refetchEvents();
            } else if (target.classList.contains('status-color-picker')) {
                 if (statusColors.hasOwnProperty(target.dataset.statusKey)) {
                     statusColors[target.dataset.statusKey] = target.value;
                     if (uiSettings.userInteractions) uiSettings.userInteractions.changedStatusColor = true;
                     saveData();
                     renderTasks();
                     renderStatusManager();
                 }
            } else if (target.id === 'notification-rate-amount' || target.id === 'notification-rate-unit') { updateNotificationRateLimit();
            } else if (target.id === 'theme-base-color') { theming.baseColor = target.value; applyTheme(); saveData();
            } else if (target.id === 'planner-default-category') { plannerSettings.defaultCategoryId = target.value; saveData();
            } else if (target.classList.contains('task-display-toggle')) {
                if (taskDisplaySettings.hasOwnProperty(target.name)) { taskDisplaySettings[target.name] = target.checked; saveData(); renderTasks(); }
            } else if (target.id === 'calculation-horizon-amount' || target.id === 'calculation-horizon-unit') {
                uiSettings.calculationHorizonAmount = parseInt(document.getElementById('calculation-horizon-amount').value, 10) || 1;
                uiSettings.calculationHorizonUnit = document.getElementById('calculation-horizon-unit').value;
                saveData();
            } else if (target.id === 'gpa-system-select') {
                appSettings.gpaSystem = target.value;
                saveData();
            }
        });

        const sortBySelectEl = document.getElementById('sort-by');
        if(sortBySelectEl) sortBySelectEl.addEventListener('change', (e) => { sortBy = e.target.value; saveData(); renderTasks(); });

        const sortDirectionSelectEl = document.getElementById('sort-direction');
        if(sortDirectionSelectEl) sortDirectionSelectEl.addEventListener('change', (e) => { sortDirection = e.target.value; saveData(); renderTasks(); });
    }

    // --- Planner & KPI Listeners ---
    const prevWeekBtnEl = document.getElementById('prevWeekBtn');
    if (prevWeekBtnEl) prevWeekBtnEl.addEventListener('click', () => { if (calendar) calendar.prev(); });

    const nextWeekBtnEl = document.getElementById('nextWeekBtn');
    if (nextWeekBtnEl) nextWeekBtnEl.addEventListener('click', () => { if (calendar) calendar.next(); });

    const todayBtnEl = document.getElementById('todayBtn');
    if (todayBtnEl) todayBtnEl.addEventListener('click', () => { if (calendar) calendar.today(); });

    const calendarHeader = document.querySelector('.calendar-header');
    if (calendarHeader) {
        const viewBtns = calendarHeader.querySelectorAll('[data-view]');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (calendar) {
                    const viewName = btn.dataset.view === 'month' ? 'dayGridMonth' : btn.dataset.view === 'daily' ? 'timeGridDay' : 'timeGridWeek';
                    calendar.changeView(viewName);
                }
            });
        });
    }

    const kpiPrevWeekBtn = document.getElementById('kpi-prev-week-btn');
    if (kpiPrevWeekBtn) kpiPrevWeekBtn.addEventListener('click', () => { uiSettings.kpiWeekOffset--; saveData(); renderKpiList(); });

    const kpiNextWeekBtn = document.getElementById('kpi-next-week-btn');
    if (kpiNextWeekBtn) kpiNextWeekBtn.addEventListener('click', () => { uiSettings.kpiWeekOffset++; saveData(); renderKpiList(); });

    const kpiTodayBtn = document.getElementById('kpi-today-btn');
    if (kpiTodayBtn) kpiTodayBtn.addEventListener('click', () => { uiSettings.kpiWeekOffset = 0; saveData(); renderKpiList(); });

    const addNewKpiBtnEl = document.getElementById('add-new-kpi-btn');
    if (addNewKpiBtnEl) addNewKpiBtnEl.addEventListener('click', () => openModal(null, { isKpi: true }));

    const setKpiBtnEl = document.getElementById('set-kpi-btn');
    if (setKpiBtnEl) {
        setKpiBtnEl.addEventListener('click', () => {
            const kpiTaskSelectEl = document.getElementById('kpi-task-select');
            if (!kpiTaskSelectEl || !kpiTaskSelectEl.value) return;
            const task = tasks.find(t => t.id === kpiTaskSelectEl.value);
            if (task) {
                task.isKpi = true;
                if (uiSettings.userInteractions) uiSettings.userInteractions.setKpi = true;
                saveData();
                renderKpiList();
                renderKpiTaskSelect();
            }
        });
    }

    const weeklyGoalsEl = document.getElementById('weeklyGoals');
    if (weeklyGoalsEl) {
        weeklyGoalsEl.addEventListener('blur', () => {
            const week = appState.weeks[CURRENT_WEEK_INDEX];
            if (week) {
                const newGoals = weeklyGoalsEl.innerHTML;
                if (week.weeklyGoals !== newGoals) {
                    week.weeklyGoals = newGoals;
                    savePlannerData();
                    if (uiSettings.activeView === 'journal-view') renderJournal();
                }
            }
        });
    }

    const addNewTaskBtnPlanner = document.getElementById('addNewTaskBtnPlanner');
    if (addNewTaskBtnPlanner) {
        addNewTaskBtnPlanner.addEventListener('click', () => openModal());
    }

    // --- Main View & Page Listeners ---
    const dashboardViewEl = document.getElementById('dashboard-view');
    if (dashboardViewEl) {
        dashboardViewEl.addEventListener('click', (event) => {
            const target = event.target.closest('[data-action="toggleDashboardGoalContent"]');
            if (target) {
                const goalContainer = target.parentElement; // The weeklyGoalsEl
                const proseDiv = goalContainer.querySelector('.prose');
                if (proseDiv) {
                    const fullContent = decodeURIComponent(goalContainer.dataset.fullGoal);
                    const isTruncated = proseDiv.innerHTML.endsWith('...');

                    if (isTruncated) {
                        proseDiv.innerHTML = fullContent.replace(/\n/g, '<br>');
                        target.textContent = 'Show Less';
                    } else {
                        proseDiv.innerHTML = fullContent.substring(0, 500).replace(/\n/g, '<br>') + '...';
                        target.textContent = 'Show More';
                    }
                }
            }
        });
    }

    const mainViewNav = document.getElementById('main-view-nav');
    if (mainViewNav) {
        mainViewNav.addEventListener('click', (event) => {
            const target = event.target.closest('.view-toggle-btn');
            if (!target) return;
            const views = [
                { btn: document.getElementById('show-task-manager-btn'), view: document.getElementById('task-manager-view'), id: 'task-manager-view' },
                { btn: document.getElementById('show-calendar-btn'), view: document.getElementById('calendar-view'), id: 'calendar-view' },
                { btn: document.getElementById('show-dashboard-btn'), view: document.getElementById('dashboard-view'), id: 'dashboard-view' },
                { btn: document.getElementById('show-journal-btn'), view: document.getElementById('journal-view'), id: 'journal-view' }
            ];
            views.forEach(item => item.btn.classList.remove('active-view-btn'));
            views.forEach(item => {
                if (item.btn === target) {
                    item.view.classList.remove('hidden');
                    item.btn.classList.add('active-view-btn');
                    uiSettings.activeView = item.id;
                if (item.id === 'calendar-view' && calendar) {
                    calendar.updateSize();
                    renderCalendarCategoryFilters();
                }
                    if (item.id === 'dashboard-view') renderDashboardContent();
                    if (item.id === 'journal-view') renderJournal();
                } else {
                    item.view.classList.add('hidden');
                }
            });
            applyTheme();
            saveData();
        });
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            startNotificationEngine();
        } else {
            stopNotificationEngine();
        }
    });

    // --- Journal Listeners (Event Delegation) ---
    if (journalModal) {
        journalModal.addEventListener('click', (event) => {
            const target = event.target.closest('[data-action]');
            if (!target) return;
            if (target.dataset.action === 'openIconPicker') {
                const context = target.dataset.context || 'journal';
                openIconPicker(context);
            }
        });
    }
    const journalViewEl = document.getElementById('journal-view');
    if (journalViewEl) {
        journalViewEl.addEventListener('click', (event) => {
            const target = event.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            const entryId = target.dataset.id || target.dataset.entryId;

            switch(action) {
                case 'addJournal':
                    openJournalModal();
                    break;
                case 'editJournal':
                    openJournalModal(entryId);
                    break;
                case 'deleteJournal':
                    if (confirm('Are you sure you want to delete this journal entry?')) {
                        appState.journal = appState.journal.filter(e => e.id !== entryId);
                        savePlannerData();
                        renderJournal();
                    }
                    break;
                case 'toggleJournalContent':
                    const contentId = target.dataset.contentId;
                    const contentDiv = document.getElementById(contentId);
                    const entryDiv = target.closest('.journal-entry');
                    if (contentDiv && entryDiv) {
                        const fullContent = decodeURIComponent(entryDiv.dataset.fullContent);
                        const isTruncated = contentDiv.textContent.endsWith('...');

                        if (isTruncated) {
                            contentDiv.textContent = fullContent;
                            target.textContent = 'Show Less';
                        } else {
                            contentDiv.textContent = fullContent.substring(0, 500) + '...';
                            target.textContent = 'Show More';
                        }
                    }
                    break;
                case 'toggleJournalIconGroup':
                    const iconGroup = target.dataset.iconGroup;
                    const entriesContainer = journalViewEl.querySelector(`.journal-entries-container[data-icon-entries="${iconGroup}"]`);
                    const chevron = target.querySelector('i.fa-solid');
                    if (entriesContainer) {
                        const isCollapsed = entriesContainer.style.display === 'none';
                        if (isCollapsed) {
                            entriesContainer.style.display = '';
                            if (chevron) {
                                chevron.classList.remove('fa-chevron-right');
                                chevron.classList.add('fa-chevron-down');
                            }
                            uiSettings.journalIconCollapseState[iconGroup] = false;
                        } else {
                            entriesContainer.style.display = 'none';
                             if (chevron) {
                                chevron.classList.remove('fa-chevron-down');
                                chevron.classList.add('fa-chevron-right');
                            }
                            uiSettings.journalIconCollapseState[iconGroup] = true;
                        }
                        saveData();
                    }
                    break;
            }
        });

        const journalSortBy = document.getElementById('journal-sort-by');
        const journalSortDir = document.getElementById('journal-sort-direction');
        const journalSortHandler = () => {
            if (uiSettings.userInteractions) uiSettings.userInteractions.sortedJournal = true;
            renderJournal();
        };
        if(journalSortBy) journalSortBy.addEventListener('change', journalSortHandler);
        if(journalSortDir) journalSortDir.addEventListener('change', journalSortHandler);
    }

    // --- Calendar View Listeners ---
    const calendarViewEl = document.getElementById('calendar-view');
    if (calendarViewEl) {
        calendarViewEl.addEventListener('change', (e) => {
            const target = e.target;
            if (target.id === 'calendar-filter-view-select') {
                calendarSettings.filterTargetView = target.value;
                saveData();
                if (calendar) {
                    calendar.refetchEvents();
                }
            }
        });

        calendarViewEl.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action="toggleCalendarFilter"]');
            if (!target) return;

            const categoryId = target.dataset.categoryId;
            const filterType = target.dataset.filterType;
            const isEnabled = target.checked;

            if (!uiSettings.calendarCategoryFilters[categoryId]) {
                uiSettings.calendarCategoryFilters[categoryId] = { show: true, schedule: true };
            }

            uiSettings.calendarCategoryFilters[categoryId][filterType] = isEnabled;

            saveData();
            updateAllTaskStatuses(true);
            if (calendar) {
                calendar.refetchEvents();
            }
        });
    }
}

function saveData() {
    if (isInitializing) {
        console.log("Initialization in progress, skipping save data.");
        return;
    }
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
        localStorage.setItem('journalSettings', JSON.stringify(journalSettings));
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
    const storedJournalSettings = localStorage.getItem('journalSettings');

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
            // Ensure the userInteractions object exists after loading
            if (!uiSettings.userInteractions) {
                uiSettings.userInteractions = {};
            }
        } catch (e) {
            console.error("Error parsing UI settings:", e);
        }
    }

    if (storedJournalSettings) {
        try {
            const parsedSettings = JSON.parse(storedJournalSettings);
            journalSettings = { ...journalSettings, ...parsedSettings };
        } catch (e) {
            console.error("Error parsing Journal settings:", e);
        }
    }


    // Only load from localStorage if the arrays are empty.
    // This allows verification scripts to inject data without it being overwritten.
    if (categories.length === 0 && storedCategories) {
        try {
            categories = JSON.parse(storedCategories);
        } catch (error) {
            console.error("Error parsing categories from localStorage:", error);
            categories = []; // Reset on error
        }
    }
    if (tasks.length === 0 && storedTasks) {
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
                    const elapsedWhileAway = Date.now() - new Date(task.timerLastStarted).getTime();
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
            tasks = []; // Reset on error
        }
    }

    updateAllTaskStatuses(true);
    renderKpiTaskSelect();
    renderKpiList();
    startMainUpdateLoop();
}

function updateAllTaskStatuses(forceRender = false) {
    const now = new Date();
    const nowMs = now.getTime();

    const calculationHorizon = getCalculationHorizonDate();
    const settings = {
        sensitivity: sensitivitySettings,
        vacations: appState.vacations,
        categories: categories,
        calendarCategoryFilters: uiSettings.calendarCategoryFilters,
        earlyOnTimeSettings: uiSettings.earlyOnTimeSettings,
    };

    // --- Task Status Updates ---
    const allOccurrences = runCalculationPipeline([...tasks], calculationHorizon, settings);
    let changed = false;
    const nextOccurrenceMap = new Map();
    allOccurrences
        .filter(o => o.scheduledEndTime && new Date(o.scheduledEndTime).getTime() > nowMs)
        .sort((a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime())
        .forEach(o => {
            if (!nextOccurrenceMap.has(o.originalId)) {
                nextOccurrenceMap.set(o.originalId, o);
            }
        });

    tasks.forEach(task => {
        const oldStatus = task.status;
        const oldConfirmationState = task.confirmationState;
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const isPastDue = dueDate && dueDate.getTime() <= nowMs;
        if (isPastDue && task.status !== 'blue' && !task.confirmationState) {
            task.confirmationState = 'awaiting_overdue_input';
            if (!task.overdueStartDate) task.overdueStartDate = task.dueDate.toISOString();
            task.pendingCycles = calculatePendingCycles(task, nowMs);
            if (task.isTimerRunning) toggleTimer(task.id);
        } else if (!isPastDue && (task.confirmationState === 'awaiting_overdue_input' || task.confirmationState === 'confirming_miss')) {
            task.confirmationState = null;
            delete task.overdueStartDate;
            delete task.pendingCycles;
        }

        const nextOccurrence = nextOccurrenceMap.get(task.id);
        let newStatus, newGpa = 0;
        if (task.status === 'blue' && task.cycleEndDate && new Date(task.cycleEndDate) > now) {
            newStatus = 'blue'; newGpa = 1.0;
        } else if (task.confirmationState === 'awaiting_overdue_input') {
            newStatus = 'black'; newGpa = 0.0;
        } else if (nextOccurrence) {
            newStatus = nextOccurrence.finalStatus;
            newGpa = nextOccurrence.coloringGpa;
        } else {
            newStatus = 'green'; newGpa = 0.75;
        }

        const isPendingConfirmation = ['confirming_complete', 'confirming_miss', 'confirming_delete', 'confirming_undo'].includes(task.confirmationState);
        if (!isPendingConfirmation) {
            if (task.status !== newStatus) task.status = newStatus;
            task.coloringGpa = newGpa;
        }
        if (task.status !== oldStatus || task.confirmationState !== oldConfirmationState) changed = true;
    });

    const tasksToRemove = tasks.filter(task => task.repetitionType === 'none' && task.completed && task.cycleEndDate && nowMs >= new Date(task.cycleEndDate).getTime()).map(t => t.id);
    if (tasksToRemove.length > 0) {
        tasks = tasks.filter(t => !tasksToRemove.includes(t.id));
        changed = true;
    }

    if (changed || forceRender) {
        saveData();
        renderTasks();
    }

    // --- Calendar Event Calculation ---
    // This is now the single source of truth for calendar event data.
    calendarMonthEvents = [];
    calendarTimeGridEvents = [];

    const processEvent = (eventData) => {
        const { start, end, baseProps, isHistorical, originalId, completionDate } = eventData;

        // Final validation before adding to arrays
        if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
            console.warn("Skipping invalid event during processing:", { baseProps, start, end });
            return;
        }

        // TimeGrid View (Week/Day): Add as a single block
        const timeGridId = isHistorical ? `hist_${originalId}_${completionDate}` : (baseProps.id || originalId);
        calendarTimeGridEvents.push({ ...baseProps, id: timeGridId, start, end });

        // Month View: Split into daily segments
        let currentSegmentStart = new Date(start);
        while (currentSegmentStart < end) {
            const startOfNextDay = new Date(currentSegmentStart);
            startOfNextDay.setHours(24, 0, 0, 0);
            const segmentEnd = (end < startOfNextDay) ? new Date(end) : startOfNextDay;

            // Create a unique ID for the segment to avoid key collisions in React-based renderers
            const segmentId = `${timeGridId}_${currentSegmentStart.toISOString()}`;

            if (segmentEnd > currentSegmentStart) {
                calendarMonthEvents.push({ ...baseProps, id: segmentId, start: currentSegmentStart, end: segmentEnd });
            }
            currentSegmentStart = startOfNextDay;
        }
    };

    // Process active tasks from the pipeline
    allOccurrences.forEach(occurrence => {
        if (!occurrence.scheduledStartTime || !occurrence.scheduledEndTime) return;

        const start = new Date(occurrence.displayStartTime || occurrence.scheduledStartTime);
        const end = new Date(occurrence.displayEndTime || occurrence.scheduledEndTime);

        const task = tasks.find(t => t.id === occurrence.originalId);
        if (!task) return; // Don't render occurrences for tasks that no longer exist

        const category = categories.find(c => c.id === occurrence.categoryId);
        const categoryColor = category ? category.color : '#374151'; // Default gray for uncategorized
        const borderColor = statusColors[occurrence.finalStatus] || statusColors.black;

        const baseProps = {
            title: occurrence.name,
            backgroundColor: categoryColor,
            borderColor: borderColor,
            textColor: getContrastingTextColor(categoryColor)['--text-color-primary'],
            extendedProps: {
                taskId: occurrence.originalId,
                occurrenceDueDate: new Date(occurrence.occurrenceDueDate).toISOString(),
                isHistorical: false,
                category: category,
                icon: task.icon
            },
            id: occurrence.id // Pass the unique occurrence ID
        };
        processEvent({ start, end, baseProps, isHistorical: false, originalId: occurrence.id });
    });

    // Process recent historical tasks
    const sevenDaysAgo = new Date(nowMs - 7 * MS_PER_DAY);
    if (appState.historicalTasks && Array.isArray(appState.historicalTasks)) {
        appState.historicalTasks
            .filter(ht => ht && ht.completionDate && new Date(ht.completionDate) >= sevenDaysAgo)
            .forEach(ht => {
                const durationMs = getDurationMs(ht.durationAmount, ht.durationUnit) || MS_PER_HOUR;
                const endDate = new Date(ht.completionDate);
                const startDate = new Date(endDate.getTime() - durationMs);

                const category = categories.find(c => c.id === ht.categoryId);
                const baseColor = category ? category.color : '#808080';

                // Make historical events appear "faded"
                const hsl = hexToHSL(baseColor);
                hsl.s = Math.max(0, hsl.s - 20); // Desaturate
                hsl.l = document.body.classList.contains('light-mode') ? Math.min(100, hsl.l + 15) : Math.max(0, hsl.l - 15); // Lighten/darken
                const eventColor = HSLToHex(hsl.h, hsl.s, hsl.l);

                const originalTask = tasks.find(t => t.id === ht.originalTaskId) || (appState.archivedTasks && appState.archivedTasks.find(t => t.id === ht.originalTaskId));

                const baseProps = {
                    title: ht.name,
                    backgroundColor: eventColor,
                    borderColor: statusColors[ht.status] || statusColors.black,
                    textColor: getContrastingTextColor(eventColor)['--text-color-primary'],
                    extendedProps: {
                        taskId: ht.originalTaskId,
                        isHistorical: true,
                        category: category,
                        icon: originalTask ? originalTask.icon : null
                    }
                };
                processEvent({ start: startDate, end: endDate, baseProps, isHistorical: true, originalId: ht.originalTaskId, completionDate: ht.completionDate });
            });
    }

    // If the calendar exists, tell it to refetch events.
    if (calendar) {
        calendar.refetchEvents();
    }

    // --- Task View Modal Border Update ---
    const taskViewModalEl = document.getElementById('task-view-modal');
    if (taskViewModalEl && taskViewModalEl.classList.contains('active')) {
        const viewingTaskId = taskViewModalEl.dataset.viewingTaskId;
        if (viewingTaskId) {
            const task = tasks.find(t => t.id === viewingTaskId);
            const borderWrapper = document.getElementById('task-view-modal-border-wrapper');
            if (task && borderWrapper) {
                let gpaPercent = typeof task.coloringGpa === 'number' ? task.coloringGpa : ((statusColors[task.status] || 0) / 4.0);
                const baseColor = interpolateFiveColors(gpaPercent);
                const isDarkMode = !document.body.classList.contains('light-mode');
                const topColor = adjustColor(baseColor, isDarkMode ? 0.2 : -0.2);
                const bottomColor = adjustColor(baseColor, isDarkMode ? -0.2 : 0.2);
                const gradient = `linear-gradient(to bottom, ${topColor}, ${bottomColor})`;
                borderWrapper.style.background = gradient;
            }
        }
    }
}
function startMainUpdateLoop() {
    if (mainUpdateInterval) {
        clearTimeout(mainUpdateInterval);
        mainUpdateInterval = null;
    }

    const scheduledUpdate = () => {
        // These are the actions that were in the setInterval
        updateAdaptiveSensitivity();
        updateAllTaskStatuses(false);

        // Schedule the next execution, ensuring it stays aligned
        const now = new Date();
        const delay = 15000 - (now.getSeconds() % 15 * 1000 + now.getMilliseconds());
        mainUpdateInterval = setTimeout(scheduledUpdate, delay);
    };

    // Kick off the first aligned execution.
    // The `loadData` function already performs an immediate update on page load.
    // This timeout sets up the first of the recurring, clock-aligned updates.
    const now = new Date();
    const initialDelay = 15000 - (now.getSeconds() % 15 * 1000 + now.getMilliseconds());
    mainUpdateInterval = setTimeout(scheduledUpdate, initialDelay);
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
        indicators: appState.indicators,
        journal: appState.journal,
        archivedTasks: appState.archivedTasks // Persist archived tasks
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
        appState.journal = parsedData.journal || [];
        // Load archived tasks, ensuring dates are correctly parsed
        if (parsedData.archivedTasks && Array.isArray(parsedData.archivedTasks)) {
            appState.archivedTasks = parsedData.archivedTasks.map(task => {
                 let tempTask = { ...task };
                tempTask.dueDate = task.dueDate ? new Date(task.dueDate) : null;
                tempTask.createdAt = task.createdAt ? new Date(task.createdAt) : new Date();
                tempTask.cycleEndDate = task.cycleEndDate ? new Date(task.cycleEndDate) : null;
                return tempTask;
            });
        } else {
            appState.archivedTasks = [];
        }


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
        { btn: showDashboardBtn, view: dashboardView, id: 'dashboard-view' },
        { btn: showJournalBtn, view: journalView, id: 'journal-view' }
    ];

    const activeViewId = uiSettings.activeView || 'dashboard-view';
    let foundActive = false;

    // Remove active class from all buttons first
    views.forEach(item => item.btn.classList.remove('active-view-btn'));

    views.forEach(item => {
        if (item.id === activeViewId) {
            item.view.classList.remove('hidden');
            item.btn.classList.add('active-view-btn');
            if (item.view === calendarView && calendar) calendar.updateSize();
            if (item.id === 'dashboard-view') renderDashboardContent();
            if (item.id === 'journal-view') renderJournal();
            foundActive = true;
        } else {
            item.view.classList.add('hidden');
        }
    });

    // Fallback if the saved view ID is invalid
    if (!foundActive && views.length > 0) {
        views[2].view.classList.remove('hidden'); // Default to dashboard
        views[2].btn.classList.add('active-view-btn');
        renderDashboardContent();
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
        nowIndicator: true, // Show the current time indicator
        navLinks: true, // Allow clicking on day/week numbers to navigate
        eventOrder: (a, b) => {
            const startA_date = a.start ? new Date(a.start) : null;
            const endA_date = a.end ? new Date(a.end) : null;
            const startB_date = b.start ? new Date(b.start) : null;
            const endB_date = b.end ? new Date(b.end) : null;
            if (!startA_date || !endA_date || !startB_date || !endB_date || isNaN(startA_date) || isNaN(endA_date) || isNaN(startB_date) || isNaN(endB_date)) {
                // This console.warn is now less likely to fire, but is good to keep as a fallback.
                console.warn("Invalid event object passed to eventOrder. Skipping sort.", JSON.stringify({ a, b }, null, 2));
                return 0; // Return a neutral sort order to prevent crashing
            }

            const durationA = endA_date.getTime() - startA_date.getTime();
            const durationB = endB_date.getTime() - startB_date.getTime();

            // Primary sort: duration (longer events first)
            if (durationA !== durationB) {
                return durationB - durationA;
            }

            // Secondary sort: start time
            if (startA_date.getTime() !== startB_date.getTime()) {
                return startA_date.getTime() - startB_date.getTime();
            }

            // Tertiary sort: alphabetical by title
            return a.title.localeCompare(b.title);
        },
        eventContent: function(arg) {
            const { event, timeText, view } = arg;
            const { extendedProps } = event;

            // --- Filtering Logic ---
            const filterTargetView = calendarSettings.filterTargetView || 'all';
            const applyFilters = filterTargetView === 'all' || filterTargetView === view.type;
            if (applyFilters) {
                const catId = extendedProps.category ? extendedProps.category.id : 'null';
                const filter = uiSettings.calendarCategoryFilters[catId];
                if (filter && !filter.show) {
                    return { domNodes: [] };
                }
            }

            // --- Month View Rendering ---
            if (view.type === 'dayGridMonth') {
                const categoryColor = event.backgroundColor;
                const textColor = event.textColor;
                const iconHtml = extendedProps.icon && uiSettings.monthView.showIcon ? `<i class="${extendedProps.icon} fa-fw month-view-icon" style="color: ${textColor};"></i>` : '';
                const timeHtml = uiSettings.monthView.showTime ? `<span class="month-view-time">${timeText}</span>` : '';
                const nameHtml = uiSettings.monthView.showName ? `<span class="month-view-name">${event.title}</span>` : '';
                // The background is applied to the wrapper, and text color to the contents.
                return { html: `<div class="month-view-event-item" style="background-color: ${categoryColor}; color: ${textColor};">${iconHtml} ${timeHtml} ${nameHtml}</div>` };
            }

            // --- TimeGrid Day/Week View Rendering ---
            const durationMs = event.end - event.start;
            const isShort = durationMs < (30 * 60 * 1000);

            // Conditional content based on user requirements
            const iconHtml = extendedProps.icon ? `<i class="${extendedProps.icon} fa-fw fc-event-icon"></i> ` : '';
            const timeHtml = `<span class="fc-event-time">${timeText}</span> `;
            const titleHtml = `<span class="fc-event-title">${event.title}</span>`;

            let contentHtml;
            if (isShort) {
                contentHtml = titleHtml;
            } else {
                contentHtml = `${iconHtml}${timeHtml}${titleHtml}`;
            }

            // Use a simple, flexible structure that allows for natural wrapping.
            return { html: `<div class="fc-event-main-inner">${contentHtml}</div>` };
        },
        eventClassNames: function(arg) {
            const durationMs = arg.event.end - arg.event.start;
            if (durationMs < (30 * 60 * 1000)) {
                return ['fc-event-short'];
            }
            return [];
        },
        events: (fetchInfo, successCallback, failureCallback) => {
            try {
                // It's more robust to check the calendar's current view directly,
                // as fetchInfo.view can be undefined during certain refreshes.
                if (calendar && calendar.view.type === 'dayGridMonth') {
                    successCallback(calendarMonthEvents);
                } else {
                    // Default to the time-grid events if the view isn't month or calendar is not ready
                    successCallback(calendarTimeGridEvents);
                }
            } catch (e) {
                console.error("Error providing events to FullCalendar:", e);
                // Ensure failureCallback exists before calling it
                if (failureCallback) {
                    failureCallback(e);
                }
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
            // Use a timeout to ensure this runs after the button classes have been set, avoiding a race condition.
            setTimeout(() => applyTheme(), 0);
        },
        eventClick: (info) => {
            const eventId = info.event.id;
            const isHistorical = info.event.extendedProps.isHistorical;
            const occurrenceDueDate = info.event.extendedProps.occurrenceDueDate ? new Date(info.event.extendedProps.occurrenceDueDate) : null;

            // Use the explicit taskId from extendedProps for active tasks. This is more reliable.
            const idToOpen = isHistorical ? eventId : (info.event.extendedProps.taskId || eventId);

            openTaskView(idToOpen, isHistorical, occurrenceDueDate);
        },
        eventDidMount: function(info) {
            if (info.view.type === 'dayGridMonth') {
                if (info.event.borderColor) {
                    info.el.style.borderColor = info.event.borderColor;
                }
            }
        },
        dateClick: (info) => {
            if (!calendarSettings.allowCreationOnClick) {
                return;
            }
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

    // --- Swipe Navigation for Calendar ---
    let touchStartX = 0;
    let touchEndX = 0;
    let lastSwipeDirection = null;
    let lastSwipeTime = 0;
    let swipeResetTimer = null;
    const SWIPE_TIMEOUT = 500; // ms

    calendarEl.addEventListener('touchstart', function(event) {
        touchStartX = event.changedTouches[0].screenX;
    }, { passive: true });

    calendarEl.addEventListener('touchend', function(event) {
        touchEndX = event.changedTouches[0].screenX;
        handleSwipeGesture();
    }, { passive: true });

    function handleSwipeGesture() {
        const swipeThreshold = 50; // Minimum pixels for a swipe
        const now = Date.now();
        let currentSwipeDirection = null;

        if (touchStartX - touchEndX > swipeThreshold) {
            currentSwipeDirection = 'left'; // Next
        } else if (touchEndX - touchStartX > swipeThreshold) {
            currentSwipeDirection = 'right'; // Prev
        }

        if (!currentSwipeDirection) return;

        // Clear any pending reset timer
        if (swipeResetTimer) {
            clearTimeout(swipeResetTimer);
            swipeResetTimer = null;
        }

        // Check for a consecutive swipe
        if (lastSwipeDirection === currentSwipeDirection && (now - lastSwipeTime < SWIPE_TIMEOUT)) {
            // This is the second swipe, trigger navigation
            if (currentSwipeDirection === 'left') {
                calendar.next();
            } else {
                calendar.prev();
            }
            // Reset state after successful double swipe
            lastSwipeDirection = null;
            lastSwipeTime = 0;
            if (uiSettings.userInteractions) {
                uiSettings.userInteractions.usedSwipeNavigation = true;
            }

        } else {
            // This is the first swipe, or the direction/timeout didn't match.
            // Set the state for the next potential swipe.
            lastSwipeDirection = currentSwipeDirection;
            lastSwipeTime = now;

            // Set a timer to reset the swipe state if a second swipe doesn't happen soon.
            swipeResetTimer = setTimeout(() => {
                lastSwipeDirection = null;
                lastSwipeTime = 0;
            }, SWIPE_TIMEOUT);
        }
    }
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
        setAppBranding(); // Set the title on load

        // The automatic check for orphaned history has been removed.
        // This functionality is now available via a button in Advanced Options.

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
        renderJournal(); // Render journal entries on load
        console.log("Mission Planner initialized.");
    } catch (e) {
        console.error("Error during Mission Planner initialization:", e);
    }

    // All initialization is complete. It's now safe to save data.
    isInitializing = false;
    console.log("Initialization complete. Data saving is now enabled.");

    initializeHints();
    if (!uiSettings.welcomeScreenShown) {
        showWelcomeModal();
    }
});

function showWelcomeModal() {
    document.body.insertAdjacentHTML('beforeend', welcomeModalTemplate());
    const welcomeModal = document.getElementById('welcome-modal');
    const colorPicker = document.getElementById('welcome-color-picker');
    const noThanksBtn = document.getElementById('welcome-no-thanks');
    const submitBtn = document.getElementById('welcome-submit');

    const closeModal = () => {
        uiSettings.welcomeScreenShown = true;
        saveData();
        deactivateModal(welcomeModal);
        welcomeModal.remove();
    };

    noThanksBtn.addEventListener('click', () => {
        theming.mode = 'auto';
        saveData();
        applyTheme();
        closeModal();
    });

    submitBtn.addEventListener('click', () => {
        theming.enabled = true;
        theming.baseColor = colorPicker.value;
        theming.mode = 'auto';
        saveData();
        applyTheme();
        closeModal();
    });

    activateModal(welcomeModal);
}

// --- Hints & Tips Banner ---
const hints = [
    {
        id: 'prepTime',
        text: "Did you know? You can set a 'Preparation Time' for tasks to get earlier reminders in the task form.",
        interaction: 'usedPrepTime'
    },
    {
        id: 'calendarClickCreate',
        text: "You can turn on 'Tap to Create' for the calendar in Advanced Options under 'Planner Integration' to quickly create events.",
        interaction: 'toggledCalendarClick'
    },
    {
        id: 'vacationMode',
        text: "Going on a trip? Use 'Vacation Schedule' in Advanced Options to automatically push task due dates.",
        interaction: 'addedVacation'
    },
    {
        id: 'vacationBypass',
        text: "For important tasks during a break, set their category to 'Bypass Vacation' in 'Vacation Schedule'.",
        interaction: 'usedVacationBypass'
    },
    {
        id: 'bulkEdit',
        text: "Pro-tip: Bulk-edit all tasks in a category from 'Category Management' in Advanced Options.",
        interaction: 'usedBulkEdit'
    },
    {
        id: 'setKPI',
        text: "Set a task as a 'KPI' from the Dashboard to track your completion accuracy over time.",
        interaction: 'setKpi'
    },
    {
        id: 'journaling',
        text: "Use the Journal to reflect on your week. Entries can be tagged with icons and grouped.",
        interaction: 'addedJournalEntry'
    },
    {
        id: 'sensitivity',
        text: "The 'Planner Sensitivity' slider changes how early the app warns you about upcoming tasks. Find what works for you!",
        interaction: 'changedSensitivity'
    },
    {
        id: 'exportData',
        text: "Create a backup of your tasks and settings by using the 'Data & Notifications' section in Advanced Options.",
        interaction: 'exportedData'
    },
    {
        id: 'statusColors',
        text: "Personalize the look of your task list by changing the Status Colors in Advanced Options.",
        interaction: 'changedStatusColor'
    },
    {
        id: 'sortJournal',
        text: "Did you know you can sort your Journal entries by date or by icon?",
        interaction: 'sortedJournal'
    },
    {
        id: 'dataCleanup',
        text: "Keep your data tidy by using the 'Orphaned History Cleanup' tool in Advanced Options under 'Data & Notifications'.",
        interaction: 'usedDataMigration'
    },
    {
        id: 'swipeNav',
        text: "To prevent accidental date changes on mobile, you now need to swipe twice in the same direction to navigate the calendar.",
        interaction: 'usedSwipeNavigation'
    }
];

function initializeHints() {
    const hintsBanner = document.getElementById('hints-banner');
    if (!hintsBanner) return;

    // Check if hints are globally disabled first.
    if (uiSettings.hintsDisabled) {
        hintsBanner.style.display = 'none';
        return;
    }


    if (!uiSettings.userInteractions) {
        uiSettings.userInteractions = {};
    }

    const showRandomHint = () => {
        // Double-check disabled flag inside the interval as well
        if (uiSettings.hintsDisabled) {
            hintsBanner.style.display = 'none';
            return;
        }

        const hintContent = hintsBanner.querySelector('.hints-content span');
        if (!hintContent) return;

        const availableHints = hints.filter(hint => !uiSettings.userInteractions[hint.interaction]);

        if (availableHints.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableHints.length);
            hintContent.textContent = `💡 ${availableHints[randomIndex].text}`;
            hintsBanner.style.display = '';
        } else {
            hintsBanner.style.display = 'none';
        }
    };

    showRandomHint();
    setInterval(showRandomHint, 30000);
}
