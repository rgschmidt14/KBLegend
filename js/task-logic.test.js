import { getDurationMs, runCalculationPipeline, getOccurrences } from './task-logic.js';

// These tests are still valid as the functions exist and are used by the pipeline.
describe('getOccurrences', () => {
    const startDate = new Date('2025-01-01T00:00:00Z');
    const endDate = new Date('2025-01-31T23:59:59Z');
    it('should return a single date for a non-repeating task within the range', () => {
        const task = { repetitionType: 'none', dueDate: new Date('2025-01-15T10:00:00Z') };
        const occurrences = getOccurrences(task, startDate, endDate);
        expect(occurrences.length).toBe(1);
    });
    it('should return an empty array for a non-repeating task outside the range', () => {
        const task = { repetitionType: 'none', dueDate: new Date('2025-02-15T10:00:00Z') };
        const occurrences = getOccurrences(task, startDate, endDate);
        expect(occurrences.length).toBe(0);
    });
    it('should calculate correct occurrences for a simple daily relative task', () => {
        const task = { repetitionType: 'relative', repetitionAmount: 1, repetitionUnit: 'days', dueDate: new Date('2025-01-02T10:00:00Z') };
        const occurrences = getOccurrences(task, startDate, endDate);
        expect(occurrences.length).toBe(30);
    });
    it('should calculate correct occurrences for an absolute weekly task (Mon & Fri)', () => {
        const task = { repetitionType: 'absolute', repetitionAbsoluteFrequency: 'weekly', repetitionAbsoluteWeeklyDays: [1, 5], dueDate: new Date('2025-01-03T09:00:00Z') };
        const occurrences = getOccurrences(task, startDate, endDate);
        expect(occurrences.length).toBe(9);
    });
});

describe('getDurationMs', () => {
    it('should return the correct number of milliseconds for minutes', () => {
        expect(getDurationMs(10, 'minutes')).toBe(600000);
    });
    it('should return the correct number of milliseconds for hours', () => {
        expect(getDurationMs(2, 'hours')).toBe(7200000);
    });
    it('should return 0 for an unknown unit', () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        expect(getDurationMs(10, 'years')).toBe(0);
        consoleWarnSpy.mockRestore();
    });
});

// New, consolidated test suite for the V11 GPA Pipeline
describe('runCalculationPipeline', () => {
    const now = new Date('2025-09-20T10:00:00Z');
    // Helper to create dates relative to 'now'
    const T = (hours, minutes = 0) => new Date(now.getTime() + hours * 3600000 + minutes * 60000);
    // A distant horizon for most tests
    const horizon = new Date('2026-01-01T00:00:00Z');

    const defaultSettings = {
        sensitivity: { sValue: 0.5 },
        vacations: [],
        categories: [],
    };

    it('should schedule a single, non-urgent task correctly', () => {
        const tasks = [{
            id: '1', name: 'Simple Task', dueDate: T(24),
            estimatedDurationAmount: 2, estimatedDurationUnit: 'hours', requiresFullAttention: true,
            repetitionType: 'none',
        }];
        const results = runCalculationPipeline(tasks, horizon, defaultSettings, now);
        expect(results.length).toBe(1);
        expect(results[0].scheduledStartTime).toEqual(T(22));
        expect(results[0].scheduledEndTime).toEqual(T(24));
        expect(results[0].finalStatus).toBe('green');
    });

    it('should assign "red" status for an imminently scheduled task', () => {
        const tasks = [{
            id: '1', name: 'Urgent Task', dueDate: T(0, 30), // Due in 30 mins
            estimatedDurationAmount: 2, estimatedDurationUnit: 'hours', requiresFullAttention: true,
            repetitionType: 'none',
        }];
        const results = runCalculationPipeline(tasks, horizon, defaultSettings, now);
        expect(results.length).toBe(1);
        expect(results[0].finalStatus).toBe('red');
    });

    it('should deconflict two overlapping tasks based on GPA (due date)', () => {
        const tasks = [
            { id: '1', name: 'More Urgent', dueDate: T(3), estimatedDurationAmount: 2, estimatedDurationUnit: 'hours', requiresFullAttention: true, repetitionType: 'none' },
            // This task now wants to be scheduled from T(2,30) to T(3,30), creating an overlap with Task 1
            { id: '2', name: 'Less Urgent', dueDate: T(3, 30), estimatedDurationAmount: 1, estimatedDurationUnit: 'hours', requiresFullAttention: true, repetitionType: 'none' }
        ];
        const results = runCalculationPipeline(tasks, horizon, defaultSettings, now);
        const task1 = results.find(t => t.originalId === '1');
        const task2 = results.find(t => t.originalId === '2');

        // Task 1 is more urgent, so it should get its preferred slot.
        expect(task1.scheduledEndTime).toEqual(T(3));
        expect(task1.scheduledStartTime).toEqual(T(1));
        // Task 2 is pushed to occur before Task 1 because of the conflict.
        expect(task2.scheduledEndTime.getTime()).toBeLessThanOrEqual(task1.scheduledStartTime.getTime());
    });

    it('should prioritize an appointment over a flexible task', () => {
        const tasks = [
            { id: '1', name: 'Flexible Task', dueDate: T(3), estimatedDurationAmount: 2, estimatedDurationUnit: 'hours', requiresFullAttention: true, isAppointment: false, repetitionType: 'none' },
            { id: '2', name: 'The Appointment', dueDate: T(2), estimatedDurationAmount: 1, estimatedDurationUnit: 'hours', requiresFullAttention: true, isAppointment: true, repetitionType: 'none' }
        ];
        const results = runCalculationPipeline(tasks, horizon, defaultSettings, now);
        const flexibleTask = results.find(t => t.originalId === '1');
        const appointment = results.find(t => t.originalId === '2');

        expect(appointment.scheduledEndTime).toEqual(T(2));
        expect(appointment.scheduledStartTime).toEqual(T(1));
        expect(flexibleTask.scheduledEndTime.getTime()).toBeLessThanOrEqual(appointment.scheduledStartTime.getTime());
    });

    it('should lower GPA and status for tasks with high miss rates', () => {
        const tasks = [{
            id: '1', name: 'Habit Task', dueDate: T(24),
            estimatedDurationAmount: 1, estimatedDurationUnit: 'hours',
            repetitionType: 'relative', repetitionAmount: 1, repetitionUnit: 'days', // Make it a repeating task
            trackMisses: true, maxMisses: 5, misses: 4,
            requiresFullAttention: true,
        }];
        const results = runCalculationPipeline(tasks, horizon, defaultSettings, now);
        expect(results[0].finalStatus).toBe('yellow');
    });

    it('should use prepTime for urgency calculation when available', () => {
        const tasks = [
            { id: '1', name: 'Long Prep', dueDate: T(10), estimatedDurationAmount: 1, estimatedDurationUnit: 'hours', prepTimeAmount: 8, prepTimeUnit: 'hours', requiresFullAttention: true, repetitionType: 'none' },
            { id: '2', name: 'Short Prep', dueDate: T(8), estimatedDurationAmount: 1, estimatedDurationUnit: 'hours', prepTimeAmount: null, requiresFullAttention: true, repetitionType: 'none' }
        ];
        const results = runCalculationPipeline(tasks, horizon, defaultSettings, now);
        const longPrep = results.find(t => t.originalId === '1');
        const shortPrep = results.find(t => t.originalId === '2');

        expect(longPrep.positioningGpa).toBeLessThan(shortPrep.positioningGpa);
    });

    it('should push a task that falls into a vacation period', () => {
        const vacationSettings = {
            ...defaultSettings,
            vacations: [{ id: 'v1', name: 'Holiday', startDate: '2025-09-21', endDate: '2025-09-23' }]
        };
        const tasks = [{
            id: '1', name: 'Vacation Task', dueDate: T(24), // Due tomorrow, inside vacation
            estimatedDurationAmount: 2, estimatedDurationUnit: 'hours', requiresFullAttention: true,
            repetitionType: 'none',
        }];
        const results = runCalculationPipeline(tasks, horizon, vacationSettings, now);

        const scheduledDate = results[0].scheduledStartTime;
        expect(scheduledDate.getDate()).toBe(24);
        expect(scheduledDate.getMonth()).toBe(8); // September is month 8
    });
});