/**
 * js/templates.js
 * ============================================================================
 * THIS FILE CONTAINS ALL HTML TEMPLATE FUNCTIONS.
 *
 * All old styling classes have been replaced with the new, semantic,
 * theme-agnostic classes (e.g., .btn, .btn-primary, .bg-secondary).
 * The actual colors for these classes will be injected by the new
 * theme engine in script.js.
 * ============================================================================
 */


// ============================================================================
// UTILITY FUNCTIONS (Copied from script.js for standalone use if needed)
// ============================================================================

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


// ============================================================================
// TEMPLATE FUNCTIONS
// ============================================================================

function taskTemplate(task, { categories, taskDisplaySettings, appSettings }) {
    const category = categories.find(c => c.id === task.categoryId);
    const categoryName = category ? category.name : 'Uncategorized';

    let categoryHtml = '';
    if (taskDisplaySettings.showCategory) {
        const categoryColor = category ? category.color : '#808080';
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
            progressHtml += `<button data-action="editProgress" data-task-id="${task.id}" class="btn btn-clear text-xs" title="Edit Progress" aria-label="Edit progress for ${task.name}">[Edit]</button>`;
        }
        progressHtml += `</div>`;
    }

    const missesHtml = (task.repetitionType !== 'none' && task.maxMisses && task.trackMisses)
        ? `<p class="misses-display mt-1">Misses: ${task.misses}/${task.maxMisses}</p>`
        : '';

    const actionAreaContainer = `<div id="action-area-${task.id}" class="flex flex-col space-y-1 items-end flex-shrink-0 min-h-[50px]"></div>`;
    const commonButtonsContainer = `<div id="common-buttons-${task.id}" class="flex space-x-2 mt-2"></div>`;
    const iconToUse = task.icon || (category ? category.icon : null);
    const iconHtml = iconToUse ? `<i class="${iconToUse} mr-2"></i>` : '';

    return `<div class="flex-grow pr-4">
                <div class="task-card-header">
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

function categoryManagerTemplate(categories) {
    let content = '';
    if (categories.length === 0) {
        content += '<p class="italic">No categories created yet.</p>';
    } else {
        content += categories.map(cat => `
            <div class="p-2 border-b" id="category-item-${cat.id}">
                <div class="flex items-center justify-between">
                    <div id="category-display-${cat.id}" class="flex-grow flex items-center" data-action="triggerCategoryEdit" data-category-id="${cat.id}">
                        <span class="font-medium cursor-pointer">${cat.icon ? `<i class="${cat.icon} mr-2"></i>` : ''}${cat.name}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button data-action="openIconPicker" data-context="category" data-category-id="${cat.id}" class="btn btn-clear text-xs">Set Icon</button>
                        <input type="color" value="${cat.color}" data-category-id="${cat.id}" class="category-color-picker h-8 w-12 border-none cursor-pointer rounded">
                        <button data-action="deleteCategory" data-category-id="${cat.id}" class="btn btn-clear font-bold text-lg" aria-label="Delete category ${cat.name}">&times;</button>
                    </div>
                </div>
                <div class="mt-2 flex justify-between items-center">
                    <label class="text-xs flex items-center" title="If checked, new tasks created with this category will automatically use this icon.">
                        <input type="checkbox" data-action="toggleApplyIcon" data-category-id="${cat.id}" class="mr-2" ${cat.applyIconToNewTasks ? 'checked' : ''}>
                        Auto-apply icon
                    </label>
                    <div class="flex justify-end space-x-2">
                        <button data-action="bulkEdit" data-category-id="${cat.id}" class="btn btn-clear text-xs">Bulk Edit</button>
                        <button data-action="deleteCategoryTasks" data-category-id="${cat.id}" class="btn btn-clear text-xs">Delete All Tasks</button>
                    </div>
                </div>
                <div id="bulk-edit-container-${cat.id}" class="hidden mt-2"></div>
            </div>
        `).join('');
    }

    content += `
        <div class="mt-4">
            <button class="btn btn-secondary btn-md w-full" data-action="renderCategoryAdd">
                Add New Category
            </button>
            <div id="add-category-form-container" class="mt-2"></div>
        </div>
    `;

    return content;
}

function taskViewTemplate(task, { categories, appSettings, isHistorical }) {
    const category = categories.find(c => c.id === task.categoryId);
    const categoryName = category ? category.name : 'Uncategorized';
    const dueDate = isHistorical ? new Date(task.completionDate) : (task.dueDate ? new Date(task.dueDate) : null);
    const dueDateStr = (dueDate && !isNaN(dueDate)) ? formatDateTime(dueDate, appSettings.use24HourFormat) : 'No due date';
    const durationStr = formatDuration(task.durationAmount || task.estimatedDurationAmount, task.durationUnit || task.estimatedDurationUnit);

    let repetitionStr = 'Non-Repeating';
    if (!isHistorical && task.repetitionType) {
        if (task.repetitionType === 'relative') {
            repetitionStr = `Every ${task.repetitionAmount || '?'} ${task.repetitionUnit || '?'}`;
        } else if (task.repetitionType === 'absolute') {
            repetitionStr = getAbsoluteRepetitionString(task);
        }
    }

    let actionsHtml;
    let progressHtml = '';
    let missesHtml = '';

    if (isHistorical) {
        actionsHtml = `
            <div id="task-view-actions-${task.originalTaskId}" class="mt-6 responsive-button-grid">
                <button data-action="triggerDeleteHistoryRecordFromView" data-history-event-id="${task.id}" data-task-id="${task.originalTaskId}" class="btn btn-deny btn-sm">Delete This Record</button>
                <button data-action="viewTaskStats" data-task-id="${task.originalTaskId}" class="btn btn-clear">View Parent Task Stats</button>
            </div>
            <div id="task-view-confirmation-${task.id}" class="mt-4"></div>
        `;
    } else {
        // Replicate the structure from the main task list for consistency
        const actionAreaContent = actionAreaTemplate(task);
        const modalButtonOptions = { editAction: 'editTaskFromView', deleteAction: 'triggerDeleteFromView' };
        const commonButtonsContent = commonButtonsTemplate(task, modalButtonOptions);

        if (task.status !== 'blue' && (task.completionType === 'count' || task.completionType === 'time')) {
             progressHtml = `<div id="progress-container-${task.id}" class="mt-2 text-sm">`;
            let progressText = '';
            if (task.completionType === 'count' && task.countTarget) {
                progressText = `${task.currentProgress || 0} / ${task.countTarget}`;
            } else if (task.completionType === 'time' && task.timeTargetAmount) {
                const targetMs = getDurationMs(task.timeTargetAmount, task.timeTargetUnit);
                progressText = `${formatMsToTime(task.currentProgress || 0)} / ${formatMsToTime(targetMs)}`;
            }
            progressHtml += `<span class="font-semibold">Progress:</span> <span id="progress-${task.id}">${progressText}</span>`;
            if (!task.confirmationState) {
                 progressHtml += `<button data-action="editProgress" data-task-id="${task.id}" class="btn btn-clear text-xs ml-2">[Edit]</button>`;
            }
            progressHtml += `</div>`;
        }

        if (task.repetitionType !== 'none' && task.maxMisses && task.trackMisses) {
            missesHtml = `<p class="text-sm">Misses: ${task.misses}/${task.maxMisses}</p>`;
        }

        actionsHtml = `
            <div class="mt-6 flex flex-col items-end">
                <div id="task-view-action-area-${task.id}" class="w-full flex justify-end">
                    ${actionAreaContent}
                </div>
                <div id="task-view-confirmation-${task.id}" class="mt-4 w-full"></div>
                <div class="flex justify-between w-full items-center mt-4">
                    <div>${missesHtml}</div>
                    <div class="flex items-center space-x-2">
                        <button data-action="viewTaskStats" data-task-id="${task.id}" class="btn btn-clear">Stats</button>
                        ${commonButtonsTemplate(task, { editAction: 'editTaskFromView', deleteAction: 'triggerDeleteFromView' })}
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <h3 class="text-2xl font-bold mb-4">${task.icon ? `<i class="${task.icon} mr-2"></i>` : ''}${task.name}</h3>
        <div class="space-y-3">
            <p><strong>Status:</strong> <span class="font-semibold">${task.status.charAt(0).toUpperCase() + task.status.slice(1)}</span></p>
            <p><strong>Category:</strong> ${categoryName}</p>
            <p><strong>Due Date:</strong> ${dueDateStr}</p>
            <p><strong>Estimated Duration:</strong> ${durationStr}</p>
            ${!isHistorical ? `<p><strong>Repetition:</strong> ${repetitionStr}</p>` : '<p><strong>Repetition:</strong> N/A (Historical Record)</p>'}
        </div>
        <div id="task-view-actions-${task.id}" class="mt-6 responsive-button-grid">
            ${actionsHtml}
        </div>
        <div id="task-view-confirmation-${task.id}" class="mt-4"></div>
    `;
}

function historyDeleteConfirmationTemplate(historyId, taskId) {
    return `
        <div class="history-delete-confirmation flex justify-end items-center space-x-2 w-full">
            <span class="text-sm font-semibold">Delete?</span>
            <button data-action="confirmHistoryDelete" data-history-id="${historyId}" data-task-id="${taskId}" data-delete-type="single" class="btn btn-deny btn-xs">This Entry</button>
            <button data-action="confirmHistoryDelete" data-task-id="${taskId}" data-delete-type="all" class="btn btn-deny btn-xs">All History for Task</button>
            <button data-action="cancelHistoryDelete" data-history-id="${historyId}" data-task-id="${taskId}" class="btn btn-clear text-xs">Cancel</button>
        </div>
    `;
}

function vacationChangeConfirmationModalTemplate(changedTasks) {
    const taskListHtml = changedTasks.map(t => `
        <li class="text-sm p-1 rounded">
            <strong>${t.name}</strong>: <span class="line-through">${new Date(t.oldDueDate).toLocaleString()}</span> -> <span class="font-semibold">${new Date(t.newDueDate).toLocaleString()}</span>
        </li>
    `).join('');

    return `
        <div id="vacation-change-confirm-modal" class="modal">
            <div class="modal-content bg-modal">
                 <button class="close-button" id="vacation-change-close-btn">&times;</button>
                <h3 class="text-xl font-semibold mb-4">Confirm Schedule Changes</h3>
                <p class="mb-4 text-sm">The recent change to vacations or categories will affect the following tasks. Please review the changes and confirm.</p>
                <div class="max-h-60 overflow-y-auto border rounded p-2 mb-4">
                    <ul class="space-y-2">
                        ${taskListHtml || '<li class="text-sm italic">No tasks were affected by this change.</li>'}
                    </ul>
                </div>
                <div class="flex justify-end space-x-2">
                    <button id="cancel-vacation-change-btn" class="btn btn-tertiary btn-md">Cancel</button>
                    <button id="confirm-vacation-change-btn" class="btn btn-secondary btn-md">Confirm Changes</button>
                </div>
            </div>
        </div>
    `;
}

const appointmentConflictModalTemplate = (conflictedTasks) => `
<div class="modal-content bg-modal">
    <button id="appointment-conflict-close-btn" class="close-button" aria-label="Close">&times;</button>
    <h2 class="text-2xl font-semibold mb-4">Appointment Conflict</h2>
    <p class="mb-4">The following appointments are scheduled during a vacation period. How would you like to proceed?</p>
    <div class="space-y-2 mb-6 max-h-60 overflow-y-auto p-2 rounded">
        ${conflictedTasks.map(task => `
            <div class="p-2 rounded-md">
                <p class="font-semibold">${task.name}</p>
                <p class="text-sm">Current Date: ${new Date(task.dueDate).toLocaleString()}</p>
            </div>
        `).join('')}
    </div>
    <div class="flex justify-end space-x-4">
        <button id="keep-appointments-btn" class="btn btn-secondary btn-md">Keep As Is</button>
        <button id="reschedule-appointments-btn" class="btn btn-primary btn-md">Reschedule Automatically</button>
    </div>
</div>
`;

function vacationManagerTemplate(vacations, categories) {
    const vacationListHtml = vacations.length > 0 ? vacations.map(v => `
        <div class="flex items-center justify-between p-2 border-b">
            <div>
                <p class="font-medium">${v.name}</p>
                <p class="text-xs">
                    ${new Date(v.startDate).toLocaleDateString()} - ${new Date(v.endDate).toLocaleDateString()}
                </p>
            </div>
            <button data-action="deleteVacation" data-id="${v.id}" class="btn btn-clear font-bold text-lg">&times;</button>
        </div>
    `).join('') : '<p class="text-sm italic">No vacations scheduled.</p>';

    const categoryBypassHtml = categories.map(cat => `
        <label class="flex items-center space-x-2">
            <input type="checkbox" data-action="toggleVacationBypass" data-category-id="${cat.id}" class="category-vacation-bypass-checkbox" ${cat.bypassVacation ? 'checked' : ''}>
            <span>${cat.name}</span>
        </label>
    `).join('');

    return `
        <div>
            <h4 class="font-semibold mb-2">Scheduled Vacations</h4>
            <div id="vacation-list" class="space-y-2 mb-4">${vacationListHtml}</div>
            <form id="add-vacation-form" class="space-y-3 p-3 border rounded-md">
                <input type="text" id="vacation-name" placeholder="Vacation Name" required>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label for="vacation-start-date" class="text-sm">Start Date</label>
                        <input type="date" id="vacation-start-date" required>
                    </div>
                    <div>
                        <label for="vacation-end-date" class="text-sm">End Date</label>
                        <input type="date" id="vacation-end-date" required>
                    </div>
                </div>
                <button type="submit" class="btn btn-secondary btn-md w-full">Add Vacation</button>
            </form>
        </div>
        <div class="mt-4">
             <h4 class="font-semibold mb-2">Category Vacation Bypass</h4>
             <p class="text-xs italic mb-2">Tasks in checked categories will NOT be pushed by vacations.</p>
             <div id="category-bypass-list" class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                ${categoryBypassHtml}
             </div>
        </div>
    `;
}

function taskViewDeleteConfirmationTemplate(taskId) {
    return `
        <div class="p-3 rounded-lg border-2 border-dashed">
            <p class="text-center font-semibold">Are you sure?</p>
            <div class="flex justify-center space-x-4 mt-3">
                <button data-action="confirmDeleteFromView" data-task-id="${taskId}" class="btn btn-deny btn-sm">Yes, Delete</button>
                <button data-action="cancelDeleteFromView" data-task-id="${taskId}" class="btn btn-clear">No, Cancel</button>
            </div>
        </div>
    `;
}

function taskViewHistoryDeleteConfirmationTemplate(historyEventId, originalTaskId) {
    return `
        <div class="p-3 rounded-lg border-2 border-dashed">
            <p class="text-center font-semibold">Delete this record?</p>
            <div class="flex justify-center space-x-4 mt-3">
                <button data-action="confirmDeleteHistoryRecordFromView" data-history-event-id="${historyEventId}" data-task-id="${originalTaskId}" class="btn btn-deny btn-sm">Yes, Delete</button>
                <button data-action="cancelDeleteHistoryRecordFromView" class="btn btn-clear">No, Cancel</button>
            </div>
        </div>
    `;
}

function dataMigrationModalTemplate() {
    return `
        <h3 class="text-xl font-semibold mb-4">Data Migration & Integrity Tool</h3>
        <button class="close-button">&times;</button>
        <div id="orphan-cleanup-section" class="hidden mb-4 p-3 border rounded">
            <h4 class="font-semibold">Orphaned History Cleanup</h4>
            <p id="orphan-summary" class="text-sm my-2"></p>
            <p class="text-xs mb-3">The following records belong to deleted tasks.</p>
            <div id="orphan-list-container" class="max-h-60 overflow-y-auto border rounded p-2 space-y-2"></div>
            <div class="mt-3 flex justify-between items-center">
                <label class="text-xs flex items-center"><input type="checkbox" id="select-all-orphans-checkbox" class="mr-2">Select All</label>
                <button id="delete-selected-orphans-btn" data-action="deleteSelectedOrphans" class="btn btn-deny btn-sm">Delete Selected</button>
            </div>
        </div>
        <div class="mt-6 pt-4 border-t">
            <h4 class="font-semibold">Danger Zone</h4>
            <p class="text-sm my-2">This action is permanent and cannot be undone.</p>
            <button id="delete-all-history-btn" data-action="deleteAllHistory" class="btn btn-deny btn-md w-full">Delete All Task History</button>
        </div>
    `;
}

function journalSettingsTemplate(settings) {
    return `
        <div>
            <label for="weekly-goal-icon-input" class="form-label">Weekly Goal Icon:</label>
            <div class="flex items-center space-x-2">
                <input type="text" id="weekly-goal-icon-input" value="${settings.weeklyGoalIcon}" class="flex-grow">
                <button type="button" id="open-weekly-goal-icon-picker" data-action="openIconPicker" data-context="journalGoal" class="btn btn-clear">Choose</button>
            </div>
        </div>
    `;
}

function bulkEditFormTemplate(categoryId, settings) {
    const { durationAmount = '', durationUnit = 'minutes', completionType = '' } = settings;
    return `
        <div class="p-4 rounded-md bg-secondary">
            <h4 class="font-bold mb-3">Bulk Edit Tasks</h4>
            <form id="bulk-edit-form-${categoryId}" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">Set Duration:</label>
                        <div class="flex space-x-2 items-center">
                            <input type="number" name="durationAmount" value="${durationAmount}" min="1" class="duration-input">
                            <select name="durationUnit" class="flex-grow">
                                <option value="minutes" ${durationUnit === 'minutes' ? 'selected' : ''}>Minute(s)</option>
                                <option value="hours" ${durationUnit === 'hours' ? 'selected' : ''}>Hour(s)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="form-label">Set Completion Type:</label>
                        <select name="completionType">
                            <option value="">-- No Change --</option>
                            <option value="simple" ${completionType === 'simple' ? 'selected' : ''}>Simple</option>
                            <option value="count" ${completionType === 'count' ? 'selected' : ''}>Count</option>
                            <option value="time" ${completionType === 'time' ? 'selected' : ''}>Time</option>
                        </select>
                    </div>
                </div>
                <div class="flex justify-end items-center space-x-3 pt-4 border-t">
                    <button type="button" data-action="deleteAllInCategory" data-category-id="${categoryId}" class="btn btn-deny btn-sm">Delete All In Category</button>
                    <button type="submit" class="btn btn-confirm btn-md">Apply Changes</button>
                </div>
            </form>
        </div>
    `;
}

function taskStatsTemplate(task, stats, historyHtml, hasChartData, isFullyCompleted) {
    const chartHtml = hasChartData ? `<div class="mt-4 gradient-bordered-content"><canvas id="task-history-chart"></canvas></div>` : '<p class="italic mt-4">Not enough history for a chart.</p>';
    const reinstateButtonHtml = isFullyCompleted
        ? `<button data-action="reinstateTask" data-task-id="${task.id}" class="btn btn-secondary btn-md mt-6">Reinstate Task</button>`
        : '';

    const overallGpaHtml = stats.overallGpa
        ? `<span class="font-bold inline-block text-center w-10 rounded py-1 ml-2"
                 style="background-color: ${stats.overallGpa.color}; color: ${stats.overallGpa.textColor}; text-shadow: ${stats.overallGpa.textShadow};">
              ${stats.overallGpa.grade}
           </span>`
        : '';

    return `
        <h3 class="text-xl font-semibold mb-4">Stats for: ${task.name}</h3>
        <div class="space-y-2">
            <div class="flex items-center">
                <strong>Completion Rate:</strong>
                <span class="ml-2">${stats.completionRate}% (${stats.completions} / ${stats.total})</span>
                ${overallGpaHtml}
            </div>
        </div>
        <h4 class="text-lg font-semibold mt-6 mb-2">Performance</h4>
        ${chartHtml}
        <h4 class="text-lg font-semibold mt-6 mb-2">Detailed History</h4>
        <div id="detailed-history-list" class="space-y-2 max-h-48 overflow-y-auto border rounded p-2">${historyHtml}</div>
        <div class="flex justify-start items-center space-x-4">
             <button data-action="backToTaskView" class="btn btn-clear mt-6">Back to Details</button>
             ${reinstateButtonHtml}
        </div>
    `;
}

function actionAreaTemplate(task) {
    const cycles = task.pendingCycles || 1;
    switch (task.confirmationState) {
        case 'confirming_complete':
            const text = cycles > 1 ? `Confirm Completion (${cycles} cycles)?` : 'Confirm Completion?';
            return `<div class="flex items-center space-x-1"><span class="action-area-text">${text}</span> <button data-action="confirmCompletion" data-task-id="${task.id}" data-confirmed="true" class="btn btn-confirm btn-sm">Yes</button> <button data-action="confirmCompletion" data-task-id="${task.id}" data-confirmed="false" class="btn btn-deny btn-sm">No</button></div>`;
        case 'awaiting_overdue_input':
            return `<div class="flex items-center space-x-1"><span class="action-area-text">Past Due:</span> <button data-action="handleOverdue" data-task-id="${task.id}" data-choice="completed" class="btn btn-confirm btn-sm">Done</button> <button data-action="handleOverdue" data-task-id="${task.id}" data-choice="missed" class="btn btn-deny btn-sm">Missed</button></div>`;
        case 'confirming_miss':
            const promptText = cycles > 1 ? 'Confirm Misses:' : 'Confirm Miss?';
            const inputControl = cycles > 1
                ? `<input type="number" id="miss-count-input-${task.id}" value="${cycles}" min="0" max="${cycles}" class="miss-input"> of ${cycles}`
                : '';

            return `<div class="confirm-miss-area">
                        <span class="action-area-text">${promptText} ${inputControl}</span>
                        <div class="button-group">
                            <button data-action="confirmMiss" data-task-id="${task.id}" data-confirmed="true" class="btn btn-confirm btn-xs">Yes</button>
                            <button data-action="confirmMiss" data-task-id="${task.id}" data-confirmed="false" class="btn btn-deny btn-xs">No</button>
                        </div>
                    </div>`;
        case 'confirming_delete':
            return `<div class="flex items-center space-x-1"><span class="action-area-text">Delete Task?</span> <button data-action="confirmDelete" data-task-id="${task.id}" data-confirmed="true" class="btn btn-confirm btn-sm">Yes</button> <button data-action="confirmDelete" data-task-id="${task.id}" data-confirmed="false" class="btn btn-deny btn-sm">Cancel</button></div>`;
        case 'confirming_undo':
            return `<div class="flex items-center space-x-1"><span class="action-area-text">Undo Completion?</span> <button data-action="confirmUndo" data-task-id="${task.id}" data-confirmed="true" class="btn btn-confirm btn-sm">Yes</button> <button data-action="confirmUndo" data-task-id="${task.id}" data-confirmed="false" class="btn btn-deny btn-sm">Cancel</button></div>`;
    }
    if (task.status === 'blue') return `<button data-action="triggerUndo" data-task-id="${task.id}" class="btn btn-clear" title="Undo Completion">Undo</button>`;
    if (task.repetitionType === 'none' && task.completed) return '<span class="text-xs italic">Done</span>';
    switch (task.completionType) {
        case 'count':
            return `<div class="flex items-center space-x-1"> <button data-action="decrementCount" data-task-id="${task.id}" class="btn btn-clear w-6 h-6">-</button> <button data-action="incrementCount" data-task-id="${task.id}" class="btn btn-clear w-6 h-6">+</button> </div>`;
        case 'time':
            const btnText = task.isTimerRunning ? 'Pause' : (task.currentProgress > 0 ? 'Resume' : 'Start');
            return `<button data-action="toggleTimer" data-task-id="${task.id}" id="timer-btn-${task.id}" class="btn btn-clear">${btnText}</button>`;
        default:
            return `<button data-action="triggerCompletion" data-task-id="${task.id}" class="btn btn-confirm btn-sm">Complete</button>`;
    }
}

function commonButtonsTemplate(task, options = {}) {
    const { editAction = 'edit', deleteAction = 'triggerDelete' } = options;
    if (task.confirmationState) return '';
    const isCompletedNonRepeating = task.repetitionType === 'none' && task.completed;
    if (isCompletedNonRepeating) {
        return `<button data-action="${deleteAction}" data-task-id="${task.id}" class="btn btn-clear" title="Delete Task">Delete</button>`;
    }
    return `<div class="flex space-x-1">
            <button data-action="${editAction}" data-task-id="${task.id}" class="btn btn-clear" title="Edit Task">Edit</button>
            <button data-action="${deleteAction}" data-task-id="${task.id}" class="btn btn-clear" title="Delete Task">Delete</button>
        </div>`;
}

function statusManagerTemplate(statusNames, statusColors, defaultStatusNames, theming) {
    const isThemeEnabled = theming.enabled;
    const isUsingThemeForStatus = theming.useThemeForStatus;

    const statusOrder = ['blue', 'green', 'yellow', 'red', 'black'];

    const statusRows = statusOrder.map(key => `
        <div id="status-display-${key}" class="flex items-center justify-between py-2">
            <span class="font-semibold">${statusNames[key]}</span>
            <div class="flex items-center space-x-3">
                <input type="color"
                       class="status-color-picker p-1 h-10 w-14 block bg-white border border-gray-200 cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none"
                       value="${statusColors[key]}"
                       data-status-key="${key}"
                       ${isThemeEnabled && isUsingThemeForStatus ? 'disabled' : ''}>
                <span class="text-xs text-gray-400">${isThemeEnabled && isUsingThemeForStatus ? '(From Theme)' : ''}</span>
                <button data-action="triggerStatusNameEdit" data-status-key="${key}" class="btn btn-clear" title="Rename ${statusNames[key]}">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
            </div>
        </div>
    `).join('');

    return `
        <div class="space-y-4">
            <p class="text-sm text-gray-400">Customize the names and colors for task statuses. These colors are used in the task list. When theming is on, you can choose to derive status colors from the theme.</p>

             <div class="flex items-center justify-between py-2 border-y border-gray-700">
                <label for="theme-for-status-toggle" class="font-semibold">Use Theme Gradient for Statuses</label>
                <div class="flex items-center">
                    <span class="text-xs mr-2 ${!isThemeEnabled ? 'text-gray-500' : ''}">${isThemeEnabled ? (isUsingThemeForStatus ? 'On' : 'Off') : 'Theme Disabled'}</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="theme-for-status-toggle" class="sr-only peer" data-action="toggleThemeForStatus" ${isUsingThemeForStatus ? 'checked' : ''} ${!isThemeEnabled ? 'disabled' : ''}>
                        <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>

            ${statusRows}
            <div class="pt-4 border-t border-gray-700">
                <button data-action="restoreDefaults" class="btn btn-tertiary w-full">Restore Status Colors & Names to Default</button>
            </div>
        </div>
    `;
}

function categoryFilterTemplate(categories, categoryFilter) {
    if (categories.length === 0) return '<p class="italic">No categories to filter.</p>';
    const allLabel = `<label><input type="checkbox" class="category-filter-checkbox" value="all" ${categoryFilter.length === 0 ? 'checked' : ''}> Show All</label>`;
    const uncategorizedLabel = `<label><input type="checkbox" class="category-filter-checkbox" value="null" ${categoryFilter.includes(null) ? 'checked' : ''}> Uncategorized</label>`;
    const categoryLabels = categories.map(cat => `<label><input type="checkbox" class="category-filter-checkbox" value="${cat.id}" ${categoryFilter.includes(cat.id) ? 'checked' : ''}> ${cat.name}</label>`).join('');
    return allLabel + uncategorizedLabel + categoryLabels;
}

function iconPickerTemplate(iconCategories) {
    return Object.entries(iconCategories).map(([category, icons]) => `
        <div class="icon-picker-category">
            <div class="icon-picker-category-header p-2 font-bold rounded cursor-pointer flex justify-between items-center">
                ${category} <span class="transform transition-transform duration-200">▼</span>
            </div>
            <div class="icon-grid hidden p-2 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                ${icons.map(iconClass => `<div class="p-2 flex justify-center items-center rounded-md hover:bg-gray-300 cursor-pointer" data-icon="${iconClass}"><i class="${iconClass} fa-2x"></i></div>`).join('')}
            </div>
        </div>`).join('');
}

function editProgressTemplate(taskId, currentValue, max) {
    return `<input type="number" id="edit-progress-input-${taskId}" value="${currentValue}" min="0" ${max !== Infinity ? `max="${max}"` : ''} class="progress-input">
            <button data-action="saveProgress" data-task-id="${taskId}" class="btn btn-confirm btn-xs ml-1">Save</button>
            <button data-action="cancelProgress" data-task-id="${taskId}" class="btn btn-clear text-xs ml-1">Cancel</button>`;
}

function editCategoryTemplate(categoryId, currentName) {
    return `<input type="text" id="edit-category-input-${categoryId}" value="${currentName}" class="progress-input flex-grow">
            <button data-action="saveCategoryEdit" data-category-id="${categoryId}" class="btn btn-confirm btn-xs ml-1">Save</button>
            <button data-action="cancelCategoryEdit" data-category-id="${categoryId}" class="btn btn-clear text-xs ml-1">Cancel</button>`;
}

function editStatusNameTemplate(statusKey, currentName) {
    return `<input type="text" id="edit-status-input-${statusKey}" value="${currentName}" class="progress-input flex-grow">
            <button data-action="saveStatusNameEdit" data-status-key="${statusKey}" class="btn btn-confirm btn-xs ml-1">Save</button>
            <button data-action="cancelStatusNameEdit" data-status-key="${statusKey}" class="btn btn-clear text-xs ml-1">Cancel</button>`;
}

function restoreDefaultsConfirmationTemplate() {
    return `<div class="flex flex-col items-center gap-2 text-center">
                <p class="text-sm">Reset all view and theme settings to their original defaults?</p>
                <div class="flex gap-2 mt-2">
                    <button data-action="confirmRestoreDefaults" data-confirmed="true" class="btn btn-deny btn-md">Yes, Reset</button>
                    <button data-action="confirmRestoreDefaults" data-confirmed="false" class="btn btn-secondary btn-md">No, Cancel</button>
                </div>
            </div>`;
}

function taskGroupHeaderTemplate(groupName, groupColor, textStyle) {
    return `<div class="collapsible-header p-2 rounded-md cursor-pointer flex justify-between items-center mt-4"
                 data-group="${groupName}"
                 style="background-color: ${groupColor}; color: ${textStyle.color}; text-shadow: ${textStyle.textShadow};">
                <h4 class="font-bold">${groupName}</h4>
                <span class="transform transition-transform duration-200">▼</span>
            </div>`;
}

function sensitivityControlsTemplate(settings) {
    const { sValue, isAdaptive } = settings;
    const sliderDisabled = isAdaptive ? 'disabled' : '';
    return `<div class="flex items-center justify-between">
                <label for="adaptive-sensitivity-toggle" class="form-label mb-0">Adaptive Sensitivity:</label>
                <input type="checkbox" id="adaptive-sensitivity-toggle" data-action="toggleAdaptiveSensitivity" class="toggle-checkbox" ${isAdaptive ? 'checked' : ''}>
            </div>
            <div class="space-y-2 ${isAdaptive ? 'opacity-50' : ''}">
                <label for="sensitivity-slider" class="form-label">Manual Sensitivity:</label>
                <div class="flex items-center space-x-4">
                    <span>Least</span>
                    <input type="range" id="sensitivity-slider" min="0" max="1" step="0.01" value="${sValue}" class="w-full" ${sliderDisabled}>
                    <span>Most</span>
                </div>
            </div>`;
}

function notificationManagerTemplate(notificationSettings, categories) {
    const categoryItems = categories.map(cat => `
        <div class="flex items-center justify-between p-2 border rounded-md">
            <span class="font-medium">${cat.name}</span>
            <input type="checkbox" data-action="toggleCategoryNotification" data-category-id="${cat.id}" class="toggle-checkbox" ${notificationSettings.categories[cat.id] !== false ? 'checked' : ''}>
        </div>`).join('');
    return `<div class="flex items-center justify-between">
                <label for="master-notification-toggle" class="form-label mb-0">Enable All Notifications:</label>
                <input type="checkbox" id="master-notification-toggle" data-action="toggleAllNotifications" class="toggle-checkbox" ${notificationSettings.enabled ? 'checked' : ''}>
            </div>
            <div id="notification-details" class="${notificationSettings.enabled ? '' : 'hidden'} space-y-4">
                <div>
                    <label class="form-label">Rate Limit:</label>
                    <div class="flex space-x-2 items-center">
                        <input type="number" id="notification-rate-amount" value="${notificationSettings.rateLimit.amount}" min="1" class="duration-input">
                        <select id="notification-rate-unit" class="flex-grow">
                            <option value="minutes" ${notificationSettings.rateLimit.unit === 'minutes' ? 'selected' : ''}>Minute(s)</option>
                            <option value="hours" ${notificationSettings.rateLimit.unit === 'hours' ? 'selected' : ''}>Hour(s)</option>
                            <option value="days" ${notificationSettings.rateLimit.unit === 'days' ? 'selected' : ''}>Day(s)</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="form-label">Notify for categories:</label>
                    <div id="notification-category-list" class="space-y-2">${categories.length > 0 ? categoryItems : '<p class="italic text-sm">No categories to configure.</p>'}</div>
                </div>
            </div>`;
}

function kpiAutomationSettingsTemplate(settings) {
    const { autoKpiEnabled, autoKpiRemovable } = settings;
    return `<p class="form-hint">Automatically create KPIs for categories based on a GPA-like model.</p>
            <div class="flex items-center justify-between">
                <label for="auto-kpi-enabled-toggle" class="form-label mb-0" title="Auto-flag a task as a KPI when it reaches max misses.">Enable Auto-KPI:</label>
                <input type="checkbox" id="auto-kpi-enabled-toggle" data-action="toggleAutoKpi" class="toggle-checkbox" ${autoKpiEnabled ? 'checked' : ''}>
            </div>
            <div class="flex items-center justify-between mt-4">
                <label for="auto-kpi-removable-toggle" class="form-label mb-0" title="Auto-remove KPI status on recovery.">Auto-remove on Recovery:</label>
                <input type="checkbox" id="auto-kpi-removable-toggle" data-action="toggleAutoKpiRemovable" class="toggle-checkbox" ${autoKpiRemovable ? 'checked' : ''}>
            </div>`;
}

function historicalTaskCardTemplate(task) {
    const categoryColor = task.categoryColor || '#374151'; // Default to a neutral gray
    const gpaColor = task.gpaColor || '#4A5568';
    const lastCompleted = task.lastCompleted ? new Date(task.lastCompleted).toLocaleDateString() : 'N/A';

    return `
        <div class="historical-task-card p-3 rounded-lg cursor-pointer"
             data-task-id="${task.id}"
             style="background-color: ${categoryColor}; border: 3px solid ${gpaColor};">
            <h4 class="font-bold truncate">${task.name}</h4>
            <p class="text-xs opacity-80 mt-1">Last completed: ${lastCompleted}</p>
        </div>
    `;
}

function hintManagerTemplate(hints, uiSettings) {
    const hintItemsHtml = hints.map(hint => {
        const isCompleted = uiSettings.userInteractions[hint.interaction];
        return `
            <label class="flex items-center justify-between p-2 border rounded-md text-sm">
                <span>${hint.text.replace('💡', '').trim()}</span>
                <input type="checkbox" data-interaction="${hint.interaction}" class="h-4 w-4 rounded hint-seen-checkbox" ${isCompleted ? 'checked' : ''}>
            </label>
        `;
    }).join('');

    return `
        <div class="flex items-center justify-between">
            <label for="disable-hints-toggle" class="form-label mb-0">Disable All Hint Banners:</label>
            <input type="checkbox" id="disable-hints-toggle" data-action="toggleAllHints" class="toggle-checkbox" ${uiSettings.hintsDisabled ? 'checked' : ''}>
        </div>
        <fieldset id="hint-details-container" class="space-y-3 mt-3 border-none p-0" ${uiSettings.hintsDisabled ? 'disabled' : ''}>
            <p class="text-xs italic">Uncheck hints to see them again. The banner shows one random, un-checked hint at a time.</p>
            <div id="hint-list" class="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
                ${hintItemsHtml}
            </div>
            <button data-action="resetAllHints" class="btn btn-secondary btn-md w-full">Reset All Hints (Show All)</button>
        </fieldset>
    `;
}

function calendarCategoryFilterTemplate(categories, filterSettings = {}, filterTargetView = 'all') {
    const renderRow = (id, name, isItalic = false) => {
        const settings = filterSettings[id] || { show: true, schedule: true };
        const nameClass = isItalic ? 'italic' : 'font-semibold';
        return `
            <div class="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                <span class="${nameClass}">${name}</span>
                <div class="flex items-center space-x-4">
                    <label class="text-xs flex items-center space-x-2 cursor-pointer" title="Show/hide tasks from this category on the calendar view.">
                        <span>Show</span>
                        <input type="checkbox" data-action="toggleCalendarFilter" data-filter-type="show" data-category-id="${id}" class="toggle-checkbox" ${settings.show ? 'checked' : ''}>
                    </label>
                    <label class="text-xs flex items-center space-x-2 cursor-pointer" title="Include/exclude tasks from this category in scheduling calculations (e.g., GPA, status changes).">
                        <span>Schedule</span>
                        <input type="checkbox" data-action="toggleCalendarFilter" data-filter-type="schedule" data-category-id="${id}" class="toggle-checkbox" ${settings.schedule ? 'checked' : ''}>
                    </label>
                </div>
            </div>
        `;
    };

    const categoryRows = categories.map(cat => renderRow(cat.id, cat.name)).join('');
    const uncategorizedRow = renderRow('null', 'Uncategorized', true);

    return `
        <div class="space-y-1 p-2 bg-main rounded-lg mt-4">
            <div class="flex justify-between items-center mb-2">
                 <h4 class="font-bold">Calendar Category Filters</h4>
                 <div class="flex items-center space-x-2">
                    <label for="calendar-filter-view-select" class="text-sm">Apply to:</label>
                    <select id="calendar-filter-view-select" data-action="setCalendarFilterView" class="text-sm p-1 rounded-md">
                        <option value="all" ${filterTargetView === 'all' ? 'selected' : ''}>All Views</option>
                        <option value="timeGridDay" ${filterTargetView === 'timeGridDay' ? 'selected' : ''}>Day</option>
                        <option value="timeGridWeek" ${filterTargetView === 'timeGridWeek' ? 'selected' : ''}>Week</option>
                        <option value="dayGridMonth" ${filterTargetView === 'dayGridMonth' ? 'selected' : ''}>Month</option>
                    </select>
                </div>
            </div>
            ${categoryRows}
            ${uncategorizedRow}
        </div>
    `;
}

function welcomeModalTemplate() {
    return `
        <div id="welcome-modal" class="modal">
            <div class="modal-content bg-modal">
                <h2 class="text-2xl font-semibold mb-4">Welcome!</h2>
                <p class="mb-4">To personalize your experience, please pick your favorite color. We'll use it to generate a custom theme for you.</p>
                <div class="flex items-center justify-center space-x-4 my-6">
                    <input type="color" id="welcome-color-picker" value="#3b82f6" class="h-16 w-16 border-none cursor-pointer rounded-lg">
                </div>
                <div class="flex justify-end space-x-2">
                    <button id="welcome-no-thanks" class="btn btn-clear">No Thanks</button>
                    <button id="welcome-submit" class="btn btn-confirm">Set Theme</button>
                </div>
            </div>
        </div>
    `;
}

export {
    taskTemplate, categoryManagerTemplate, taskViewTemplate, notificationManagerTemplate, taskStatsTemplate,
    actionAreaTemplate, commonButtonsTemplate, statusManagerTemplate, categoryFilterTemplate, iconPickerTemplate,
    editProgressTemplate, editCategoryTemplate, editStatusNameTemplate, restoreDefaultsConfirmationTemplate,
    taskGroupHeaderTemplate, bulkEditFormTemplate, dataMigrationModalTemplate, sensitivityControlsTemplate,
    historyDeleteConfirmationTemplate, taskViewDeleteConfirmationTemplate, vacationManagerTemplate,
    taskViewHistoryDeleteConfirmationTemplate, journalSettingsTemplate, vacationChangeConfirmationModalTemplate,
    appointmentConflictModalTemplate, kpiAutomationSettingsTemplate, historicalTaskCardTemplate, hintManagerTemplate,
    calendarCategoryFilterTemplate, welcomeModalTemplate
};