from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    Verifies two main fixes by manually triggering the UI elements.
    """
    # 1. Go to the application and inject data
    page.goto("http://localhost:8000")
    page.evaluate("""() => {
        // Inject orphaned history
        localStorage.setItem('pilotPlannerDataV8', JSON.stringify({
            weeks: [],
            indicators: [],
            historicalTasks: [{
                originalTaskId: 'orphan_id',
                name: 'Orphaned History',
                completionDate: '2025-01-01T00:00:00.000Z',
                status: 'completed'
            }]
        }));
        // Inject a fully formed task to AVOID triggering the auto-modal
        localStorage.setItem('tasks', JSON.stringify([{
            "name": "Fully Formed Task", "icon": null, "timeInputType": "due", "dueDateType": "absolute",
            "dueDate": "2025-10-02T12:00:00.000Z", "repetitionType": "none", "maxMisses": null,
            "trackMisses": true, "requiresFullAttention": true, "completionType": "simple",
            "currentProgress": 0, "isTimerRunning": false, "timerLastStarted": null,
            "confirmationState": null, "overdueStartDate": null, "pendingCycles": null, "misses": 0,
            "completed": false, "status": "green", "createdAt": "2025-10-01T00:00:00.000Z",
            "cycleEndDate": null, "completionReducedMisses": false, "description": "",
            "estimatedDurationAmount": null, "estimatedDurationUnit": "minutes", "categoryId": null,
            "relativeAmount": null, "relativeUnit": null, "repetitionAmount": null, "repetitionUnit": null,
            "repetitionAbsoluteFrequency": null, "repetitionAbsoluteWeeklyDays": null,
            "repetitionAbsoluteMonthlyMode": null, "repetitionAbsoluteDaysOfMonth": null,
            "repetitionAbsoluteNthWeekdayOccurrence": null, "repetitionAbsoluteNthWeekdayDays": null,
            "repetitionAbsoluteYearlyMonths": null, "repetitionAbsoluteYearlyMode": null,
            "repetitionAbsoluteYearlyDaysOfMonth": null, "repetitionAbsoluteYearlyNthWeekdayOccurrence": null,
            "repetitionAbsoluteYearlyNthWeekdayDays": null, "countTarget": null,
            "timeTargetAmount": null, "timeTargetUnit": null, "isKpi": false, "id": "task1"
        }]));
    }""")

    page.reload()
    expect(page.locator("#main-view-nav")).to_be_visible()

    # --- Verification for Migration Tool ---
    # Manually open the modal and check it
    page.locator("#advancedOptionsBtnMain").click()
    advanced_options_modal = page.locator("#advanced-options-modal")
    expect(advanced_options_modal).to_be_visible()

    migration_tool_btn = advanced_options_modal.locator('[data-action="openMigrationTool"]')
    migration_tool_btn.click()

    migration_modal = page.locator("#data-migration-modal")
    expect(migration_modal).to_be_visible()

    # The analysis logic runs when the modal is opened. Check the result.
    history_analysis_section = migration_modal.locator("#history-analysis-section")
    expect(history_analysis_section).to_be_visible()
    expect(history_analysis_section).to_contain_text("Found 1 orphaned history record(s)")

    migration_modal.screenshot(path="jules-scratch/verification/01_migration_tool_verification.png")

    # Close both modals
    migration_modal.locator('.close-button').click()
    advanced_options_modal.locator('.close-button').click()
    expect(migration_modal).not_to_be_visible()
    expect(advanced_options_modal).not_to_be_visible()

    # --- Verification for Button Theming ---
    page.locator("#advancedOptionsBtnMain").click()
    expect(advanced_options_modal).to_be_visible()

    light_mode_btn = advanced_options_modal.locator('[data-mode="light"]')
    light_mode_btn.click()

    page.screenshot(path="jules-scratch/verification/02_theme_change_verification.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()