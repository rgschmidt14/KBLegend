import re
from playwright.sync_api import sync_playwright, Page, expect
import json
from datetime import datetime, timedelta

def create_tasks_and_verify(page: Page):
    # --- 1. Arrange: Define Task Data ---
    # Get the upcoming Saturday
    today = datetime.now()
    days_until_saturday = (5 - today.weekday() + 7) % 7
    saturday = today + timedelta(days=days_until_saturday)

    # Task A: 5-hour task due at 10 PM on Saturday
    due_date_a = saturday.replace(hour=22, minute=0, second=0, microsecond=0)
    task_a = {
        "id": "task_a_long",
        "name": "Long Task Due Later",
        "dueDate": due_date_a.isoformat(),
        "estimatedDurationAmount": 5,
        "estimatedDurationUnit": "hours",
        "requiresFullAttention": True,
        "isAppointment": False,
        "status": "green",
        "repetitionType": "none",
        "completed": False,
        "createdAt": datetime.now().isoformat()
    }

    # Task B: 1-hour task due at 6 PM on Saturday
    due_date_b = saturday.replace(hour=18, minute=0, second=0, microsecond=0)
    task_b = {
        "id": "task_b_short",
        "name": "Short Task Due Earlier",
        "dueDate": due_date_b.isoformat(),
        "estimatedDurationAmount": 1,
        "estimatedDurationUnit": "hours",
        "requiresFullAttention": True,
        "isAppointment": False,
        "status": "green",
        "repetitionType": "none",
        "completed": False,
        "createdAt": datetime.now().isoformat()
    }

    tasks_to_inject = [task_a, task_b]

    # --- 2. Act: Inject data and load the page ---
    page.goto("http://localhost:8000")

    # Use evaluate to set localStorage. This runs the script in the browser context.
    page.evaluate(
        """(tasks) => {
            localStorage.setItem('tasks', JSON.stringify(tasks));
            localStorage.setItem('categories', '[]');
            localStorage.setItem('historicalTasksV1', '[]');
            localStorage.setItem('theming', '{"enabled": false}');
            // Set this item to prevent the data migration modal from appearing
            localStorage.setItem('lastMigrationCheck', new Date().toDateString());
        }""",
        tasks_to_inject,
    )

    # Reload the page to make the application load the injected data
    page.reload()

    # Reload the page to make the application load the injected data
    page.reload()

    # Wait for the calendar to be visible
    expect(page.locator("#calendar")).to_be_visible()

    # Wait for events to be rendered
    page.wait_for_selector(".fc-event", timeout=5000)

    # --- 3. Assert: Check the initial rendering ---
    # The longer task should be anchored at its due time (5pm-10pm)
    # The shorter task should be pushed before it (4pm-5pm)

    # Check for the long task within the calendar view
    long_task_locator = page.locator("#calendar").get_by_text("Long Task Due Later")
    expect(long_task_locator).to_be_visible()

    # Check for the short task within the calendar view
    short_task_locator = page.locator("#calendar").get_by_text("Short Task Due Earlier")
    expect(short_task_locator).to_be_visible()

    # --- 4. Act: Navigate to the next week ---
    page.get_by_role("button", name="Next Week >").click()
    # Wait for the calendar to re-render the events for the new week
    # A simple wait for a selector is sufficient here
    page.wait_for_selector(".fc-event", timeout=5000)

    # --- 5. Act: Navigate back to the original week to confirm persistence ---
    page.get_by_role("button", name="< Prev Week").click()
    page.wait_for_selector(".fc-event", timeout=5000)

    # --- 6. Screenshot: Capture the final state ---
    page.screenshot(path="jules-scratch/verification/verification.png")


def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        create_tasks_and_verify(page)
        browser.close()

if __name__ == "__main__":
    run_verification()