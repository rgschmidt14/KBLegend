from playwright.sync_api import sync_playwright, expect
import time

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Navigate to the application
        page.goto("http://localhost:8000")

        # Wait for the main button to be ready
        advanced_options_btn = page.get_by_role("button", name="Advanced Options")
        expect(advanced_options_btn).to_be_visible(timeout=10000)

        # 2. Open Advanced Options
        advanced_options_btn.click()

        # CHANGE: Add a hard sleep to see if it's a stubborn race condition.
        time.sleep(1) # Give the modal 1 second to fully animate and render.

        # Get a handle on the modal now that we know it's open
        advanced_modal = page.locator("#advanced-options-modal")
        expect(advanced_modal).to_be_visible()

        # 3. Verify Vacation Mode UI
        vacation_fieldset = advanced_modal.locator("fieldset", has_text="Vacation Mode")
        expect(vacation_fieldset).to_be_visible()

        # Add a new vacation
        vacation_fieldset.get_by_placeholder("Vacation Name (e.g., 'Family Trip')").fill("Test Vacation")

        # Set start date to tomorrow and end date to the day after
        from datetime import date, timedelta
        tomorrow = date.today() + timedelta(days=1)
        day_after = date.today() + timedelta(days=2)

        vacation_fieldset.get_by_label("Start Date").fill(tomorrow.strftime("%Y-%m-%d"))
        vacation_fieldset.get_by_label("End Date").fill(day_after.strftime("%Y-%m-%d"))

        vacation_fieldset.get_by_role("button", name="Add Vacation").click()

        # Verify the vacation appears in the list
        expect(advanced_modal.get_by_text("Test Vacation")).to_be_visible()

        # 4. Verify Icon Picker Fix
        # Click the "Set Icon" button for the first category
        category_manager = advanced_modal.locator("fieldset", has_text="Category Management")
        set_icon_button = category_manager.get_by_role("button", name="Set Icon").first
        expect(set_icon_button).to_be_visible()
        set_icon_button.click()

        # The icon picker modal should be visible
        icon_picker_modal = page.locator("#icon-picker-modal")
        expect(icon_picker_modal).to_be_visible()

        # Check that the icon picker is on top
        expect(icon_picker_modal.get_by_text("General")).to_be_visible()

        # 5. Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")
        print("Screenshot taken successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)