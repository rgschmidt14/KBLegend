const MS_PER_MINUTE = 60000;
const MS_PER_HOUR = 3600000;
const MS_PER_DAY = 86400000;
const YELLOW_WINDOW_HOURS = 16;
const YELLOW_WINDOW_MS = YELLOW_WINDOW_HOURS * MS_PER_HOUR;

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

export { getDurationMs, calculateStatus };
