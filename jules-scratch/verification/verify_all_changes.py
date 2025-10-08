import json
import re
from datetime import datetime, timedelta
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    # --- Test Data ---
    now = datetime.now()
    yesterday = now - timedelta(days=1)
    tomorrow = now + timedelta(days=1)

    # A repeating task that became overdue yesterday
    repeating_task = {
        "id": "_task1",
        "name": "Check Repeating Task on Calendar",
        "repetitionType": "relative",
        "repetitionAmount": 12,
        "repetitionUnit": "hours",
        "dueDate": yesterday.isoformat(),
        "estimatedDurationAmount": 30,
        "estimatedDurationUnit": "minutes",
        "completed": False,
        "status": "black", # Should be overdue
        "confirmationState": "awaiting_overdue_input",
        "overdueStartDate": yesterday.isoformat(),
        "misses": 1,
        "trackMisses": True,
        "maxMisses": 5,
        "requiresFullAttention": True
    }

    # A simple task for testing modal interactions
    simple_task = {
        "id": "_task2",
        "name": "Test Modal Interactivity",
        "dueDate": tomorrow.isoformat(),
        "completed": False,
        "status": "green",
        "requiresFullAttention": True
    }

    tasks_data = [repeating_task, simple_task]

    # --- Playwright Setup ---
    browser = playwright.chromium.launch(headless=True)
    # Set a small viewport for the responsive UI test
    context = browser.new_context(viewport={"width": 400, "height": 800})
    page = context.new_page()

    # --- Helper to inject data ---
    def setup_initial_state():
        page.goto("http://localhost:8000")
        # Inject tasks into localStorage
        page.evaluate(f"localStorage.setItem('tasks', '{json.dumps(tasks_data)}')")
        # Reload to apply the data
        page.goto("http://localhost:8000")
        # Wait for the task list to be populated to ensure the app is ready
        expect(page.locator(".task-item")).to_have_count(2)

    # --- Run Tests ---

    # Test 1: Verify pending overdue tasks appear on the calendar
    print("Running Test 1: Pending Overdue Task on Calendar...")
    setup_initial_state()
    page.get_by_role("button", name="Calendar").click()
    # Use .first to handle multiple occurrences being rendered, which is expected
    expect(page.get_by_text("Check Repeating Task on Calendar (Pending)").first).to_be_visible()
    print("...Verified pending task is on the calendar.")
    page.screenshot(path="jules-scratch/verification/01_pending_task_on_calendar.png")

    # Test 2: Verify responsive layout of multi-completion UI
    print("Running Test 2: Responsive Confirmation UI...")
    page.get_by_role("button", name="Task Manager").click()
    # Find the overdue task and click "Missed" to trigger the confirmation
    overdue_task_locator = page.locator(".task-item", has_text="Check Repeating Task on Calendar")
    overdue_task_locator.get_by_role("button", name="Missed").click()
    # Wait for the confirmation UI to appear
    expect(overdue_task_locator.get_by_text("Confirm Misses:")).to_be_visible()
    print("...Verified confirmation UI is visible on small screen.")
    page.screenshot(path="jules-scratch/verification/02_responsive_confirmation_ui.png")

    # Test 3: Verify the "Close modal after action" setting
    print("Running Test 3: 'Close Modal After Action' Setting...")

    # --- Enable the setting ---
    page.get_by_role("button", name="Advanced Options").click()
    features_section = page.locator(".collapsible-section", has_text="Other Features")
    toggle_label = page.get_by_label("Close modal after action:")
    close_modal_toggle_input = page.locator("#close-modal-after-action-toggle")

    # Expand the section if the toggle isn't visible
    if not toggle_label.is_visible():
        features_section.get_by_role("heading").click()
        page.wait_for_timeout(500) # Wait for animation

    # Now click the label to check the toggle
    toggle_label.click()
    expect(close_modal_toggle_input).to_be_checked()
    page.get_by_role("button", name="Close").click()
    print("...Enabled 'Close modal after action'.")

    # Go to calendar, open modal, perform action, and assert it closes
    page.get_by_role("button", name="Calendar").click()
    page.get_by_text("Test Modal Interactivity").click()
    modal = page.locator("#task-view-modal")
    expect(modal).to_be_visible()
    modal.get_by_role("button", name="Complete").click()
    modal.get_by_role("button", name="Yes").click()
    expect(modal).to_be_hidden()
    print("...Verified modal closes after action when setting is ON.")

    # --- Reset state and disable the setting ---
    setup_initial_state() # Re-inject the simple task
    page.get_by_role("button", name="Advanced Options").click()

    # Re-locate the elements after state reset
    features_section = page.locator(".collapsible-section", has_text="Other Features")
    toggle_label = page.get_by_label("Close modal after action:")
    close_modal_toggle_input = page.locator("#close-modal-after-action-toggle")

    # Expand the section if the toggle isn't visible
    if not toggle_label.is_visible():
        features_section.get_by_role("heading").click()
        page.wait_for_timeout(500) # Wait for animation

    # Click again to uncheck it
    toggle_label.click()
    expect(close_modal_toggle_input).not_to_be_checked()
    page.get_by_role("button", name="Close").click()
    print("...Disabled 'Close modal after action'.")

    # Go to calendar, open modal, perform action, and assert it stays open
    page.get_by_role("button", name="Calendar").click()
    page.get_by_text("Test Modal Interactivity").click()
    expect(modal).to_be_visible()
    modal.get_by_role("button", name="Complete").click()
    modal.get_by_role("button", name="Yes").click()
    expect(modal).to_be_visible() # Should stay open now
    print("...Verified modal stays open after action when setting is OFF.")
    page.screenshot(path="jules-scratch/verification/03_modal_stays_open.png")

    # --- Cleanup ---
    context.close()
    browser.close()
    print("Verification script finished successfully!")

if __name__ == "__main__":
    with sync_playwright() as p:
        run_verification(p)