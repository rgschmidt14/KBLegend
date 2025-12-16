
// Mock environment
const tasks = [];
const appState = { vacations: [] };
const uiSettings = { earlyOnTimeSettings: { enabled: false } };
const settings = {
    sensitivity: { sValue: 0.5 },
    vacations: [],
    categories: [],
    calendarCategoryFilters: {},
    earlyOnTimeSettings: { enabled: false }
};

// Mock functions from task-logic.js (simplified for relevant parts)
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
  case 'months': ms = amount * 30 * MS_PER_DAY; break;
  default: ms = 0;
  }
  return ms;
}

function getOccurrences(task, startDate, endDate) {
    const dueDates = [];
    const initialDueDate = new Date(task.dueDate);
    const intervalMs = getDurationMs(task.repetitionAmount, task.repetitionUnit);

    let currentDate = new Date(initialDueDate);
    while (currentDate.getTime() < startDate.getTime()) {
        currentDate = new Date(currentDate.getTime() + intervalMs);
    }

    let i = 0;
    while (currentDate.getTime() <= endDate.getTime() && i < 10) { // Limit for test
        dueDates.push(new Date(currentDate));
        currentDate = new Date(currentDate.getTime() + intervalMs);
        i++;
    }
    return dueDates;
}

function adjustDateForVacation(date) { return date; } // No-op for test

function runCalculationPipeline(tasks, calculationHorizon, settings, now_for_testing) {
  const now = now_for_testing || new Date();
  let allOccurrences = [];

  tasks.forEach(task => {
    if (!task.occurrenceOverrides) task.occurrenceOverrides = {};

    if (task.repetitionType === 'relative') {
      const startScanDate = now;
      const dueDates = getOccurrences(task, startScanDate, calculationHorizon);

      dueDates.forEach(dueDate => {
        const occurrenceId = `${task.id}_${dueDate.toISOString()}`;
        const override = task.occurrenceOverrides[occurrenceId] || {};

        // Merge logic
        const occurrence = {
          ...task,
          ...override,
          originalId: task.id,
          id: occurrenceId,
          occurrenceDueDate: dueDate,
        };

        // IMPORTANT: The pipeline logic for applying overrides to times
        // If an override has a 'dueDate', it should replace the calculated occurrenceDueDate?
        // In the original code:
        // allOccurrences.push({ ...task, ...override, ..., occurrenceDueDate: dueDate })
        // The spread `...override` comes BEFORE `occurrenceDueDate: dueDate`.
        // So if override has `occurrenceDueDate`, it gets overwritten by the calculated `dueDate`!
        // Wait, let's check the code in index.html line 8225

        // Code in index.html:
        // allOccurrences.push({
        //   ...task,
        //   ...override, // Apply any specific overrides
        //   originalId: task.id,
        //   id: occurrenceId,
        //   occurrenceDueDate: dueDate,
        // });

        // If the user changed the TIME of the occurrence, they likely set a new `dueDate` property in the override.
        // But here `occurrenceDueDate` is explicitly set to the calculated `dueDate`.
        // However, `task.baseDueDate` is calculated later from `task.occurrenceDueDate`.

        // Let's see if the override contains `dueDate` (the property used for time).
        // If I change the time of a task, I expect `dueDate` to update.
        // But `getOccurrences` calculates dates based on the *original* schedule.

        // If I override an occurrence to be at 6am instead of 4:30am,
        // `override` object might contain `{ dueDate: "2025-...T06:00:00" }`.

        // But look at the order: `...override` is spread, then `occurrenceDueDate` is set to `dueDate` (from getOccurrences).
        // `occurrenceDueDate` is what is used for `baseDueDate` calculation later.

        // If the override changes the TIME, it effectively changes the due date for that instance.
        // If the pipeline forces `occurrenceDueDate` to be the calculated one, the override is ignored?

        // But wait, the display logic uses `baseDueDate`.
        // `baseDueDate` = `adjustDateForVacation(new Date(task.occurrenceDueDate), ...)`

        // If `override` has `dueDate`, does it affect `occurrenceDueDate`? No.
        // Does `baseDueDate` use `task.dueDate`? No, it uses `task.occurrenceDueDate`.

        // This looks like the bug! The calculated occurrence date overwrites any date override?
        // OR, does the override simply not set `occurrenceDueDate`?

        // Let's verify what happens when we "Edit Occurrence".
        // The modal saves to `occurrenceOverrides[id]`.
        // If we change the time, we probably save a new `dueDate`.

        allOccurrences.push(occurrence);
      });
    }
  });

  return allOccurrences;
}

// --- Test Setup ---
const now = new Date('2025-06-01T12:00:00'); // Noon
const task = {
    id: 'sleep_task',
    name: 'Sleep',
    dueDate: '2025-06-01T04:30:00', // 4:30 AM
    repetitionType: 'relative',
    repetitionAmount: 1,
    repetitionUnit: 'days',
    estimatedDurationAmount: 8,
    estimatedDurationUnit: 'hours',
    occurrenceOverrides: {}
};

// Run initial pipeline
const horizon = new Date('2025-06-05T00:00:00');
let results = runCalculationPipeline([task], horizon, settings, now);

// Find tomorrow's occurrence (June 2nd)
const tomorrowISO = '2025-06-02T04:30:00.000Z'; // Assuming local/UTC match for simplicity in this mock, or close enough
// Actually getOccurrences uses local time logic usually.
// Let's just find the second one.
const targetOccurrence = results[1];
const targetId = targetOccurrence.id;

console.log('Target ID:', targetId);
console.log('Original Time:', targetOccurrence.occurrenceDueDate.toISOString());

// --- Simulate Edit ---
// User changes time to 6:00 AM for this occurrence only.
// This usually updates `dueDate` in the override.
// AND it should probably update `occurrenceDueDate` if that's what drives the calendar?

const newDate = new Date(targetOccurrence.occurrenceDueDate);
newDate.setHours(6, 0, 0, 0); // 6:00 AM

task.occurrenceOverrides[targetId] = {
    dueDate: newDate.toISOString(),
    // If the logic relies on `occurrenceDueDate` to position it, maybe we need to override that too?
    occurrenceDueDate: newDate.toISOString()
};

console.log('Override applied:', task.occurrenceOverrides[targetId]);

// Run pipeline again
results = runCalculationPipeline([task], horizon, settings, now);
const updatedOccurrence = results.find(o => o.id === targetId);

console.log('Updated Occurrence DueDate:', updatedOccurrence.occurrenceDueDate.toISOString());
console.log('Match expected?', newDate.toISOString() === updatedOccurrence.occurrenceDueDate.toISOString());

// Check other occurrences
const otherOccurrence = results[0];
console.log('Other Occurrence DueDate (Should be 4:30):', otherOccurrence.occurrenceDueDate.toISOString());
