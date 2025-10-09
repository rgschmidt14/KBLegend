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

// --- Start of Date Generation Helpers ---

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
        // console.error(`Invalid input for generateAbsoluteOccurrences for task ${task.id}`);
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

function getOccurrences(task, startDate, endDate) {
    const dueDates = [];
    if (!task.dueDate) return dueDates;

    const initialDueDate = new Date(task.dueDate);

    if (task.repetitionType === 'none') {
        // Corrected logic: A non-repeating task occurs on its due date.
        // The function should simply check if that single date falls within the requested window.
        if (initialDueDate.getTime() >= startDate.getTime() && initialDueDate.getTime() <= endDate.getTime()) {
            dueDates.push(initialDueDate);
        }
    } else if (task.repetitionType === 'absolute') {
        return generateAbsoluteOccurrences(task, startDate, endDate);
    } else if (task.repetitionType === 'relative') {
        const intervalMs = getDurationMs(task.repetitionAmount, task.repetitionUnit);
        if (intervalMs > 0) {
            let currentDate = new Date(initialDueDate);
            while (currentDate.getTime() < startDate.getTime()) {
                currentDate = new Date(currentDate.getTime() + intervalMs);
            }
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
        currentDate = new Date(vacationEndDate.getFullYear(), vacationEndDate.getMonth(), vacationEndDate.getDate() + 1, originalHours, originalMinutes, originalSeconds);
        vacation = isDateInVacation(currentDate, vacations);
    }
    return currentDate;
}

/**
 * The new V11 GPA-based calculation pipeline. This is the single source of truth for task status and scheduling.
 * @param {Array} tasks - The array of all active tasks.
 * @param {Date} calculationHorizon - The date until which to project tasks.
 * @param {object} settings - An object containing user settings like sensitivity, vacations, and categories.
 * @returns {Array} A new array of all processed task occurrences, not the original tasks.
 */
function runCalculationPipeline(tasks, calculationHorizon, settings, now_for_testing) {
    const now = now_for_testing || new Date();
    const nowMs = now.getTime();
    const { sensitivity, vacations, categories, calendarCategoryFilters } = settings;

    // --- Step 0: Filter tasks based on calendar 'schedule' settings ---
    const filteredTasks = tasks.filter(task => {
        if (!calendarCategoryFilters) return true; // If setting doesn't exist, don't filter
        const catId = task.categoryId || 'null';
        const filter = calendarCategoryFilters[catId];
        // A category is excluded ONLY if its 'schedule' property is explicitly false.
        return !filter || filter.schedule !== false;
    });

    // --- Step 1: Generate all occurrences ---
    let allOccurrences = [];
    filteredTasks.forEach(task => {
        if (!task.dueDate) return;
        const dueDates = getOccurrences(task, now, calculationHorizon);
        dueDates.forEach(dueDate => {
            allOccurrences.push({
                ...task,
                originalId: task.id,
                id: `${task.id}_${dueDate.toISOString()}`,
                occurrenceDueDate: dueDate,
            });
        });
    });

    // --- Step 2.1: Calculate "Positioning GPA" & Prioritize ---
    allOccurrences.forEach(occurrence => {
        const task = occurrence;
        const baseDueDate = adjustDateForVacation(new Date(task.occurrenceDueDate), vacations, task.categoryId, categories);
        task.baseDueDate = baseDueDate;

        const prepTimeMs = getDurationMs(task.prepTimeAmount, task.prepTimeUnit);
        const estimatedDurationMs = getDurationMs(task.estimatedDurationAmount, task.estimatedDurationUnit);
        const urgencySourceDuration = prepTimeMs > 0 ? prepTimeMs : estimatedDurationMs;
        const warningWindow = urgencySourceDuration * 4;
        const timeUntilDue = baseDueDate.getTime() - nowMs;

        let timeDemerit = (warningWindow > 0 && timeUntilDue <= warningWindow) ? (1 - (timeUntilDue / warningWindow)) * 3.0 : 0;
        timeDemerit = Math.max(0, Math.min(timeDemerit, 3.0));

        let habitDemerit = (task.repetitionType !== 'none' && task.trackMisses && task.maxMisses > 0) ? (task.misses / task.maxMisses) * 2.0 : 0;
        habitDemerit = Math.max(0, Math.min(habitDemerit, 2.0));

        task.positioningGpa = 4.0 - timeDemerit - habitDemerit;
    });

    // --- Step 2.2: De-conflict the Calendar ("Scheduling Forward") ---
    const appointments = allOccurrences.filter(o => o.isAppointment);
    const flexibleTasks = allOccurrences.filter(o => !o.isAppointment);
    flexibleTasks.sort((a, b) => a.positioningGpa - b.positioningGpa);

    let busySlots = [];
    appointments.forEach(task => {
        const durationMs = getDurationMs(task.estimatedDurationAmount, task.estimatedDurationUnit);
        if (!task.baseDueDate) return;
        task.scheduledStartTime = new Date(task.baseDueDate.getTime() - durationMs);
        task.scheduledEndTime = new Date(task.baseDueDate);
        busySlots.push({ start: task.scheduledStartTime.getTime(), end: task.scheduledEndTime.getTime() });
    });

    busySlots.sort((a, b) => a.start - b.start);

    flexibleTasks.forEach(task => {
        const durationMs = getDurationMs(task.estimatedDurationAmount, task.estimatedDurationUnit);
        if (!task.baseDueDate || durationMs <= 0) {
            task.scheduledStartTime = task.baseDueDate;
            task.scheduledEndTime = task.baseDueDate;
            return;
        }

        let potentialEndTime = new Date(task.baseDueDate);
        let foundSlot = false;
        for (let i = 0; i < 500 && !foundSlot; i++) {
            let potentialStartTime = new Date(potentialEndTime.getTime() - durationMs);
            let conflict = false;
            for (const slot of busySlots) {
                if (potentialStartTime.getTime() < slot.end && potentialEndTime.getTime() > slot.start) {
                    conflict = true;
                    potentialEndTime = new Date(slot.start);
                    break;
                }
            }
            if (!conflict) {
                task.scheduledStartTime = potentialStartTime;
                task.scheduledEndTime = potentialEndTime;
                busySlots.push({ start: potentialStartTime.getTime(), end: potentialEndTime.getTime() });
                busySlots.sort((a, b) => a.start - b.start);
                foundSlot = true;
            }
        }
        if (!foundSlot) { // Fallback
            task.scheduledStartTime = new Date(task.baseDueDate.getTime() - durationMs);
            task.scheduledEndTime = new Date(task.baseDueDate);
        }
    });

    // --- Step 2.3: Calculate Final "Coloring GPA" ---
    allOccurrences.forEach(occurrence => {
        if (!occurrence.scheduledStartTime) {
            occurrence.finalGpa = -1;
            occurrence.finalStatus = 'green';
            return;
        }

        const prepTimeMs = getDurationMs(occurrence.prepTimeAmount, occurrence.prepTimeUnit);
        const estimatedDurationMs = getDurationMs(occurrence.estimatedDurationAmount, occurrence.estimatedDurationUnit);
        const urgencySourceDuration = prepTimeMs > 0 ? prepTimeMs : estimatedDurationMs;
        const warningWindow = urgencySourceDuration * 4;
        const timeUntilDue = occurrence.scheduledStartTime.getTime() - nowMs;

        let finalTimeDemerit = (warningWindow > 0 && timeUntilDue <= warningWindow) ? (1 - (timeUntilDue / warningWindow)) * 3.0 : 0;
        finalTimeDemerit = Math.max(0, Math.min(finalTimeDemerit, 3.0));

        let habitDemerit = (occurrence.repetitionType !== 'none' && occurrence.trackMisses && occurrence.maxMisses > 0) ? (occurrence.misses / occurrence.maxMisses) * 2.0 : 0;
        habitDemerit = Math.max(0, Math.min(habitDemerit, 2.0));

        occurrence.finalGpa = 4.0 - finalTimeDemerit - habitDemerit;

        const s = sensitivity.sValue || 0.5;
        const adjustedRedThreshold = 0.5 + (s - 0.5);
        const adjustedYellowThreshold = 1.5 + (s - 0.5);
        const adjustedGreenThreshold = 2.5 + (s - 0.5);

        if (occurrence.finalGpa < adjustedRedThreshold) occurrence.finalStatus = 'black';
        else if (occurrence.finalGpa < adjustedYellowThreshold) occurrence.finalStatus = 'red';
        else if (occurrence.finalGpa < adjustedGreenThreshold) occurrence.finalStatus = 'yellow';
        else occurrence.finalStatus = 'green';
    });

    return allOccurrences;
}

export { getDurationMs, getOccurrences, adjustDateForVacation, runCalculationPipeline };