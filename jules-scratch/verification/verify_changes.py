
import re
import json
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Listen for console events
    page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

    try:
        page.goto("http://localhost:8000")

        # 1. Bypass welcome modal by injecting settings
        ui_settings = {"welcomeScreenShown": True, "isSimpleMode": False}
        page.evaluate(f"localStorage.setItem('uiSettings', JSON.stringify({json.dumps(ui_settings)}))")

        # 2. Inject data for tests
        categories_data = [{"id": "work", "name": "Work", "color": "#ff0000"}]
        tasks_data = [
            {
                "id": "kpi-task-1",
                "name": "KPI Task",
                "isKpi": True,
                "categoryId": "work",
                "dueDate": "2025-10-23T12:00:00.000Z"
            },
            {
                "id": "cal-task-1",
                "name": "Calendar Task",
                "categoryId": "work",
                "dueDate": "2025-10-23T14:00:00.000Z",
                "estimatedDurationAmount": 2,
                "estimatedDurationUnit": "hours",
                "icon": "fa-solid fa-star"
            }
        ]
        history_data = [
             {
                "originalTaskId": "kpi-task-1",
                "name": "KPI Task",
                "completionDate": "2025-10-22T12:00:00.000Z",
                "status": "green"
             }
        ]

        # Inject data into the correct localStorage keys
        page.evaluate(f"localStorage.setItem('categories', JSON.stringify({json.dumps(categories_data)}))")
        page.evaluate(f"localStorage.setItem('tasks', JSON.stringify({json.dumps(tasks_data)}))")
        page.evaluate(f"localStorage.setItem('historicalTasksV1', JSON.stringify({json.dumps(history_data)}))")

        # Reload for data to take effect
        page.reload()
        page.wait_for_timeout(500) # Give app time to initialize fully

        # 3. Verify KPI Chart is clickable and opens modal
        kpi_chart_container = page.locator("#kpi-chart-container")
        expect(kpi_chart_container).to_be_visible()

        # Click the chart canvas itself
        kpi_chart_container.locator("canvas").click()

        # The modal title is the task name
        modal_title = page.locator("#task-view-modal h2")
        expect(modal_title).to_have_text("KPI Task")
        expect(modal_title).to_be_visible()

        page.screenshot(path="jules-scratch/verification/1_kpi_modal.png")
        page.locator("#task-view-modal .close-button").click()

        # 4. Verify Calendar Views (Week vs Day)
        page.get_by_role("button", name="Calendar").click()
        expect(page.locator("#calendar")).to_be_visible()

        # Default is week view, check for vertical layout (stacked)
        expect(page.locator('.fc-event-main-inner > div:nth-child(2)')).to_have_class(re.compile(r'fc-event-time'))
        page.screenshot(path="jules-scratch/verification/2_week_view_initial.png")

        # Switch to day view and check for horizontal layout
        page.get_by_role("button", name="Day").click()
        expect(page.locator('.fc-event-main-inner.flex')).to_be_visible()
        page.screenshot(path="jules-scratch/verification/3_day_view_initial.png")

        # 5. Verify View Toggles in Advanced Options
        page.get_by_role("button", name="Advanced Options").click()
        page.locator('div[data-section-key="filters"] .collapsible-header').click()

        # Uncheck show icon and time for both views
        page.locator('#week-view-display-options input[name="showIcon"]').uncheck()
        page.locator('#week-view-display-options input[name="showTime"]').uncheck()
        page.locator('#day-view-display-options input[name="showIcon"]').uncheck()
        page.locator('#day-view-display-options input[name="showTime"]').uncheck()

        page.screenshot(path="jules-scratch/verification/4_toggles_off.png")
        page.locator("#advanced-options-modal .close-button").click()

        # 6. Verify changes in Day view
        expect(page.locator('.fc-event-main-inner > .fc-event-icon')).not_to_be_visible()
        expect(page.locator('.fc-event-main-inner > .fc-event-time')).not_to_be_visible()
        page.screenshot(path="jules-scratch/verification/5_day_view_toggled.png")

        # 7. Verify changes in Week view
        page.get_by_role("button", name="Week").click()
        expect(page.locator('.fc-event-main-inner > .fc-event-icon')).not_to_be_visible()
        expect(page.locator('.fc-event-main-inner > .fc-event-time')).not_to_be_visible()
        page.screenshot(path="jules-scratch/verification/6_week_view_toggled.png")

    finally:
        browser.close()

with sync_playwright() as p:
    run_verification(p)

print("Verification script finished.")
