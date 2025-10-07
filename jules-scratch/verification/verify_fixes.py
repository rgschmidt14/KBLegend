import re
from datetime import datetime, timedelta
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(color_scheme="dark")
    page = context.new_page()

    try:
        # --- Calculate yesterday's date ---
        yesterday = datetime.now() - timedelta(days=1)
        yesterday_str = yesterday.strftime("%Y-%m-%dT12:00")

        page.goto("http://localhost:8000/")

        # --- Enable a dark theme to test contrast ---
        page.locator("#advancedOptionsBtnMain").click()
        advanced_options_modal = page.locator("#advanced-options-modal")
        expect(advanced_options_modal).to_be_visible()
        page.locator(".collapsible-header", has_text="Theme and Color").click()
        theme_toggle = page.locator("#theme-enabled-toggle")
        expect(theme_toggle).to_be_visible()
        if not theme_toggle.is_checked():
            theme_toggle.check()
        page.get_by_role("button", name="Night").click()

        # Disable theme colors for statuses to assert against default colors
        status_theme_toggle = page.locator('[data-action="toggleStatusTheme"]')
        expect(status_theme_toggle).to_be_visible()
        if status_theme_toggle.is_checked():
            status_theme_toggle.uncheck()

        advanced_options_modal.get_by_role("button", name="Close").click()
        expect(advanced_options_modal).not_to_be_visible()

        # --- Switch to Task Manager and create an overdue task for yesterday ---
        page.locator("#show-task-manager-btn").click()
        page.locator("#add-task-btn").click()
        task_modal = page.locator("#task-modal")
        expect(task_modal).to_be_visible()
        page.locator("#simple-mode-toggle").click()
        page.get_by_label("Task Name").fill("Check Yesterday's Task")
        due_date_input = page.get_by_label("Due Date & Time:")
        expect(due_date_input).to_be_visible()
        due_date_input.fill(yesterday_str)
        page.get_by_role("button", name="Save Task").click()
        expect(task_modal).not_to_be_visible()

        # --- Verify on Calendar ---
        page.locator("#show-calendar-btn").click()

        # Navigate calendar to yesterday
        page.get_by_role("button", name="Day", exact=True).click()
        page.get_by_role("button", name="Today").click()
        page.get_by_role("button", name="< Prev Day").click()

        # Find the event
        overdue_event = page.locator(".fc-event", has_text="Check Yesterday's Task").first
        expect(overdue_event).to_be_visible()

        # Assert the border color is black (#4b5563)
        expect(overdue_event).to_have_attribute("style", re.compile(r"border-color:\s*rgb\(75, 85, 99\)"))

        # --- Take screenshot for visual verification ---
        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)