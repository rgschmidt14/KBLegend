from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 800, 'height': 600})
    page = context.new_page()

    try:
        # Navigate to the local server
        page.goto("http://localhost:8000/index.html")

        # Wait for the main content to be visible
        expect(page.locator("#main-content")).to_be_visible()

        # Click the "Task Manager" button to show the controls we need to verify
        task_manager_button = page.get_by_role("button", name="Task Manager")
        expect(task_manager_button).to_be_visible()
        task_manager_button.click()

        # Wait for the task manager view to be visible
        expect(page.locator("#task-manager-view")).to_be_visible()

        # Give a moment for any animations to settle
        page.wait_for_timeout(500)

        # Take a screenshot of the page
        page.screenshot(path="jules-scratch/verification/layout_verification.png")

        # Take another screenshot at a narrow width to verify wrapping
        page.set_viewport_size({'width': 400, 'height': 800})
        page.wait_for_timeout(500)
        page.screenshot(path="jules-scratch/verification/layout_verification_narrow.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)