from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the local server
        page.goto("http://localhost:8000")

        # Give the page a moment to load
        page.wait_for_timeout(1000)

        # Switch to the Task Manager view to make the "Add New Task" button visible
        page.locator("#show-task-manager-btn").click()
        expect(page.locator("#task-manager-view")).to_be_visible()
        page.wait_for_timeout(500)

        # Screenshot 1: Initial view showing task buttons
        page.screenshot(path="jules-scratch/verification/01_initial_view.png")

        # Open the new task modal
        page.locator("#add-task-btn").click()
        expect(page.locator("#task-modal")).to_be_visible()
        page.wait_for_timeout(500) # wait for modal animation

        # Screenshot 2: Modal view showing clear save/cancel buttons
        page.screenshot(path="jules-scratch/verification/02_modal_buttons.png")

        # Create a simple task to verify the in-card buttons
        page.locator("#task-name").fill("Verify Button Styles Task")
        page.locator("#task-modal button:text-is('Save Task')").click()
        expect(page.locator("#task-modal")).not_to_be_visible()

        # Wait for the task to render
        page.wait_for_timeout(500)

        # Screenshot 3: Final view with the new task showing clear edit/delete buttons
        page.screenshot(path="jules-scratch/verification/03_task_card_buttons.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)