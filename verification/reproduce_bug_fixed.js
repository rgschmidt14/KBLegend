
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

        // Merge logic - FIXED ORDER
        const occurrence = {
          ...task,
          originalId: task.id,
          id: occurrenceId,
          occurrenceDueDate: dueDate,
          ...override, // Override comes LAST
        };

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
const tomorrowISO = '2025-06-02T04:30:00.000Z';
const targetOccurrence = results[1];
const targetId = targetOccurrence.id;

console.log('Target ID:', targetId);
console.log('Original Time:', targetOccurrence.occurrenceDueDate.toISOString());

// --- Simulate Edit ---
const newDate = new Date(targetOccurrence.occurrenceDueDate);
newDate.setHours(6, 0, 0, 0); // 6:00 AM

task.occurrenceOverrides[targetId] = {
    dueDate: newDate.toISOString(),
    occurrenceDueDate: newDate // Save as object to match expected Type in logic
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
