import re
import json
from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    Verifies a series of UI fixes and enhancements.
    """
    # 1. Go to the application
    page.goto("http://localhost:8000")

    # 2. Prepare data to inject
    # Use a fixed date for reproducibility
    due_in_past = "2025-10-06T12:00:00.000Z"

    active_tasks_data = [
        {
            "id": "task_miss_ui",
            "name": "Check Confirm Misses UI",
            "repetitionType": "relative",
            "repetitionAmount": 1,
            "repetitionUnit": "days",
            "dueDate": due_in_past,
            "status": "black",
            "confirmationState": "awaiting_overdue_input",
            "requiresFullAttention": True,
            "completed": False,
            "currentProgress": 0,
        }
    ]

    archived_tasks_data = [
        {
            "id": "task_stats_test",
            "name": "Check Stats and GPA",
            "repetitionType": "none",
            "completed": True,
            "requiresFullAttention": True,
            "currentProgress": 0,
            "dueDate": "2025-10-07T12:00:00.000Z",
            "cycleEndDate": "2025-10-07T12:00:00.000Z"
        }
    ]

    history_data = [
        {"originalTaskId": "task_stats_test", "name": "Check Stats and GPA", "completionDate": "2025-10-05T12:00:00.000Z", "status": "green"},
        {"originalTaskId": "task_stats_test", "name": "Check Stats and GPA", "completionDate": "2025-10-06T12:00:00.000Z", "status": "red"},
        {"originalTaskId": "task_stats_test", "name": "Check Stats and GPA", "completionDate": "2025-10-07T12:00:00.000Z", "status": "green"},
    ]

    planner_data = {
        "weeks": [],
        "indicators": [],
        "journal": [],
        "archivedTasks": archived_tasks_data
    }

    # 3. Inject data into localStorage
    page.evaluate(f"""
        localStorage.clear();
        localStorage.setItem('tasks', JSON.stringify({json.dumps(active_tasks_data)}));
        localStorage.setItem('historicalTasksV1', JSON.stringify({json.dumps(history_data)}));
        localStorage.setItem('pilotPlannerDataV8', JSON.stringify({json.dumps(planner_data)}));
        localStorage.setItem('uiSettings', JSON.stringify({{ "activeView": "task-manager-view" }}));
    """)

    # 4. Reload the page to apply the new data
    page.reload()
    page.wait_for_selector("#task-list")

    # 5. Verify "Confirm Misses" UI
    # Find the overdue task and click "Missed"
    miss_task_element = page.locator(".task-item", has_text="Check Confirm Misses UI")
    expect(miss_task_element).to_be_visible()

    # The button is inside the action area, which is re-rendered.
    miss_task_element.get_by_role("button", name="Missed").click()

    # Check that the confirmation UI with the input field is now visible
    confirm_misses_text = miss_task_element.locator(".action-area-text")
    expect(confirm_misses_text).to_be_visible()
    expect(confirm_misses_text).to_contain_text("Confirm Misses")

    # 6. Verify Journal Buttons (Logic Check)
    # This is a good place to quickly verify the journal logic without cluttering the screenshot
    page.get_by_role("button", name="Journal").click()
    expect(page.locator("#journal-view")).to_be_visible()
    # Check that the delegated click listener works for adding a new entry
    page.get_by_role("button", name="New Entry").click()
    expect(page.locator("#journal-modal")).to_be_visible()
    page.locator("#journal-modal .close-button").click()

    # Go back to task manager for the main screenshot
    page.get_by_role("button", name="Task Manager").click()
    expect(page.locator("#task-manager-view")).to_be_visible()

    # 7. Verify GPA Border and Stats Modal
    # Click the history button to see all historical tasks
    page.get_by_role("button", name="View All History").click()

    # Find the stats task in the historical overview and click it
    stats_task_card = page.locator(".historical-task-card", has_text="Check Stats and GPA")
    expect(stats_task_card).to_be_visible()
    stats_task_card.click()

    # Add a short wait for the modal transition animations to complete
    page.wait_for_timeout(500)

    # The task view modal should appear. Check for the border wrapper.
    border_wrapper = page.locator("#task-view-modal-border-wrapper")
    expect(border_wrapper).to_be_visible()
    # Check that it has a gradient background, which indicates the GPA color was applied
    expect(border_wrapper).to_have_css("background-image", re.compile(r"linear-gradient"))

    # Now open the stats view from within the task view modal
    page.get_by_role("button", name="View Parent Task Stats").click()

    # The stats content should now be visible
    stats_content = page.locator("#task-stats-content")
    # Wait for the hidden class to be removed, which is how the app shows the content
    expect(stats_content).not_to_have_class(re.compile(r"hidden"), timeout=5000)
    expect(stats_content).to_be_visible()

    # Verify the overall GPA letter grade is present
    # It will be a span with a specific style, inside the completion rate div
    completion_rate_div = stats_content.locator("div.flex.items-center", has_text="Completion Rate")
    gpa_span = completion_rate_div.locator("span.font-bold")
    expect(gpa_span).to_be_visible()
    expect(gpa_span).not_to_be_empty() # Ensure it has a letter grade inside

    # Verify the chart is rendered
    expect(stats_content.locator("#task-history-chart")).to_be_visible()

    # 8. Take the final screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Set a mobile-like viewport to test the responsive layout of the "Confirm Misses" UI
        context = browser.new_context(viewport={'width': 414, 'height': 896})
        page = context.new_page()
        try:
            run_verification(page)
            print("Verification script ran successfully.")
        except Exception as e:
            print(f"Verification script failed: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    main()