from playwright.sync_api import sync_playwright, expect
import datetime

def run_verification(playwright):
    """
    This script performs a final, definitive verification by injecting
    debugging styles to prove whether calendar events are being rendered
    in the correct location, regardless of the application's own styling.
    """
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:8000")

        base_date = datetime.datetime.now()

        # --- Create Tasks ---
        page.get_by_role("button", name="Add New Task").click()
        page.locator("#simple-mode-toggle").check()
        page.get_by_label("Task Name").fill("Sleep")
        yesterday = base_date - datetime.timedelta(days=1)
        yesterday_str = yesterday.strftime('%Y-%m-%dT23:00')
        page.locator("#task-due-date").fill(yesterday_str)
        page.locator("#task-repetition").select_option("relative")
        page.locator("#repetition-amount").fill("1")
        page.locator("#repetition-unit").select_option("days")
        page.locator("#estimated-duration-amount").fill("8")
        page.locator("#estimated-duration-unit").select_option("hours")
        page.get_by_role("button", name="Save Task").click()

        page.get_by_role("button", name="Add New Task").click()
        page.get_by_label("Task Name").fill("Work on Project")
        tomorrow = base_date + datetime.timedelta(days=1)
        tomorrow_str = tomorrow.strftime('%Y-%m-%dT14:00')
        page.locator("#task-due-date").fill(tomorrow_str)
        page.get_by_role("button", name="Save Task").click()

        # --- Complete Task ---
        page.get_by_role("button", name="Task Manager").click()
        sleep_task_locator = page.locator(".task-item", has_text="Sleep")
        expect(sleep_task_locator).to_be_visible()
        done_button = sleep_task_locator.get_by_role("button", name="Done")
        expect(done_button).to_be_visible()
        done_button.click()
        confirm_button = sleep_task_locator.get_by_role("button", name="Yes")
        expect(confirm_button).to_be_visible()
        confirm_button.click()

        # --- Navigate to Calendar and Verify ---
        page.get_by_role("button", name="Calendar").click()

        # Wait for the correct number of events to be in the DOM.
        expect(page.locator(".fc-event")).to_have_count(4, timeout=10000)

        # --- Inject Debugging Styles ---
        # This will force the events to be visible if they exist in the DOM.
        page.add_style_tag(content="""
            .fc-event {
                border: 5px solid fuchsia !important;
                background-color: yellow !important;
                color: black !important;
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
            }
        """)

        page.wait_for_timeout(1000) # Let styles apply

        page.screenshot(path="jules-scratch/verification/verification.png")

    except Exception as e:
        print(f"An error occurred during verification: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

if __name__ == "__main__":
    with sync_playwright() as p:
        run_verification(p)