import re
from playwright.sync_api import sync_playwright, expect
import json
from datetime import datetime, timedelta
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Add a cache-busting query parameter
        cache_buster = int(time.time())
        page.goto(f"http://localhost:8000?v={cache_buster}")

        # Set up local storage to bypass the welcome screen
        page.evaluate('localStorage.setItem("uiSettings", JSON.stringify({"welcomeScreenShown": true}))')

        # Inject task data
        today = datetime.now()
        due_date = today.replace(hour=12, minute=0, second=0, microsecond=0) # Set a predictable time

        task_data = [{
            "id": "_testtask1",
            "name": "Draggable Event?",
            "dueDate": due_date.isoformat(),
            "createdAt": today.isoformat(),
            "timeInputType": "due",
            "dueDateType": "absolute",
            "repetitionType": "none",
            "maxMisses": None,
            "trackMisses": True,
            "requiresFullAttention": True,
            "completionType": "simple",
            "currentProgress": 0,
            "isTimerRunning": False,
            "confirmationState": None,
            "overdueStartDate": None,
            "pendingCycles": None,
            "misses": 0,
            "completed": False,
            "status": "green",
            "cycleEndDate": None,
            "description": "",
            "estimatedDurationAmount": 1,
            "estimatedDurationUnit": "hours",
            "categoryId": None,
            "isKpi": False,
            "isAppointment": True,
            "prepTimeAmount": None,
            "prepTimeUnit": "minutes",
            "thoughts": "",
            "occurrenceOverrides": {},
        }]

        page.evaluate('''(data) => {
            localStorage.setItem("tasks", JSON.stringify(data));
        }''', task_data)

        # Reload the page to load the injected data
        page.reload()

        # Navigate to the calendar view
        calendar_button = page.get_by_role("button", name="Calendar")
        expect(calendar_button).to_be_visible(timeout=10000)
        calendar_button.click()

        # Find the event we created, scoping it to the calendar view to avoid ambiguity
        calendar_view = page.locator("#calendar-view")
        event_locator = calendar_view.get_by_text("Draggable Event?")
        expect(event_locator).to_be_visible()

        # Get the initial position of the event
        initial_box = event_locator.bounding_box()
        print(f"Initial position: {initial_box}")

        # Attempt to drag the event down by 100 pixels
        event_locator.hover()
        page.mouse.down()
        page.mouse.move(initial_box['x'] + initial_box['width'] / 2, initial_box['y'] + initial_box['height'] / 2 + 100)
        page.mouse.up()

        # Wait a moment for the UI to settle
        page.wait_for_timeout(500)

        # Get the final position of the event
        final_box = event_locator.bounding_box()
        print(f"Final position: {final_box}")

        # Take a screenshot for visual verification
        page.screenshot(path="jules-scratch/verification/verification.png")

        print("Screenshot 'jules-scratch/verification/verification.png' created.")

        # Assert that the position has not changed
        assert initial_box['y'] == final_box['y'], "The event's vertical position should not have changed."
        print("Assertion passed: Event did not move vertically.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
