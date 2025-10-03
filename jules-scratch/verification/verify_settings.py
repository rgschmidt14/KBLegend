from playwright.sync_api import Page, expect

def test_click_to_add_setting(page: Page):
    """
    This test verifies that the 'Allow Task Creation on Click' setting
    works correctly. It checks that the feature is disabled by default,
    can be enabled via the toggle in Advanced Options, and that enabling
    it allows tasks to be created by clicking on the calendar.
    """
    # 1. Arrange: Go to the application.
    page.goto("http://localhost:8000")

    # Wait for the calendar to initialize
    expect(page.locator(".fc-view-harness")).to_be_visible()

    # 2. Act: Click on the calendar before enabling the setting.
    # We expect nothing to happen.
    page.locator('.fc-timegrid-slot-lane').first.click(force=True)

    # Assert that the modal did NOT appear
    expect(page.locator("#task-modal")).not_to_be_visible()

    # 3. Act: Open advanced options and enable the setting.
    page.get_by_role("button", name="Advanced Options").click()

    # Assert that the modal is visible and take a screenshot of the default state.
    expect(page.locator("#advanced-options-modal")).to_be_visible()
    page.screenshot(path="jules-scratch/verification/01_toggle_off.png")

    # Find the toggle and click it
    toggle = page.locator("#allow-creation-on-click-toggle")
    toggle.check()

    # Close the modal
    page.locator("#advanced-options-modal .close-button").click()

    # 4. Act: Click on the calendar again.
    # This time, we expect the task creation modal to appear.
    page.locator('.fc-timegrid-slot-lane').first.click(force=True)

    # 5. Assert: Confirm the task modal is now visible.
    expect(page.locator("#task-modal")).to_be_visible()
    expect(page.get_by_role("heading", name="Add New Task")).to_be_visible()

    # 6. Screenshot: Capture the final result for visual verification.
    page.screenshot(path="jules-scratch/verification/02_modal_opened.png")