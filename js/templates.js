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
        // The text color is now handled by the parent .task-item's CSS variables
        categoryHtml = `<span class="text-xs font-medium px-2 py-1 rounded-full" style="background-color: ${categoryColor};">${categoryName}</span>`;
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
    const iconToUse = task.icon || (category ? category.icon : null);
    const iconHtml = iconToUse ? `<i class="${iconToUse} mr-2"></i>` : '';

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
    let content = '';
    if (categories.length === 0) {
        content += '<p class="text-gray-500 italic">No categories created yet.</p>';
    } else {
        content += categories.map(cat => `
            <div class="p-2 border-b" id="category-item-${cat.id}">
                <div class="flex items-center justify-between">
                    <div id="category-display-${cat.id}" class="flex-grow flex items-center" data-action="triggerCategoryEdit" data-category-id="${cat.id}">
                        <span class="font-medium cursor-pointer">${cat.icon ? `<i class="${cat.icon} mr-2"></i>` : ''}${cat.name}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button data-action="setCategoryIcon" data-category-id="${cat.id}" class="themed-button-clear text-xs">Set Icon</button>
                        <input type="color" value="${cat.color}" data-category-id="${cat.id}" class="category-color-picker h-8 w-12 border-none cursor-pointer rounded">
                        <button data-action="deleteCategory" data-category-id="${cat.id}" class="themed-button-clear font-bold text-lg" aria-label="Delete category ${cat.name}">&times;</button>
                    </div>
                </div>
                <div class="mt-2 flex justify-end space-x-2">
                    <button data-action="bulkEdit" data-category-id="${cat.id}" class="themed-button-clear text-xs">Bulk Edit</button>
                    <button data-action="deleteCategoryTasks" data-category-id="${cat.id}" class="themed-button-clear text-xs">Delete All Tasks</button>
                </div>
                <div id="bulk-edit-container-${cat.id}" class="hidden mt-2"></div>
            </div>
        `).join('');
    }

    content += `
        <div class="mt-4">
            <button class="control-button control-button-blue w-full themed-button-secondary" data-action="renderCategoryAdd">
                Add New Category
            </button>
            <div id="add-category-form-container" class="mt-2"></div>
        </div>
    `;

    return content;
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
            <button data-action="viewTaskStats" class="control-button control-button-blue themed-button-secondary">View Statistics</button>
            <button data-action="editTaskFromView" class="control-button control-button-yellow themed-button-secondary">Edit Task</button>
        </div>
    `;
}

export function dataMigrationModalTemplate() {
    return `
        <div class="modal-content">
            <h3 class="text-xl font-semibold mb-4">Task Data Migration & Integrity Tool</h3>
            <button class="close-button">&times;</button>

            <div id="history-analysis-section" class="hidden mb-4 p-3 border rounded border-red-400 bg-red-50">
                <h4 class="font-semibold text-red-800">History Issues Detected</h4>
                <p id="history-issues-summary" class="text-sm text-red-700 my-2"></p>
                <p class="text-xs text-gray-600 mb-3">This can happen if tasks are deleted. Cleaning removes history records that no longer link to a valid task. This action cannot be undone.</p>
                <button id="clean-history-btn" data-action="cleanHistory" class="control-button control-button-red themed-button-tertiary">Clean Orphaned History</button>
            </div>

            <div id="migration-step-1">
                <p class="mb-4">Upload an old task data file (JSON format) to migrate tasks.</p>
                <input type="file" id="migration-file-input" accept=".json" class="w-full p-2 border rounded">
            </div>

            <div id="migration-step-2" class="hidden mt-4">
                <div id="migration-summary" class="mb-4 p-3 bg-blue-100 text-blue-800 rounded-lg"></div>
                <p class="mb-2 font-semibold">Fields to Map</p>
                <div id="migration-differences-area" class="space-y-2 p-2 border rounded border-yellow-400 bg-yellow-50 mb-4">
                    <!-- Fields that require manual mapping will be shown here. -->
                </div>

                <p class="mb-2 font-semibold text-gray-500">Identical Fields (Auto-Mapped)</p>
                <div id="migration-identical-area" class="space-y-2 p-2 border rounded bg-gray-100 text-gray-500">
                    <!-- Auto-mapped fields shown here, disabled -->
                </div>

                <div class="mt-4 flex justify-end space-x-2">
                    <button id="cancel-migration-btn" class="themed-button-tertiary">Cancel</button>
                    <button id="run-migration-btn" class="themed-button-secondary">Run Migration</button>
                </div>
            </div>

            <div id="migration-step-confirm" class="hidden mt-4">
                <p class="mb-4 text-center" id="migration-confirm-message"></p>
                <div class="mt-4 flex justify-center space-x-2">
                    <button id="cancel-confirm-btn" class="themed-button-tertiary">Cancel</button>
                    <button id="run-confirm-btn" class="themed-button-secondary">Confirm Migration</button>
                </div>
            </div>
        </div>
    `;
}

export function bulkEditFormTemplate(categoryId, settings) {
    const {
        durationAmount = '',
        durationUnit = 'minutes',
        completionType = '',
    } = settings;

    return `
        <div class="p-4 rounded-md" style="background-color: #374151; border: 1px solid #4b5563;">
            <h4 class="font-bold mb-3" style="color: #d1d5db;">Bulk Edit Tasks in this Category</h4>
            <form id="bulk-edit-form-${categoryId}" class="space-y-4">

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="form-label" style="color: #d1d5db;">Set Duration:</label>
                        <div class="flex space-x-2 items-center">
                            <input type="number" name="durationAmount" value="${durationAmount}" min="1" placeholder="e.g., 30" class="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 duration-input" style="background-color: #1f2937; border-color: #4b5563; color: #f3f4f6;">
                            <select name="durationUnit" class="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 flex-grow" style="background-color: #1f2937; border-color: #4b5563; color: #f3f4f6;">
                                <option value="minutes" ${durationUnit === 'minutes' ? 'selected' : ''}>Minute(s)</option>
                                <option value="hours" ${durationUnit === 'hours' ? 'selected' : ''}>Hour(s)</option>
                            </select>
                        </div>
                        <p class="form-hint" style="color: #9ca3af;">Leave blank to ignore.</p>
                    </div>
                    <div>
                        <label class="form-label" style="color: #d1d5db;">Set Completion Type:</label>
                        <select name="completionType" class="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" style="background-color: #1f2937; border-color: #4b5563; color: #f3f4f6;">
                            <option value="">-- No Change --</option>
                            <option value="simple" ${completionType === 'simple' ? 'selected' : ''}>Simple (Mark Done)</option>
                            <option value="count" ${completionType === 'count' ? 'selected' : ''}>Count</option>
                            <option value="time" ${completionType === 'time' ? 'selected' : ''}>Time</option>
                        </select>
                    </div>
                </div>

                <div class="flex justify-end items-center space-x-3 pt-4 border-t" style="border-color: #4b5563;">
                    <button type="button" data-action="deleteAllInCategory" data-category-id="${categoryId}" class="control-button text-xs themed-button-tertiary">Delete All In Category</button>
                    <button type="submit" class="control-button text-white themed-button-secondary" style="background-color: #10B981; hover:background-color: #059669;">Apply Changes to All</button>
                </div>

            </form>
        </div>
    `;
}

export function taskStatsTemplate(task, stats, historyHtml, hasChartData) {
    const chartHtml = hasChartData
        ? `<div class="mt-4"><canvas id="task-history-chart"></canvas></div>`
        : '<p class="text-gray-500 italic mt-4">Not enough history to display a chart.</p>';

    return `
        <h3 class="text-xl font-semibold mb-4">Stats for: ${task.name}</h3>
        <div class="space-y-2">
            <p><strong>Completion Rate:</strong> ${stats.completionRate}% (${stats.completions} / ${stats.total})</p>
            <p><strong>Total Completions:</strong> ${stats.completions}</p>
            <p><strong>Total Misses:</strong> ${stats.misses}</p>
        </div>

        <h4 class="text-lg font-semibold mt-6 mb-2">Performance Over Time</h4>
        ${chartHtml}

        <h4 class="text-lg font-semibold mt-6 mb-2">Detailed History</h4>
        <ul class="list-disc list-inside max-h-48 overflow-y-auto border rounded p-2 bg-gray-50">
            ${historyHtml}
        </ul>

        <button data-action="backToTaskView" class="control-button control-button-gray mt-6 themed-button-secondary">Back to Details</button>
    `;
}

export function actionAreaTemplate(task) {
    const cycles = task.pendingCycles || 1;
    switch (task.confirmationState) {
        case 'confirming_complete':
            const text = cycles > 1 ? `Confirm Completion (${cycles} cycles)?` : 'Confirm Completion?';
            return `<div class="flex items-center space-x-1"><span class="action-area-text">${text}</span> <button data-action="confirmCompletion" data-task-id="${task.id}" data-confirmed="true" class="themed-button-secondary font-bold py-2 px-4 rounded shadow focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-green-500 hover:bg-green-600 text-white focus:ring-green-400">Yes</button> <button data-action="confirmCompletion" data-task-id="${task.id}" data-confirmed="false" class="themed-button-tertiary font-bold py-2 px-4 rounded shadow focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-red-500 hover:bg-red-600 text-white focus:ring-red-400">No</button></div>`;
        case 'awaiting_overdue_input':
            return `<div class="flex items-center space-x-1"><span class="action-area-text">Past Due:</span> <button data-action="handleOverdue" data-task-id="${task.id}" data-choice="completed" class="control-button control-button-green themed-button-secondary">Done</button> <button data-action="handleOverdue" data-task-id="${task.id}" data-choice="missed" class="control-button control-button-red themed-button-tertiary">Missed</button></div>`;
        case 'confirming_miss':
            const input = cycles > 1 ? `<input type="number" id="miss-count-input-${task.id}" value="${cycles}" min="0" max="${cycles}" class="miss-input"> / ${cycles} cycles?` : '?';
            return `<div class="flex items-center space-x-1"><span class="action-area-text">Confirm Misses ${input}</span> <button data-action="confirmMiss" data-task-id="${task.id}" data-confirmed="true" class="control-button control-button-green themed-button-secondary">Yes</button> <button data-action="confirmMiss" data-task-id="${task.id}" data-confirmed="false" class="control-button control-button-red themed-button-tertiary">No</button></div>`;
        case 'confirming_delete':
            return `<div class="flex items-center space-x-1"><span class="action-area-text">Delete Task?</span> <button data-action="confirmDelete" data-task-id="${task.id}" data-confirmed="true" class="control-button control-button-red themed-button-tertiary">Yes</button> <button data-action="confirmDelete" data-task-id="${task.id}" data-confirmed="false" class="control-button control-button-gray themed-button-secondary">Cancel</button></div>`;
        case 'confirming_undo':
            return `<div class="flex items-center space-x-1"><span class="action-area-text">Undo Completion?</span> <button data-action="confirmUndo" data-task-id="${task.id}" data-confirmed="true" class="control-button control-button-yellow themed-button-secondary">Yes</button> <button data-action="confirmUndo" data-task-id="${task.id}" data-confirmed="false" class="control-button control-button-gray themed-button-tertiary">Cancel</button></div>`;
    }
    const isCompletedNonRepeating = task.repetitionType === 'none' && task.completed;
    if (isCompletedNonRepeating) {
        return '<span class="text-xs text-gray-500 italic">Done</span>';
    }
    if (task.status === 'blue') {
        return `<button data-action="triggerUndo" data-task-id="${task.id}" class="control-button control-button-gray themed-button-secondary" title="Undo Completion / Reactivate Early">Undo</button>`;
    }
    switch (task.completionType) {
        case 'count':
            const target = task.countTarget || Infinity;
            return (task.currentProgress < target)
                ? `<div class="flex items-center space-x-1"> <button data-action="decrementCount" data-task-id="${task.id}" class="control-button control-button-gray themed-button-tertiary w-6 h-6 flex items-center justify-center">-</button> <button data-action="incrementCount" data-task-id="${task.id}" class="control-button control-button-blue themed-button-secondary w-6 h-6 flex items-center justify-center">+</button> </div>`
                : `<button data-action="triggerCompletion" data-task-id="${task.id}" class="control-button control-button-green themed-button-secondary">Complete</button>`;
        case 'time':
            const targetMs = getDurationMs(task.timeTargetAmount, task.timeTargetUnit);
            if (task.currentProgress >= targetMs) {
                return `<button data-action="triggerCompletion" data-task-id="${task.id}" class="control-button control-button-green themed-button-secondary">Complete</button>`;
            }
            const btnText = task.isTimerRunning ? 'Pause' : (task.currentProgress > 0 ? 'Resume' : 'Start');
            const btnClass = task.isTimerRunning ? 'control-button-yellow themed-button-tertiary' : 'control-button-green themed-button-secondary';
            return `<button data-action="toggleTimer" data-task-id="${task.id}" id="timer-btn-${task.id}" class="control-button ${btnClass}">${btnText}</button>`;
        default:
            return `<button data-action="triggerCompletion" data-task-id="${task.id}" class="control-button control-button-green themed-button-secondary">Complete</button>`;
    }
}

export function commonButtonsTemplate(task) {
    if (task.confirmationState) return '';
    const isCompletedNonRepeating = task.repetitionType === 'none' && task.completed;

    if (isCompletedNonRepeating) {
        return `<button data-action="triggerDelete" data-task-id="${task.id}" class="control-button control-button-red themed-button-tertiary" title="Delete Task">Delete</button>`;
    }
    return `
        <div class="flex space-x-1">
            <button data-action="edit" data-task-id="${task.id}" class="control-button control-button-yellow themed-button-secondary" title="Edit Task">Edit</button>
            <button data-action="triggerDelete" data-task-id="${task.id}" class="control-button control-button-red themed-button-tertiary" title="Delete Task">Delete</button>
        </div>
    `;
}

export function statusManagerTemplate(statusNames, statusColors, defaultStatusNames, theming) {
    const toggleHtml = `
        <div class="flex items-center justify-between mb-4 p-2 border-b">
            <label for="status-theme-toggle" class="form-label mb-0">Use Theme Gradient for Statuses:</label>
            <input type="checkbox" id="status-theme-toggle" data-action="toggleStatusTheme" class="toggle-checkbox h-6 w-12 rounded-full p-1 bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 appearance-none cursor-pointer" ${theming.useThemeForStatus ? 'checked' : ''}>
        </div>
    `;

    const statusItems = Object.keys(defaultStatusNames).map(statusKey => {
        const displayName = statusNames[statusKey] || defaultStatusNames[statusKey];
        const color = statusColors[statusKey] || '#ccc';
        return `
            <div class="flex items-center justify-between p-2 border-b" id="status-item-${statusKey}">
                <div id="status-display-${statusKey}" class="flex-grow flex items-center space-x-3">
                    <div class="w-4 h-4 rounded-full" style="background-color: ${color};"></div>
                    <span class="font-medium cursor-pointer" data-action="triggerStatusNameEdit" data-status-key="${statusKey}">${displayName}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <input type="color" value="${color}" data-status-key="${statusKey}" class="status-color-picker h-8 w-12 border-none cursor-pointer rounded" ${theming.useThemeForStatus ? 'disabled' : ''}>
                </div>
            </div>
        `;
    }).join('');

    return toggleHtml + statusItems;
}

export function categoryFilterTemplate(categories, categoryFilter) {
    if (categories.length === 0) {
        return '<p class="text-gray-500 italic">No categories to filter.</p>';
    }

    const allLabel = `
        <label class="flex items-center space-x-2">
            <input type="checkbox" class="category-filter-checkbox" value="all" ${categoryFilter.length === 0 ? 'checked' : ''}>
            <span>Show All</span>
        </label>
    `;

    const uncategorizedLabel = `
        <label class="flex items-center space-x-2">
            <input type="checkbox" class="category-filter-checkbox" value="null" ${categoryFilter.includes(null) ? 'checked' : ''}>
            <span>Uncategorized</span>
        </label>
    `;

    const categoryLabels = categories.map(cat => `
        <label class="flex items-center space-x-2">
            <input type="checkbox" class="category-filter-checkbox" value="${cat.id}" ${categoryFilter.includes(cat.id) ? 'checked' : ''}>
            <span>${cat.name}</span>
        </label>
    `).join('');

    return allLabel + uncategorizedLabel + categoryLabels;
}

export function iconPickerTemplate(iconCategories) {
    let contentHtml = '';
    for (const category in iconCategories) {
        const iconsHtml = iconCategories[category].map(iconClass => `
            <div class="p-2 flex justify-center items-center rounded-md hover:bg-gray-300 cursor-pointer" data-icon="${iconClass}">
                <i class="${iconClass} fa-2x text-gray-700"></i>
            </div>
        `).join('');

        contentHtml += `
            <div class="icon-picker-category">
                <div class="icon-picker-category-header p-2 bg-gray-200 text-gray-800 font-bold rounded cursor-pointer flex justify-between items-center">
                    ${category}
                    <span class="transform transition-transform duration-200"> ▼ </span>
                </div>
                <div class="icon-grid hidden p-2 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    ${iconsHtml}
                </div>
            </div>
        `;
    }
    return contentHtml;
}

export function editProgressTemplate(taskId, currentValue, max) {
    return `
        <input type="number" id="edit-progress-input-${taskId}" value="${currentValue}" min="0" ${max !== Infinity ? `max="${max}"` : ''} class="progress-input">
        <button data-action="saveProgress" data-task-id="${taskId}" class="control-button control-button-green text-xs ml-1 themed-button-secondary">Save</button>
        <button data-action="cancelProgress" data-task-id="${taskId}" class="control-button control-button-gray text-xs ml-1 themed-button-tertiary">Cancel</button>
    `;
}

export function editCategoryTemplate(categoryId, currentName) {
    return `
        <input type="text" id="edit-category-input-${categoryId}" value="${currentName}" class="progress-input flex-grow">
        <button data-action="saveCategoryEdit" data-category-id="${categoryId}" class="control-button control-button-green text-xs ml-1 themed-button-secondary">Save</button>
        <button data-action="cancelCategoryEdit" data-category-id="${categoryId}" class="control-button control-button-gray text-xs ml-1 themed-button-tertiary">Cancel</button>
    `;
}

export function editStatusNameTemplate(statusKey, currentName) {
    return `
        <input type="text" id="edit-status-input-${statusKey}" value="${currentName}" class="progress-input flex-grow">
        <button data-action="saveStatusNameEdit" data-status-key="${statusKey}" class="control-button control-button-green text-xs ml-1 themed-button-secondary">Save</button>
        <button data-action="cancelStatusNameEdit" data-status-key="${statusKey}" class="control-button control-button-gray text-xs ml-1 themed-button-tertiary">Cancel</button>
    `;
}

export function restoreDefaultsConfirmationTemplate() {
    return `
        <div class="flex flex-col items-center gap-2 text-center">
            <p class="text-sm">Reset all view and theme settings to their original defaults? Your tasks, categories, and planner entries will not be affected.</p>
            <div class="flex gap-2 mt-2">
                <button data-action="confirmRestoreDefaults" data-confirmed="true" class="control-button control-button-red themed-button-tertiary">Yes, Reset</button>
                <button data-action="confirmRestoreDefaults" data-confirmed="false" class="control-button control-button-gray themed-button-secondary">No, Cancel</button>
            </div>
        </div>
    `;
}

export function taskGroupHeaderTemplate(groupName, groupColor, textStyle) {
    return `
        <div class="collapsible-header p-2 rounded-md cursor-pointer flex justify-between items-center mt-4"
             data-group="${groupName}"
             style="background-color: ${groupColor}; color: ${textStyle.color}; text-shadow: ${textStyle.textShadow};">
            <h4 class="font-bold">${groupName}</h4>
            <span class="transform transition-transform duration-200"> ▼ </span>
        </div>
    `;
}

export function sensitivityControlsTemplate(settings) {
    const { sValue, isAdaptive } = settings;
    const sliderDisabled = isAdaptive ? 'disabled' : '';
    const containerOpacity = isAdaptive ? 'opacity-50' : '';

    return `
        <div class="flex items-center justify-between">
            <label for="adaptive-sensitivity-toggle" class="form-label mb-0">Use Adaptive Sensitivity:</label>
            <input type="checkbox" id="adaptive-sensitivity-toggle" data-action="toggleAdaptiveSensitivity" class="toggle-checkbox h-6 w-12 rounded-full p-1 bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 appearance-none cursor-pointer" ${isAdaptive ? 'checked' : ''}>
        </div>
        <div id="manual-sensitivity-container" class="space-y-2 ${containerOpacity}">
            <label for="sensitivity-slider" class="form-label">Manual Sensitivity:</label>
            <div class="flex items-center space-x-4">
                <span class="text-sm text-gray-500">Least</span>
                <input type="range" id="sensitivity-slider" min="0" max="1" step="0.01" value="${sValue}" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" ${sliderDisabled}>
                <span class="text-sm text-gray-500">Most</span>
            </div>
            <p class="form-hint">Controls how early the system warns you about upcoming tasks. Disabled when adaptive mode is on.</p>
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
