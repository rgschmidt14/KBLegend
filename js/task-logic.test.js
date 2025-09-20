import { getDurationMs, calculateStatus } from './task-logic.js';

describe('calculateStatus', () => {
    const now = new Date('2025-09-20T10:00:00Z').getTime();
    const allTasks = []; // Start with an empty list of other tasks

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
        const status = calculateStatus(task, now, allTasks);
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
        const status = calculateStatus(task, now, allTasks);
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
             countsAsBusy: true,
             estimatedDurationAmount: 4,
             estimatedDurationUnit: 'hours',
        }
        const status = calculateStatus(task, now, [otherBusyTask]);
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
        const status2 = calculateStatus(task, now, [busyTask2]);
        // now (10:00) + busyTask2 (10h) = effective time of 20:00.
        // 20:00 is not > 22:00. Still green.
        // Let's make it more aggressive.
        const busyTask3 = { ...otherBusyTask, id: '6', estimatedDurationAmount: 13, estimatedDurationUnit: 'hours' }; // 13 hour task
        const status3 = calculateStatus(task, now, [busyTask3]);
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
        const status = calculateStatus(task, now, allTasks);
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
        const status = calculateStatus(task, now, allTasks);
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
        const status = calculateStatus(task, now, allTasks);
        expect(status.name).toBe('black');
    });
});
