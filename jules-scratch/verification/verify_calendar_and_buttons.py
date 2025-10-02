from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Navigate to the application.
        page.goto("http://localhost:8000")

        # 2. Check that the calendar is visible.
        calendar_element = page.locator("#calendar")
        expect(calendar_element).to_be_visible(timeout=10000) # Increased timeout for calendar to load

        # 3. Click the "Day" view button and take a screenshot.
        # Use exact=True to avoid matching "Today"
        day_button = page.get_by_role("button", name="Day", exact=True)
        day_button.click()
        # Wait for theme to be applied
        page.wait_for_timeout(500)
        page.screenshot(path="jules-scratch/verification/verification_day_view.png")

        # 4. Click the "Month" view button and take a screenshot.
        month_button = page.get_by_role("button", name="Month", exact=True)
        month_button.click()
        # Wait for theme to be applied
        page.wait_for_timeout(500)
        page.screenshot(path="jules-scratch/verification/verification_month_view.png")

        # 5. Click the "Week" view button and take the final screenshot.
        week_button = page.get_by_role("button", name="Week", exact=True)
        week_button.click()
        # Wait for theme to be applied
        page.wait_for_timeout(500)
        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)