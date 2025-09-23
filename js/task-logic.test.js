import { getDurationMs, calculateStatus, calculateScheduledTimes } from './task-logic.js';

describe('calculateScheduledTimes', () => {
    const viewStartDate = new Date('2025-09-22T00:00:00Z');
    const viewEndDate = new Date('2025-09-23T00:00:00Z');

    it('should not change times for tasks that do not require full attention', () => {
        const tasks = [{
            id: '1',
            dueDate: new Date('2025-09-22T12:00:00Z'),
            estimatedDurationAmount: 2,
            estimatedDurationUnit: 'hours',
            requiresFullAttention: false,
        }];
        const scheduledTasks = calculateScheduledTimes(tasks, viewStartDate, viewEndDate);
        expect(scheduledTasks[0].scheduledStartTime).toBeUndefined();
    });

    it('should schedule a single full attention task correctly', () => {
        const tasks = [{
            id: '1',
            dueDate: new Date('2025-09-22T12:00:00Z'),
            estimatedDurationAmount: 2,
            estimatedDurationUnit: 'hours',
            requiresFullAttention: true,
        }];
        const scheduledTasks = calculateScheduledTimes(tasks, viewStartDate, viewEndDate);
        expect(scheduledTasks[0].scheduledStartTime.toISOString()).toBe('2025-09-22T10:00:00.000Z');
        expect(scheduledTasks[0].scheduledEndTime.toISOString()).toBe('2025-09-22T12:00:00.000Z');
    });

    it('should deconflict two overlapping full attention tasks', () => {
        const tasks = [
            {
                id: '1', // More important (due first)
                dueDate: new Date('2025-09-22T12:00:00Z'),
                estimatedDurationAmount: 2,
                estimatedDurationUnit: 'hours',
                requiresFullAttention: true,
            },
            {
                id: '2', // Less important
                dueDate: new Date('2025-09-22T12:30:00Z'),
                estimatedDurationAmount: 1,
                estimatedDurationUnit: 'hours',
                requiresFullAttention: true,
            }
        ];
        const scheduledTasks = calculateScheduledTimes(tasks, viewStartDate, viewEndDate);
        const task1 = scheduledTasks.find(t => t.id === '1');
        const task2 = scheduledTasks.find(t => t.id === '2');

        // Task 1 should be unchanged
        expect(task1.scheduledStartTime.toISOString()).toBe('2025-09-22T10:00:00.000Z');
        expect(task1.scheduledEndTime.toISOString()).toBe('2025-09-22T12:00:00.000Z');

        // Task 2 should be shifted before Task 1
        expect(task2.scheduledEndTime.toISOString()).toBe('2025-09-22T09:59:00.000Z'); // Ends 1 min before task 1 starts
        expect(task2.scheduledStartTime.toISOString()).toBe('2025-09-22T08:59:00.000Z');
    });

    it('should handle a three-task pile-up', () => {
        const tasks = [
            { id: '1', dueDate: new Date('2025-09-22T12:00:00Z'), estimatedDurationAmount: 2, estimatedDurationUnit: 'hours', requiresFullAttention: true },
            { id: '2', dueDate: new Date('2025-09-22T12:30:00Z'), estimatedDurationAmount: 1, estimatedDurationUnit: 'hours', requiresFullAttention: true },
            { id: '3', dueDate: new Date('2025-09-22T13:00:00Z'), estimatedDurationAmount: 3, estimatedDurationUnit: 'hours', requiresFullAttention: true },
        ];
        const scheduledTasks = calculateScheduledTimes(tasks, viewStartDate, viewEndDate);
        const task1 = scheduledTasks.find(t => t.id === '1');
        const task2 = scheduledTasks.find(t => t.id === '2');
        const task3 = scheduledTasks.find(t => t.id === '3');

        // Task 1 (most important) is not moved
        expect(task1.scheduledStartTime.toISOString()).toBe('2025-09-22T10:00:00.000Z');

        // Task 2 is moved before task 1
        expect(task2.scheduledEndTime.toISOString()).toBe('2025-09-22T09:59:00.000Z');

        // Task 3 is moved before task 2
        expect(task3.scheduledEndTime.toISOString()).toBe('2025-09-22T08:58:00.000Z');
        expect(task3.scheduledStartTime.toISOString()).toBe('2025-09-22T05:58:00.000Z');
    });

    it('should use miss count as a tie-breaker for tasks with the same due date', () => {
        const tasks = [
            { id: '1', dueDate: new Date('2025-09-22T12:00:00Z'), misses: 2, estimatedDurationAmount: 2, estimatedDurationUnit: 'hours', requiresFullAttention: true },
            { id: '2', dueDate: new Date('2025-09-22T12:00:00Z'), misses: 5, estimatedDurationAmount: 1, estimatedDurationUnit: 'hours', requiresFullAttention: true }, // More important
        ];
        const scheduledTasks = calculateScheduledTimes(tasks, viewStartDate, viewEndDate);
        const task1 = scheduledTasks.find(t => t.id === '1');
        const task2 = scheduledTasks.find(t => t.id === '2');

        // Task 2 (higher misses) should be scheduled first
        expect(task2.scheduledStartTime.toISOString()).toBe('2025-09-22T11:00:00.000Z');

        // Task 1 is shifted before task 2
        expect(task1.scheduledEndTime.toISOString()).toBe('2025-09-22T10:59:00.000Z');
    });
});

describe('getDurationMs', () => {
    it('should return the correct number of milliseconds for minutes', () => {
        expect(getDurationMs(10, 'minutes')).toBe(600000);
    });

    it('should return the correct number of milliseconds for hours', () => {
        expect(getDurationMs(2, 'hours')).toBe(7200000);
    });

    it('should return the correct number of milliseconds for days', () => {
        expect(getDurationMs(1, 'days')).toBe(86400000);
    });

    it('should return the correct number of milliseconds for weeks', () => {
        expect(getDurationMs(1, 'weeks')).toBe(604800000);
    });

    it('should return an approximation for months', () => {
        // 30 days approximation
        expect(getDurationMs(1, 'months')).toBe(2592000000);
    });

    it('should return 0 for invalid or zero amount', () => {
        expect(getDurationMs(0, 'days')).toBe(0);
        expect(getDurationMs(-5, 'hours')).toBe(0);
        expect(getDurationMs(null, 'minutes')).toBe(0);
    });

    it('should return 0 for an unknown unit', () => {
        expect(getDurationMs(10, 'years')).toBe(0);
    });
});

describe('calculateStatus', () => {
    const now = new Date('2025-09-20T10:00:00Z').getTime();
    const allTasks = []; // Start with an empty list of other tasks
    const defaultSensitivity = {
        yellowWindowMs: 16 * 3600000,
        yellowBuffer: 2,
        redBuffer: 1,
        missRatio: 0.5,
    };

    it('should return "green" for a standard task that is not due soon', () => {
        const task = {
            id: '1',
            dueDate: new Date('2025-09-21T12:00:00Z'), // More than 24 hours from 'now'
            estimatedDurationAmount: 1,
            estimatedDurationUnit: 'hours',
            repetitionType: 'none',
            completed: false,
            misses: 0,
        };
        const status = calculateStatus(task, now, allTasks, defaultSensitivity);
        expect(status.name).toBe('green');
    });

    it('should return "red" for a task that is past its due date', () => {
        const task = {
            id: '2',
            dueDate: new Date('2025-09-20T09:00:00Z'), // 1 hour ago
            estimatedDurationAmount: 1,
            estimatedDurationUnit: 'hours',
            repetitionType: 'none',
            completed: false,
            misses: 0,
        };
        const status = calculateStatus(task, now, allTasks, defaultSensitivity);
        expect(status.name).toBe('red');
    });

    it('should return "yellow" for a task that is due within the YELLOW_WINDOW (16 hours)', () => {
        const task = {
            id: '3',
            dueDate: new Date('2025-09-20T22:00:00Z'), // 12 hours from now
            estimatedDurationAmount: 30,
            estimatedDurationUnit: 'minutes',
            repetitionType: 'none',
            completed: false,
            misses: 0,
        };
        // This test relies on the logic of summing up other busy tasks.
        // We'll create another "busy" task to trigger the yellow status.
        const otherBusyTask = {
             id: '4',
             dueDate: new Date('2025-09-20T20:00:00Z'), // Due in 10 hours
             status: 'green', // It's green but its estimate will be counted
             requiresFullAttention: true,
             estimatedDurationAmount: 4,
             estimatedDurationUnit: 'hours',
        }
        const status = calculateStatus(task, now, [otherBusyTask], defaultSensitivity);
        // The logic is: now (10:00) + other task (4h) = 14:00. This is NOT > task due date (22:00).
        // However, the *other* logic is `timeUntilDue <= taskEstimateMs * 2`.
        // Time until due is 12 hours. Estimate is 30 mins. 12h is not <= 60 mins.
        // Let's re-read calculateStatus. Ah, it's (nowMs + sumRelevantEstimatesMs) > dueDateMs.
        // sumRelevantEstimatesMs includes green tasks inside the yellow window.
        // `otherBusyTask` is due in 10 hours, which is inside the 16-hour window. So its 4h estimate is counted.
        // now (10:00) + other task estimate (4h) = effective time of 14:00.
        // The due date of task '3' is 22:00.
        // 14:00 is not > 22:00. So it should still be green.
        // Let's adjust the test to *make* it yellow.
        const busyTask2 = { ...otherBusyTask, id: '5', estimatedDurationAmount: 10, estimatedDurationUnit: 'hours' }; // 10 hour task
        const status2 = calculateStatus(task, now, [busyTask2], defaultSensitivity);
        // now (10:00) + busyTask2 (10h) = effective time of 20:00.
        // 20:00 is not > 22:00. Still green.
        // Let's make it more aggressive.
        const busyTask3 = { ...otherBusyTask, id: '6', estimatedDurationAmount: 13, estimatedDurationUnit: 'hours' }; // 13 hour task
        const status3 = calculateStatus(task, now, [busyTask3], defaultSensitivity);
        // now (10:00) + busyTask3 (13h) = effective time of 23:00.
        // 23:00 IS > 22:00. This should be yellow.
        expect(status3.name).toBe('yellow');
    });

    it('should return "red" for a task that is due very soon (within its own estimated duration)', () => {
        const task = {
            id: '7',
            dueDate: new Date('2025-09-20T10:30:00Z'), // 30 minutes from now
            estimatedDurationAmount: 1,
            estimatedDurationUnit: 'hours', // 1 hour estimate
            repetitionType: 'none',
            completed: false,
            misses: 0,
        };
        const status = calculateStatus(task, now, allTasks, defaultSensitivity);
        expect(status.name).toBe('red');
    });

    it('should return "blue" for a completed non-repeating task', () => {
        const task = {
            id: '8',
            dueDate: new Date('2025-09-19T10:00:00Z'), // Due yesterday
            repetitionType: 'none',
            completed: true, // This is the key
            misses: 0,
        };
        const status = calculateStatus(task, now, allTasks, defaultSensitivity);
        expect(status.name).toBe('blue');
    });

    it('should return "black" for a repeating task that has reached its max misses', () => {
        const task = {
            id: '9',
            dueDate: new Date('2025-09-21T10:00:00Z'),
            repetitionType: 'relative',
            trackMisses: true,
            maxMisses: 3,
            misses: 3,
        };
        const status = calculateStatus(task, now, allTasks, defaultSensitivity);
        expect(status.name).toBe('black');
    });

    describe('when tracking habit misses', () => {
        const baseHabitTask = {
            id: '10',
            dueDate: new Date('2025-09-21T12:00:00Z'), // Due in the future, so it should be green
            repetitionType: 'relative',
            trackMisses: true,
            maxMisses: 10,
            misses: 0,
            requiresFullAttention: true,
        };

        it('should upgrade a "green" task to "yellow" when miss ratio is over 50%', () => {
            const task = { ...baseHabitTask, misses: 6 }; // 6/10 = 60%
            const status = calculateStatus(task, now, allTasks, defaultSensitivity);
            expect(status.name).toBe('yellow');
        });

        it('should upgrade a "yellow" task to "red" when miss ratio is over 50%', () => {
            // To make the original task yellow, we need to adjust its due date and create a sufficiently busy task.
            const yellowTask = { ...baseHabitTask, id: '11', dueDate: new Date('2025-09-21T01:00:00Z') }; // Due in 15 hours
            const busyTask = { id: 'busy1', dueDate: new Date('2025-09-20T23:00:00Z'), estimatedDurationAmount: 16, estimatedDurationUnit: 'hours', requiresFullAttention: true, status: 'green' };
            const initialStatus = calculateStatus(yellowTask, now, [busyTask], defaultSensitivity);
            expect(initialStatus.name).toBe('yellow'); // First, confirm it's yellow

            const taskWithMisses = { ...yellowTask, misses: 6 }; // Now add the misses
            const finalStatus = calculateStatus(taskWithMisses, now, [busyTask], defaultSensitivity);
            expect(finalStatus.name).toBe('red');
        });

        it('should upgrade a "red" task to "black" when miss ratio is over 50%', () => {
            const pastDueTask = { ...baseHabitTask, dueDate: new Date('2025-09-20T09:00:00Z') }; // Make it overdue
            const initialStatus = calculateStatus(pastDueTask, now, allTasks, defaultSensitivity);
            expect(initialStatus.name).toBe('red'); // First, confirm it's red

            const task = { ...pastDueTask, misses: 6 }; // Now add the misses
            const finalStatus = calculateStatus(task, now, allTasks, defaultSensitivity);
            expect(finalStatus.name).toBe('black');
        });

        it('should not change status if miss ratio is exactly 50%', () => {
            const task = { ...baseHabitTask, misses: 5 }; // 5/10 = 50%
            const status = calculateStatus(task, now, allTasks, defaultSensitivity);
            expect(status.name).toBe('green');
        });

        it('should not change status if habit tracking is disabled', () => {
            const task = { ...baseHabitTask, misses: 6, trackMisses: false };
            const status = calculateStatus(task, now, allTasks, defaultSensitivity);
            expect(status.name).toBe('green');
        });
    });

    describe('with different completion types', () => {
        const baseTask = {
            id: '20',
            dueDate: new Date('2025-09-20T20:00:00Z'), // Due in 10 hours
            estimatedDurationAmount: 1,
            estimatedDurationUnit: 'hours',
            requiresFullAttention: true,
        };

        it('should consider a "count-based" task as less busy when it is partially complete', () => {
            // This busy task has a 12-hour estimate, but is 75% complete.
            // So, it should only contribute 3 hours of "busyness".
            const busyTask = {
                id: '21',
                dueDate: new Date('2025-09-20T22:00:00Z'),
                requiresFullAttention: true,
                status: 'green',
                estimatedDurationAmount: 12,
                estimatedDurationUnit: 'hours',
                completionType: 'count',
                countTarget: 100,
                currentProgress: 75,
            };
            // With the full 12 hours, baseTask would be yellow (10:00 + 12h > 20:00).
            // With the remaining 3 hours, it should be green (10:00 + 3h < 20:00).
            const status = calculateStatus(baseTask, now, [busyTask], defaultSensitivity);
            expect(status.name).toBe('green');
        });

        it('should consider a "time-based" task as less busy when it is partially complete', () => {
            // This busy task has a target of 12 hours, but 10 hours are already done.
            // So, it should only contribute 2 hours of "busyness".
            const busyTask = {
                id: '22',
                dueDate: new Date('2025-09-20T22:00:00Z'),
                requiresFullAttention: true,
                status: 'green',
                completionType: 'time',
                timeTargetAmount: 12,
                timeTargetUnit: 'hours',
                currentProgress: getDurationMs(10, 'hours'), // 10 hours logged
            };
            // With the remaining 2 hours, baseTask should be green (10:00 + 2h < 20:00).
            const status = calculateStatus(baseTask, now, [busyTask], defaultSensitivity);
            expect(status.name).toBe('green');
        });

        it('should use the full estimate if a count-based task has no progress', () => {
            // This busy task has a 12-hour estimate and is 0% complete.
            // It should contribute the full 12 hours, making the baseTask yellow.
            const busyTask = {
                id: '23',
                dueDate: new Date('2025-09-20T22:00:00Z'),
                requiresFullAttention: true,
                status: 'green',
                estimatedDurationAmount: 12,
                estimatedDurationUnit: 'hours',
                completionType: 'count',
                countTarget: 100,
                currentProgress: 0,
            };
            // With the full 12 hours, baseTask should be yellow (10:00 + 12h > 20:00).
            const status = calculateStatus(baseTask, now, [busyTask], defaultSensitivity);
            expect(status.name).toBe('yellow');
        });
    });

    describe('with confirmation states', () => {
        it('should return "red" if confirmationState is "awaiting_overdue_input"', () => {
            const task = { id: '30', confirmationState: 'awaiting_overdue_input' };
            const status = calculateStatus(task, now, allTasks, defaultSensitivity);
            expect(status.name).toBe('red');
        });

        it('should return "black" if confirmationState is "awaiting_overdue_input" and miss ratio is high', () => {
            const task = {
                id: '31',
                confirmationState: 'awaiting_overdue_input',
                repetitionType: 'relative',
                trackMisses: true,
                maxMisses: 10,
                misses: 6,
            };
            const status = calculateStatus(task, now, allTasks, defaultSensitivity);
            expect(status.name).toBe('black');
        });

        it('should return "red" if confirmationState is "confirming_complete" and task is past due', () => {
            const task = {
                id: '32',
                confirmationState: 'confirming_complete',
                dueDate: new Date(now - 1000), // 1 second ago
            };
            const status = calculateStatus(task, now, allTasks, defaultSensitivity);
            expect(status.name).toBe('red');
        });

        it('should return "green" if confirmationState is "confirming_complete" and task is not due yet', () => {
            const task = {
                id: '33',
                confirmationState: 'confirming_complete',
                dueDate: new Date(now + 100000), // In the future
            };
            const status = calculateStatus(task, now, allTasks, defaultSensitivity);
            expect(status.name).toBe('green');
        });
    });

    describe('with cycle end dates', () => {
        it('should keep a "blue" repeating task as "blue" if its cycle end date is in the future', () => {
            const pausedTask = {
                id: '40',
                status: 'blue', // It's waiting for its next cycle
                repetitionType: 'relative',
                cycleEndDate: new Date(now + 100000), // The cycle is paused until the future
            };
            const status = calculateStatus(pausedTask, now, allTasks, defaultSensitivity);
            expect(status.name).toBe('blue');
        });

        it('should re-evaluate a "blue" repeating task if its cycle end date has passed', () => {
            const unpausedTask = {
                id: '41',
                status: 'blue',
                repetitionType: 'relative',
                dueDate: new Date(now + 3600000), // Due in 1 hour
                cycleEndDate: new Date(now - 1000), // The cycle pause has ended
            };
            // Since the pause is over, it should no longer be blue.
            // timeUntilDue (1hr) is > estimate*2 (1hr is not > 1hr). Default estimate is 30 mins.
            // So timeUntilDue (3600000) > taskEstimateMs * 2 (1800000 * 2 = 3600000) is false.
            // It should be green. Let me recheck the logic.
            // `timeUntilDue <= taskEstimateMs * 2` -> 3600000 <= 3600000 is true. So it should be yellow.
            const status = calculateStatus(unpausedTask, now, allTasks, defaultSensitivity);
            expect(status.name).toBe('yellow');
        });
    });

    describe('with dynamic sensitivity settings', () => {
        const baseTask = {
            id: '50',
            dueDate: new Date('2025-09-25T10:00:00Z'), // 5 days from now
            estimatedDurationAmount: 2,
            estimatedDurationUnit: 'hours',
            repetitionType: 'none',
            completed: false,
            misses: 0,
        };

        it('should be "green" with least sensitive settings (S=0)', () => {
            const leastSensitive = {
                yellowWindowMs: 16 * 3600000, // 16 hours
                yellowBuffer: 2,
                redBuffer: 1,
                missRatio: 0.50,
            };
            const status = calculateStatus(baseTask, now, allTasks, leastSensitive);
            expect(status.name).toBe('green');
        });

        it('should be "yellow" with most sensitive settings (S=1)', () => {
            const mostSensitive = {
                yellowWindowMs: 1176 * 3600000, // 7 weeks
                yellowBuffer: 10,
                redBuffer: 5,
                missRatio: 0.10,
            };
            // The yellow window is huge, so the task (due in 5 days) will be inside it.
            // The busyness check will run. Since there are no other tasks, it should be green.
            // However, the *second* check is timeUntilDue <= taskEstimateMs * yellowBuffer
            // timeUntilDue = 5 days = 120 hours.
            // taskEstimateMs * yellowBuffer = 2 hours * 10 = 20 hours.
            // 120 > 20, so it should still be green.
            // Let's adjust the due date to make it yellow.
            // Let's make it due in 19 hours.
            const closerTask = { ...baseTask, dueDate: new Date(now + 19 * 3600000) };
            // timeUntilDue = 19 hours. taskEstimate*yellowBuffer = 20 hours.
            // 19 <= 20 is true. So it should be yellow.
            const status = calculateStatus(closerTask, now, allTasks, mostSensitive);
            expect(status.name).toBe('yellow');
        });

        it('should be "red" with most sensitive settings (S=1) when due soon', () => {
             const mostSensitive = {
                yellowWindowMs: 1176 * 3600000, // 7 weeks
                yellowBuffer: 10,
                redBuffer: 5,
                missRatio: 0.10,
            };
            // taskEstimate * redBuffer = 2 hours * 5 = 10 hours.
            // Let's make the task due in 9 hours.
            const veryCloseTask = { ...baseTask, dueDate: new Date(now + 9 * 3600000) };
            const status = calculateStatus(veryCloseTask, now, allTasks, mostSensitive);
            expect(status.name).toBe('red');
        });

        it('should upgrade status based on a more sensitive missRatio', () => {
            const sensitiveMissRatio = {
                yellowWindowMs: 16 * 3600000,
                yellowBuffer: 2,
                redBuffer: 1,
                missRatio: 0.10, // Only 10% needed to trigger status upgrade
            };
            const habitTask = {
                id: '51',
                dueDate: new Date('2025-09-21T12:00:00Z'), // Green by default
                repetitionType: 'relative',
                trackMisses: true,
                maxMisses: 10,
                misses: 2, // 20% miss rate
                requiresFullAttention: true,
            };
            // With default 0.5 threshold, this would be green.
            // With 0.1 threshold, this should be yellow.
            const status = calculateStatus(habitTask, now, allTasks, sensitiveMissRatio);
            expect(status.name).toBe('yellow');
        });
    });
});
