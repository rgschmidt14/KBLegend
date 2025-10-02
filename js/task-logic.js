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
function calculateScheduledTimes(tasks, viewStartDate, viewEndDate) {
    // Deep clone tasks to avoid modifying the original objects
    let scheduledTasks = JSON.parse(JSON.stringify(tasks));

    // Convert date strings back to Date objects
    scheduledTasks.forEach(task => {
        if (task.dueDate) task.dueDate = new Date(task.dueDate);
        if (task.cycleEndDate) task.cycleEndDate = new Date(task.cycleEndDate);
    });

    const fullAttentionTasks = scheduledTasks.filter(t => t.requiresFullAttention);
    const otherTasks = scheduledTasks.filter(t => !t.requiresFullAttention);

    // Initialize scheduled times for full attention tasks
    fullAttentionTasks.forEach(task => {
        const durationMs = getDurationMs(task.estimatedDurationAmount, task.estimatedDurationUnit) || 0;
        if (task.dueDate) {
            task.scheduledEndTime = new Date(task.dueDate);
            task.scheduledStartTime = new Date(task.dueDate.getTime() - durationMs);
        }
    });

    // Sort tasks by priority: 1. Appointments, 2. Status, 3. Due Date
    const statusOrder = { 'black': 0, 'red': 1, 'yellow': 2, 'green': 3, 'blue': 4 };
    fullAttentionTasks.sort((a, b) => {
        // Appointments are highest priority
        if (a.isAppointment && !b.isAppointment) return -1;
        if (!a.isAppointment && b.isAppointment) return 1;

        // Then, sort by status
        const statusA = statusOrder[a.status] ?? 5;
        const statusB = statusOrder[b.status] ?? 5;
        if (statusA !== statusB) {
            return statusA - statusB;
        }

        // Finally, sort by due date for tasks with the same status
        const dueDateA = a.dueDate ? a.dueDate.getTime() : Infinity;
        const dueDateB = b.dueDate ? b.dueDate.getTime() : Infinity;
        return dueDateA - dueDateB;
    });

    // Deconflict tasks: move lower-priority tasks earlier to make space for higher-priority ones
    for (let i = 0; i < fullAttentionTasks.length; i++) {
        let taskA = fullAttentionTasks[i]; // The task being placed

        // Appointments are immovable, so we skip them in the placement logic.
        if (taskA.isAppointment) {
            continue;
        }

        let hasConflict = true;
        while (hasConflict) {
            hasConflict = false;
            // Check for conflicts against all higher-priority tasks (which includes all appointments)
            for (let j = 0; j < i; j++) {
                const taskB = fullAttentionTasks[j]; // An already-placed, more important task

                // Check for overlap
                if (taskA.scheduledStartTime < taskB.scheduledEndTime && taskA.scheduledEndTime > taskB.scheduledStartTime) {
                    const durationMs = getDurationMs(taskA.estimatedDurationAmount, taskA.estimatedDurationUnit) || 0;
                    // Conflict found. Move taskA to end just before taskB begins.
                    taskA.scheduledEndTime = new Date(taskB.scheduledStartTime.getTime() - 1000); // End 1 second before
                    taskA.scheduledStartTime = new Date(taskA.scheduledEndTime.getTime() - durationMs);

                    hasConflict = true; // Mark that a conflict was found and resolved
                    break; // Restart the conflict check for taskA against all higher-priority tasks
                }
            }
        }
    }

    return [...fullAttentionTasks, ...otherTasks];
}

export { getDurationMs, calculateStatus, calculateScheduledTimes };
