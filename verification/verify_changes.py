from playwright.sync_api import sync_playwright, expect

def verify_task_modal():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Load the application
        page.goto("http://localhost:8000")

        # Bypass welcome modal if it appears
        if page.locator("#welcome-modal").is_visible():
            page.locator("#welcome-no-thanks").click()

        # 2. Navigate to Task Manager View
        page.locator("#show-task-manager-btn").click()

        # 3. Open the "Add New Task" modal
        page.locator("#add-task-btn").click()

        # 4. Verify General Section in Advanced Mode
        # Switch to Advanced Mode first
        page.locator("#simple-mode-toggle").click()

        # Check for the General legend (it should be visible in advanced mode)
        general_legend = page.locator("#general-legend")
        expect(general_legend).to_be_visible()

        # Verify the "All Day" toggle position in Advanced Mode
        all_day_wrapper = page.locator("#all-day-wrapper")
        expect(all_day_wrapper).to_be_visible()

        # 5. Take a screenshot of the Advanced Modal
        page.screenshot(path="verification/advanced_modal.png")
        print("Screenshot saved to verification/advanced_modal.png")

        # 6. Verify Simple Mode Toggle
        page.locator("#simple-mode-toggle").click()

        # General legend should be hidden
        expect(general_legend).not_to_be_visible()

        # All Day toggle should be back in the simple fieldset
        expect(all_day_wrapper).to_be_visible()

        # 7. Take a screenshot of Simple Modal
        page.screenshot(path="verification/simple_modal.png")
        print("Screenshot saved to verification/simple_modal.png")

        browser.close()

if __name__ == "__main__":
    verify_task_modal()
