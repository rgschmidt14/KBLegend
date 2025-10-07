import re
from playwright.sync_api import sync_playwright, expect

def verify_changes(page):
    """
    This script verifies the UI changes from the V11 GPA refactor.
    It assumes the app defaults to the Task Manager view.
    1. Checks for the "Preparation Time" field in the task modal.
    2. Checks for the "Performance" section and "Calculation Horizon" in Advanced Options.
    """
    # Navigate to the app
    page.goto("http://localhost:8000")

    # The app should now load directly into the Task Manager view.
    # We can directly look for the button.
    add_task_button = page.locator("#add-task-btn")
    expect(add_task_button).to_be_visible()
    add_task_button.click()

    # Toggle to advanced mode to see all fields
    simple_mode_toggle = page.get_by_role("checkbox", name="Advanced")
    expect(simple_mode_toggle).to_be_visible()
    simple_mode_toggle.check()

    # Check that the "Preparation Time" label and inputs are visible
    expect(page.get_by_label("Preparation Time:")).to_be_visible()
    expect(page.locator("#prep-time-amount")).to_be_visible()
    expect(page.locator("#prep-time-unit")).to_be_visible()

    # Close the task modal
    page.get_by_role("button", name="Close Task Form").click()

    # --- Verify Calculation Horizon in Advanced Options ---
    # Open Advanced Options
    page.get_by_role("button", name="Advanced Options").click()

    # Find and click the "Performance" collapsible header using a more robust locator
    performance_section = page.locator(".collapsible-section[data-section-key='performance']")
    performance_header = performance_section.get_by_role("heading")
    expect(performance_header).to_be_visible()
    performance_header.click()

    # Check that the "Calculation Horizon" label and inputs are visible
    expect(page.get_by_label("Calculation Horizon:")).to_be_visible()
    expect(page.locator("#calculation-horizon-amount")).to_be_visible()
    expect(page.locator("#calculation-horizon-unit")).to_be_visible()

    # Take a screenshot of the advanced options modal
    page.locator("#advanced-options-modal .modal-content").screenshot(path="jules-scratch/verification/verification.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify_changes(page)
        browser.close()

if __name__ == "__main__":
    main()