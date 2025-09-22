/**
 * This file will contain template functions that generate HTML strings.
 * This helps to separate the HTML structure from the JavaScript logic.
 */

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

function formatDateTime(date, use24HourFormat) {
    if (!date || isNaN(date)) return 'N/A';
    const dateOptions = { year: 'numeric', month: 'numeric', day: 'numeric' };
    const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: !use24HourFormat };
    return `${date.toLocaleDateString('en-US', dateOptions)} ${date.toLocaleTimeString('en-US', timeOptions)}`;
}

function formatDuration(amount, unit) {
    if (!amount || !unit || amount <= 0) return 'N/A';
    return `${amount} ${unit}`;
}

function formatMsToTime(ms) {
    if (isNaN(ms) || ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function getDurationMs(amount, unit) {
    if (!amount || !unit || amount <= 0) return 0;
    amount = parseInt(amount, 10);
    let ms = 0;
    switch (unit) {
        case 'minutes': ms = amount * 60000; break;
        case 'hours': ms = amount * 3600000; break;
        case 'days': ms = amount * 86400000; break;
        case 'weeks': ms = amount * 7 * 86400000; break;
        case 'months': ms = amount * 30 * 86400000; break; // Approximation
        default: ms = 0;
    }
    return ms;
}


export function taskTemplate(task, { categories, taskDisplaySettings, getContrastingTextColor, appSettings }) {
    const category = categories.find(c => c.id === task.categoryId);
    const categoryName = category ? category.name : 'Uncategorized';

    let categoryHtml = '';
    if (taskDisplaySettings.showCategory) {
        const categoryColor = category ? category.color : '#808080'; // Default to gray
        const categoryTextStyle = getContrastingTextColor(categoryColor);
        categoryHtml = `<span class="text-xs font-medium px-2 py-1 rounded-full" style="background-color: ${categoryColor}; color: ${categoryTextStyle.color}; text-shadow: ${categoryTextStyle.textShadow};">${categoryName}</span>`;
    }

    const dueDateStr = (task.dueDate && !isNaN(task.dueDate)) ? formatDateTime(task.dueDate, appSettings.use24HourFormat) : 'No due date';
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
    const isCompletedNonRepeating = task.repetitionType === 'none' && task.completed;
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

    return `<div class="flex-grow pr-4">
                <div class="flex justify-between items-baseline">
                    <h3 class="text-lg font-semibold">${iconHtml}${task.name || 'Unnamed Task'}</h3>
                    ${categoryHtml}
                </div>
                ${dueDateHtml}
                ${repetitionHtml}
                ${durationHtml}
                ${countdownHtml}
                ${progressHtml}
            </div>
            <div class="flex flex-col space-y-1 items-end flex-shrink-0">
                ${actionAreaContainer}
                ${missesHtml}
                ${commonButtonsContainer}
            </div>`;
}

export function categoryManagerTemplate(categories) {
    if (categories.length === 0) {
        return '<p class="text-gray-500 italic">No categories created yet.</p>';
    }

    const categoryItems = categories.map(cat => `
        <div class="p-2 border-b" id="category-item-${cat.id}">
            <div class="flex items-center justify-between">
                <div id="category-display-${cat.id}" class="flex-grow flex items-center" data-action="triggerCategoryEdit" data-category-id="${cat.id}">
                    <span class="font-medium cursor-pointer">${cat.name}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <input type="color" value="${cat.color}" data-category-id="${cat.id}" class="category-color-picker h-8 w-12 border-none cursor-pointer rounded">
                    <button data-action="deleteCategory" data-category-id="${cat.id}" class="text-red-500 hover:text-red-700 font-bold text-lg" aria-label="Delete category ${cat.name}">&times;</button>
                </div>
            </div>
            <div class="mt-2 flex justify-end space-x-2">
                <button data-action="clearCategoryTasks" data-category-id="${cat.id}" class="control-button control-button-yellow text-xs">Clear Active</button>
                <button data-action="deleteCategoryTasks" data-category-id="${cat.id}" class="control-button control-button-red text-xs">Delete All</button>
            </div>
        </div>
    `).join('');

    const addButton = `
        <button class="control-button control-button-blue mt-4" data-action="addCategory">
            Add New Category
        </button>
    `;

    return categoryItems + addButton;
}

export function taskViewTemplate(task, { categories, appSettings }) {
    const category = categories.find(c => c.id === task.categoryId);
    const categoryName = category ? category.name : 'Uncategorized';
    const dueDateStr = (task.dueDate && !isNaN(task.dueDate)) ? formatDateTime(task.dueDate, appSettings.use24HourFormat) : 'No due date';
    const durationStr = formatDuration(task.estimatedDurationAmount, task.estimatedDurationUnit);

    let repetitionStr = 'Non-Repeating';
    if (task.repetitionType === 'relative') {
        repetitionStr = `Every ${task.repetitionAmount || '?'} ${task.repetitionUnit || '?'}`;
    } else if (task.repetitionType === 'absolute') {
        repetitionStr = getAbsoluteRepetitionString(task);
    }

    return `
        <h3 class="text-2xl font-bold mb-4">${task.icon ? `<i class="${task.icon} mr-2"></i>` : ''}${task.name}</h3>
        <div class="space-y-3 text-gray-700">
            <p><strong>Status:</strong> <span class="font-semibold">${task.status.charAt(0).toUpperCase() + task.status.slice(1)}</span></p>
            <p><strong>Category:</strong> ${categoryName}</p>
            <p><strong>Due Date:</strong> ${dueDateStr}</p>
            <p><strong>Estimated Duration:</strong> ${durationStr}</p>
            <p><strong>Repetition:</strong> ${repetitionStr}</p>
        </div>
        <div class="mt-6 flex justify-end space-x-3">
            <button data-action="viewTaskStats" class="control-button control-button-blue">View Statistics</button>
            <button data-action="editTaskFromView" class="control-button control-button-yellow">Edit Task</button>
        </div>
    `;
}

export function notificationManagerTemplate(notificationSettings, categories) {
    const categoryItems = categories.map(cat => {
        // Default to true if not set
        const isEnabled = notificationSettings.categories[cat.id] !== false;
        return `
            <div class="flex items-center justify-between p-2 border rounded-md">
                <span class="font-medium">${cat.name}</span>
                <input type="checkbox" data-action="toggleCategoryNotification" data-category-id="${cat.id}" class="toggle-checkbox h-6 w-12 rounded-full p-1 bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 appearance-none cursor-pointer" ${isEnabled ? 'checked' : ''}>
            </div>
        `;
    }).join('');

    const categoryListHtml = categories.length > 0
        ? categoryItems
        : '<p class="text-gray-500 italic text-sm">No categories to configure.</p>';

    return `
        <div class="flex items-center justify-between">
            <label for="master-notification-toggle" class="form-label mb-0">Enable All Notifications:</label>
            <input type="checkbox" id="master-notification-toggle" data-action="toggleAllNotifications" class="toggle-checkbox h-6 w-12 rounded-full p-1 bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 appearance-none cursor-pointer ${notificationSettings.enabled ? 'bg-green-500' : ''}" ${notificationSettings.enabled ? 'checked' : ''}>
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
                    ${categoryListHtml}
                </div>
            </div>
        </div>
    `;
}
