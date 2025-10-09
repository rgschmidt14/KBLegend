import re
import json
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Add a console message handler to catch JS errors and logs
    def handle_console(msg):
        print(f"Browser Console ({msg.type.upper()}): {msg.text}")

    page.on("console", handle_console)

    # 1. Define Task Data
    tasks_data = [
        {
            "id": "_task1", "name": "Morning Standup", "icon": "fa-solid fa-users",
            "dueDate": "2025-10-15T09:00:00.000Z", "estimatedDurationAmount": 30, "estimatedDurationUnit": "minutes",
            "categoryId": "Work", "repetitionType": "absolute", "repetitionAbsoluteFrequency": "weekly",
            "repetitionAbsoluteWeeklyDays": [1, 2, 3, 4, 5]
        },
        {
            "id": "_task2", "name": "Design Review", "icon": "fa-solid fa-palette",
            "dueDate": "2025-10-15T14:00:00.000Z", "estimatedDurationAmount": 1, "estimatedDurationUnit": "hours",
            "categoryId": "Work", "repetitionType": "none"
        },
        {
            "id": "_task3", "name": "Gym Session", "icon": "fa-solid fa-dumbbell",
            "dueDate": "2025-10-15T18:00:00.000Z", "estimatedDurationAmount": 1, "estimatedDurationUnit": "hours",
            "categoryId": "Health", "repetitionType": "absolute", "repetitionAbsoluteFrequency": "weekly",
            "repetitionAbsoluteWeeklyDays": [1, 3, 5]
        }
    ]
    categories_data = [
        {"id": "Work", "name": "Work", "color": "#3b82f6", "icon": "fa-solid fa-briefcase"},
        {"id": "Health", "name": "Health", "color": "#10b981", "icon": "fa-solid fa-heart-pulse"}
    ]

    # Go to the page first to have a document context
    page.goto("http://localhost:8000")

    # Inject data using page.evaluate
    page.evaluate("""(data) => {
        localStorage.setItem('tasks', JSON.stringify(data.tasks));
        localStorage.setItem('categories', JSON.stringify(data.categories));
    }""", {'tasks': tasks_data, 'categories': categories_data})

    # Reload the page to apply the data
    page.reload()
    page.wait_for_load_state('networkidle')

    # 2. Navigate and Configure Month View
    page.get_by_role("button", name="Calendar").click()
    page.locator("#advancedOptionsBtnMain").click()

    # Wait for the modal container to have the 'active' class
    modal = page.locator("#advanced-options-modal")
    expect(modal).to_have_class(re.compile(r"active"))

    # Now that the modal is active, we can safely find elements within it
    expect(modal.get_by_role("heading", name="Advanced Options")).to_be_visible()

    # Open filters section and configure month view
    modal.get_by_role("heading", name="Filters").click()
    month_view_options = modal.locator("#month-view-display-options")
    expect(month_view_options).to_be_visible()

    # Use force=True to bypass interception checks in the complex scrolling modal
    month_view_options.get_by_label("Show Time").check(force=True)
    month_view_options.get_by_label("Show Icon").uncheck(force=True)
    month_view_options.get_by_label("Show Name").check(force=True)
    month_view_options.get_by_label("Group Repeated Tasks").check(force=True)

    # Close modal
    modal.locator(".close-button").click()
    expect(modal).not_to_have_class(re.compile(r"active"))

    # Switch to Month view
    page.get_by_role("button", name="Month").click()

    # Go to a specific date to ensure consistency
    page.get_by_role("heading", name=re.compile("October 2025")).wait_for(state="visible")

    # 3. Take screenshot of the new month view
    page.screenshot(path="jules-scratch/verification/verification.png")

    # 4. Verify the filter toggle
    page.locator("#advancedOptionsBtnMain").click()
    expect(modal).to_have_class(re.compile(r"active"))

    modal.get_by_role("heading", name="Filters").click()

    # Use force=True here as well
    modal.get_by_label("Show Category Filters Below Calendar:").uncheck(force=True)

    # Close modal
    modal.locator(".close-button").click()
    expect(modal).not_to_have_class(re.compile(r"active"))

    # Assert that the filter container is now hidden
    expect(page.locator("#calendar-category-filters")).to_be_hidden()

    # Take a second screenshot to show the filters are gone
    page.screenshot(path="jules-scratch/verification/verification_filters_off.png")

    print("Verification script completed successfully.")

    # ---------------------
    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)