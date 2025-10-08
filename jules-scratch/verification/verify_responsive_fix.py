import json
from datetime import datetime, timedelta
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    # --- Test Data ---
    # A repeating task that is overdue to trigger the confirmation dialog
    overdue_task = {
        "id": "_task1",
        "name": "Test Responsive Confirmation UI",
        "repetitionType": "relative",
        "repetitionAmount": 12,
        "repetitionUnit": "hours",
        "dueDate": (datetime.now() - timedelta(days=1)).isoformat(),
        "completed": False,
        "status": "black",
        "confirmationState": "awaiting_overdue_input",
        "overdueStartDate": (datetime.now() - timedelta(days=1)).isoformat(),
        "requiresFullAttention": True,
        "pendingCycles": 6 # Simulate multiple pending cycles
    }

    tasks_data = [overdue_task]

    # --- Playwright Setup ---
    browser = playwright.chromium.launch(headless=True)
    # Set a small viewport to test the responsive layout
    context = browser.new_context(viewport={"width": 400, "height": 800})
    page = context.new_page()

    # --- Verification Steps ---
    print("Running simplified verification for responsive UI fix...")
    page.goto("http://localhost:8000")

    # Inject tasks into localStorage and reload
    page.evaluate(f"localStorage.setItem('tasks', '{json.dumps(tasks_data)}')")
    page.goto("http://localhost:8000")

    # ** FIX: Switch to the Task Manager view first **
    page.get_by_role("button", name="Task Manager").click()

    # Wait for the task list to be populated
    expect(page.locator(".task-item")).to_have_count(1)

    # Find the overdue task
    task_locator = page.locator(".task-item", has_text="Test Responsive Confirmation UI")

    # Click "Missed" to trigger the confirmation UI
    task_locator.get_by_role("button", name="Missed").click()

    # Wait for the confirmation UI to appear
    expect(task_locator.get_by_text("Confirm Misses:")).to_be_visible()

    print("...Verified confirmation UI is visible on small screen.")
    page.screenshot(path="jules-scratch/verification/responsive_fix_verification.png")

    # --- Cleanup ---
    context.close()
    browser.close()
    print("Verification script finished successfully!")

if __name__ == "__main__":
    with sync_playwright() as p:
        run_verification(p)