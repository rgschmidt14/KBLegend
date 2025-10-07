import re
from playwright.sync_api import sync_playwright, Page, expect
import json

def run_verification(page: Page):
    """
    This script verifies several UI fixes and enhancements by first injecting
    the necessary data state into localStorage.
    """
    # 1. Define test data
    kpi_task = {
        "id": "kpi_task_for_verify",
        "name": "My KPI Task",
        "isKpi": True,
        "repetitionType": "none", "completed": False, "status": "green", "dueDate": "2025-10-10T10:00:00.000Z",
        "icon": None, "timeInputType": "due", "dueDateType": "absolute", "maxMisses": None, "trackMisses": True,
        "requiresFullAttention": True, "completionType": "simple", "currentProgress": 0, "isTimerRunning": False,
        "timerLastStarted": None, "confirmationState": None, "overdueStartDate": None, "pendingCycles": None,
        "misses": 0, "createdAt": "2025-10-07T10:00:00.000Z", "cycleEndDate": None, "completionReducedMisses": False,
        "description": "", "estimatedDurationAmount": 60, "estimatedDurationUnit": "minutes", "categoryId": None,
        "relativeAmount": None, "relativeUnit": None, "repetitionAmount": None, "repetitionUnit": None,
        "repetitionAbsoluteFrequency": None, "repetitionAbsoluteWeeklyDays": None, "repetitionAbsoluteMonthlyMode": None,
        "repetitionAbsoluteDaysOfMonth": None, "repetitionAbsoluteNthWeekdayOccurrence": None,
        "repetitionAbsoluteNthWeekdayDays": None, "repetitionAbsoluteYearlyMonths": None,
        "repetitionAbsoluteYearlyMode": None, "repetitionAbsoluteYearlyDaysOfMonth": None,
        "repetitionAbsoluteYearlyNthWeekdayOccurrence": None, "repetitionAbsoluteYearlyNthWeekdayDays": None,
        "countTarget": None, "timeTargetAmount": None, "timeTargetUnit": None, "isAutoKpi": False,
        "isAppointment": False, "prepTimeAmount": None, "prepTimeUnit": "minutes"
    }

    single_history_task_archived = {
        "id": "history_task_1", "name": "Test Single History Task", "isKpi": False, "repetitionType": "none",
        "completed": True, "status": "blue", "dueDate": "2025-10-06T10:00:00.000Z", "icon": None,
        "timeInputType": "due", "dueDateType": "absolute", "maxMisses": None, "trackMisses": True,
        "requiresFullAttention": True, "completionType": "simple", "currentProgress": 0, "isTimerRunning": False,
        "timerLastStarted": None, "confirmationState": None, "overdueStartDate": None, "pendingCycles": None,
        "misses": 0, "createdAt": "2025-10-06T09:00:00.000Z", "cycleEndDate": "2025-10-06T10:00:00.000Z",
        "completionReducedMisses": False, "description": "", "estimatedDurationAmount": 60,
        "estimatedDurationUnit": "minutes", "categoryId": None, "relativeAmount": None, "relativeUnit": None,
        "repetitionAmount": None, "repetitionUnit": None, "repetitionAbsoluteFrequency": None,
        "repetitionAbsoluteWeeklyDays": None, "repetitionAbsoluteMonthlyMode": None, "repetitionAbsoluteDaysOfMonth": None,
        "repetitionAbsoluteNthWeekdayOccurrence": None, "repetitionAbsoluteNthWeekdayDays": None,
        "repetitionAbsoluteYearlyMonths": None, "repetitionAbsoluteYearlyMode": None,
        "repetitionAbsoluteYearlyDaysOfMonth": None, "repetitionAbsoluteYearlyNthWeekdayOccurrence": None,
        "repetitionAbsoluteYearlyNthWeekdayDays": None, "countTarget": None, "timeTargetAmount": None,
        "timeTargetUnit": None, "isAutoKpi": False, "isAppointment": False, "prepTimeAmount": None,
        "prepTimeUnit": "minutes"
    }

    history_record = {
        "originalTaskId": "history_task_1", "name": "Test Single History Task",
        "completionDate": "2025-10-06T10:00:00.000Z", "actionDate": "2025-10-06T10:00:05.000Z",
        "status": "green", "originalDueDate": "2025-10-06T10:00:00.000Z", "durationAmount": 60,
        "durationUnit": "minutes", "progress": 1, "categoryId": None
    }

    # 2. Navigate and inject data
    page.goto("http://localhost:8000")
    page.evaluate("""(data) => {
        localStorage.setItem('tasks', JSON.stringify(data.tasks));

        const appState = {
            historicalTasks: data.historicalTasks,
            archivedTasks: data.archivedTasks,
            weeks: [], indicators: [], journal: [], vacations: []
        };
        localStorage.setItem('pilotPlannerDataV8', JSON.stringify(appState));

        const uiSettings = {
            isSimpleMode: true, activeView: 'dashboard-view', kpiChartMode: 'single', kpiChartDateRange: '8d',
            kpiWeekOffset: 0, journalIconCollapseState: {}, advancedOptionsCollapseState: {}
        };
        localStorage.setItem('uiSettings', JSON.stringify(uiSettings));

    }""", {
        "tasks": [kpi_task],
        "historicalTasks": [history_record],
        "archivedTasks": [single_history_task_archived]
    })

    # 3. Reload page to apply new state
    page.reload()
    expect(page.get_by_role("heading", name="Key Performance Indicators")).to_be_visible()

    # 4. Dashboard Verification
    page.set_viewport_size({"width": 400, "height": 800})
    page.wait_for_timeout(500)
    page.screenshot(path="jules-scratch/verification/01_kpi_controls_responsive.png")

    page.get_by_role("button", name="Stacked").click()
    page.wait_for_timeout(500)
    page.screenshot(path="jules-scratch/verification/02_kpi_stacked_charts.png")

    # 5. Task View & Stats Modal Verification
    page.set_viewport_size({"width": 1280, "height": 720})

    # Switch to Task Manager view
    page.get_by_role("button", name="Task Manager").click()
    expect(page.get_by_role("button", name="View All History")).to_be_visible()

    page.get_by_role("button", name="View All History").click()
    historical_modal_heading = page.get_by_role("heading", name="Historical Task Overview")
    expect(historical_modal_heading).to_be_visible()

    page.locator(".historical-task-card", has_text="Test Single History Task").click()

    # FIX: Wait for the old modal to disappear before checking for the new one.
    expect(historical_modal_heading).not_to_be_visible()

    task_view_heading = page.locator("#task-view-modal h3", has_text="Test Single History Task")
    expect(task_view_heading).to_be_visible()

    page.screenshot(path="jules-scratch/verification/03_task_view_modal_buttons.png")

    page.get_by_role("button", name="View Parent Task Stats").click()

    stats_heading = page.locator("#task-stats-content h3", has_text="Stats for: Test Single History Task")
    expect(stats_heading).to_be_visible()
    page.wait_for_timeout(500)

    page.screenshot(path="jules-scratch/verification/04_stats_modal_final.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()