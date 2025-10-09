import json
import re
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Listen for console messages and print them
    page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

    # Define a complete, known state for the application
    categories_data = [{
        "id": "work", "name": "Work", "color": "#3b82f6", "icon": "fa-solid fa-briefcase",
        "applyIconToNewTasks": True, "bypassVacation": False
    }]
    tasks_data = [{
        "id": "test-task-1", "name": "Verify Styling Task", "dueDate": "2025-10-09T17:00:00.000Z",
        "categoryId": "work", "estimatedDurationAmount": 1, "estimatedDurationUnit": "hours",
        "repetitionType": "none", "status": "green", "coloringGpa": 0.75, "completed": False,
        "icon": "fa-solid fa-briefcase"
    }]
    ui_settings_data = {
        "activeView": "calendar-view", "calendarCategoryFilters": {}, "hintsDisabled": True
    }
    calendar_settings_data = { "lastView": "timeGridWeek" }

    # Go to the base page to set local storage
    page.goto("http://localhost:8000/index.html")

    # Inject all necessary data into localStorage
    page.evaluate(
        """(data) => {
            localStorage.setItem('categories', JSON.stringify(data.categories));
            localStorage.setItem('tasks', JSON.stringify(data.tasks));
            localStorage.setItem('uiSettings', JSON.stringify(data.uiSettings));
            localStorage.setItem('calendarSettings', JSON.stringify(data.calendarSettings));
        }""",
        {
            "categories": categories_data,
            "tasks": tasks_data,
            "uiSettings": ui_settings_data,
            "calendarSettings": calendar_settings_data
        }
    )

    # Reload the page to make sure the app loads the new data
    page.reload()

    # Wait for the page to fully load and initialize
    page.wait_for_load_state("networkidle")

    # Take a screenshot for debugging
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)