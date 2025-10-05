const MS_PER_MINUTE = 60000;
const MS_PER_HOUR = 3600000;
const MS_PER_DAY = 86400000;

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
        default: console.warn("Unknown duration unit:", unit); ms = 0;
    }
    return ms;
}

function calculateStatus(task, nowMs, allTasks, sensitivityParams) {
    const { yellowWindowMs, yellowBuffer, redBuffer, missRatio: missRatioThreshold } = sensitivityParams;

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
            } else {
                // If it's awaiting completion but not yet due, it should be considered green.
                return { name: 'green', className: 'task-green' };
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
                if (t.requiresFullAttention === false) return false;
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
            const yellowLookaheadMs = nowMs + yellowWindowMs;
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
            if (timeUntilDue <= taskEstimateMs * redBuffer) {
                activeStatusName = 'red';
            } else if (activeStatusName !== 'red' && timeUntilDue <= taskEstimateMs * yellowBuffer) {
                activeStatusName = 'yellow';
            }
        } else {
            activeStatusName = 'green';
        }
        let finalStatusName = activeStatusName;
        if (finalStatusName !== 'black' && task.repetitionType !== 'none' && task.maxMisses > 0 && task.trackMisses) {
            const missRatio = task.misses / task.maxMisses;
            if (missRatio > missRatioThreshold && missRatio < 1) {
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

/**
 * Checks for daily KPIs and generates tasks for them if they don't already exist for the current day.
 * @param {Array} indicators - The array of all KPI indicators.
 */
// --- Start of Date Generation Helpers (moved from script.js) ---

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

// --- End of Date Generation Helpers ---

function getOccurrences(task, startDate, endDate) {
    const dueDates = [];
    if (!task.dueDate) return dueDates;

    const initialDueDate = new Date(task.dueDate);

    if (task.repetitionType === 'none') {
        // Ensure the single due date is within the requested range
        if (initialDueDate.getTime() >= startDate.getTime() && initialDueDate.getTime() <= endDate.getTime()) {
             dueDates.push(initialDueDate);
        }
    } else if (task.repetitionType === 'absolute') {
        // For absolute, we just call our existing helper
        return generateAbsoluteOccurrences(task, startDate, endDate);
    } else if (task.repetitionType === 'relative') {
        const intervalMs = getDurationMs(task.repetitionAmount, task.repetitionUnit);
        if (intervalMs > 0) {
            let currentDate = new Date(initialDueDate);

            // Find the first occurrence that is *within or after* the start of our window
            // This handles tasks that started in the past and repeat into the window.
            while (currentDate.getTime() < startDate.getTime()) {
                currentDate = new Date(currentDate.getTime() + intervalMs);
            }

            // Now, iterate forward from that point until we are past the end date
            let i = 0; // Safety break
            while (currentDate.getTime() <= endDate.getTime() && i < 500) {
                dueDates.push(new Date(currentDate));
                currentDate = new Date(currentDate.getTime() + intervalMs);
                i++;
            }
        }
    }
    return dueDates;
}


function isDateInVacation(date, vacations) {
    if (!vacations || vacations.length === 0) return false;
    const checkTime = new Date(date).setHours(0, 0, 0, 0);

    for (const vacation of vacations) {
        const startTime = new Date(vacation.startDate).setHours(0, 0, 0, 0);
        const endTime = new Date(vacation.endDate).setHours(23, 59, 59, 999);
        if (checkTime >= startTime && checkTime <= endTime) {
            return vacation; // Return the vacation object if found
        }
    }
    return false;
}

function adjustDateForVacation(date, vacations, taskCategoryId, allCategories) {
    const category = allCategories.find(c => c.id === taskCategoryId);
    const canBypassVacation = category ? category.bypassVacation : false;

    if (canBypassVacation || !date) {
        return date;
    }

    const originalHours = date.getHours();
    const originalMinutes = date.getMinutes();
    const originalSeconds = date.getSeconds();

    let currentDate = new Date(date);
    let vacation = isDateInVacation(currentDate, vacations);
    while (vacation) {
        const vacationEndDate = new Date(vacation.endDate);
        // Push to the day after vacation, preserving original time
        currentDate = new Date(vacationEndDate.getFullYear(), vacationEndDate.getMonth(), vacationEndDate.getDate() + 1, originalHours, originalMinutes, originalSeconds);
        vacation = isDateInVacation(currentDate, vacations);
    }
    return currentDate;
}

function calculateScheduledTimes(tasks, viewStartDate, viewEndDate, vacations = [], categories = []) {
    let allOccurrences = [];

    // 1. Generate all occurrences for all tasks within the given timeframe.
    // We look back 7 days to catch tasks that might be pushed into the current view.
    const schedulingStartDate = new Date(viewStartDate.getTime() - 7 * MS_PER_DAY);

    tasks.forEach(task => {
        if (!task.dueDate) return;

        const durationMs = getDurationMs(task.estimatedDurationAmount, task.estimatedDurationUnit) || 0;
        const dueDates = getOccurrences(task, schedulingStartDate, viewEndDate);

        const adjustedDueDates = dueDates.map(dueDate => adjustDateForVacation(dueDate, vacations, task.categoryId, categories));

        adjustedDueDates.forEach(dueDate => {
            allOccurrences.push({
                ...task, // Copy all original task properties
                originalId: task.id,
                id: `${task.id}_${dueDate.toISOString()}`, // Unique ID for this occurrence
                occurrenceDueDate: dueDate,
                scheduledEndTime: dueDate,
                scheduledStartTime: new Date(dueDate.getTime() - durationMs),
            });
        });
    });

    // 2. Separate tasks that need deconfliction from those that don't.
    const fullAttentionOccurrences = allOccurrences.filter(o => o.requiresFullAttention);
    const otherOccurrences = allOccurrences.filter(o => !o.requiresFullAttention);

    // 3. Sort tasks by priority: 1. Appointments, 2. Status, 3. Due Date
    const statusOrder = { 'black': 0, 'red': 1, 'yellow': 2, 'green': 3, 'blue': 4 };
    fullAttentionOccurrences.sort((a, b) => {
        if (a.isAppointment && !b.isAppointment) return -1;
        if (!a.isAppointment && b.isAppointment) return 1;

        const statusA = statusOrder[a.status] ?? 5;
        const statusB = statusOrder[b.status] ?? 5;
        if (statusA !== statusB) return statusA - statusB;

        return b.occurrenceDueDate.getTime() - a.occurrenceDueDate.getTime();
    });

    // 4. Deconflict tasks
    for (let i = 0; i < fullAttentionOccurrences.length; i++) {
        let taskA = fullAttentionOccurrences[i];
        if (taskA.isAppointment) continue;

        let hasConflict = true;
        while (hasConflict) {
            hasConflict = false;
            for (let j = 0; j < i; j++) {
                const taskB = fullAttentionOccurrences[j];
                if (taskA.scheduledStartTime < taskB.scheduledEndTime && taskA.scheduledEndTime > taskB.scheduledStartTime) {
                    const durationMs = getDurationMs(taskA.estimatedDurationAmount, taskA.estimatedDurationUnit) || 0;
                    taskA.scheduledEndTime = new Date(taskB.scheduledStartTime.getTime() - 1000);
                    taskA.scheduledStartTime = new Date(taskA.scheduledEndTime.getTime() - durationMs);
                    hasConflict = true;
                    break;
                }
            }
        }
    }

    // 5. Combine and filter for the final view
    const finalScheduledTasks = [...fullAttentionOccurrences, ...otherOccurrences];
    const now = new Date();

    // Final filter:
    // - Must not be in the past (scheduledEndTime > now).
    // - Must overlap with the current calendar view.
    return finalScheduledTasks.filter(o =>
        o.scheduledEndTime.getTime() > now.getTime() &&
        o.scheduledStartTime < viewEndDate &&
        o.scheduledEndTime > viewStartDate
    );
}


export { getDurationMs, calculateStatus, calculateScheduledTimes, getOccurrences, adjustDateForVacation };
